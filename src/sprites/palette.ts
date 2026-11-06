import { fromOklch, hex, type Rgb, shiftHue, toOklch } from './color';

/** Tone indices within a material ramp. Light comes from the upper left. */
export const HI = 0;
export const BASE = 1;
export const SHADE = 2;
export const DEEP = 3;

/**
 * A material is one surface type (coat cloth, skin, brass...) with a short
 * ramp of tones from highlight to deep shadow, plus an outline colour that is
 * a dark, hue-shifted version of the same material rather than flat black.
 */
export interface Material {
  name: string;
  /** [highlight, base, shade, deep]. */
  tones: [Rgb, Rgb, Rgb, Rgb];
  outline: Rgb;
}

export interface RampOptions {
  /** Lightness step between tones in OKLab L units. */
  step?: number;
  /** Degrees of hue shift per step (warm in light, cool in shadow). */
  hueShift?: number;
  /** Hue that highlights drift toward. */
  warm?: number;
  /** Hue that shadows drift toward. */
  cool?: number;
  /** Extra darkening for the outline beyond the deep tone. */
  outlineStep?: number;
}

/**
 * Builds a 4-tone ramp around a base colour: highlights drift warm and a
 * little less saturated, shadows drift cool, which reads better than plain
 * darkening.
 */
export function ramp(name: string, baseHex: string, options: RampOptions = {}): Material {
  const step = options.step ?? 0.085;
  const shift = options.hueShift ?? 9;
  const warm = options.warm ?? 85;
  const cool = options.cool ?? 285;
  const base = toOklch(hex(baseHex));
  const at = (k: number): Rgb => {
    const L = Math.max(0.08, Math.min(0.98, base.L + k * step));
    const target = k > 0 ? warm : cool;
    const h = k === 0 ? base.h : shiftHue(base.h, target, Math.abs(k) * shift);
    const C = k > 0 ? base.C * (1 - 0.12 * k) : base.C * (1 + 0.06 * Math.min(-k, 2) - 0.08 * Math.max(0, -k - 2));
    return fromOklch({ L, C: Math.max(0, C), h });
  };
  const outlineK = -2 - (options.outlineStep ?? 1.6);
  return {
    name,
    tones: [at(1), at(0), at(-1), at(-2)],
    outline: at(outlineK),
  };
}

/** A material from explicit colours, for hand-tuned ramps. */
export function manual(name: string, tones: [string, string, string, string], outline: string): Material {
  return {
    name,
    tones: [hex(tones[0]), hex(tones[1]), hex(tones[2]), hex(tones[3])],
    outline: hex(outline),
  };
}

/** Every colour a set of materials can produce, plus extras. */
export function paletteColours(materials: Iterable<Material>, extras: Iterable<Rgb> = []): Rgb[] {
  const set = new Set<Rgb>();
  for (const m of materials) {
    for (const t of m.tones) set.add(t);
    set.add(m.outline);
  }
  for (const e of extras) set.add(e);
  return [...set];
}
