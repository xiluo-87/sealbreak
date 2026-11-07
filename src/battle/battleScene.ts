/**
 * The battle screen. Draws the backdrop, combatants, timeline strip and
 * forecast on the canvas; menus, the party panel and messages are HTML over
 * it. All rules live in Battle; this only chooses actions and plays events.
 */
import { sound } from '../audio';
import { hint } from '../input/hints';
import { BALANCE } from '../data/balance';
import { ENEMIES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { LETTER_BY_ID } from '../data/letters';
import { type SkillDef, SKILLS, type Weight } from '../data/skills';
import type { LetterMode } from './letterSkills';
import type { Weather } from '../data/weather';
import type { Keyboard } from '../input/keyboard';
import type { Scene, SceneContext } from '../game/scene';
import { Rng } from '../game/rng';
import type { GameState } from '../game/state';
import { backdrop } from '../render/backdrop';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../render/scale';
import { frameAt } from '../sprites/anim';
import { ALL_CHARACTERS } from '../sprites/characters';
import { fieldSets } from '../sprites/fieldSprites';
import { resolveBones } from '../sprites/rig';
import { drawFrame, getSheet, type SpriteSheet } from '../sprites/sheet';
import type { SpriteSetDef } from '../sprites/types';
import { ListMenu, type MenuItem } from '../ui/menu';
import { type Action, Battle, type BattleEvent, type BattleResult, type Combatant, type Results } from './battle';

export interface BattleHooks {
  onEnd(result: BattleResult, results: Results | null): void;
}

interface Visual {
  key: string;
  sheet: SpriteSheet;
  /** Feet position on screen. */
  x: number;
  y: number;
  /** Where the feet sit inside the frame. */
  fx: number;
  fy: number;
  anim: string;
  t: number;
  lunge: number;
  flash: number;
  alpha: number;
  icon: HTMLCanvasElement;
}

interface Popup {
  x: number;
  y: number;
  text: string;
  color: string;
  t: number;
}

const PARTY_SLOTS: [number, number][] = [
  [478, 250],
  [546, 282],
  [470, 318],
  [552, 340],
];
const ENEMY_SLOTS: [number, number][] = [
  [346, 266],
  [292, 226],
  [292, 320],
  [404, 320],
];
const BISCUIT_SLOT: [number, number] = [604, 322];

function setById(id: string): SpriteSetDef {
  for (const c of ALL_CHARACTERS) {
    const s = c.sets().find((x) => x.id === id);
    if (s) return s;
  }
  throw new Error(`no sprite set ${id}`);
}

/** A 20x20 crop around a sprite's head, for the timeline strip. */
function iconFrom(set: SpriteSetDef, headBone: string, dy = -6): HTMLCanvasElement {
  const sheet = getSheet(set);
  const bones = resolveBones(set.rig, {});
  const m = bones.get(headBone);
  const hx = Math.round(m ? m[4] : set.rig.width / 2);
  const hy = Math.round(m ? m[5] : set.rig.height / 3) + dy;
  const c = document.createElement('canvas');
  c.width = 20;
  c.height = 20;
  const g = c.getContext('2d');
  const a = sheet.anims.get('idle');
  if (g && a) g.drawImage(sheet.canvas, hx - 10, a.row * sheet.frameHeight + hy - 10, 20, 20, 0, 0, 20, 20);
  return c;
}

function rootOf(set: SpriteSetDef): [number, number] {
  const r = set.rig.bones.find((b) => b.name === 'root');
  return [r?.x ?? set.rig.width / 2, r?.y ?? set.rig.height];
}

function weatherIcon(g: CanvasRenderingContext2D, w: Weather, x: number, y: number, big: boolean): void {
  const s = big ? 1 : 0.75;
  const px = (dx: number, dy: number, ww: number, hh: number, col: string): void => {
    g.fillStyle = col;
    g.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), Math.max(1, Math.round(ww * s)), Math.max(1, Math.round(hh * s)));
  };
  px(0, 0, 22, 22, 'rgba(30, 24, 40, 0.7)');
  if (w === 'clear') {
    px(7, 7, 8, 8, '#f2c14e');
    px(9, 5, 4, 12, '#f2c14e');
    px(5, 9, 12, 4, '#f2c14e');
    px(9, 9, 3, 3, '#fbe6a0');
  } else if (w === 'rain') {
    px(4, 6, 14, 6, '#c9cfd8');
    px(6, 4, 8, 4, '#dfe4ea');
    for (const dx of [6, 10, 14]) px(dx, 14, 1, 4, '#7fb0e0');
  } else {
    for (const [dy, len] of [
      [6, 12],
      [11, 15],
      [16, 9],
    ] as const) {
      px(4, dy, len, 2, '#dfe8e8');
      px(4 + len, dy - 2, 2, 2, '#dfe8e8');
    }
  }
}

