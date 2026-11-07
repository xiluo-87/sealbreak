/**
 * The field: tile movement, camera, followers, NPCs, talking, exits, map
 * events and cutscenes. Story state lives in GameState; this scene only
 * keeps what is needed to draw and animate it.
 */
import { CUTSCENES } from '../data/cutscenes';
import { DIALOGUE } from '../data/dialogue';
import { MAPS } from '../data/maps';
import { SPEAKERS } from '../data/speakers';
import { applyAll, check } from '../game/conditions';
import type { Cutscene } from '../game/cutscene';
import { DialogueRun, fillText } from '../game/dialogue';
import type { Scene, SceneContext } from '../game/scene';
import type { GameState } from '../game/state';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../render/scale';
import { paintGround, tallSpriteFor } from '../render/tileArt';
import { DialogueBox, type SpeakerInfo } from '../ui/dialogueBox';
import { Actor } from './actor';
import { cameraFor } from './camera';
import { type Dir, delta, opposite } from './dir';
import { exitAt, type ExitDef, type NpcDef, type ParsedMap, parseMap, solidAt } from './maps';
import { advance, RUN_MS_PER_TILE, stepTo, TILE, tryStep, WALK_MS_PER_TILE } from './movement';

export interface FieldHooks {
  /** Called on entering a town and after cutscenes that end in one. */
  autosave(state: GameState): void;
  openMenu(): void;
  /** Starts a battle; `done` runs when the party is back in the field. */
  battle(encounter: string, done: (result: 'victory' | 'fled') => void): void;
}

interface Npc {
  def: NpcDef;
  actor: Actor;
}

interface CutsceneRun {
  c: Cutscene;
  i: number;
  /** Time left on a wait or fade step, ms. */
  timer: number;
  started: boolean;
}

const FADE_MS = 260;
const groundCache = new Map<string, HTMLCanvasElement>();

export class FieldScene implements Scene {
  map!: ParsedMap;
  private ground!: HTMLCanvasElement;
  readonly player: Actor;
  private followers: Actor[] = [];
  private npcs = new Map<string, Npc>();
  private readonly box: DialogueBox;
  private dialogue: { run: DialogueRun; onDone: () => void } | null = null;
  private cutscene: CutsceneRun | null = null;
  /** 0 = clear, 1 = black. */
  private fade = 0;
  private fadeTo = 0;
  private warp: { exit: ExitDef; phase: 'out' | 'in' } | null = null;
  private stepMs = WALK_MS_PER_TILE;
  private inBattle = false;

  constructor(
    readonly state: GameState,
    ui: HTMLElement,
    private readonly hooks: FieldHooks,
  ) {
    this.box = new DialogueBox(ui);
    this.player = new Actor('player', 'rookie', state.x, state.y, state.facing);
    this.loadMap(state.mapId, state.x, state.y, state.facing, true);
  }

  /** True while the player is free to walk and open the menu. */
  get idle(): boolean {
    return !this.dialogue && !this.cutscene && !this.warp && !this.inBattle && this.fade === 0;
  }

  destroy(): void {
    this.box.el.remove();
  }

  // -------------------------------------------------------------------------
  // Maps.

  private loadMap(id: string, x: number, y: number, facing: Dir, runEnter: boolean): void {
    const def = MAPS[id];
    if (!def) throw new Error(`unknown map ${id}`);
    this.map = parseMap(def);
    let ground = groundCache.get(id);
    if (!ground) {
      ground = paintGround(this.map);
      groundCache.set(id, ground);
    }
    this.ground = ground;
    this.state.mapId = id;
    this.player.place(x, y, facing);
    this.savePosition();
    this.npcs.clear();
    for (const n of def.npcs) this.npcs.set(n.id, { def: n, actor: new Actor(n.id, n.sprite, n.x, n.y, n.facing) });
    this.followers = [];
    this.syncFollowers();
    if (runEnter) this.runEvents('enter');
    if (def.kind === 'town' && !this.cutscene && !this.dialogue) this.hooks.autosave(this.state);
  }

  private savePosition(): void {
    this.state.x = this.player.m.tx;
    this.state.y = this.player.m.ty;
    this.state.facing = this.player.m.facing;
  }

