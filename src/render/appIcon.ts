/**
 * The Home Screen and browser tab icon: a sealed envelope, drawn in code at
 * startup like every other picture in the game.
 */

/** The icon is a 20×20 pixel picture, scaled up with hard edges. */
export const ICON_GRID = 20;
/** 180 px, the size iPhones use for Home Screen icons. */
const ICON_SCALE = 9;

const INK = '#1b1a24';
const OUTLINE = '#4a3a52';
const PAPER = '#f3ead6';
const FLAP = '#e6d8b8';
const CREASE = '#c9b48c';
const WAX = '#c8392f';
const WAX_LIGHT = '#f0786a';
const WAX_DARK = '#7a1f1a';

/** Draws the icon at `px` screen pixels per icon pixel. */
export function drawAppIcon(g: CanvasRenderingContext2D, px: number): void {
  const dot = (x: number, y: number, w: number, h: number, colour: string): void => {
    g.fillStyle = colour;
    g.fillRect(x * px, y * px, w * px, h * px);
  };
  dot(0, 0, ICON_GRID, ICON_GRID, INK);
  // Shadow, outline and paper.
  dot(3, 16, 16, 1, 'rgba(0, 0, 0, 0.45)');
  dot(2, 5, 16, 11, OUTLINE);
  dot(3, 6, 14, 9, PAPER);
  // The flap: a darker triangle with a crease down each side to the seal.
  for (let i = 0; i < 5; i++) {
    dot(4 + i, 6 + i, 12 - 2 * i, 1, FLAP);
    dot(3 + i, 6 + i, 1, 1, CREASE);
    dot(16 - i, 6 + i, 1, 1, CREASE);
  }
  // The wax seal.
  dot(9, 10, 2, 1, WAX);
  dot(8, 11, 4, 2, WAX);
  dot(9, 13, 2, 1, WAX);
  dot(9, 11, 1, 1, WAX_LIGHT);
  dot(11, 12, 1, 1, WAX_DARK);
  dot(10, 13, 1, 1, WAX_DARK);
}

/** Adds the icon to the page, for the browser tab and for Add to Home Screen. */
export function installAppIcon(): void {
  const canvas = document.createElement('canvas');
  canvas.width = ICON_GRID * ICON_SCALE;
  canvas.height = ICON_GRID * ICON_SCALE;
  const g = canvas.getContext('2d');
  if (!g) return;
  drawAppIcon(g, ICON_SCALE);
  let url: string;
  try {
    url = canvas.toDataURL('image/png');
  } catch {
    return;
  }
  for (const rel of ['apple-touch-icon', 'icon']) {
    const link = document.createElement('link');
    link.rel = rel;
    link.type = 'image/png';
    link.href = url;
    document.head.appendChild(link);
  }
}
