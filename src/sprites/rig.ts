/**
 * Part rig types. A character is a set of bones (a transform hierarchy) and
 * named parts (shapes of one material attached to a bone). A pose moves and
 * rotates bones and sets flags that switch parts and details on or off.
 */
import { apply, IDENTITY, type Mat, multiply, rotate, scale, translate } from './geom';
import type { Material } from './palette';
import type { Shape } from './shapes';

export interface BoneDef {
  name: string;
  parent?: string;
  /** Origin in the parent's space, in pixels. */
  x: number;
  y: number;
  /** Rest rotation in degrees. */
  rot?: number;
}

export interface BonePose {
  rot?: number;
  x?: number;
  y?: number;
  sx?: number;
  sy?: number;
}

export interface Pose {
  bones?: Record<string, BonePose>;
  /** Flags switch parts and details (`when` / `unless`). */
  flags?: string[];
  /** Per-part z overrides for this pose. */
  z?: Record<string, number>;
  /** Whole-sprite offset, applied inside the mirror so it flips with the view. */
  dx?: number;
  dy?: number;
}

/** Lets a part build its shape in sprite space from bone positions. */
export interface ShapeContext {
  /** World position of a point given in a bone's local space. */
  p(bone: string, x?: number, y?: number): [number, number];
  /** World transform of a bone. */
  m(bone: string): Mat;
  flags: ReadonlySet<string>;
  mirrored: boolean;
}

export interface ShadeDef {
  /** Width of the shadow band on the side away from the light. Default 2. */
  shadow?: number;
  /** Width of the highlight band on the lit edge. Default 1, 0 disables. */
  light?: number;
  /** Direction away from the light, default [1, 1] (light from upper left). */
  dir?: [number, number];
  /** Receive cast shadows from parts in front. Default true. */
  receive?: boolean;
  /** No rim shading: the whole part uses the base tone. */
  flat?: boolean;
  /** Base tone index. Default 1. */
  base?: number;
}

export interface ToneMark {
  /** Tone index to paint, or a material name with a tone ("brass:1"). */
  tone: number;
  shape: Shape;
}

export interface PartDef {
  name: string;
  bone: string;
  z: number;
  material: string;
  /** Shape in the bone's local space, or a function giving one in sprite space. */
  shape: Shape | ((ctx: ShapeContext) => Shape);
  /** Shapes removed from this part (same space as `shape`). */
  cut?: Shape | ((ctx: ShapeContext) => Shape);
  /** Only keep pixels that also belong to these parts' masks. */
  clipTo?: string[];
  /** Hand-placed tone strokes such as folds, clipped to the part. */
  marks?: ToneMark[] | ((ctx: ShapeContext) => ToneMark[]);
  shade?: ShadeDef;
  when?: string;
  unless?: string;
  /** Keep 1-pixel features during cleanup. */
  thin?: boolean;
  /** Coverage needed for a pixel to count, 0..1. Default 0.5. */
  threshold?: number;
  /** Cast-shadow length on parts behind. Default 1, 0 for none. */
  cast?: number;
  /** Darken the edge of parts behind this one. Default true. */
  sep?: boolean;
  /** Outer outline. Default true. */
  outline?: boolean;
}

/**
 * Colour references used by detail grids: "coat" (base tone), "coat:0".."coat:3",
 * "coat:o" (outline) or "#rrggbb" (snapped to the palette).
 */
export type ColourRef = string;

export interface DetailDef {
  name?: string;
  bone: string;
  /** Top-left of the grid in bone space. Rotation is ignored to keep pixels crisp. */
  x: number;
  y: number;
  grid: string[];
  key: Record<string, ColourRef>;
  /** Only draw over pixels owned by these parts. */
  clip?: string[];
  when?: string;
  unless?: string;
  /** Do not flip the grid when the rig is mirrored. */
  noFlip?: boolean;
}

export interface Rig {
  id: string;
  width: number;
  height: number;
  materials: Record<string, Material>;
  bones: BoneDef[];
  parts: PartDef[];
  details: DetailDef[];
  /** Mirror horizontally before shading, so light stays upper-left. */
  mirror?: boolean;
}

export function isActive(item: { when?: string; unless?: string }, flags: ReadonlySet<string>): boolean {
  if (item.when !== undefined && !item.when.split('|').some((f) => flags.has(f))) return false;
  if (item.unless !== undefined && item.unless.split('|').some((f) => flags.has(f))) return false;
  return true;
}

/** World transforms of every bone for a pose. */
export function resolveBones(rig: Rig, pose: Pose): Map<string, Mat> {
  const base = multiply(
    rig.mirror ? multiply(translate(rig.width, 0), scale(-1, 1)) : IDENTITY,
    translate(pose.dx ?? 0, pose.dy ?? 0),
  );
  const out = new Map<string, Mat>();
  const byName = new Map(rig.bones.map((b) => [b.name, b]));
  const visit = (name: string, depth: number): Mat => {
    const known = out.get(name);
    if (known) return known;
    const bone = byName.get(name);
    if (!bone) throw new Error(`${rig.id}: unknown bone "${name}"`);
    if (depth > 64) throw new Error(`${rig.id}: bone cycle at "${name}"`);
    const parent = bone.parent !== undefined ? visit(bone.parent, depth + 1) : base;
    const p = pose.bones?.[name] ?? {};
    let m = multiply(parent, translate(bone.x + (p.x ?? 0), bone.y + (p.y ?? 0)));
    m = multiply(m, rotate((bone.rot ?? 0) + (p.rot ?? 0)));
    if (p.sx !== undefined || p.sy !== undefined) m = multiply(m, scale(p.sx ?? 1, p.sy ?? 1));
    out.set(name, m);
    return m;
  };
  for (const b of rig.bones) visit(b.name, 0);
  return out;
}

export function shapeContext(rig: Rig, bones: Map<string, Mat>, flags: ReadonlySet<string>): ShapeContext {
  const m = (bone: string): Mat => {
    const t = bones.get(bone);
    if (!t) throw new Error(`${rig.id}: unknown bone "${bone}"`);
    return t;
  };
  return {
    m,
    p: (bone, x = 0, y = 0) => apply(m(bone), x, y),
    flags,
    mirrored: rig.mirror === true,
  };
}