export class BattleScene implements Scene {
  readonly battle: Battle;
  private readonly visuals = new Map<string, Visual>();
  private biscuitVisual: Visual | null = null;
  private popups: Popup[] = [];
  private queue: BattleEvent[] = [];
  private wait = 0;
  private phase: 'intro' | 'next' | 'command' | 'play' | 'end' | 'done' = 'intro';
  private introT = 0;
  private menu: ListMenu | null = null;
  private preview: Weight | undefined;
  private targeting: string | null = null;
  private auto = false;
  private readonly el: HTMLDivElement;
  private readonly msgEl: HTMLDivElement;
  private readonly panelEl: HTMLDivElement;
  private readonly autoEl: HTMLDivElement;
  private resultEl: HTMLDivElement | null = null;
  private results: Results | null = null;
  private time = 0;
  private readonly tutorial: boolean;

  constructor(
    private readonly game: GameState,
    encounterId: string,
    ui: HTMLElement,
    private readonly hooks: BattleHooks,
  ) {
    // Draw a battle seed from the game's RNG so the same save plays out the same way.
    const rng = Rng.fromState(game.rng);
    const seed = rng.nextUint32();
    game.rng = rng.getState();
    this.battle = new Battle(game, encounterId, seed);
    this.tutorial = encounterId === 'sorting-rats';

    for (const c of this.battle.combatants) this.addVisual(c);
    if (this.battle.biscuit) {
      const set = setById('biscuit-battle');
      const [fx, fy] = rootOf(set);
      this.biscuitVisual = { key: 'biscuit', sheet: getSheet(set), x: BISCUIT_SLOT[0], y: BISCUIT_SLOT[1], fx, fy, anim: 'idle', t: 0, lunge: 0, flash: 0, alpha: 1, icon: iconFrom(fieldSets('biscuit').down, 'head', 0) };
    }

    this.el = document.createElement('div');
    this.el.className = 'battle-ui';
    this.msgEl = document.createElement('div');
    this.msgEl.className = 'battle-msg';
    this.msgEl.setAttribute('aria-live', 'polite');
    this.panelEl = document.createElement('div');
    this.panelEl.className = 'battle-party';
    this.autoEl = document.createElement('div');
    this.autoEl.className = 'battle-auto';
    this.autoEl.hidden = true;
    this.autoEl.textContent = `Auto-battle on. ${hint('auto-off')}.`;
    this.el.append(this.msgEl, this.panelEl, this.autoEl);
    ui.appendChild(this.el);
    this.message(this.tutorial ? 'Rats! Attack them, or use the letter you carry with Letter.' : `${this.battle.combatants.filter((c) => c.side === 'enemy').map((e) => e.name).join(', ')}!`);
    this.renderPanel();
  }

  destroy(): void {
    this.menu?.destroy();
    this.el.remove();
  }

  private message(text: string): void {
    this.msgEl.textContent = text;
    this.msgEl.hidden = text.length === 0;
  }

  private renderPanel(): void {
    const rows = this.battle.combatants
      .filter((c) => c.side === 'party')
      .map((c) => {
        const ail = Object.keys(c.ailments)
          .map((a) => `<span class="ail ail-${a}">${a}</span>`)
          .join('');
        const cur = this.phase === 'command' && this.battle.current().key === c.key ? ' current' : '';
        return `<div class="pm${c.ko ? ' ko' : ''}${cur}"><div class="pm-name">${c.name}<small>Lv ${c.level}</small>${c.guarding ? '<span class="ail">guard</span>' : ''}${ail}</div>
          <div class="bar hp"><i style="width:${(100 * c.hp) / c.maxHp}%"></i><span>${c.hp}/${c.maxHp}</span></div>
          <div class="bar fp"><i style="width:${c.maxFp ? (100 * c.fp) / c.maxFp : 0}%"></i><span>${c.fp}/${c.maxFp} FP</span></div></div>`;
      });
    const html = rows.join('');
    if (this.panelEl.innerHTML !== html) this.panelEl.innerHTML = html;
  }

