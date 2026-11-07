/** Logical resolution of the game. Everything renders at this size. */
export const LOGICAL_WIDTH = 640;
export const LOGICAL_HEIGHT = 360;

/** Whole-number scaling is used when it fills at least this much of the space. */
export const MIN_INTEGER_FILL = 0.85;

export interface ScaleResult {
  /** Device pixels per logical pixel (whole when `integer` is true). */
  scale: number;
  integer: boolean;
  /** CSS size of the canvas element. */
  cssWidth: number;
  cssHeight: number;
}

/**
 * Picks the largest whole-number scale (in device pixels) that fits, so every
 * logical pixel is the same size on screen. When that would leave much of the
 * space empty, as on phones with browser bars, it scales to fit instead.
 */
export function computeScale(
  availableCssWidth: number,
  availableCssHeight: number,
  devicePixelRatio: number,
  width = LOGICAL_WIDTH,
  height = LOGICAL_HEIGHT,
): ScaleResult {
  const dpr = devicePixelRatio > 0 && Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1;
  const w = Math.max(1, availableCssWidth);
  const h = Math.max(1, availableCssHeight);
  const fit = Math.min((w * dpr) / width, (h * dpr) / height);
  const whole = Math.floor(fit + 1e-6);
  const integer = whole >= 1 && whole / fit >= MIN_INTEGER_FILL;
  const scale = integer ? whole : fit;
  return { scale, integer, cssWidth: (width * scale) / dpr, cssHeight: (height * scale) / dpr };
}