  private visibleNpcs(): Npc[] {
    return [...this.npcs.values()].filter((n) => check(n.def.if, this.state));
  }

  /** Followers are the other party members, then Biscuit. */
  private syncFollowers(): void {
    const want: string[] = this.state.party.filter((p) => p !== 'rookie');
    if (this.state.flags['biscuit.joined']) want.push('biscuit');
    this.followers = this.followers.filter((f) => want.includes(f.id));
    for (const id of want) {
      if (this.followers.some((f) => f.id === id)) continue;
      const from = this.npcs.get(id)?.actor.m ?? this.followers[this.followers.length - 1]?.m ?? this.player.m;
      this.followers.push(new Actor(id, id, from.tx, from.ty, from.facing));
    }
    this.followers.sort((a, b) => want.indexOf(a.id) - want.indexOf(b.id));
  }

  private blocked(x: number, y: number): boolean {
    if (solidAt(this.map, x, y)) return true;
    const exit = exitAt(this.map, x, y);
    if (exit && !check(exit.if, this.state)) return true;
    const b = this.map.buildingAt[y * this.map.width + x] ?? -1;
    if (b >= 0 && !exit) return true;
    return this.visibleNpcs().some((n) => (n.actor.m.tx === x && n.actor.m.ty === y) || (n.actor.m.moving && n.actor.m.fx === x && n.actor.m.fy === y));
  }

  // -------------------------------------------------------------------------
  // Events, dialogue and cutscenes.

  private runEvents(on: 'enter' | 'step' | 'interact', x?: number, y?: number): boolean {
    const ev = this.map.def.events.find((e) => e.on === on && (on === 'enter' || (e.x === x && e.y === y)) && check(e.if, this.state));
    if (!ev) return false;
    if (ev.cutscene) this.startCutscene(ev.cutscene);
    else if (ev.dialogue) this.say(ev.dialogue, () => undefined);
    else if (ev.battle) {
      this.inBattle = true;
      this.hooks.battle(ev.battle, () => {
        this.inBattle = false;
      });
    }
    return true;
  }

  private say(id: string, onDone: () => void): void {
    const d = DIALOGUE[id];
    if (!d) throw new Error(`unknown dialogue ${id}`);
    const run = new DialogueRun(d, this.state);
    if (run.done) {
      onDone();
      return;
    }
    this.dialogue = { run, onDone };
    this.showLine();
  }

  private showLine(): void {
    const d = this.dialogue;
    if (!d) return;
    const view = d.run.view();
    if (!view) {
      this.endDialogue();
      return;
    }
    const sp = view.line.who ? SPEAKERS[view.line.who] : undefined;
    const info: SpeakerInfo | null = sp ? { name: fillText(sp.name, this.state), ...(sp.portrait ? { portrait: sp.portrait } : {}) } : null;
    this.box.show(view, info);
  }

  private endDialogue(): void {
    const d = this.dialogue;
    this.dialogue = null;
    this.box.hide();
    this.syncFollowers();
    d?.onDone();
  }

  private updateDialogue(ctx: SceneContext): void {
    const d = this.dialogue;
    if (!d) return;
    const click = this.box.takeClick();
    if (ctx.input.wasPressed('up')) this.box.move(-1);
    if (ctx.input.wasPressed('down')) this.box.move(1);
    const confirm = ctx.input.wasPressed('confirm') || click !== null;
    if (!confirm) return;
    if (this.box.skip()) return;
    if (this.box.hasChoices()) {
      if (click === -1) return;
      d.run.choose(this.box.selectedChoice());
    } else d.run.advance();
    if (d.run.done) this.endDialogue();
    else this.showLine();
  }

  private startCutscene(id: string): void {
    const c = CUTSCENES[id];
    if (!c) throw new Error(`unknown cutscene ${id}`);
    this.cutscene = { c, i: 0, timer: 0, started: false };
  }

  private actorById(id: string): Actor {
    if (id === 'player') return this.player;
    const n = this.npcs.get(id);
    if (n) return n.actor;
    const f = this.followers.find((x) => x.id === id);
    if (f) return f;
    throw new Error(`cutscene actor ${id} is not on map ${this.map.def.id}`);
  }

