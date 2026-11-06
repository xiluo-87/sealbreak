import { JUNIPER } from '../sprites/characters/juniper/index';
import { ODILE } from '../sprites/characters/odile/index';
import { ROOKIE } from '../sprites/characters/rookie/index';
import { drawAnim, getSheet, type SpriteSheet } from '../sprites/sheet';
import type { Facing } from '../sprites/types';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../render/scale';
import type { Scene, SceneContext } from './scene';

/** Field sprites keep their feet at this point inside the 32x48 frame. */
const FOOT_X = 16;
const FOOT_Y = 46;
/** Walking speed from the design: 5 tiles of 32 px per second. */
const WALK_PX_PER_S = 5 * 32;
const RUN_FACTOR = 1.75;

interface Walker {
  x: number;
  y: number;
  facing: Facing;
  moving: boolean;
  /** Time spent in the current animation, ms. */
  t: number;
  sheets: Record<Facing, SpriteSheet>;
}

function fieldSheets(sets: ReturnType<typeof ROOKIE.sets>): Record<Facing, SpriteSheet> {
  const pick = (view: Facing): SpriteSheet => {
    const def = sets.find((s) => s.kind === 'field' && s.view === view);
    if (!def) throw new Error(`missing field sprite ${view}`);
    return getSheet(def);
  };
  return { down: pick('down'), up: pick('up'), left: pick('left'), right: pick('right') };
}

/**
 * Milestone 1 test yard: walk the Rookie around and see the field sprites
 * in motion next to Odile and Juniper. Replaced by Thistle Cross in Milestone 2.
 */
export class YardScene implements Scene {
  private readonly rookie: Walker;
  private readonly odile: Walker;
  private readonly juniper: Walker;
  private readonly ground: HTMLCanvasElement;

  constructor() {
    const rookieSets = ROOKIE.sets().filter((s) => s.kind === 'field');
    const odileSets = ODILE.sets().filter((s) => s.kind === 'field');
    this.rookie = { x: 280, y: 210, facing: 'down', moving: false, t: 0, sheets: fieldSheets(rookieSets) };
    this.odile = { x: 360, y: 190, facing: 'down', moving: false, t: 0, sheets: fieldSheets(odileSets) };
    const juniperSets = JUNIPER.sets().filter((s) => s.kind === 'field');
    this.juniper = { x: 410, y: 214, facing: 'left', moving: false, t: 300, sheets: fieldSheets(juniperSets) };
    this.ground = paintGround();
  }

  update(ctx: SceneContext): void {
    const r = this.rookie;
    const dir = ctx.input.direction();
    const wasMoving = r.moving;
    r.moving = dir !== null;
    if (dir) {
      if (dir !== r.facing) r.t = 0;
      r.facing = dir;
      const speed = (WALK_PX_PER_S * (ctx.input.isHeld('run') ? RUN_FACTOR : 1) * ctx.stepMs) / 1000;
      const nx = r.x + (dir === 'left' ? -speed : dir === 'right' ? speed : 0);
      const ny = r.y + (dir === 'up' ? -speed : dir === 'down' ? speed : 0);
      // Keep a little distance from the others and stay on screen.
      const clear = [this.odile, this.juniper].every((o) => Math.hypot(nx - o.x, (ny - o.y) * 1.6) > 22);
      if (clear) {
        r.x = Math.max(20, Math.min(LOGICAL_WIDTH - 20, nx));
        r.y = Math.max(60, Math.min(LOGICAL_HEIGHT - 8, ny));
      }
    }
    if (wasMoving !== r.moving) r.t = 0;
    r.t += ctx.stepMs * (ctx.input.isHeld('run') && r.moving ? RUN_FACTOR : 1);

    // The others turn to keep an eye on the Rookie.
    for (const o of [this.odile, this.juniper]) {
      const dx = r.x - o.x;
      const dy = r.y - o.y;
      o.facing = Math.abs(dx) > Math.abs(dy) * 1.2 ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
      o.t += ctx.stepMs;
    }
  }

  render(g: CanvasRenderingContext2D): void {
    g.drawImage(this.ground, 0, 0);
    const walkers = [this.rookie, this.odile, this.juniper].sort((a, b) => a.y - b.y);
    for (const w of walkers) {
      g.fillStyle = 'rgba(28, 36, 22, 0.35)';
      g.beginPath();
      g.ellipse(Math.round(w.x), Math.round(w.y) - 1, 9, 3, 0, 0, Math.PI * 2);
      g.fill();
    }
    for (const w of walkers) {
      drawAnim(g, w.sheets[w.facing], w.moving ? 'walk' : 'idle', w.t, Math.round(w.x) - FOOT_X, Math.round(w.y) - FOOT_Y);
    }
  }

  debugInfo(): Record<string, string | number> {
    const r = this.rookie;
    return { rookie: `${Math.round(r.x)},${Math.round(r.y)} ${r.facing}${r.moving ? ' walk' : ''}` };
  }
}

/** Soft autumn grass with a dirt path, drawn once. Kept low in contrast so characters stand out. */
function paintGround(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = LOGICAL_WIDTH;
  c.height = LOGICAL_HEIGHT;
  const g = c.getContext('2d');
  if (!g) return c;
  g.fillStyle = '#6f7f4f';
  g.fillRect(0, 0, c.width, c.height);
  // Deterministic speckle so the grass does not look tiled.
  let seed = 1234567;
  const rnd = (): number => {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    return seed / 4294967296;
  };
  const tufts = ['#66764a', '#788a57', '#7f8f5a', '#6a7a4c'];
  for (let i = 0; i < 2200; i++) {
    g.fillStyle = tufts[Math.floor(rnd() * tufts.length)] ?? '#6f7f4f';
    const x = Math.floor(rnd() * c.width);
    const y = Math.floor(rnd() * c.height);
    g.fillRect(x, y, rnd() < 0.3 ? 2 : 1, 1);
  }
  // A worn path across the yard.
  for (let x = 0; x < c.width; x++) {
    const mid = 250 + Math.round(Math.sin(x / 70) * 10);
    for (let y = mid - 14; y < mid + 14; y++) {
      const edge = Math.abs(y - mid) > 11;
      if (edge && rnd() < 0.5) continue;
      g.fillStyle = rnd() < 0.08 ? '#a08c66' : edge ? '#8d7d58' : '#97845f';
      g.fillRect(x, y, 1, 1);
    }
  }
  // Fallen leaves.
  const leaves = ['#b9783c', '#c79a48', '#a5532f'];
  for (let i = 0; i < 90; i++) {
    g.fillStyle = leaves[Math.floor(rnd() * leaves.length)] ?? '#b9783c';
    g.fillRect(Math.floor(rnd() * c.width), Math.floor(rnd() * c.height), 2, 1);
  }
  return c;
}