  // -------------------------------------------------------------------------
  // Choosing actions.

  private closeMenu(): void {
    this.menu?.destroy();
    this.menu = null;
    this.preview = undefined;
    this.targeting = null;
  }

  private showCommands(): void {
    const c = this.battle.current();
    this.closeMenu();
    this.phase = 'command';
    this.message(this.tutorial && c.id === 'rookie' ? 'Attack, or choose Letter to use the letter you carry.' : `${c.name}’s turn.`);
    const items: (MenuItem & { weight?: Weight })[] = [
      { label: 'Attack', weight: 'normal', action: () => this.pickTarget('enemy', (t) => ({ kind: 'attack', target: t })) },
      { label: 'Skill', disabled: this.battle.usableSkills(c).length === 0, action: () => this.showSkills() },
      {
        label: 'Letter',
        detail: c.letters.length === 0 ? 'No letters carried' : undefined,
        weight: 'normal',
        disabled: !this.battle.letterOptions(c, 'carry').some((o) => o.usable),
        action: () => this.showLetters('carry'),
      },
      { label: 'Break the Seal', weight: 'normal', disabled: c.letters.length === 0, action: () => this.showLetters('burst') },
      ...(this.battle.deliverOptions().length > 0 ? [{ label: 'Deliver', detail: 'Hand over their letter', action: () => this.showDeliver() }] : []),
      { label: 'Guard', weight: 'light', action: () => this.choose({ kind: 'guard' }) },
      { label: 'Item', disabled: !Object.entries(this.game.items).some(([id, n]) => n > 0 && ITEMS[id]?.battle), action: () => this.showItems() },
      { label: 'Run', weight: 'normal', disabled: !this.battle.encounter.escapable, detail: this.battle.encounter.escapable ? `${Math.round(this.battle.runChance() * 100)}%` : 'Can’t run', action: () => this.choose({ kind: 'run' }) },
      { label: 'Auto', detail: 'Basic attacks and heals', action: () => this.setAuto(true) },
    ];
    this.menu = new ListMenu(this.el, c.name, items, undefined, 'menu battle-menu battle-commands', (i) => {
      this.preview = items[i]?.weight;
    });
  }

  private showDeliver(): void {
    this.closeMenu();
    const opts = this.battle.deliverOptions();
    const items: MenuItem[] = opts.map((o) => ({
      label: `“${LETTER_BY_ID[o.letter]?.title ?? o.letter}”`,
      detail: `To ${this.battle.get(o.target).name}`,
      action: () => this.choose({ kind: 'deliver', letter: o.letter, target: o.target }),
    }));
    this.menu = new ListMenu(this.el, 'Deliver', items, () => this.showCommands(), 'menu battle-menu');
  }

  private showSkills(): void {
    const c = this.battle.current();
    this.closeMenu();
    const skills = c.skills.map((id) => SKILLS[id]).filter((s) => !!s);
    const items: MenuItem[] = skills.map((s) => ({
      label: `${s.name}  ${s.fp} FP`,
      detail: s.description,
      disabled: s.fp > c.fp,
      action: () => this.targetSkill(s, (t) => ({ kind: 'skill', skill: s.id, target: t }), () => this.showSkills()),
    }));
    this.menu = new ListMenu(this.el, 'Skill', items, () => this.showCommands(), 'menu battle-menu', (i) => {
      this.preview = skills[i]?.weight;
    });
  }

