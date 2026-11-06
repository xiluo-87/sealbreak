import { type Frame, renderFrame } from './pipeline';
import type { SpriteSetDef } from './types';

export interface BuiltSet {
  def: SpriteSetDef;
  /** Rendered frames per animation name. */
  anims: Map<string, Frame[]>;
}

/** Renders every frame of a sprite set. Pure, so tests and scripts can use it. */
export function buildSet(def: SpriteSetDef): BuiltSet {
  const anims = new Map<string, Frame[]>();
  for (const a of def.anims) anims.set(a.name, a.frames.map((pose) => renderFrame(def.rig, pose)));
  return { def, anims };
}