  private updateCutscene(dt: number): void {
    const run = this.cutscene;
    if (!run || this.dialogue) return;
    const step = run.c.steps[run.i];
    const next = (): void => {
      run.i++;
      run.started = false;
    };
    if (!step) {
      this.cutscene = null;
      this.syncFollowers();
      if (this.map.def.kind === 'town') this.hooks.autosave(this.state);
      return;
    }
    if ('say' in step) {
      if (!run.started) {
        run.started = true;
        this.say(step.say, next);
      }
    } else if ('walk' in step) {
      const a = this.actorById(step.walk);
      if (!run.started) {
        run.started = true;
        a.path = [...step.path];
      }
      if (!a.m.moving) {
        const d = a.path.shift();
        if (d) {
          const [dx, dy] = delta(d);
          const from = { x: a.m.tx, y: a.m.ty };
          stepTo(a.m, a.m.tx + dx, a.m.ty + dy);
          if (a === this.player) this.pullFollowers(from.x, from.y);
        } else next();
      }
    } else if ('face' in step) {
      this.actorById(step.face).m.facing = step.dir;
      next();
    } else if ('wait' in step) {
      if (!run.started) {
        run.started = true;
        run.timer = step.wait;
      }
      run.timer -= dt;
      if (run.timer <= 0) next();
    } else if ('then' in step) {
      applyAll(step.then, this.state);
      this.syncFollowers();
      next();
    } else if ('fade' in step) {
      if (!run.started) {
        run.started = true;
        this.fadeTo = step.fade === 'out' ? 1 : 0;
      }
      if (this.fade === this.fadeTo) next();
    } else if ('battle' in step) {
      if (!run.started) {
        run.started = true;
        this.inBattle = true;
        this.hooks.battle(step.battle, () => {
          this.inBattle = false;
          next();
        });
      }
    } else {
      const w = step.warp;
      this.loadMap(w.map, w.x, w.y, w.facing, false);
      next();
    }
  }

  // -------------------------------------------------------------------------
  // Walking.

  private pullFollowers(x: number, y: number): void {
    let px = x;
    let py = y;
    for (const f of this.followers) {
      const ox = f.m.tx;
      const oy = f.m.ty;
      if (ox !== px || oy !== py) stepTo(f.m, px, py);
      px = ox;
      py = oy;
    }
  }

  private tryMove(dir: Dir, fresh: boolean): void {
    const m = this.player.m;
    const [dx, dy] = delta(dir);
    const tx = m.tx + dx;
    const ty = m.ty + dy;
    const exit = exitAt(this.map, tx, ty);
    if (exit && !check(exit.if, this.state)) {
      m.facing = dir;
      if (fresh && exit.blocked) this.say(exit.blocked, () => undefined);
      return;
    }
    const fx = m.tx;
    const fy = m.ty;
    if (tryStep(m, dir, (x, y) => this.blocked(x, y))) this.pullFollowers(fx, fy);
  }

  private arrive(): void {
    this.savePosition();
    this.state.steps++;
    const m = this.player.m;
    const exit = exitAt(this.map, m.tx, m.ty);
    if (exit && check(exit.if, this.state)) {
      this.warp = { exit, phase: 'out' };
      this.fadeTo = 1;
      return;
    }
    this.runEvents('step', m.tx, m.ty);
  }

  private interact(): void {
    const m = this.player.m;
    const [dx, dy] = delta(m.facing);
    const x = m.tx + dx;
    const y = m.ty + dy;
    const npc = this.visibleNpcs().find((n) => n.actor.m.tx === x && n.actor.m.ty === y && !n.actor.m.moving);
    if (npc?.def.dialogue) {
      const before = npc.actor.m.facing;
      if (npc.def.turns !== false) npc.actor.m.facing = opposite(m.facing);
      this.say(npc.def.dialogue, () => {
        npc.actor.m.facing = before;
      });
      return;
    }
    this.runEvents('interact', x, y);
  }

  // -------------------------------------------------------------------------
  // Scene.