  private showLetters(mode: LetterMode): void {
    const c = this.battle.current();
    this.closeMenu();
    const opts = this.battle.letterOptions(c, mode);
    const items: MenuItem[] = opts.map((o) => ({
      label: mode === 'carry' ? `${o.skill.name}${o.skill.passive ? '' : `  ${o.skill.fp} FP`}` : o.skill.name,
      detail: `${LETTER_BY_ID[o.letter]?.title ?? o.letter}. ${o.skill.description}`,
      disabled: !o.usable,
      action: () => this.targetSkill(o.skill, (t) => ({ kind: 'letter', letter: o.letter, mode, target: t }), () => this.showLetters(mode)),
    }));
    this.menu = new ListMenu(this.el, mode === 'carry' ? 'Letter' : 'Break the Seal', items, () => this.showCommands(), 'menu battle-menu', () => {
      this.preview = 'normal';
    });
  }

  /** Picks a target as the skill requires, or acts at once for self and group skills. */
  private targetSkill(s: SkillDef, make: (key: string) => Action, back: () => void): void {
    const c = this.battle.current();
    if (s.target === 'enemy') this.pickTarget('enemy', make, back);
    else if (s.target === 'ally') this.pickTarget('ally', make, back);
    else if (s.target === 'anyAlly') this.pickTarget('any', make, back);
    else if (s.target === 'allEnemies') this.choose(make(this.battle.alive('enemy')[0]?.key ?? c.key));
    else this.choose(make(c.key));
  }

  private showItems(): void {
    this.closeMenu();
    const entries = Object.entries(this.game.items).filter(([id, n]) => n > 0 && ITEMS[id]?.battle);
    const items: MenuItem[] = entries.map(([id, n]) => {
      const it = ITEMS[id];
      return {
        label: `${it?.name ?? id} ×${n}`,
        detail: it?.description ?? '',
        action: () => this.pickTarget(it?.revive ? 'fallen' : 'ally', (t) => ({ kind: 'item', item: id, target: t })),
      };
    });
    this.menu = new ListMenu(this.el, 'Item', items, () => this.showCommands(), 'menu battle-menu', () => {
      this.preview = 'normal';
    });
  }

  private pickTarget(kind: 'enemy' | 'ally' | 'fallen' | 'any', make: (key: string) => Action, back: () => void = () => this.showCommands()): void {
    this.closeMenu();
    const pool = this.battle.combatants.filter((c) =>
      kind === 'enemy' ? c.side === 'enemy' && !c.ko : kind === 'ally' ? c.side === 'party' && !c.ko : kind === 'any' ? c.side === 'party' : c.side === 'party' && c.ko,
    );
    if (pool.length === 0) {
      this.message('Nobody to use that on.');
      this.showCommands();
      return;
    }
    const items: MenuItem[] = pool.map((c) => ({ label: c.name, detail: `${c.hp}/${c.maxHp} HP`, action: () => this.choose(make(c.key)) }));
    this.menu = new ListMenu(this.el, kind === 'enemy' ? 'Target' : 'Who?', items, back, 'menu battle-menu', (i) => {
      this.targeting = pool[i]?.key ?? null;
    });
  }

  private choose(action: Action): void {
    this.closeMenu();
    if (action.kind === 'item') {
      const item = action.item;
      const n = (this.game.items[item] ?? 0) - 1;
      this.game.items = Object.fromEntries(Object.entries({ ...this.game.items, [item]: n }).filter(([, v]) => v > 0));
    }
    this.queue = this.battle.act(action);
    this.phase = 'play';
  }

  private setAuto(on: boolean): void {
    this.auto = on;
    this.autoEl.hidden = !on;
    this.autoEl.textContent = `Auto-battle on. ${hint('auto-off')}.`;
    if (on && this.phase === 'command') {
      this.closeMenu();
      this.phase = 'next';
      this.takeTurn(true);
    }
  }

  // -------------------------------------------------------------------------
  // Turn flow.

  private takeTurn(skipStart = false): void {
    if (this.battle.result) {
      this.phase = 'end';
      return;
    }
    if (!skipStart) {
      const pre = this.battle.startTurn();
      if (pre.length > 0) {
        this.queue = pre;
        this.phase = 'play';
        return;
      }
    }
    const c = this.battle.current();
    if (c.side === 'enemy') {
      this.queue = this.battle.act(this.battle.enemyAction(c));
      this.phase = 'play';
    } else if (this.auto) {
      this.queue = this.battle.act(this.battle.autoAction(c));
      this.phase = 'play';
    } else this.showCommands();
  }

