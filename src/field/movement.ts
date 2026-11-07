/**
 * Tile movement. A mover always stands on a tile or is part way between two
 * tiles. Steps take a fixed time, so encounters can be counted in steps.
 */
import { type Dir, delta } from './dir';

export const TILE = 32;
/** Walking speed from the design: 5 tiles per second. */
export const WALK_MS_PER_TILE = 200;
export const RUN_MS_PER_TILE = 120;

export interface Mover {
  /** Tile the mover is on, or heading to while moving. */
  tx: number;
  ty: number;
  /** Tile the current step started from. */
  fx: number;
  fy: number;
  /** 0..1 progress of the current step. 1 when standing still. */
  t: number;
  moving: boolean;
  facing: Dir;
}

export function mover(tx: number, ty: number, facing: Dir = 'down'): Mover {
  return { tx, ty, fx: tx, fy: ty, t: 1, moving: false, facing };
}

/**
 * Starts a step if the mover is standing still and the target is free.
 * Always turns to face `dir`. Returns true if a step started.
 */
export function tryStep(m: Mover, dir: Dir, blocked: (x: number, y: number) => boolean): boolean {
  if (m.moving) return false;
  m.facing = dir;
  const [dx, dy] = delta(dir);
  if (blocked(m.tx + dx, m.ty + dy)) return false;
  m.fx = m.tx;
  m.fy = m.ty;
  m.tx += dx;
  m.ty += dy;
  m.t = 0;
  m.moving = true;
  return true;
}

/** Forces a step without collision (followers and cutscenes). */
export function stepTo(m: Mover, x: number, y: number): void {
  const dx = x - m.tx;
  const dy = y - m.ty;
  if (dx === 0 && dy === 0) return;
  m.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down';
  m.fx = m.tx;
  m.fy = m.ty;
  m.tx = x;
  m.ty = y;
  m.t = 0;
  m.moving = true;
}

/**
 * Advances the current step. Returns the leftover time in ms once the step
 * has finished (so a held key can chain steps without a pause), or -1 while
 * the step is still under way or the mover is idle.
 */
export function advance(m: Mover, dtMs: number, msPerTile: number): number {
  if (!m.moving) return -1;
  m.t += dtMs / msPerTile;
  if (m.t < 1) return -1;
  const leftover = (m.t - 1) * msPerTile;
  m.t = 1;
  m.moving = false;
  m.fx = m.tx;
  m.fy = m.ty;
  return leftover;
}

/** Pixel position of the mover's feet (bottom centre of its tile). */
export function feet(m: Mover): { x: number; y: number } {
  const t = m.moving ? m.t : 1;
  const x = (m.fx + (m.tx - m.fx) * t) * TILE + TILE / 2;
  const y = (m.fy + (m.ty - m.fy) * t) * TILE + TILE - 3;
  return { x: Math.round(x), y: Math.round(y) };
}
