/**
 * Colour helpers for the sprite pipeline. Colours are packed 0xRRGGBB
 * numbers. Ramps and palette snapping work in OKLab so that perceived
 * lightness steps stay even across hues.
 */
export type Rgb = number;

export function hex(text: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(text.trim());
  if (!m || m[1] === undefined) throw new Error(`Bad colour: ${text}`);
  return parseInt(m[1], 16);
}

export function toHex(c: Rgb): string {
  return `#${(c & 0xffffff).toString(16).padStart(6, '0')}`;
}

export function rgbOf(c: Rgb): [number, number, number] {
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
}

export function packRgb(r: number, g: number, b: number): Rgb {
  const cl = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));
  return (cl(r) << 16) | (cl(g) << 8) | cl(b);
}

function srgbToLinear(v: number): number {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(v: number): number {
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return s * 255;
}

export interface Lab {
  L: number;
  a: number;
  b: number;
}

export function toOklab(c: Rgb): Lab {
  const [r8, g8, b8] = rgbOf(c);
  const r = srgbToLinear(r8);
  const g = srgbToLinear(g8);
  const b = srgbToLinear(b8);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** Converts OKLab to linear-light sRGB components (may be out of gamut). */
function oklabToLinear(lab: Lab): [number, number, number] {
  const l = (lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b) ** 3;
  const m = (lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b) ** 3;
  const s = (lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function fromOklab(lab: Lab): Rgb {
  const [r, g, b] = oklabToLinear(lab);
  return packRgb(linearToSrgb(Math.max(0, r)), linearToSrgb(Math.max(0, g)), linearToSrgb(Math.max(0, b)));
}

export interface Lch {
  L: number;
  C: number;
  /** Hue in degrees. */
  h: number;
}

export function toOklch(c: Rgb): Lch {
  const { L, a, b } = toOklab(c);
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { L, C: Math.hypot(a, b), h: h < 0 ? h + 360 : h };
}

/** OKLCH to sRGB, reducing chroma until the colour fits the sRGB gamut. */
export function fromOklch(lch: Lch): Rgb {
  let C = lch.C;
  const rad = (lch.h * Math.PI) / 180;
  for (let i = 0; i < 24; i++) {
    const lin = oklabToLinear({ L: lch.L, a: C * Math.cos(rad), b: C * Math.sin(rad) });
    if (lin.every((v) => v >= -0.0005 && v <= 1.0005)) break;
    C *= 0.9;
  }
  return fromOklab({ L: lch.L, a: C * Math.cos(rad), b: C * Math.sin(rad) });
}

/** Perceptual distance squared between two colours. */
export function distance2(a: Rgb, b: Rgb): number {
  const p = toOklab(a);
  const q = toOklab(b);
  return (p.L - q.L) ** 2 + (p.a - q.a) ** 2 + (p.b - q.b) ** 2;
}

/** Moves hue `h` toward `target` by at most `amount` degrees along the short way. */
export function shiftHue(h: number, target: number, amount: number): number {
  let d = target - h;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  const step = Math.sign(d) * Math.min(Math.abs(d), amount);
  return (h + step + 360) % 360;
}
