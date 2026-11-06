/**
 * Browser side of the sprite pipeline: rendered frames are packed into one
 * canvas per sprite set and cached, so drawing a sprite is a single
 * drawImage call.
 */
import { frameAt } from './anim';
import { buildSet } from './build';
import type { Frame } from './pipeline';
import type { AnimDef, SpriteSetDef } from './types';

export interface SheetAnim {
  def: AnimDef;
  row: number;
}

export interface SpriteSheet {
  id: string;
  canvas: HTMLCanvasElement;
  frameWidth: number;
  frameHeight: number;
  anims: Map<string, SheetAnim>;
  /** Milliseconds it took to render this sheet. */
  buildMs: number;
}

const cache = new Map<string, SpriteSheet>();

export function frameToCanvas(frame: Frame): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = frame.width;
  c.height = frame.height;
  const g = c.getContext('2d');
  if (g) g.putImageData(new ImageData(new Uint8ClampedArray(frame.rgba), frame.width, frame.height), 0, 0);
  return c;
}

export function getSheet(def: SpriteSetDef): SpriteSheet {
  const hit = cache.get(def.id);
  if (hit) return hit;
  const t0 = performance.now();
  const built = buildSet(def);
  const fw = def.rig.width;
  const fh = def.rig.height;
  const cols = Math.max(1, ...def.anims.map((a) => a.frames.length));
  const canvas = document.createElement('canvas');
  canvas.width = cols * fw;
  canvas.height = def.anims.length * fh;
  const g = canvas.getContext('2d');
  const anims = new Map<string, SheetAnim>();
  def.anims.forEach((a, row) => {
    anims.set(a.name, { def: a, row });
    (built.anims.get(a.name) ?? []).forEach((f, col) => {
      g?.putImageData(new ImageData(new Uint8ClampedArray(f.rgba), fw, fh), col * fw, row * fh);
    });
  });
  const sheet: SpriteSheet = { id: def.id, canvas, frameWidth: fw, frameHeight: fh, anims, buildMs: performance.now() - t0 };
  cache.set(def.id, sheet);
  return sheet;
}

/** Draws one frame with its top-left at (x, y), optionally scaled by a whole number. */
export function drawFrame(
  g: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  anim: string,
  frame: number,
  x: number,
  y: number,
  scale = 1,
): void {
  const a = sheet.anims.get(anim);
  if (!a) return;
  const f = Math.max(0, Math.min(a.def.frames.length - 1, frame));
  g.drawImage(
    sheet.canvas,
    f * sheet.frameWidth,
    a.row * sheet.frameHeight,
    sheet.frameWidth,
    sheet.frameHeight,
    Math.round(x),
    Math.round(y),
    sheet.frameWidth * scale,
    sheet.frameHeight * scale,
  );
}

/** Draws the frame of `anim` that is showing `elapsedMs` after it started. */
export function drawAnim(
  g: CanvasRenderingContext2D,
  sheet: SpriteSheet,
  anim: string,
  elapsedMs: number,
  x: number,
  y: number,
  scale = 1,
): void {
  const a = sheet.anims.get(anim);
  if (!a) return;
  drawFrame(g, sheet, anim, frameAt(a.def, elapsedMs), x, y, scale);
}
