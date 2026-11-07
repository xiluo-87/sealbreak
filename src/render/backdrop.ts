/** Battle backdrops drawn in code, one per region, cached. */
import { hash01 } from './tileArt';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './scale';

const cache = new Map<string, HTMLCanvasElement>();

interface Palette {
  sky: [string, string, string];
  hills: [string, string];
  ground: [string, string, string];
  road: [string, string];
  accents: string[];
}

const PALETTES: Record<string, Palette> = {
  thistle: {
    sky: ['#8fa6bf', '#b9c4c4', '#e2d3b0'],
    hills: ['#7a8a62', '#62744e'],
    ground: ['#76844f', '#6b7948', '#818f58'],
    road: ['#9b8660', '#8b7754'],
    accents: ['#b5763a', '#c49846', '#9e5a32'],
  },
  interior: {
    sky: ['#5e4430', '#6e5038', '#7a5a3e'],
    hills: ['#8d6a46', '#7a5a3e'],
    ground: ['#a07a52', '#8d6a46', '#b08a60'],
    road: ['#7b4b70', '#5e3654'],
    accents: ['#efe6d2', '#d3a648', '#c8392f'],
  },
};

export function backdrop(region: string): HTMLCanvasElement {
  const key = region;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = PALETTES[region] ?? PALETTES.thistle;
  const c = document.createElement('canvas');
  c.width = LOGICAL_WIDTH;
  c.height = LOGICAL_HEIGHT;
  const g = c.getContext('2d');
  if (!g || !p) return c;
  const horizon = 150;
  if (region === 'interior') {
    // The sorting room: a wall with pigeonholes and a plank floor.
    g.fillStyle = '#d9ccb0';
    g.fillRect(0, 0, LOGICAL_WIDTH, horizon);
    g.fillStyle = '#7a5a3e';
    g.fillRect(0, horizon - 40, LOGICAL_WIDTH, 40);
    for (let x = 20; x < LOGICAL_WIDTH; x += 120) {
      g.fillStyle = '#6b4f35';
      g.fillRect(x, 20, 80, 70);
      for (let r = 0; r < 4; r++) {
        for (let k = 0; k < 5; k++) {
          g.fillStyle = '#3e2c1f';
          g.fillRect(x + 4 + k * 15, 24 + r * 16, 13, 14);
          if (hash01(x + k, r, 3) < 0.5) {
            g.fillStyle = '#efe6d2';
            g.fillRect(x + 6 + k * 15, 30 + r * 16, 9, 7);
          }
        }
      }
    }
    for (let y = horizon; y < LOGICAL_HEIGHT; y += 10) {
      g.fillStyle = (y / 10) % 2 ? '#a07a52' : '#9a7650';
      g.fillRect(0, y, LOGICAL_WIDTH, 10);
      g.fillStyle = '#8d6a46';
      g.fillRect(0, y + 9, LOGICAL_WIDTH, 1);
      for (let x = 0; x < LOGICAL_WIDTH; x += 60) g.fillRect(x + ((y / 10) % 3) * 20, y, 1, 9);
    }
    cache.set(key, c);
    return c;
  }
  // Sky in three soft bands.
  const bands = [0, 50, 100, horizon];
  p.sky.forEach((col, i) => {
    g.fillStyle = col;
    g.fillRect(0, bands[i] ?? 0, LOGICAL_WIDTH, (bands[i + 1] ?? horizon) - (bands[i] ?? 0));
  });
  // Clouds.
  g.fillStyle = '#eee6d2';
  for (let i = 0; i < 6; i++) {
    const cx = Math.floor(hash01(i, 1, 9) * LOGICAL_WIDTH);
    const cy = 20 + Math.floor(hash01(i, 2, 9) * 60);
    for (let k = 0; k < 4; k++) g.fillRect(cx + k * 10 - 14, cy - (k % 2) * 4, 22, 6);
  }
  // Hills.
  for (let layer = 0; layer < 2; layer++) {
    g.fillStyle = p.hills[layer] ?? '#62744e';
    for (let x = 0; x < LOGICAL_WIDTH; x++) {
      const h = Math.round(Math.sin(x / (70 + layer * 40) + layer) * 10 + Math.sin(x / 23 + layer * 3) * 4) + 22 - layer * 10;
      g.fillRect(x, horizon - h - 14 + layer * 14, 1, h + 20);
    }
  }
  // Telegraph poles marching along the horizon.
  g.fillStyle = '#5a4636';
  for (let x = 40; x < LOGICAL_WIDTH; x += 150) {
    g.fillRect(x, horizon - 50, 2, 44);
    g.fillRect(x - 6, horizon - 48, 14, 2);
  }
  g.fillStyle = 'rgba(40, 36, 30, 0.5)';
  for (let x = 40; x < LOGICAL_WIDTH - 150; x += 150) {
    for (let k = 0; k < 150; k += 2) g.fillRect(x + k, horizon - 47 + Math.round(Math.sin((k / 150) * Math.PI) * 5), 2, 1);
  }
  // Ground with a road running across.
  g.fillStyle = p.ground[0];
  g.fillRect(0, horizon, LOGICAL_WIDTH, LOGICAL_HEIGHT - horizon);
  for (let i = 0; i < 1400; i++) {
    const x = Math.floor(hash01(i, 5, 11) * LOGICAL_WIDTH);
    const y = horizon + Math.floor(hash01(i, 6, 11) * (LOGICAL_HEIGHT - horizon));
    g.fillStyle = i % 2 ? p.ground[1] : p.ground[2];
    g.fillRect(x, y, i % 3 === 0 ? 2 : 1, 1);
  }
  g.fillStyle = p.road[0];
  g.fillRect(0, 196, LOGICAL_WIDTH, 34);
  g.fillStyle = p.road[1];
  for (let i = 0; i < 300; i++) g.fillRect(Math.floor(hash01(i, 7, 13) * LOGICAL_WIDTH), 196 + Math.floor(hash01(i, 8, 13) * 34), 2, 1);
  g.fillStyle = p.ground[1];
  for (let x = 0; x < LOGICAL_WIDTH; x += 3) {
    g.fillRect(x, 195 - Math.floor(hash01(x, 1, 14) * 3), 2, 3);
    g.fillRect(x, 229 + Math.floor(hash01(x, 2, 14) * 3), 2, 3);
  }
  // Fallen leaves.
  for (let i = 0; i < 70; i++) {
    g.fillStyle = p.accents[i % p.accents.length] ?? '#b5763a';
    g.fillRect(Math.floor(hash01(i, 9, 15) * LOGICAL_WIDTH), horizon + 4 + Math.floor(hash01(i, 10, 15) * 200), 2, 1);
  }
  cache.set(key, c);
  return c;
}
