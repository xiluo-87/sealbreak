/**
 * Shared portrait structure: expressions, frames and flag naming. Portraits
 * are 96x96 busts authored facing left and mirrored by the pipeline so they
 * face right, toward the dialogue text, with the light still upper-left.
 */
import type { DetailDef, Pose } from '../rig';
import { anim, type AnimDef } from '../types';

export const EXPRESSIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised'] as const;
export type Expression = (typeof EXPRESSIONS)[number];
export type MouthState = 'closed' | 'half' | 'open';

export interface FaceFrame {
  expr: Expression;
  blink: boolean;
  mouth: MouthState;
}

/** Flags understood by portrait detail grids. */
export function faceFlags(f: FaceFrame): string[] {
  return [`e-${f.expr}${f.blink ? '-blink' : ''}`, `b-${f.expr}`, `m-${f.expr}-${f.mouth}`, f.expr];
}

/** Base, blink, then two talking frames for every expression. */
export function portraitAnims(extra: (f: FaceFrame) => Partial<Pose> = () => ({})): AnimDef[] {
  return EXPRESSIONS.map((expr) => {
    const frames: FaceFrame[] = [
      { expr, blink: false, mouth: 'closed' },
      { expr, blink: true, mouth: 'closed' },
      { expr, blink: false, mouth: 'half' },
      { expr, blink: false, mouth: 'open' },
    ];
    return anim(
      expr,
      frames.map((f) => ({ flags: faceFlags(f), ...extra(f) })),
      [1400, 110, 120, 140],
    );
  });
}

export interface FaceGrids {
  /** Eye grids per expression, open and blinking. */
  eyes: Record<Expression, { open: string[]; blink: string[] }>;
  brows: Record<Expression, string[]>;
  mouths: Record<Expression, Record<MouthState, string[]>>;
}

/** Turns face grids into detail layers clipped to the given parts. */
export function faceDetails(
  grids: FaceGrids,
  at: { bone: string; eyes: [number, number]; brows: [number, number]; mouth: [number, number] },
  key: Record<string, string>,
  clip: string[],
): DetailDef[] {
  const out: DetailDef[] = [];
  for (const expr of Object.keys(grids.eyes) as Expression[]) {
    const e = grids.eyes[expr];
    out.push(
      { name: `eyes-${expr}`, bone: at.bone, x: at.eyes[0], y: at.eyes[1], grid: e.open, key, clip, when: `e-${expr}` },
      { name: `eyes-${expr}-blink`, bone: at.bone, x: at.eyes[0], y: at.eyes[1], grid: e.blink, key, clip, when: `e-${expr}-blink` },
      { name: `brows-${expr}`, bone: at.bone, x: at.brows[0], y: at.brows[1], grid: grids.brows[expr], key, clip, when: `b-${expr}` },
    );
    for (const m of ['closed', 'half', 'open'] as const) {
      out.push({
        name: `mouth-${expr}-${m}`,
        bone: at.bone,
        x: at.mouth[0],
        y: at.mouth[1],
        grid: grids.mouths[expr][m],
        key,
        clip,
        when: `m-${expr}-${m}`,
      });
    }
  }
  return out;
}

/** Builds a detail grid from a list of pixels (absolute bone-space coordinates). */
export function gridFromPixels(pixels: [number, number, string][]): { x: number; y: number; grid: string[] } {
  const xs = pixels.map((p) => p[0]);
  const ys = pixels.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const w = Math.max(...xs) - x0 + 1;
  const h = Math.max(...ys) - y0 + 1;
  const rows = Array.from({ length: h }, () => new Array<string>(w).fill('.'));
  for (const [x, y, ch] of pixels) {
    const row = rows[y - y0];
    if (row) row[x - x0] = ch;
  }
  return { x: x0, y: y0, grid: rows.map((r) => r.join('')) };
}

/** Pixels on the outline of an ellipse (a 1-pixel ring), in integer coordinates. */
export function ringPixels(cx: number, cy: number, rx: number, ry: number, ch: string): [number, number, string][] {
  const out = new Map<string, [number, number, string]>();
  const steps = Math.ceil(2 * Math.PI * Math.max(rx, ry) * 2);
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(a) * rx);
    const y = Math.round(cy + Math.sin(a) * ry);
    out.set(`${x},${y}`, [x, y, ch]);
  }
  return [...out.values()];
}

/** Pixels along a polyline, every `spacing` pixels (for chains and stitching). */
export function dottedPixels(points: [number, number][], spacing: number, ch: string): [number, number, string][] {
  const out: [number, number, string][] = [];
  let carry = 0;
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) continue;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let d = carry; d <= len; d += spacing) {
      const t = len === 0 ? 0 : d / len;
      out.push([Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), ch]);
    }
    carry = spacing - ((len - carry) % spacing);
    if (carry >= spacing) carry -= spacing;
  }
  return out;
}
