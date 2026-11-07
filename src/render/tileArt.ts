/**
 * Tile and building art, drawn in code. Terrain is kept lower in contrast
 * than the characters so they stand out. Variation comes from a hash of the
 * tile position, so the same map always looks the same.
 */
import type { Building, ParsedMap } from '../field/maps';
import { TILE } from '../field/movement';

type G = CanvasRenderingContext2D;

/** Small integer hash of a tile position, 0..1. */
export function hash01(x: number, y: number, salt = 0): number {
  let h = Math.imul(x * 374761393 + y * 668265263 + salt * 2147483647, 0x27d4eb2d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

const C = {
  grass: '#76844f',
  grassDark: '#6b7948',
  grassLight: '#818f58',
  tuft: '#8b9862',
  leafA: '#b5763a',
  leafB: '#c49846',
  leafC: '#9e5a32',
  dirt: '#9b8660',
  dirtDark: '#8b7754',
  dirtLight: '#a9946d',
  stone: '#9b958b',
  stoneLight: '#aca69a',
  stoneDark: '#837d73',
  mortar: '#857f74',
  water: '#5c7e92',
  waterDark: '#4d6c80',
  waterLight: '#7a9bae',
  bank: '#6a6a45',
  hedge: '#4f6b3a',
  hedgeLight: '#5f7c45',
  hedgeDark: '#3f5730',
  wood: '#8a6a48',
  woodDark: '#6b4f35',
  woodLight: '#a3825c',
  trunk: '#6a4b34',
  trunkDark: '#523926',
  shadow: 'rgba(30, 36, 20, 0.28)',
  floor: '#a07a52',
  floorDark: '#8d6a46',
  floorLight: '#b08a60',
  plaster: '#d9ccb0',
  plasterDark: '#c4b596',
  wainscot: '#7a5a3e',
  rug: '#7b4b70',
  rugLight: '#93607f',
  rugBorder: '#5e3654',
  iron: '#3a3a42',
  paper: '#efe6d2',
  brass: '#d3a648',
};

function px(g: G, color: string, x: number, y: number, w = 1, h = 1): void {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

function grass(g: G, x: number, y: number, tx: number, ty: number): void {
  px(g, C.grass, x, y, TILE, TILE);
  for (let i = 0; i < 14; i++) {
    const r = hash01(tx, ty, i);
    const r2 = hash01(tx, ty, i + 50);
    const cx = x + Math.floor(r * TILE);
    const cy = y + Math.floor(r2 * TILE);
    const c = i % 3 === 0 ? C.grassDark : i % 3 === 1 ? C.grassLight : C.tuft;
    px(g, c, cx, cy, i % 4 === 0 ? 2 : 1, 1);
    if (i % 5 === 0) px(g, C.grassLight, cx, cy - 1);
  }
  if (hash01(tx, ty, 99) < 0.35) {
    const lx = x + Math.floor(hash01(tx, ty, 98) * 28);
    const ly = y + Math.floor(hash01(tx, ty, 97) * 28);
    px(g, hash01(tx, ty, 96) < 0.5 ? C.leafA : C.leafB, lx, ly, 2, 1);
  }
}

function flowers(g: G, x: number, y: number, tx: number, ty: number): void {
  grass(g, x, y, tx, ty);
  const cols = ['#d9a441', '#e7d9b6', '#b9655a', '#c58ab0'];
  for (let i = 0; i < 6; i++) {
    const fx = x + 3 + Math.floor(hash01(tx, ty, i + 10) * 26);
    const fy = y + 3 + Math.floor(hash01(tx, ty, i + 20) * 26);
    px(g, '#5f7c45', fx, fy + 1, 1, 2);
    px(g, cols[i % cols.length] ?? '#d9a441', fx - 1, fy, 3, 1);
    px(g, cols[i % cols.length] ?? '#d9a441', fx, fy - 1, 1, 3);
  }
}

function dirt(g: G, x: number, y: number, tx: number, ty: number, same: (dx: number, dy: number) => boolean): void {
  px(g, C.dirt, x, y, TILE, TILE);
  for (let i = 0; i < 12; i++) {
    const cx = x + Math.floor(hash01(tx, ty, i + 200) * TILE);
    const cy = y + Math.floor(hash01(tx, ty, i + 300) * TILE);
    px(g, i % 2 ? C.dirtDark : C.dirtLight, cx, cy, i % 3 === 0 ? 2 : 1, 1);
  }
  // Soft grass edges where the path meets grass.
  const edge = (cond: boolean, ex: number, ey: number, w: number, h: number): void => {
    if (cond) return;
    for (let i = 0; i < Math.max(w, h); i += 2) {
      const ix = w > h ? ex + i : ex;
      const iy = w > h ? ey : ey + i;
      const len = 1 + Math.floor(hash01(tx * 7 + i, ty * 3, 400) * 3);
      if (w > h) px(g, C.grass, ix, iy, 2, len);
      else px(g, C.grass, ix, iy, len, 2);
    }
  };
  edge(same(0, -1), x, y, TILE, 1);
  edge(same(-1, 0), x, y, 1, TILE);
  if (!same(0, 1)) for (let i = 0; i < TILE; i += 2) px(g, C.grass, x + i, y + TILE - 1 - Math.floor(hash01(tx + i, ty, 401) * 2), 2, 2);
  if (!same(1, 0)) for (let i = 0; i < TILE; i += 2) px(g, C.grass, x + TILE - 1 - Math.floor(hash01(tx, ty + i, 402) * 2), y + i, 2, 2);
}

function cobble(g: G, x: number, y: number, tx: number, ty: number): void {
  // Rounded setts in soft, close tones so the square doesn't read as a wall.
  px(g, C.mortar, x, y, TILE, TILE);
  const tones = ['#948e83', '#9a9488', '#8f897e', '#9d968a', '#928b7f'];
  for (let row = 0; row < 4; row++) {
    const off = (row + ty) % 2 === 0 ? 0 : 5;
    for (let col = -1; col < 4; col++) {
      const sx = x + col * 10 + off;
      const sy = y + row * 8;
      const r = hash01(tx * 5 + col, ty * 5 + row, 500);
      const base = tones[Math.floor(r * tones.length)] ?? C.stone;
      const x0 = Math.max(x, sx + 1);
      const x1 = Math.min(x + TILE, sx + 10);
      if (x1 - x0 < 2) continue;
      px(g, base, x0, sy + 1, x1 - x0, 6);
      // Knock off the corners and add a soft top light and bottom shade.
      if (x0 === sx + 1) {
        px(g, C.mortar, x0, sy + 1);
        px(g, C.mortar, x0, sy + 6);
      }
      if (x1 === sx + 10) {
        px(g, C.mortar, x1 - 1, sy + 1);
        px(g, C.mortar, x1 - 1, sy + 6);
      }
      px(g, '#a39d91', x0 + 1, sy + 1, Math.max(0, x1 - x0 - 2), 1);
      px(g, '#878177', x0 + 1, sy + 6, Math.max(0, x1 - x0 - 2), 1);
    }
  }
  if (hash01(tx, ty, 510) < 0.2) px(g, '#7e8a58', x + Math.floor(hash01(tx, ty, 511) * 28), y + 7 + 8 * Math.floor(hash01(tx, ty, 512) * 3), 2, 1);
}

function water(g: G, x: number, y: number, tx: number, ty: number, isWater: (dx: number, dy: number) => boolean): void {
  px(g, C.water, x, y, TILE, TILE);
  for (let i = 0; i < 5; i++) {
    const wx = x + Math.floor(hash01(tx, ty, i + 600) * 24);
    const wy = y + 3 + Math.floor(hash01(tx, ty, i + 610) * 26);
    px(g, C.waterLight, wx, wy, 4 + (i % 3), 1);
    px(g, C.waterDark, wx + 2, wy + 1, 4, 1);
  }
  if (!isWater(-1, 0)) {
    px(g, C.bank, x, y, 3, TILE);
    px(g, C.waterDark, x + 3, y, 1, TILE);
  }
  if (!isWater(1, 0)) {
    px(g, C.bank, x + TILE - 3, y, 3, TILE);
    px(g, C.waterLight, x + TILE - 4, y, 1, TILE);
  }
}

function bridge(g: G, x: number, y: number): void {
  px(g, C.water, x, y, TILE, TILE);
  for (let i = 0; i < TILE; i += 6) {
    px(g, C.woodLight, x, y + i, TILE, 5);
    px(g, C.woodDark, x, y + i + 5, TILE, 1);
    px(g, C.wood, x + 3 + ((i / 6) % 2) * 12, y + i + 2, 2, 1);
  }
}

function shadowBlob(g: G, cx: number, cy: number, rx: number, ry: number): void {
  g.fillStyle = C.shadow;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

function bush(g: G, x: number, y: number, tx: number, ty: number): void {
  grass(g, x, y, tx, ty);
  shadowBlob(g, x + 17, y + 26, 12, 4);
  const blobs: [number, number, number][] = [
    [10, 18, 8],
    [20, 17, 9],
    [15, 12, 8],
  ];
  for (const [bx, by, r] of blobs) {
    g.fillStyle = C.hedgeDark;
    g.beginPath();
    g.arc(x + bx + 1, y + by + 1, r, 0, Math.PI * 2);
    g.fill();
  }
  for (const [bx, by, r] of blobs) {
    g.fillStyle = C.hedge;
    g.beginPath();
    g.arc(x + bx, y + by, r - 1, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 6; i++) px(g, C.hedgeLight, x + 6 + Math.floor(hash01(tx, ty, i + 700) * 18), y + 7 + Math.floor(hash01(tx, ty, i + 710) * 12), 2, 1);
  if (hash01(tx, ty, 720) < 0.5) px(g, '#c0503a', x + 12, y + 14, 2, 2);
}

function hedge(g: G, x: number, y: number, tx: number, ty: number, isHedge: (dx: number, dy: number) => boolean): void {
  grass(g, x, y, tx, ty);
  const l = isHedge(-1, 0) ? 0 : 3;
  const r = isHedge(1, 0) ? TILE : TILE - 3;
  const t = isHedge(0, -1) ? 0 : 6;
  const b = isHedge(0, 1) ? TILE : TILE - 4;
  px(g, C.hedgeDark, x + l, y + t + 2, r - l, b - t - 2);
  px(g, C.hedge, x + l, y + t, r - l, b - t - 6);
  px(g, C.hedgeLight, x + l, y + t, r - l, 2);
  for (let i = 0; i < 8; i++) {
    const hx = x + l + Math.floor(hash01(tx, ty, i + 800) * (r - l - 2));
    const hy = y + t + 2 + Math.floor(hash01(tx, ty, i + 810) * Math.max(1, b - t - 10));
    px(g, i % 2 ? C.hedgeLight : C.hedgeDark, hx, hy, 2, 1);
  }
}

function fence(g: G, x: number, y: number, tx: number, ty: number, isFence: (dx: number, dy: number) => boolean): void {
  grass(g, x, y, tx, ty);
  px(g, C.woodDark, x + (isFence(-1, 0) ? 0 : 4), y + 14, isFence(1, 0) ? TILE : TILE - 4, 2);
  px(g, C.wood, x + (isFence(-1, 0) ? 0 : 4), y + 13, isFence(1, 0) ? TILE : TILE - 4, 1);
  px(g, C.woodDark, x + (isFence(-1, 0) ? 0 : 4), y + 21, isFence(1, 0) ? TILE : TILE - 4, 2);
  px(g, C.wood, x + (isFence(-1, 0) ? 0 : 4), y + 20, isFence(1, 0) ? TILE : TILE - 4, 1);
  for (const fx of [4, 20]) {
    px(g, C.woodDark, x + fx, y + 8, 4, 19);
    px(g, C.woodLight, x + fx, y + 8, 1, 18);
    px(g, C.wood, x + fx + 1, y + 7, 2, 1);
  }
}

function well(g: G, x: number, y: number, tx: number, ty: number): void {
  cobble(g, x, y, tx, ty);
  shadowBlob(g, x + 17, y + 27, 13, 4);
  px(g, '#6f6a62', x + 4, y + 12, 24, 14);
  px(g, C.stoneLight, x + 4, y + 12, 24, 2);
  for (let i = 0; i < 4; i++) px(g, C.stoneDark, x + 6 + i * 6, y + 16, 1, 9);
  px(g, '#2c3a44', x + 7, y + 13, 18, 3);
  px(g, C.woodDark, x + 5, y + 2, 2, 12);
  px(g, C.woodDark, x + 25, y + 2, 2, 12);
  px(g, C.wood, x + 3, y + 1, 26, 3);
  px(g, '#9a8e7a', x + 15, y + 4, 1, 8);
  px(g, C.woodDark, x + 13, y + 10, 5, 3);
}

function crates(g: G, x: number, y: number, tx: number, ty: number, indoor: boolean): void {
  if (indoor) floor(g, x, y, tx, ty);
  else grass(g, x, y, tx, ty);
  shadowBlob(g, x + 17, y + 28, 13, 3);
  const box = (bx: number, by: number, s: number): void => {
    px(g, C.woodDark, bx, by, s, s);
    px(g, C.wood, bx + 1, by + 1, s - 2, s - 2);
    px(g, C.woodLight, bx + 1, by + 1, s - 2, 1);
    px(g, C.woodDark, bx + 1, by + Math.floor(s / 2), s - 2, 1);
    px(g, C.woodDark, bx + Math.floor(s / 2), by + 1, 1, s - 2);
  };
  box(x + 3, y + 14, 14);
  box(x + 16, y + 16, 12);
  box(x + 8, y + 3, 12);
}

function noticeboard(g: G, x: number, y: number, tx: number, ty: number): void {
  cobble(g, x, y, tx, ty);
  shadowBlob(g, x + 16, y + 28, 10, 3);
  px(g, C.woodDark, x + 6, y + 14, 2, 14);
  px(g, C.woodDark, x + 24, y + 14, 2, 14);
  px(g, C.woodDark, x + 3, y + 3, 26, 15);
  px(g, '#b39b72', x + 4, y + 4, 24, 13);
  px(g, C.paper, x + 6, y + 6, 8, 9);
  px(g, '#e9dcc0', x + 16, y + 5, 9, 7);
  px(g, '#c8392f', x + 9, y + 6, 2, 1);
  for (let i = 0; i < 3; i++) px(g, '#8a8070', x + 7, y + 9 + i * 2, 6, 1);
}

function tollgate(g: G, x: number, y: number, tx: number, ty: number, isGate: (dx: number, dy: number) => boolean): void {
  dirt(g, x, y, tx, ty, () => true);
  if (!isGate(0, -1)) {
    px(g, '#5a5048', x + 12, y + 6, 8, 24);
    px(g, '#6e645a', x + 12, y + 6, 2, 24);
  }
  px(g, '#e8e0cc', x, y + 12, TILE, 5);
  for (let i = 0; i < TILE; i += 8) px(g, '#b8463a', x + i, y + 12, 4, 5);
  px(g, '#5a5048', x, y + 17, TILE, 1);
}

function floor(g: G, x: number, y: number, tx: number, ty: number): void {
  px(g, C.floor, x, y, TILE, TILE);
  for (let i = 0; i < 4; i++) {
    const by = y + i * 8;
    px(g, C.floorDark, x, by + 7, TILE, 1);
    px(g, C.floorLight, x, by, TILE, 1);
    const seam = x + Math.floor(hash01(tx, ty * 4 + i, 900) * 28);
    px(g, C.floorDark, seam, by, 1, 7);
    if (hash01(tx, ty * 4 + i, 901) < 0.3) px(g, C.floorDark, x + Math.floor(hash01(tx, ty, 902 + i) * 28), by + 3, 3, 1);
  }
}

function backWall(g: G, x: number, y: number, tx: number, ty: number, row: number): void {
  if (row === 0) {
    px(g, C.plasterDark, x, y, TILE, TILE);
    px(g, '#b8a888', x, y, TILE, 4);
    return;
  }
  px(g, C.plaster, x, y, TILE, 20);
  px(g, C.wainscot, x, y + 20, TILE, 12);
  px(g, '#8c6a4a', x, y + 20, TILE, 2);
  px(g, '#5e4430', x, y + 31, TILE, 1);
  if (hash01(tx, ty, 950) < 0.3) {
    px(g, '#b9a888', x + 10, y + 4, 12, 10);
    px(g, '#93a3b0', x + 11, y + 5, 10, 8);
  }
}

function sideWall(g: G, x: number, y: number): void {
  px(g, '#5e4430', x, y, TILE, TILE);
  px(g, '#6e5038', x + 2, y, TILE - 4, TILE);
  px(g, '#7d5d42', x + 2, y, 2, TILE);
}

function pigeonholes(g: G, x: number, y: number, tx: number, ty: number): void {
  px(g, C.woodDark, x, y, TILE, TILE);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const cx = x + 2 + c * 7;
      const cy = y + 2 + r * 7;
      px(g, '#3e2c1f', cx, cy, 6, 6);
      const k = hash01(tx * 4 + c, ty * 4 + r, 960);
      if (k < 0.45) {
        px(g, C.paper, cx + 1, cy + 2, 4, 4);
        px(g, '#d6c4a2', cx + 1, cy + 5, 4, 1);
      } else if (k < 0.55) px(g, '#c8392f', cx + 2, cy + 3, 2, 2);
    }
  }
}

function shelf(g: G, x: number, y: number, tx: number, ty: number): void {
  backWall(g, x, y, tx, ty, 1);
  px(g, C.woodDark, x + 1, y + 2, 30, 28);
  for (let r = 0; r < 3; r++) {
    px(g, C.wood, x + 2, y + 10 + r * 9, 28, 2);
    for (let i = 0; i < 3; i++) {
      if (hash01(tx * 3 + i, ty * 3 + r, 970) < 0.6) {
        const w = 5 + Math.floor(hash01(tx, i + r, 971) * 4);
        px(g, i % 2 ? '#c9b48c' : '#b59a6c', x + 3 + i * 9, y + 10 + r * 9 - 6, w, 6);
        px(g, '#8a6a48', x + 3 + i * 9, y + 10 + r * 9 - 3, w, 1);
      }
    }
  }
}

function counter(g: G, x: number, y: number, tx: number, ty: number, isCounter: (dx: number, dy: number) => boolean): void {
  floor(g, x, y, tx, ty);
  const l = isCounter(-1, 0) ? 0 : 2;
  const r = isCounter(1, 0) ? TILE : TILE - 2;
  px(g, '#5a3f2a', x + l, y + 6, r - l, 24);
  px(g, '#7a5a3e', x + l, y + 12, r - l, 16);
  px(g, '#b08a60', x + l, y + 4, r - l, 6);
  px(g, '#c49c70', x + l, y + 4, r - l, 1);
  px(g, '#5a3f2a', x + l, y + 10, r - l, 1);
  if (!isCounter(-1, 0)) px(g, C.brass, x + 6, y + 1, 4, 3);
  if (hash01(tx, ty, 980) < 0.4) px(g, C.paper, x + 12, y + 5, 7, 4);
}

function table(g: G, x: number, y: number, tx: number, ty: number): void {
  floor(g, x, y, tx, ty);
  shadowBlob(g, x + 16, y + 28, 13, 3);
  px(g, C.woodDark, x + 3, y + 18, 3, 10);
  px(g, C.woodDark, x + 26, y + 18, 3, 10);
  px(g, '#9a7650', x + 1, y + 8, 30, 12);
  px(g, '#b08a60', x + 1, y + 8, 30, 2);
  for (let i = 0; i < 3; i++) {
    const lx = x + 4 + Math.floor(hash01(tx, ty, 990 + i) * 20);
    px(g, C.paper, lx, y + 11 + i * 2, 6, 3);
  }
}

function rug(g: G, x: number, y: number, tx: number, ty: number, isRug: (dx: number, dy: number) => boolean): void {
  floor(g, x, y, tx, ty);
  px(g, C.rug, x, y, TILE, TILE);
  if (!isRug(0, -1)) px(g, C.rugBorder, x, y, TILE, 3);
  if (!isRug(0, 1)) px(g, C.rugBorder, x, y + TILE - 3, TILE, 3);
  if (!isRug(-1, 0)) px(g, C.rugBorder, x, y, 3, TILE);
  if (!isRug(1, 0)) px(g, C.rugBorder, x + TILE - 3, y, 3, TILE);
  for (let i = 4; i < TILE - 4; i += 8) px(g, C.rugLight, x + i, y + 14, 4, 4);
}

function stove(g: G, x: number, y: number, tx: number, ty: number): void {
  floor(g, x, y, tx, ty);
  shadowBlob(g, x + 16, y + 28, 11, 3);
  px(g, C.iron, x + 6, y + 10, 20, 18);
  px(g, '#4c4c56', x + 6, y + 10, 20, 2);
  px(g, '#c0603a', x + 10, y + 18, 12, 5);
  px(g, '#e8a050', x + 12, y + 19, 4, 2);
  px(g, C.iron, x + 14, y - 8, 4, 18);
}

function doormat(g: G, x: number, y: number, tx: number, ty: number): void {
  floor(g, x, y, tx, ty);
  px(g, '#7a6a48', x + 3, y + 8, 26, 18);
  for (let i = 0; i < 26; i += 3) px(g, '#8a7a56', x + 3 + i, y + 8, 1, 18);
}

function interiorDoor(g: G, x: number, y: number, tx: number, ty: number): void {
  floor(g, x, y, tx, ty);
  px(g, '#2a1e16', x + 4, y + 20, 24, 12);
  px(g, '#e8d8a8', x + 6, y + 22, 20, 10);
}

// ---------------------------------------------------------------------------
// Tall things are drawn as standalone sprites and depth-sorted with characters.

export interface TallSprite {
  canvas: HTMLCanvasElement;
  /** Offset from the tile's top-left to the sprite's top-left. */
  ox: number;
  oy: number;
}

const tallCache = new Map<string, TallSprite>();

function sprite(key: string, w: number, h: number, ox: number, oy: number, draw: (g: G) => void): TallSprite {
  const hit = tallCache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  if (g) draw(g);
  const s = { canvas, ox, oy };
  tallCache.set(key, s);
  return s;
}

const CANOPIES = [
  ['#9a6a2e', '#b58237', '#7e5326', '#c99a4a'],
  ['#7b8a3e', '#91a04a', '#5f6e32', '#a9b45a'],
  ['#a65a2c', '#c0723a', '#843f22', '#d48a4a'],
];

function blob(g: G, cx: number, cy: number, r: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
}

export function treeSprite(variant: number): TallSprite {
  const v = variant % CANOPIES.length;
  return sprite(`tree${v}`, 48, 64, -8, -32, (g) => {
    const [base, light, dark, hi] = CANOPIES[v] ?? CANOPIES[0] ?? [];
    g.fillStyle = C.shadow;
    g.beginPath();
    g.ellipse(26, 59, 14, 4, 0, 0, Math.PI * 2);
    g.fill();
    px(g, C.trunkDark, 21, 40, 7, 20);
    px(g, C.trunk, 21, 40, 4, 20);
    px(g, C.trunkDark, 18, 58, 13, 2);
    const blobs: [number, number, number][] = [
      [24, 22, 16],
      [14, 30, 11],
      [34, 30, 11],
      [24, 36, 12],
    ];
    for (const [x, y, r] of blobs) blob(g, x + 1, y + 2, r, dark ?? '#5e4a2a');
    for (const [x, y, r] of blobs) blob(g, x, y, r - 1, base ?? '#9a6a2e');
    blob(g, 19, 18, 8, light ?? '#b58237');
    blob(g, 12, 28, 5, light ?? '#b58237');
    for (let i = 0; i < 14; i++) {
      const lx = 6 + Math.floor(hash01(i, v, 1100) * 36);
      const ly = 8 + Math.floor(hash01(v, i, 1101) * 34);
      px(g, i % 3 === 0 ? (hi ?? '#c99a4a') : (dark ?? '#5e4a2a'), lx, ly, 2, 1);
    }
  });
}

export function lampSprite(): TallSprite {
  return sprite('lamp', 16, 56, 8, -24, (g) => {
    g.fillStyle = C.shadow;
    g.beginPath();
    g.ellipse(8, 53, 6, 2, 0, 0, Math.PI * 2);
    g.fill();
    px(g, C.iron, 7, 12, 2, 42);
    px(g, '#4c4c56', 5, 50, 6, 4);
    px(g, C.iron, 3, 4, 10, 2);
    px(g, '#e8c46a', 4, 6, 8, 7);
    px(g, '#f6e2a0', 5, 7, 3, 3);
    px(g, C.iron, 4, 12, 8, 1);
    px(g, C.iron, 6, 1, 4, 3);
  });
}

export function poleSprite(): TallSprite {
  return sprite('pole', 32, 80, 0, -48, (g) => {
    g.fillStyle = C.shadow;
    g.beginPath();
    g.ellipse(16, 77, 6, 2, 0, 0, Math.PI * 2);
    g.fill();
    px(g, '#5a4636', 14, 6, 4, 72);
    px(g, '#6e5844', 14, 6, 1, 72);
    px(g, '#5a4636', 4, 10, 24, 3);
    px(g, '#e8e0cc', 5, 8, 2, 2);
    px(g, '#e8e0cc', 25, 8, 2, 2);
    px(g, '#e8e0cc', 15, 4, 2, 2);
  });
}

export function topiarySprite(): TallSprite {
  // A peacock in privet, recently given a moustache.
  return sprite('topiary', 32, 56, 0, -24, (g) => {
    g.fillStyle = C.shadow;
    g.beginPath();
    g.ellipse(16, 52, 12, 3, 0, 0, Math.PI * 2);
    g.fill();
    px(g, C.woodDark, 14, 44, 4, 8);
    blob(g, 17, 37, 10, C.hedgeDark);
    blob(g, 16, 36, 9, C.hedge);
    blob(g, 11, 18, 6, C.hedgeDark);
    blob(g, 10, 17, 5, C.hedge);
    px(g, C.hedge, 9, 22, 4, 8);
    blob(g, 23, 26, 7, C.hedgeDark);
    blob(g, 22, 25, 6, C.hedgeLight);
    px(g, C.hedgeLight, 8, 13, 3, 1);
    px(g, '#2f4024', 5, 19, 6, 1);
    px(g, '#2f4024', 4, 20, 2, 1);
    px(g, '#2f4024', 10, 20, 2, 1);
  });
}

export function tallSpriteFor(m: ParsedMap, x: number, y: number): TallSprite | null {
  const t = m.tiles[y * m.width + x];
  if (!t?.tall) return null;
  if (t.id === 'tree') return treeSprite(Math.floor(hash01(x, y, 1200) * 3));
  if (t.id === 'lamp') return lampSprite();
  if (t.id === 'pole') return poleSprite();
  if (t.id === 'topiary') return topiarySprite();
  return null;
}

// ---------------------------------------------------------------------------
// Buildings.

interface BuildingStyle {
  roof: [string, string, string];
  wall: [string, string];
  trim: string;
  door: string;
  roofKind: 'slate' | 'thatch' | 'tile';
}

const STYLES: Record<string, BuildingStyle> = {
  postoffice: { roof: ['#5f6b7a', '#4d5866', '#748293'], wall: ['#d9ccb0', '#c4b596'], trim: '#3d4a6a', door: '#b44a3e', roofKind: 'slate' },
  inn: { roof: ['#b09a5c', '#94804a', '#c6b070'], wall: ['#e2d6bc', '#cdbf9f'], trim: '#5a3f2a', door: '#6a4a30', roofKind: 'thatch' },
  shop: { roof: ['#5f7a58', '#4c6446', '#73906a'], wall: ['#b8765a', '#a0644a'], trim: '#e8e0cc', door: '#3f5a3a', roofKind: 'tile' },
  bakery: { roof: ['#a8503c', '#8c4030', '#c0644a'], wall: ['#e6d8b8', '#d0c09c'], trim: '#7a4a2e', door: '#7a4a2e', roofKind: 'tile' },
  mayor: { roof: ['#4f5866', '#3f4652', '#646e7e'], wall: ['#cfc6b4', '#b9af9c'], trim: '#e8e0cc', door: '#2f3a52', roofKind: 'slate' },
  cottage: { roof: ['#a8945a', '#8c7a48', '#bfa96c'], wall: ['#e8dcc4', '#d2c4a8'], trim: '#6a4a30', door: '#4f6b8a', roofKind: 'thatch' },
  house: { roof: ['#8c5a3c', '#744830', '#a46c4a'], wall: ['#d6c8aa', '#c2b392'], trim: '#5a3f2a', door: '#5a3f2a', roofKind: 'tile' },
  house2: { roof: ['#6e6a5c', '#5a574a', '#827e6e'], wall: ['#cbb89a', '#b5a282'], trim: '#5a3f2a', door: '#7a5a3e', roofKind: 'slate' },
  tollbooth: { roof: ['#8c5a3c', '#744830', '#a46c4a'], wall: ['#a3825c', '#8a6a48'], trim: '#5a3f2a', door: '#5a3f2a', roofKind: 'tile' },
};

function window4(g: G, x: number, y: number, trim: string): void {
  px(g, trim, x, y, 14, 14);
  px(g, '#3e5466', x + 2, y + 2, 10, 10);
  px(g, '#6f8aa0', x + 2, y + 2, 4, 3);
  px(g, trim, x + 6, y + 2, 2, 10);
  px(g, trim, x + 2, y + 6, 10, 2);
  px(g, '#6a4a30', x - 1, y + 14, 16, 3);
  px(g, '#c0503a', x + 1, y + 13, 2, 1);
  px(g, '#d9a441', x + 6, y + 13, 2, 1);
  px(g, '#c58ab0', x + 11, y + 13, 2, 1);
}

export function drawBuilding(g: G, b: Building): void {
  const s = STYLES[b.style] ?? STYLES.house;
  if (!s) return;
  const x = b.x * TILE;
  const y = b.y * TILE;
  const w = b.w * TILE;
  const h = b.h * TILE;
  const wallH = Math.min(2, b.h - 1) * TILE - 6;
  const roofH = h - wallH;
  // Shadow on the ground to the right and below.
  g.fillStyle = 'rgba(30, 36, 20, 0.25)';
  g.fillRect(x + 6, y + h - 2, w, 5);
  g.fillRect(x + w, y + 10, 5, h - 10);
  // Walls.
  const wy = y + roofH;
  px(g, s.wall[0], x + 2, wy, w - 4, wallH);
  px(g, s.wall[1], x + 2, wy + wallH - 4, w - 4, 4);
  for (let i = 0; i < 6; i++) {
    px(g, s.wall[1], x + 4 + Math.floor(hash01(b.x, i, 1300) * (w - 10)), wy + 4 + Math.floor(hash01(b.y, i, 1301) * (wallH - 10)), 3, 1);
  }
  if (b.style === 'inn') {
    for (let bx = x + 2; bx < x + w - 2; bx += 24) px(g, '#5a3f2a', bx, wy, 3, wallH);
    px(g, '#5a3f2a', x + 2, wy + 2, w - 4, 3);
  }
  px(g, s.trim, x + 2, wy, w - 4, 2);
  // Windows on every column except the door's.
  for (let c = 0; c < b.w; c++) {
    const cx = (b.x + c) * TILE;
    if (b.door && b.door.x === b.x + c) continue;
    if (c === 0 || c === b.w - 1 ? b.w > 4 && hash01(b.x + c, b.y, 1310) < 0.5 : true) {
      window4(g, cx + 9, wy + Math.max(4, wallH - 34), s.trim);
    }
  }
  // Door.
  if (b.door) {
    const dx = b.door.x * TILE;
    const dy = y + h - 30;
    px(g, '#3a2a1e', dx + 5, dy - 2, 22, 32);
    px(g, s.door, dx + 7, dy, 18, 30);
    px(g, '#00000033', dx + 16, dy, 1, 30);
    px(g, '#ffffff22', dx + 7, dy, 2, 30);
    px(g, '#d3a648', dx + 21, dy + 15, 2, 2);
    px(g, '#5e5a52', dx + 3, y + h - 2, 26, 2);
  }
  // Roof, overhanging the walls a little.
  const ox = 4;
  px(g, s.roof[1], x - ox, y + 2, w + ox * 2, roofH);
  px(g, s.roof[0], x - ox, y + 2, Math.floor((w + ox * 2) * 0.55), roofH - 4);
  px(g, s.roof[2], x - ox, y + 2, w + ox * 2, 3);
  px(g, '#00000040', x - ox, y + roofH, w + ox * 2, 3);
  const rows = Math.floor((roofH - 6) / 6);
  for (let r = 0; r < rows; r++) {
    const ry = y + 6 + r * 6;
    if (s.roofKind === 'thatch') {
      for (let i = 0; i < w + ox * 2; i += 3) px(g, hash01(i, r, b.x) < 0.5 ? s.roof[1] : s.roof[2], x - ox + i, ry + (i % 2), 1, 3);
    } else {
      px(g, s.roof[1], x - ox, ry + 5, w + ox * 2, 1);
      const step = s.roofKind === 'slate' ? 10 : 8;
      for (let i = (r % 2) * (step / 2); i < w + ox * 2; i += step) px(g, s.roof[1], x - ox + i, ry, 1, 5);
    }
  }
  // Chimney.
  if (b.style !== 'tollbooth') {
    const chx = x + w - 30;
    px(g, '#7a5a4a', chx, y - 4, 10, 14);
    px(g, '#8c6a58', chx, y - 4, 10, 2);
    px(g, '#5e4436', chx + 7, y - 2, 3, 12);
  }
  // Signs.
  if (b.style === 'postoffice' && b.door) {
    const sx = b.door.x * TILE - 20;
    const sy = wy - 6;
    px(g, '#3d4a6a', sx, sy, 72, 12);
    px(g, '#d3a648', sx + 2, sy + 2, 68, 1);
    px(g, '#d3a648', sx + 2, sy + 9, 68, 1);
    // A little post horn.
    px(g, '#d3a648', sx + 30, sy + 4, 10, 2);
    px(g, '#d3a648', sx + 38, sy + 3, 3, 4);
    px(g, '#d3a648', sx + 28, sy + 5, 3, 2);
  }
  if (b.style === 'bakery' && b.door) {
    const sx = b.door.x * TILE + 30;
    px(g, '#5a3f2a', sx, wy + 4, 1, 6);
    px(g, '#d9b070', sx - 6, wy + 10, 14, 8);
    px(g, '#b88a4a', sx - 5, wy + 12, 12, 2);
  }
  if (b.style === 'inn' && b.door) {
    const sx = b.door.x * TILE - 14;
    px(g, '#5a3f2a', sx + 6, wy - 2, 1, 8);
    px(g, '#7a2b3e', sx, wy + 6, 14, 12);
    px(g, '#d3a648', sx + 4, wy + 9, 6, 6);
  }
  if (b.style === 'shop') {
    for (let i = x + 4; i < x + w - 4; i += 8) {
      px(g, '#e8e0cc', i, wy + 2, 4, 6);
      px(g, '#4c6446', i + 4, wy + 2, 4, 6);
    }
  }
  if (b.style === 'mayor' && b.door) {
    const dx = b.door.x * TILE;
    px(g, '#e8e0cc', dx - 2, y + h - 34, 4, 34);
    px(g, '#e8e0cc', dx + 30, y + h - 34, 4, 34);
    px(g, '#e8e0cc', dx - 4, y + h - 38, 40, 4);
  }
}

// ---------------------------------------------------------------------------
// The ground layer for a whole map.

export function paintGround(m: ParsedMap): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = m.width * TILE;
  canvas.height = m.height * TILE;
  const g = canvas.getContext('2d');
  if (!g) return canvas;
  g.imageSmoothingEnabled = false;
  const indoor = m.def.kind === 'interior';
  const idAt = (x: number, y: number): string | undefined => {
    if (x < 0 || y < 0 || x >= m.width || y >= m.height) return undefined;
    return m.tiles[y * m.width + x]?.id;
  };
  for (let ty = 0; ty < m.height; ty++) {
    for (let tx = 0; tx < m.width; tx++) {
      const x = tx * TILE;
      const y = ty * TILE;
      const id = m.tiles[ty * m.width + tx]?.id ?? 'grass';
      const same = (dx: number, dy: number): boolean => idAt(tx + dx, ty + dy) === id;
      const ch = m.def.grid[ty]?.[tx];
      if (ch === 'D' && indoor) {
        interiorDoor(g, x, y, tx, ty);
        continue;
      }
      switch (id) {
        case 'flowers':
          flowers(g, x, y, tx, ty);
          break;
        case 'dirt':
          dirt(g, x, y, tx, ty, (dx, dy) => {
            const o = idAt(tx + dx, ty + dy);
            return o === 'dirt' || o === 'cobble' || o === 'bridge' || o === 'tollgate' || o === undefined;
          });
          break;
        case 'cobble':
          cobble(g, x, y, tx, ty);
          break;
        case 'water':
          water(g, x, y, tx, ty, (dx, dy) => {
            const o = idAt(tx + dx, ty + dy);
            return o === 'water' || o === 'bridge' || o === undefined;
          });
          break;
        case 'bridge':
          bridge(g, x, y);
          break;
        case 'bush':
          bush(g, x, y, tx, ty);
          break;
        case 'hedge':
          hedge(g, x, y, tx, ty, same);
          break;
        case 'fence':
          fence(g, x, y, tx, ty, same);
          break;
        case 'well':
          well(g, x, y, tx, ty);
          break;
        case 'crates':
          crates(g, x, y, tx, ty, indoor);
          break;
        case 'noticeboard':
          noticeboard(g, x, y, tx, ty);
          break;
        case 'tollgate':
          tollgate(g, x, y, tx, ty, same);
          break;
        case 'wall':
          backWall(g, x, y, tx, ty, ty);
          break;
        case 'wallside':
          sideWall(g, x, y);
          break;
        case 'floor':
          floor(g, x, y, tx, ty);
          break;
        case 'counter':
          counter(g, x, y, tx, ty, same);
          break;
        case 'pigeonholes':
          pigeonholes(g, x, y, tx, ty);
          break;
        case 'shelf':
          shelf(g, x, y, tx, ty);
          break;
        case 'rug':
          rug(g, x, y, tx, ty, same);
          break;
        case 'table':
          table(g, x, y, tx, ty);
          break;
        case 'stove':
          stove(g, x, y, tx, ty);
          break;
        case 'doormat':
          doormat(g, x, y, tx, ty);
          break;
        default:
          // Grass under trees, lamps, poles and topiary; they are drawn as sprites.
          if (id === 'tree' || id === 'lamp' || id === 'pole' || id === 'topiary' || id === 'grass') {
            const under = idAt(tx, ty + 1);
            if (id !== 'grass' && (under === 'cobble' || idAt(tx - 1, ty) === 'cobble')) cobble(g, x, y, tx, ty);
            else grass(g, x, y, tx, ty);
          } else grass(g, x, y, tx, ty);
      }
    }
  }
  for (const b of m.buildings) drawBuilding(g, b);
  return canvas;
}
