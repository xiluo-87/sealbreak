/**
 * Camera: centres on a point, clamped so it never shows past the map edge.
 * Maps smaller than the screen are centred.
 */
export function cameraFor(
  focusX: number,
  focusY: number,
  mapW: number,
  mapH: number,
  viewW: number,
  viewH: number,
): { x: number; y: number } {
  const axis = (focus: number, map: number, view: number): number => {
    if (map <= view) return Math.round((map - view) / 2);
    return Math.round(Math.min(map - view, Math.max(0, focus - view / 2)));
  };
  return { x: axis(focusX, mapW, viewW), y: axis(focusY, mapH, viewH) };
}
