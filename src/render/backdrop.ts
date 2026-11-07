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
  fen: {
    sky: ['#8a9aa6', '#a8b2b4', '#c8c8b8'],
    hills: ['#6a7a6a', '#5a6a5c'],
    ground: ['#6e7c5a', '#62705a', '#7c8a66'],
    road: ['#7e7464', '#6e6456'],
    accents: ['#8a8a52', '#b0985a', '#6a6a3e'],
  },
  abbey: {
    sky: ['#9aaac0', '#b8c2c8', '#dad6c4'],
    hills: ['#6e8456', '#5e744c'],
    ground: ['#6e8456', '#62784c', '#7c925e'],
    road: ['#a09a8a', '#8e887a'],
    accents: ['#8a9a5a', '#a89a5a', '#c8c0a0'],
  },
  copperhill: {
    sky: ['#9a8a7e', '#b4a290', '#d0b898'],
    hills: ['#6e5e50', '#5a4c42'],
    ground: ['#7e7650', '#706848', '#8c845c'],
    road: ['#8a6a52', '#7a5c46'],
    accents: ['#3e3a3c', '#a8582a', '#5a5456'],
  },
  oldfront: {
    sky: ['#8a8e8a', '#a4a69c', '#c0bca8'],
    hills: ['#6a6a4c', '#5a5a42'],
    ground: ['#6e6e4c', '#626244', '#7a7a56'],
    road: ['#6e5e48', '#5e5040'],
    accents: ['#4a4230', '#7a6a4a', '#5a5a5a'],
  },
  salt: {
    sky: ['#8ab8c8', '#b0d0d4', '#e2dcc4'],
    hills: ['#3a8a8c', '#2e7476'],
    ground: ['#cdbd94', '#bcac84', '#ddd0aa'],
    road: ['#b8a07a', '#a89070'],
    accents: ['#8aa890', '#ffffff', '#a89878'],
  },
  gulls: {
    sky: ['#8aa8c0', '#aac4d0', '#d6d8cc'],
    hills: ['#3a7a8c', '#2e6676'],
    ground: ['#8a9a72', '#7c8c66', '#98a87e'],
    road: ['#a89878', '#988868'],
    accents: ['#ffffff', '#a8b48a', '#6a6a6a'],
  },
  kingsend: {
    sky: ['#8a9ab0', '#aab4c0', '#cfcfc4'],
    hills: ['#8a8478', '#787266'],
    ground: ['#5e7a4e', '#526c44', '#6a8858'],
    road: ['#b4aea2', '#9c968a'],
    accents: ['#c87a3a', '#b4aea2', '#7a8a5a'],
  },
};

/** Indoor fights: wall, beam, floor and floor seam colours, and what hangs on the wall. */
const INDOORS: Record<string, { wall: string; trim: string; floor: [string, string]; seam: string; deco: 'pigeonholes' | 'alcoves' | 'banners' | 'beams' | 'furnace' }> = {
  interior: { wall: '#d9ccb0', trim: '#7a5a3e', floor: ['#a07a52', '#9a7650'], seam: '#8d6a46', deco: 'pigeonholes' },
  crypt: { wall: '#6e6a62', trim: '#4a4640', floor: ['#5e5a54', '#58544e'], seam: '#46423c', deco: 'alcoves' },
  hall: { wall: '#b8a88a', trim: '#5a4434', floor: ['#7a5e44', '#745840'], seam: '#5e4634', deco: 'banners' },
  mine: { wall: '#4a4440', trim: '#5a4632', floor: ['#3a3532', '#36312e'], seam: '#2a2624', deco: 'beams' },
  furnace: { wall: '#3a3438', trim: '#22202a', floor: ['#4a4448', '#443e42'], seam: '#2e2a30', deco: 'furnace' },
};

const ALIAS: Record<string, string> = { office: 'interior', 'fen-town': 'fen', harbour: 'salt' };

