/**
 * The sprite pipeline. Pure: no DOM or canvas, so it runs the same in tests.
 *
 *   1. Part rig: bones are posed and each part's shapes are placed.
 *   2. Low-res rendering: each part is rasterised at exact sprite size.
 *   3. Pixel cleanup: coverage is thresholded to hard edges, stray single
 *      pixels and pinholes are removed, colours come from (or are snapped
 *      to) the character's palette.
 *   4. Shading: each material has a 4-tone ramp. Light comes from the upper
 *      left, so lower-right rims fall into shade, upper-left rims catch light,
 *      and parts in front cast short shadows on parts behind.
 *   5. Outline: a selective outline in a dark tone of the neighbouring
 *      material, lighter on the lit side, plus darkened edges where parts
 *      overlap.
 *   6. Detail layer: hand-placed pixel grids for faces, buttons and stitching.
 */
import { distance2, hex, type Rgb } from './color';
import { BASE, DEEP, HI, type Material, paletteColours, SHADE } from './palette';
import { rasterize } from './raster';
import {
  type ColourRef,
  isActive,
  type PartDef,
  type Pose,
  resolveBones,
  type Rig,
  type ShapeContext,
  shapeContext,
} from './rig';
import { type Shape, transformShape } from './shapes';

export interface Frame {
  width: number;
  height: number;
  /** RGBA pixels, alpha is always 0 or 255. */
  rgba: Uint8ClampedArray;
  /** Index into `parts` of the part owning each pixel, or -1. Outline pixels are -1. */
  owner: Int16Array;
  /** Names of the drawn parts in z order. */
  parts: string[];
}

function at(mask: Uint8Array, w: number, h: number, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
}

function resolveShape(
  shape: Shape | ((ctx: ShapeContext) => Shape),
  bone: string,
  ctx: ShapeContext,
): Shape {
  return typeof shape === 'function' ? shape(ctx) : transformShape(shape, ctx.m(bone));
}

/** Nearest palette colour by perceptual distance. */
export function nearest(c: Rgb, palette: readonly Rgb[]): Rgb {
  let best = palette[0] ?? c;
  let bestD = Infinity;
  for (const p of palette) {
    if (p === c) return p;
    const d = distance2(c, p);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

/** Snaps every opaque pixel to the palette and makes alpha binary. */
export function snapToPalette(rgba: Uint8ClampedArray, palette: readonly Rgb[], alphaThreshold = 128): void {
  const cache = new Map<Rgb, Rgb>();
  for (let i = 0; i < rgba.length; i += 4) {
    if ((rgba[i + 3] ?? 0) < alphaThreshold) {
      rgba[i] = rgba[i + 1] = rgba[i + 2] = rgba[i + 3] = 0;
      continue;
    }
    const c = ((rgba[i] ?? 0) << 16) | ((rgba[i + 1] ?? 0) << 8) | (rgba[i + 2] ?? 0);
    let s = cache.get(c);
    if (s === undefined) {
      s = nearest(c, palette);
      cache.set(c, s);
    }
    rgba[i] = (s >> 16) & 255;
    rgba[i + 1] = (s >> 8) & 255;
    rgba[i + 2] = s & 255;
    rgba[i + 3] = 255;
  }
}

export function resolveColour(ref: ColourRef, materials: Record<string, Material>, palette: readonly Rgb[]): Rgb {
  if (ref.startsWith('#')) return nearest(hex(ref), palette);
  const [name, tone] = ref.split(':');
  const mat = materials[name ?? ''];
  if (!mat) throw new Error(`Unknown material "${name}" in colour "${ref}"`);
  if (tone === undefined) return mat.tones[BASE];
  if (tone === 'o') return mat.outline;
  const t = Number(tone);
  if (!Number.isInteger(t) || t < 0 || t > 3) throw new Error(`Bad tone in colour "${ref}"`);
  return mat.tones[t as 0 | 1 | 2 | 3];
}

/**
 * Removes single-pixel islands and fills single-pixel holes, except for parts
 * marked `thin`. Works on the owner buffer in place.
 */
export function cleanup(owner: Int16Array, w: number, h: number, thin: readonly boolean[]): void {
  const copy = owner.slice();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = copy[y * w + x] ?? -1;
      const n4 = [
        x + 1 < w ? (copy[y * w + x + 1] ?? -1) : -1,
        y + 1 < h ? (copy[(y + 1) * w + x] ?? -1) : -1,
        x > 0 ? (copy[y * w + x - 1] ?? -1) : -1,
        y > 0 ? (copy[(y - 1) * w + x] ?? -1) : -1,
      ];
      if (o >= 0 && !thin[o]) {
        // Island: no same-part neighbour in all 8 directions.
        let same = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if ((dx !== 0 || dy !== 0) && x + dx >= 0 && y + dy >= 0 && x + dx < w && y + dy < h) {
              if (copy[(y + dy) * w + x + dx] === o) same++;
            }
          }
        }
        if (same === 0) {
          owner[y * w + x] = majority(n4);
          continue;
        }
      }
      // Pinhole: all four neighbours belong to one solid part in front of this pixel.
      const first = n4[0] ?? -1;
      if (first >= 0 && !thin[first] && n4.every((v) => v === first) && o !== first && (o === -1 || o < first)) {
        if (o === -1 || !thin[o]) owner[y * w + x] = first;
      }
    }
  }
}