  /** Places a combatant in the next free slot on its side. */
  private addVisual(c: Combatant): void {
    const i = [...this.visuals.keys()].filter((k) => this.battle.get(k).side === c.side).length;
    if (c.side === 'party') {
      const set = setById(`${c.id}-battle`);
      const [fx, fy] = rootOf(set);
      const [x, y] = PARTY_SLOTS[i] ?? [520, 300];
      const field = fieldSets(c.id).down;
      this.visuals.set(c.key, { key: c.key, sheet: getSheet(set), x, y, fx, fy, anim: c.ko ? 'knockedOut' : 'idle', t: c.ko ? 9999 : i * 90, lunge: 0, flash: 0, alpha: 1, icon: iconFrom(field, 'head') });
      return;
    }
    const def = ENEMIES[c.id];
    const set = setById(`${def?.sprite ?? c.id}-battle`);
    const [fx, fy] = rootOf(set);
    const [x, y] = ENEMY_SLOTS[i] ?? [ENEMY_SLOTS[i % ENEMY_SLOTS.length]?.[0] ?? 300, 280];
    this.visuals.set(c.key, { key: c.key, sheet: getSheet(set), x, y, fx, fy, anim: 'idle', t: i * 130, lunge: 0, flash: 0, alpha: 1, icon: iconFrom(set, 'head', 0) });
  }

  private visual(key: string): Visual | undefined {
    return key === 'biscuit' ? (this.biscuitVisual ?? undefined) : this.visuals.get(key);
  }

  private popup(key: string, text: string, color: string): void {
    const v = this.visual(key);
    if (!v) return;
    this.popups.push({ x: v.x, y: v.y - v.fy + 10, text, color, t: 0 });
  }

  private playNext(): void {
    const e = this.queue.shift();
    if (!e) {
      this.phase = this.battle.result ? 'end' : 'next';
      return;
    }
    switch (e.type) {
      case 'act': {
        const v = this.visual(e.actor);
        const c = this.battle.get(e.actor);
        if (v) {
          v.anim =
            e.anim === 'attack'
              ? 'attack'
              : e.anim === 'guard'
                ? 'guard'
                : e.anim === 'breakSeal'
                  ? 'breakSeal'
                  : c.side === 'enemy'
                    ? e.anim === 'cast'
                      ? 'cast'
                      : 'attack'
                    : 'read';
          if (!v.sheet.anims.has(v.anim)) v.anim = 'attack';
          v.t = 0;
          if (e.anim === 'attack') v.lunge = 1;
        }
        this.message(`${c.name}: ${e.label}`);
        sound(e.anim === 'attack' ? 'swing' : e.anim === 'breakSeal' ? 'wax' : e.anim === 'guard' ? 'blip' : 'swoosh');
        this.wait = e.anim === 'attack' ? 260 : e.anim === 'breakSeal' ? 720 : 420;
        break;
      }
      case 'damage': {
        const v = this.visual(e.target);
        if (v && !this.battle.get(e.target).ko) {
          v.anim = 'hit';
          v.t = 0;
        }
        if (v) v.flash = 1;
        sound('hit');
        this.popup(e.target, String(e.amount), '#fff4e0');
        this.wait = 240;
        break;
      }
      case 'heal':
        sound('heal');
        this.popup(e.target, `+${e.amount}`, '#9fe39a');
        this.wait = 240;
        break;
      case 'fp':
        this.popup(e.target, `+${e.amount} FP`, '#9fc8f0');
        this.wait = 220;
        break;
      case 'status':
        sound('status');
        this.popup(e.target, `${e.ailment[0]?.toUpperCase()}${e.ailment.slice(1)}!`, '#e8b0f0');
        this.wait = 300;
        break;
      case 'delay':
        this.popup(e.target, 'Delayed', '#f0d890');
        this.wait = 280;
        break;
      case 'ko': {
        const v = this.visual(e.target);
        if (v) {
          v.anim = this.battle.get(e.target).side === 'enemy' ? 'defeat' : 'knockedOut';
          v.t = 0;
        }
        sound('ko');
        this.wait = 420;
        break;
      }
      case 'revive': {
        const v = this.visual(e.target);
        if (v) {
          v.anim = 'idle';
          v.alpha = 1;
        }
        this.wait = 200;
        break;
      }
      case 'message':
        this.message(e.text);
        this.wait = 650;
        break;
      case 'skip':
        this.wait = 200;
        break;
      case 'biscuit': {
        const v = this.biscuitVisual;
        if (v) {
          v.anim = e.what === 'headbutt' ? 'attack' : e.what === 'eat' ? 'eat' : 'wander';
          v.t = 0;
          if (e.what === 'headbutt') v.lunge = 1;
        }
        sound('bleat');
        this.wait = 380;
        break;
      }
      case 'join': {
        const c = this.battle.get(e.target);
        if (!this.visuals.has(c.key)) this.addVisual(c);
        sound(c.side === 'party' ? 'join' : 'swoosh');
        this.popup(e.target, c.side === 'party' ? 'Joins!' : 'Arrives!', '#f0d890');
        this.wait = 420;
        break;
      }
      case 'escape': {
        const v = this.visual(e.target);
        if (v) v.alpha = 0;
        sound('swoosh');
        this.popup(e.target, 'Gone!', '#f0d890');
        this.wait = 300;
        break;
      }
      case 'end':
        this.wait = 300;
        break;
    }
    this.renderPanel();
  }