export function backdrop(name: string): HTMLCanvasElement {
  const region = ALIAS[name] ?? name;
  const key = name;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = PALETTES[region] ?? PALETTES.thistle;
  const c = document.createElement('canvas');
  c.width = LOGICAL_WIDTH;
  c.height = LOGICAL_HEIGHT;
  const g = c.getContext('2d');
  if (!g || !p) return c;
  const horizon = 150;
  const indoor = INDOORS[region];
  if (indoor) {
    g.fillStyle = indoor.wall;
    g.fillRect(0, 0, LOGICAL_WIDTH, horizon);
    g.fillStyle = indoor.trim;
    g.fillRect(0, horizon - 40, LOGICAL_WIDTH, 40);
    for (let x = 20; x < LOGICAL_WIDTH; x += 120) {
      if (indoor.deco === 'pigeonholes') {
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
      } else if (indoor.deco === 'alcoves') {
        g.fillStyle = '#3a3632';
        g.fillRect(x + 10, 30, 60, 60);
        g.fillStyle = '#2a2622';
        g.fillRect(x + 16, 36, 48, 54);
        g.fillStyle = '#8a8478';
        g.fillRect(x + 22, 70, 36, 8);
        g.fillStyle = '#e8c46a';
        g.fillRect(x + 70, 40, 4, 8);
      } else if (indoor.deco === 'banners') {
        g.fillStyle = '#8a2a2a';
        g.fillRect(x + 20, 10, 40, 80);
        g.fillStyle = '#d3a648';
        g.fillRect(x + 30, 30, 20, 4);
        g.fillRect(x + 38, 22, 4, 20);
        g.fillStyle = '#5a4434';
        g.fillRect(x + 16, 8, 48, 4);
      } else if (indoor.deco === 'beams') {
        g.fillStyle = '#5a4632';
        g.fillRect(x, 0, 12, horizon);
        g.fillRect(x - 20, 10, 60, 10);
        g.fillStyle = '#e8c46a';
        g.fillRect(x + 50, 40, 6, 8);
        g.fillStyle = '#6a5a4a';
        g.fillRect(x + 40, 60, 30, 3);
      } else {
        g.fillStyle = '#1a1418';
        g.fillRect(x + 10, 30, 70, 70);
        g.fillStyle = '#c8501e';
        g.fillRect(x + 16, 60, 58, 40);
        g.fillStyle = '#f0a040';
        g.fillRect(x + 24, 70, 42, 30);
        g.fillStyle = '#fff0a0';
        g.fillRect(x + 34, 82, 22, 18);
      }
    }
    for (let y = horizon; y < LOGICAL_HEIGHT; y += 10) {
      g.fillStyle = (y / 10) % 2 ? indoor.floor[0] : indoor.floor[1];
      g.fillRect(0, y, LOGICAL_WIDTH, 10);
      g.fillStyle = indoor.seam;
      g.fillRect(0, y + 9, LOGICAL_WIDTH, 1);
      for (let x = 0; x < LOGICAL_WIDTH; x += 60) g.fillRect(x + ((y / 10) % 3) * 20, y, 1, 9);
    }
    if (indoor.deco === 'furnace') {
      g.fillStyle = 'rgba(240, 120, 40, 0.12)';
      g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
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
  // Things on the horizon.
  if (region === 'copperhill') {
    for (let x = 30; x < LOGICAL_WIDTH; x += 140) {
      g.fillStyle = '#3e3a3c';
      g.beginPath();
      g.moveTo(x, horizon);
      g.lineTo(x + 40, horizon - 40);
      g.lineTo(x + 90, horizon);
      g.fill();
      g.fillStyle = '#5a4a40';
      g.fillRect(x + 100, horizon - 70, 10, 70);
      g.fillStyle = 'rgba(80, 76, 80, 0.5)';
      for (let k = 0; k < 4; k++) g.fillRect(x + 96 - k * 6, horizon - 80 - k * 8, 16 + k * 2, 6);
    }
  }
  if (region === 'salt' || region === 'gulls') {
    g.fillStyle = p.hills[0];
    g.fillRect(0, horizon - 30, LOGICAL_WIDTH, 30);
    g.fillStyle = '#ffffff55';
    for (let i = 0; i < 40; i++) g.fillRect(Math.floor(hash01(i, 3, 21) * LOGICAL_WIDTH), horizon - 28 + Math.floor(hash01(i, 4, 21) * 26), 6, 1);
    if (region === 'gulls') {
      g.fillStyle = '#f2eee4';
      g.fillRect(520, horizon - 110, 20, 80);
      g.fillStyle = '#b83a32';
      g.fillRect(520, horizon - 96, 20, 8);
      g.fillRect(520, horizon - 70, 20, 8);
      g.fillStyle = '#f6e2a0';
      g.fillRect(522, horizon - 120, 16, 10);
    }
  }
  if (region === 'kingsend') {
    g.fillStyle = '#9c968a';
    g.fillRect(0, horizon - 44, LOGICAL_WIDTH, 30);
    for (let x = 0; x < LOGICAL_WIDTH; x += 16) g.fillRect(x, horizon - 50, 8, 6);
    for (const tx of [80, 300, 520]) {
      g.fillStyle = '#8a8478';
      g.fillRect(tx, horizon - 100, 30, 86);
      g.fillStyle = '#4a5a8a';
      g.beginPath();
      g.moveTo(tx - 4, horizon - 100);
      g.lineTo(tx + 15, horizon - 126);
      g.lineTo(tx + 34, horizon - 100);
      g.fill();
    }
  }
  if (region === 'fen') {
    g.fillStyle = '#5a7484';
    g.fillRect(0, horizon - 16, LOGICAL_WIDTH, 16);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = i % 2 ? '#8a8a52' : '#6a6a3e';
      const x = Math.floor(hash01(i, 5, 22) * LOGICAL_WIDTH);
      g.fillRect(x, horizon - 30 - Math.floor(hash01(i, 6, 22) * 12), 1, 30);
    }
  }
  if (region === 'oldfront') {
    g.fillStyle = '#4a4230';
    for (let x = 10; x < LOGICAL_WIDTH; x += 50) {
      g.fillRect(x, horizon - 20, 3, 20);
      g.fillStyle = 'rgba(40, 36, 30, 0.6)';
      for (let k = 0; k < 50; k += 3) g.fillRect(x + k, horizon - 16 + Math.round(Math.sin(k / 4) * 2), 2, 1);
      g.fillStyle = '#4a4230';
    }
  }
  if (region === 'abbey') {
    g.fillStyle = '#c4bca8';
    g.fillRect(420, horizon - 80, 120, 70);
    g.fillStyle = '#5e646a';
    g.beginPath();
    g.moveTo(410, horizon - 80);
    g.lineTo(480, horizon - 110);
    g.lineTo(550, horizon - 80);
    g.fill();
    g.fillRect(470, horizon - 140, 20, 40);
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