  update(ctx: SceneContext): void {
    const dt = ctx.stepMs;
    const wasIdle = this.idle;
    this.state.playMs += dt;
    this.box.update(dt);

    // Fades and warps.
    if (this.fade !== this.fadeTo) {
      const stepF = dt / FADE_MS;
      this.fade = this.fadeTo > this.fade ? Math.min(this.fadeTo, this.fade + stepF) : Math.max(this.fadeTo, this.fade - stepF);
    }
    if (this.warp) {
      if (this.warp.phase === 'out' && this.fade === 1) {
        const e = this.warp.exit;
        this.warp.phase = 'in';
        this.loadMap(e.to, e.toX, e.toY, e.facing, false);
        this.fadeTo = 0;
      } else if (this.warp.phase === 'in' && this.fade === 0) {
        this.warp = null;
        this.runEvents('enter');
      }
    }

    if (this.dialogue) this.updateDialogue(ctx);
    else if (this.cutscene) this.updateCutscene(dt);

    // The player.
    const run = ctx.input.isHeld('run');
    this.stepMs = run ? RUN_MS_PER_TILE : WALK_MS_PER_TILE;
    // Input that closed a dialogue this step must not also open the next one.
    const control = this.idle && wasIdle;
    const dir = control ? ctx.input.direction() : null;
    if (control && !this.player.m.moving) {
      if (dir) this.tryMove(dir, ctx.input.wasPressed(dir));
      else if (ctx.input.wasPressed('confirm')) this.interact();
      else if (ctx.input.wasPressed('cancel')) this.hooks.openMenu();
    }
    const cutsceneStep = this.cutscene ? WALK_MS_PER_TILE * 1.25 : this.stepMs;
    const left = advance(this.player.m, dt, cutsceneStep);
    if (left >= 0 && !this.cutscene) {
      this.arrive();
      const again = this.idle ? ctx.input.direction() : null;
      if (again) {
        this.tryMove(again, false);
        advance(this.player.m, left, this.stepMs);
      }
    } else if (left >= 0) this.savePosition();
    this.player.tick(dt, run && control ? 1.4 : 1);

    for (const f of this.followers) {
      advance(f.m, dt, this.cutscene ? cutsceneStep : this.stepMs);
      f.tick(dt, run && control ? 1.4 : 1);
    }
    for (const n of this.npcs.values()) {
      advance(n.actor.m, dt, WALK_MS_PER_TILE * 1.25);
      n.actor.tick(dt);
    }
  }

  render(g: CanvasRenderingContext2D): void {
    const pf = this.player.feet();
    const cam = cameraFor(pf.x, pf.y - 16, this.map.width * TILE, this.map.height * TILE, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    g.fillStyle = '#16151d';
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    g.drawImage(this.ground, -cam.x, -cam.y);

    const items: { y: number; order: number; draw: () => void }[] = [];
    const addActor = (a: Actor, order: number): void => {
      items.push({ y: a.feet().y, order, draw: () => a.draw(g, cam.x, cam.y) });
    };
    this.followers.forEach((f, i) => addActor(f, -1 - i));
    for (const n of this.visibleNpcs()) addActor(n.actor, 0);
    addActor(this.player, 1);

    const x0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
    const y0 = Math.max(0, Math.floor(cam.y / TILE) - 1);
    const x1 = Math.min(this.map.width - 1, Math.ceil((cam.x + LOGICAL_WIDTH) / TILE) + 1);
    const y1 = Math.min(this.map.height - 1, Math.ceil((cam.y + LOGICAL_HEIGHT) / TILE) + 2);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const s = tallSpriteFor(this.map, tx, ty);
        if (!s) continue;
        items.push({ y: ty * TILE + TILE - 1, order: 0, draw: () => g.drawImage(s.canvas, tx * TILE + s.ox - cam.x, ty * TILE + s.oy - cam.y) });
      }
    }
    items.sort((a, b) => a.y - b.y || a.order - b.order);
    for (const it of items) it.draw();

    if (this.fade > 0) {
      g.fillStyle = `rgba(14, 12, 20, ${this.fade.toFixed(3)})`;
      g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
  }

  debugInfo(): Record<string, string | number> {
    const m = this.player.m;
    return {
      map: this.map.def.id,
      tile: `${m.tx},${m.ty} ${m.facing}`,
      walked: this.state.steps,
      flags: Object.keys(this.state.flags).length,
    };
  }
}