  private finish(): void {
    const result = this.battle.result;
    if (!result) return;
    this.phase = 'done';
    this.closeMenu();
    this.autoEl.hidden = true;
    sound(result === 'victory' ? 'victory' : result === 'defeat' ? 'defeat' : result === 'delivered' ? 'chime' : 'swoosh');
    if (result === 'fled' || result === 'delivered') {
      this.battle.applyResults(this.game);
      this.hooks.onEnd(result, null);
      return;
    }
    if (result === 'defeat') {
      this.battle.applyResults(this.game);
      this.hooks.onEnd('defeat', null);
      return;
    }
    for (const c of this.battle.combatants) {
      const v = this.visuals.get(c.key);
      if (v && c.side === 'party' && !c.ko) {
        v.anim = 'victory';
        v.t = 0;
      }
    }
    if (this.biscuitVisual) {
      this.biscuitVisual.anim = 'victory';
      this.biscuitVisual.t = 0;
    }
    this.results = this.battle.applyResults(this.game);
    const r = this.results;
    const lines = [`<h2>Victory</h2>`, `<p>${r.xpEach} XP each · ${r.coin} coin</p>`];
    if (r.items.length > 0) lines.push(`<p>Found: ${r.items.map((i) => ITEMS[i]?.name ?? i).join(', ')}</p>`);
    for (const up of r.levelUps) {
      const c = this.battle.get(up.id);
      lines.push(`<p class="levelup">${c.name} reached level ${up.level}!</p>`);
    }
    lines.push(`<p class="hint">${hint('confirm')} to continue</p>`);
    this.resultEl = document.createElement('div');
    this.resultEl.className = 'menu battle-results';
    this.resultEl.innerHTML = lines.join('');
    this.resultEl.addEventListener('click', () => this.leave());
    this.el.appendChild(this.resultEl);
    this.renderPanel();
  }

  private leave(): void {
    if (!this.results) return;
    const r = this.results;
    this.results = null;
    this.hooks.onEnd('victory', r);
  }

  /**
   * The battle tune and how much of it plays: rain keeps it to bass and
   * strings, clear skies bring in the drums and fiddle, wind brings in
   * everything. Bosses never drop below the middle. It stops for the result.
   */
  music(): { song: string | null; intensity: number } {
    if (this.phase === 'done' || this.phase === 'end') return { song: null, intensity: 0 };
    const w = this.battle.forecast()[0];
    const boss = this.battle.combatants.some((c) => c.side === 'enemy' && ENEMIES[c.id]?.boss);
    const level = w === 'rain' ? 0 : w === 'clear' ? 1 : 2;
    return { song: 'battle', intensity: boss ? Math.max(1, level) : level };
  }