function majority(values: number[]): number {
  let best = -1;
  let bestCount = 0;
  for (const v of values) {
    let c = 0;
    for (const u of values) if (u === v) c++;
    if (c > bestCount || (c === bestCount && v > best)) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

export function renderFrame(rig: Rig, pose: Pose = {}): Frame {
  const W = rig.width;
  const H = rig.height;
  const N = W * H;
  const flags = new Set(pose.flags ?? []);
  const bones = resolveBones(rig, pose);
  const ctx = shapeContext(rig, bones, flags);
  const palette = paletteColours(Object.values(rig.materials));

  const zOf = (p: PartDef): number => pose.z?.[p.name] ?? p.z;
  const parts = rig.parts
    .map((p, i) => ({ p, i }))
    .filter((e) => isActive(e.p, flags))
    .sort((a, b) => zOf(a.p) - zOf(b.p) || a.i - b.i)
    .map((e) => e.p);

  // 2. Rasterise every part at exact size.
  const masks = new Map<string, Uint8Array>();
  for (const part of parts) {
    if (masks.has(part.name)) throw new Error(`${rig.id}: duplicate part "${part.name}"`);
    if (!rig.materials[part.material]) throw new Error(`${rig.id}: part "${part.name}" has unknown material "${part.material}"`);
    const mask = rasterize(resolveShape(part.shape, part.bone, ctx), W, H, part.threshold ?? 0.5);
    if (part.cut) {
      const cut = rasterize(resolveShape(part.cut, part.bone, ctx), W, H, 0.5);
      for (let i = 0; i < N; i++) if (cut[i]) mask[i] = 0;
    }
    masks.set(part.name, mask);
  }
  for (const part of parts) {
    if (!part.clipTo) continue;
    const mask = masks.get(part.name);
    if (!mask) continue;
    const clips = part.clipTo.map((n) => masks.get(n)).filter((m): m is Uint8Array => m !== undefined);
    for (let i = 0; i < N; i++) if (mask[i] && !clips.some((c) => c[i])) mask[i] = 0;
  }

  // Painter's order into the owner buffer.
  const owner = new Int16Array(N).fill(-1);
  parts.forEach((part, idx) => {
    const mask = masks.get(part.name);
    if (!mask) return;
    for (let i = 0; i < N; i++) if (mask[i]) owner[i] = idx;
  });

  // 3. Cleanup.
  cleanup(
    owner,
    W,
    H,
    parts.map((p) => p.thin === true),
  );

  // 4. Shading.
  const tone = new Int8Array(N).fill(BASE);
  parts.forEach((part, idx) => {
    const mask = masks.get(part.name);
    if (!mask) return;
    const s = part.shade ?? {};
    const base = s.base ?? BASE;
    const [dx, dy] = s.dir ?? [1, 1];
    const sw = s.shadow ?? 2;
    const lw = s.light ?? 1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (owner[i] !== idx) continue;
        let t = base;
        if (!s.flat) {
          let shadow = false;
          for (let k = 1; k <= sw && !shadow; k++) {
            if (!at(mask, W, H, x + Math.round(dx * k), y + Math.round(dy * k))) shadow = true;
          }
          if (shadow) t = Math.max(t, SHADE);
          else {
            for (let k = 1; k <= lw; k++) {
              if (!at(mask, W, H, x - Math.round(dx * k), y - Math.round(dy * k))) {
                t = Math.min(t, HI);
                break;
              }
            }
          }
        }
        tone[i] = t;
      }
    }
  });

  // Hand-placed tone marks (folds, creases), clipped to their part.
  parts.forEach((part, idx) => {
    if (!part.marks) return;
    const marks = typeof part.marks === 'function' ? part.marks(ctx) : part.marks;
    for (const mark of marks) {
      const shape = typeof part.marks === 'function' ? mark.shape : transformShape(mark.shape, ctx.m(part.bone));
      const mm = rasterize(shape, W, H, 0.4);
      for (let i = 0; i < N; i++) if (mm[i] && owner[i] === idx) tone[i] = mark.tone;
    }
  });

  // Cast shadows and separation lines from parts in front.
  const castLen = parts.map((p) => p.cast ?? 1);
  const maxCast = Math.max(0, ...castLen);
  const shaded = tone.slice();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const a = owner[i] ?? -1;
      if (a < 0) continue;
      const part = parts[a];
      if (!part) continue;
      let t = tone[i] ?? BASE;
      if (part.shade?.receive !== false && !part.shade?.flat) {
        let cast = false;
        for (let k = 1; k <= maxCast && !cast; k++) {
          for (const [ox, oy] of [
            [0, -k],
            [-k, -k],
          ] as const) {
            const qx = x + ox;
            const qy = y + oy;
            if (qx < 0 || qy < 0) continue;
            const b = owner[qy * W + qx] ?? -1;
            if (b > a && (castLen[b] ?? 0) >= k) cast = true;
          }
        }
        if (cast) t = t >= SHADE ? DEEP : SHADE;
      }
      for (const [ox, oy] of [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ] as const) {
        const qx = x + ox;
        const qy = y + oy;
        if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
        const b = owner[qy * W + qx] ?? -1;
        if (b > a && parts[b]?.sep !== false) {
          t = DEEP;
          break;
        }
      }
      shaded[i] = t;
    }
  }

  // Colour.
  const rgba = new Uint8ClampedArray(N * 4);
  const put = (i: number, c: Rgb): void => {
    rgba[i * 4] = (c >> 16) & 255;
    rgba[i * 4 + 1] = (c >> 8) & 255;
    rgba[i * 4 + 2] = c & 255;
    rgba[i * 4 + 3] = 255;
  };
  for (let i = 0; i < N; i++) {
    const a = owner[i] ?? -1;
    if (a < 0) continue;
    const mat = rig.materials[parts[a]?.material ?? ''];
    if (!mat) continue;
    put(i, mat.tones[Math.max(0, Math.min(3, shaded[i] ?? BASE)) as 0 | 1 | 2 | 3]);
  }

  // 5. Selective outline.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if ((owner[i] ?? -1) >= 0) continue;
      let best = -1;
      let lit = true;
      for (const [ox, oy, litSide] of [
        [1, 0, true],
        [0, 1, true],
        [-1, 0, false],
        [0, -1, false],
      ] as const) {
        const qx = x + ox;
        const qy = y + oy;
        if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
        const b = owner[qy * W + qx] ?? -1;
        if (b < 0 || parts[b]?.outline === false) continue;
        if (!litSide) lit = false;
        if (b > best) best = b;
      }
      if (best < 0) continue;
      const mat = rig.materials[parts[best]?.material ?? ''];
      if (!mat) continue;
      put(i, lit ? mat.tones[DEEP] : mat.outline);
    }
  }

  // 6. Detail layer.
  const names = parts.map((p) => p.name);
  for (const d of rig.details) {
    if (!isActive(d, flags)) continue;
    const m = bones.get(d.bone);
    if (!m) throw new Error(`${rig.id}: detail on unknown bone "${d.bone}"`);
    const ax = m[0] * d.x + m[2] * d.y + m[4];
    const ay = m[1] * d.x + m[3] * d.y + m[5];
    const gw = Math.max(...d.grid.map((r) => r.length));
    const flip = rig.mirror === true && d.noFlip !== true;
    const left = Math.floor(ax + 0.5 + 1e-6) - (flip ? gw : 0);
    const top = Math.floor(ay + 0.5 + 1e-6);
    const clip = d.clip ? new Set(d.clip) : null;
    d.grid.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        const ch = row[c] ?? '.';
        if (ch === '.' || ch === ' ') continue;
        const ref = d.key[ch];
        if (ref === undefined) throw new Error(`${rig.id}: detail "${d.name ?? d.bone}" has no colour for "${ch}"`);
        const px = left + (flip ? gw - 1 - c : c);
        const py = top + r;
        if (px < 0 || py < 0 || px >= W || py >= H) continue;
        const i = py * W + px;
        if (clip) {
          const o = owner[i] ?? -1;
          if (o < 0 || !clip.has(names[o] ?? '')) continue;
        }
        put(i, resolveColour(ref, rig.materials, palette));
      }
    });
  }

  // Safety pass: everything ends up on the character's palette with hard alpha.
  snapToPalette(rgba, palette);
  return { width: W, height: H, rgba, owner, parts: names };
}

/** Solid silhouette of a frame (1 where any pixel is opaque). */
export function silhouette(frame: Frame): Uint8Array {
  const out = new Uint8Array(frame.width * frame.height);
  for (let i = 0; i < out.length; i++) out[i] = (frame.rgba[i * 4 + 3] ?? 0) > 0 ? 1 : 0;
  return out;
}
