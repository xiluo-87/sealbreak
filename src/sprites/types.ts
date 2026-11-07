import type { Pose, Rig } from './rig';

export type SpriteKind = 'field' | 'battle' | 'portrait' | 'enemy';
export type Facing = 'down' | 'up' | 'left' | 'right';

export interface AnimDef {
  name: string;
  frames: Pose[];
  /** Milliseconds per frame (one value per frame). */
  durations: number[];
  loop: boolean;
}

/** One rig plus its animations, e.g. the Rookie's field sprite facing left. */
export interface SpriteSetDef {
  id: string;
  character: string;
  kind: SpriteKind;
  view?: Facing;
  rig: Rig;
  anims: AnimDef[];
}

export interface CharacterSprites {
  id: string;
  name: string;
  sets(): SpriteSetDef[];
}

/** Sizes from the design document, section 13.1. */
export const SPRITE_SIZES: Record<SpriteKind, { width: number; height: number }> = {
  field: { width: 32, height: 48 },
  battle: { width: 64, height: 96 },
  portrait: { width: 96, height: 96 },
  /** Regular enemies vary between 48 and 72 px; this is the largest. */
  enemy: { width: 72, height: 72 },
};

export function anim(name: string, frames: Pose[], ms: number | number[], loop = true): AnimDef {
  const durations = Array.isArray(ms) ? ms : frames.map(() => ms);
  if (durations.length !== frames.length) throw new Error(`anim ${name}: ${frames.length} frames but ${durations.length} durations`);
  return { name, frames, durations, loop };
}