  update(ctx: SceneContext): void {
    const dt = ctx.stepMs;
    this.time += dt;
    for (const v of [...this.visuals.values(), ...(this.biscuitVisual ? [this.biscuitVisual] : [])]) {
      v.t += dt;
      const a = v.sheet.anims.get(v.anim);
      const done = a && !a.def.loop && v.t > a.def.durations.reduce((x, y) => x + y, 0) + 120;
      const c = v.key === 'biscuit' ? null : this.battle.get(v.key);
      if (done && v.anim !== 'knockedOut' && v.anim !== 'defeat' && v.anim !== 'victory') {
        v.anim = c?.guarding ? 'guard' : 'idle';
        v.t = 0;
      }
      if (c?.ko && c.side === 'enemy') v.alpha = Math.max(0, v.alpha - dt / 600);
      v.lunge = Math.max(0, v.lunge - dt / 380);
      v.flash = Math.max(0, v.flash - dt / 180);
    }
    for (const p of this.popups) p.t += dt;
    this.popups = this.popups.filter((p) => p.t < 900);

    const input: Keyboard = ctx.input;
    if (this.auto && input.wasPressed('cancel')) this.setAuto(false);

    switch (this.phase) {
      case 'intro':
        this.introT += dt;
        if (this.introT >= 380) {
          this.phase = 'next';
          this.takeTurn();
        }
        break;
      case 'next':
        this.takeTurn();
        break;
      case 'command':
        this.menu?.update(input);
        break;
      case 'play':
        this.wait -= dt;
        if (this.wait <= 0) this.playNext();
        break;
      case 'end':
        this.finish();
        break;
      case 'done':
        if (this.results && input.wasPressed('confirm')) this.leave();
        break;
    }
  }

