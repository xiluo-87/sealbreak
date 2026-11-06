/** Logical resolution of the game. Everything renders at this size. */
export const LOGICAL_WIDTH = 640;
export const LOGICAL_HEIGHT = 360;

export interface ScaleResult {
  /** Whole number of device pixels per logical pixel. */
  scale: number;
  /** CSS size of the canvas element. */
  cssWidth: number;
  cssHeight: number;
}

/**
 * Picks the largest whole-number scale (in device pixels) that fits the
 * available space, so every logical pixel is the same size on screen.
 */
export function computeScale(
  availableCssWidth: number,
  availableCssHeight: number,
  devicePixelRatio: number,
  width = LOGICAL_WIDTH,
  height = LOGICAL_HEIGHT,
): ScaleResult {
  const dpr = devicePixelRatio > 0 && Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1;
  const fit = Math.min((availableCssWidth * dpr) / width, (availableCssHeight * dpr) / height);
  const scale = Math.max(1, Math.floor(fit + 1e-6));
  return { scale, cssWidth: (width * scale) / dpr, cssHeight: (height * scale) / dpr };
}
