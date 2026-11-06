/**
 * A small deterministic scanline rasteriser. Shapes are sampled on a 4x4
 * grid inside each pixel using the non-zero winding rule, which gives a
 * coverage count per pixel. Thresholding that count produces hard pixel
 * edges with no anti-aliasing, the same in every browser and in tests.
 */
import type { Shape } from './shapes';

export const SUBSAMPLES = 4;
export const FULL_COVERAGE = SUBSAMPLES * SUBSAMPLES;

/** Coverage (0..16) of `shape` on a w*h grid. */
export function coverage(shape: Shape, w: number, h: number): Uint8Array {
  const cov = new Uint8Array(w * h);
  let minY = Infinity;
  let maxY = -Infinity;
  for (const c of shape) {
    for (let i = 1; i < c.length; i += 2) {
      const y = c[i] ?? 0;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (minY === Infinity) return cov;
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(h - 1, Math.ceil(maxY));
  const xs: number[] = [];
  const ws: number[] = [];
  const order: number[] = [];
  const maxSub = w * SUBSAMPLES - 1;
  for (let py = y0; py <= y1; py++) {
    for (let s = 0; s < SUBSAMPLES; s++) {
      const y = py + (s + 0.5) / SUBSAMPLES;
      xs.length = 0;
      ws.length = 0;
      for (const c of shape) {
        const n = c.length / 2;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          const ya = c[i * 2 + 1] ?? 0;
          const yb = c[j * 2 + 1] ?? 0;
          if ((ya <= y && yb > y) || (yb <= y && ya > y)) {
            const xa = c[i * 2] ?? 0;
            const xb = c[j * 2] ?? 0;
            xs.push(xa + ((y - ya) * (xb - xa)) / (yb - ya));
            ws.push(yb > ya ? 1 : -1);
          }
        }
      }
      if (xs.length < 2) continue;
      order.length = 0;
      for (let k = 0; k < xs.length; k++) order.push(k);
      order.sort((a, b) => (xs[a] ?? 0) - (xs[b] ?? 0));
      let wind = 0;
      let start = 0;
      for (const k of order) {
        const prev = wind;
        wind += ws[k] ?? 0;
        const x = xs[k] ?? 0;
        if (prev === 0 && wind !== 0) start = x;
        else if (prev !== 0 && wind === 0) {
          const k0 = Math.max(0, Math.ceil(start * SUBSAMPLES - 0.5));
          const k1 = Math.min(maxSub, Math.ceil(x * SUBSAMPLES - 0.5) - 1);
          const row = py * w;
          for (let q = k0; q <= k1; q++) {
            const idx = row + ((q / SUBSAMPLES) | 0);
            cov[idx] = (cov[idx] ?? 0) + 1;
          }
        }
      }
    }
  }
  return cov;
}

/** Thresholds coverage to a hard mask. `threshold` is a fraction of a pixel. */
export function toMask(cov: Uint8Array, threshold = 0.5): Uint8Array {
  const t = Math.max(1, Math.round(threshold * FULL_COVERAGE));
  const out = new Uint8Array(cov.length);
  for (let i = 0; i < cov.length; i++) out[i] = (cov[i] ?? 0) >= t ? 1 : 0;
  return out;
}

export function rasterize(shape: Shape, w: number, h: number, threshold = 0.5): Uint8Array {
  return toMask(coverage(shape, w, h), threshold);
}