  render(g: CanvasRenderingContext2D): void {
    const region = this.battle.encounter.backdrop ?? this.battle.encounter.region;
    g.drawImage(backdrop(region), 0, 0);
    // Rain and wind tint the scene a little.
    const w = this.battle.forecast()[0];
    if (w === 'rain') {
      g.fillStyle = 'rgba(60, 80, 110, 0.18)';
      g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      g.fillStyle = 'rgba(190, 210, 235, 0.5)';
      for (let i = 0; i < 70; i++) {
        const x = (i * 97 + Math.floor(this.time / 6)) % LOGICAL_WIDTH;
        const y = (i * 53 + Math.floor(this.time / 3)) % LOGICAL_HEIGHT;
        g.fillRect(x, y, 1, 5);
      }
    } else if (w === 'wind') {
      g.fillStyle = 'rgba(230, 236, 230, 0.45)';
      for (let i = 0; i < 18; i++) {
        const x = (i * 131 + Math.floor(this.time / 2)) % (LOGICAL_WIDTH + 40) - 40;
        const y = 40 + ((i * 71) % 260);
        g.fillRect(x, y, 14, 1);
      }
    }

    // Combatants, back to front.
    const all = [...this.visuals.values(), ...(this.biscuitVisual ? [this.biscuitVisual] : [])].sort((a, b) => a.y - b.y);
    for (const v of all) {
      if (v.alpha <= 0) continue;
      const c = v.key === 'biscuit' ? null : this.battle.get(v.key);
      const dir = c?.side === 'enemy' ? 1 : -1;
      const lunge = Math.sin(Math.min(1, v.lunge) * Math.PI) * 22 * dir;
      const shake = v.flash > 0 ? Math.round(Math.sin(this.time / 20) * 2) : 0;
      g.fillStyle = 'rgba(20, 24, 14, 0.25)';
      g.beginPath();
      g.ellipse(v.x + lunge, v.y + 1, c?.side === 'enemy' ? 16 : 14, 4, 0, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = v.alpha;
      const a = v.sheet.anims.get(v.anim) ?? v.sheet.anims.get('idle');
      const frame = a ? (v.anim === 'knockedOut' || v.anim === 'defeat' ? frameAt({ ...a.def, loop: false }, v.t) : frameAt(a.def, v.t)) : 0;
      drawFrame(g, v.sheet, a?.def.name ?? 'idle', frame, Math.round(v.x - v.fx + lunge + shake), Math.round(v.y - v.fy));
      if (v.flash > 0.5) {
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = (v.flash - 0.5) * 0.8;
        drawFrame(g, v.sheet, a?.def.name ?? 'idle', frame, Math.round(v.x - v.fx + lunge + shake), Math.round(v.y - v.fy));
        g.globalCompositeOperation = 'source-over';
      }
      g.globalAlpha = 1;
    }

    // Target pointer.
    const pointerKey = this.targeting ?? (this.phase === 'command' ? this.battle.current().key : null);
    const pv = pointerKey ? this.visuals.get(pointerKey) : undefined;
    if (pv) {
      const bob = Math.round(Math.sin(this.time / 140) * 2);
      const px = Math.round(pv.x);
      const py = Math.round(pv.y - pv.fy - 4 + bob);
      g.fillStyle = this.targeting ? '#f2c14e' : '#f3ead6';
      g.fillRect(px - 4, py - 6, 9, 2);
      g.fillRect(px - 3, py - 4, 7, 2);
      g.fillRect(px - 2, py - 2, 5, 2);
      g.fillRect(px - 1, py, 3, 2);
    }

    // Damage numbers.
    g.font = 'bold 12px Georgia, serif';
    g.textAlign = 'center';
    for (const p of this.popups) {
      const y = Math.round(p.y - Math.min(18, p.t / 25));
      g.globalAlpha = p.t > 600 ? Math.max(0, 1 - (p.t - 600) / 300) : 1;
      g.fillStyle = '#1b1a24';
      g.fillText(p.text, p.x + 1, y + 1);
      g.fillStyle = p.color;
      g.fillText(p.text, p.x, y);
    }
    g.globalAlpha = 1;

    this.drawTimeline(g);
    this.drawForecast(g);

    // The intro wipe: bars open from the middle in under half a second.
    if (this.phase === 'intro') {
      const k = Math.min(1, this.introT / 380);
      const h = Math.round((LOGICAL_HEIGHT / 2) * (1 - k));
      g.fillStyle = '#16151d';
      g.fillRect(0, 0, LOGICAL_WIDTH, h);
      g.fillRect(0, LOGICAL_HEIGHT - h, LOGICAL_WIDTH, h);
    }
  }

  private drawTimeline(g: CanvasRenderingContext2D): void {
    const order = this.battle.result ? [] : this.battle.timeline(BALANCE.timelineShown, this.phase === 'command' ? this.preview : undefined);
    const cur = this.battle.result ? null : this.battle.current().key;
    if (order.length === 0) return;
    const x0 = 196;
    const y0 = 8;
    g.fillStyle = 'rgba(30, 24, 40, 0.72)';
    g.fillRect(x0 - 6, y0 - 4, BALANCE.timelineShown * 26 + 8, 32);
    let nextOfCurrent = -1;
    if (this.preview && cur) nextOfCurrent = order.indexOf(cur, 1);
    order.forEach((key, i) => {
      const v = this.visual(key);
      const x = x0 + i * 26;
      const enemy = key.startsWith('e');
      g.fillStyle = i === 0 ? '#f2c14e' : enemy ? '#a8483e' : key === 'biscuit' ? '#c9a274' : '#4a6a9a';
      g.fillRect(x - 1, y0 - 1, 24, 24);
      g.fillStyle = '#e9e2d0';
      g.fillRect(x + 1, y0 + 1, 20, 20);
      if (v) g.drawImage(v.icon, x + 1, y0 + 1);
      if (i === nextOfCurrent) {
        g.fillStyle = '#f2c14e';
        g.fillRect(x - 2, y0 + 23, 26, 2);
      }
    });
  }

  private drawForecast(g: CanvasRenderingContext2D): void {
    const f = this.battle.forecast();
    weatherIcon(g, f[0] ?? 'clear', 560, 8, true);
    weatherIcon(g, f[1] ?? 'clear', 586, 12, false);
    weatherIcon(g, f[2] ?? 'clear', 606, 12, false);
  }

  debugInfo(): Record<string, string | number> {
    return { battle: this.battle.encounter.id, turn: this.battle.turn, time: Math.round(this.battle.time), weather: this.battle.forecast().join(' ') };
  }
}

/** Battle frames for party members who do not have a battle sprite are not expected. */
export function hasBattleSprite(id: string): boolean {
  return ALL_CHARACTERS.some((c) => c.sets().some((s) => s.id === `${id}-battle`));
}

export type { Combatant };
