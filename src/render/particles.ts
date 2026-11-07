/**
 * Small effects drawn on the canvas: bursts for hits, heals, broken seals
 * and deliveries in battle, and gentle ambient weather on the field. This
 * is rendering only; its variation comes from its own little generator, not
 * the game's seeded RNG, so effects never change what happens in play.
 */
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './scale';

export type BurstKind = 'hit' | 'heal' | 'wax' | 'paper' | 'chime' | 'status';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Downward pull, px per ms². */
  fall: number;
  age: number;
  life: number;
  color: string;
  w: number;
  h: number;
  sway: number;
}

const BURSTS: Record<BurstKind, { n: number; colors: string[]; speed: [number, number]; up: number; fall: number; life: [number, number]; size: [number, number]; sway?: number }> = {
  hit: { n: 9, colors: ['#fff4e0', '#f2c14e', '#f39b4e'], speed: [0.08, 0.18], up: 0.04, fall: 0.0004, life: [200, 340], size: [1, 2] },
  heal: { n: 10, colors: ['#9fe39a', '#d8f5c8', '#6ec46a'], speed: [0.005, 0.02], up: 0.035, fall: 0, life: [600, 900], size: [1, 2], sway: 0.6 },
  status: { n: 7, colors: ['#e8b0f0', '#b07ad0'], speed: [0.01, 0.03], up: 0.02, fall: 0, life: [500, 700], size: [1, 2], sway: 0.8 },
  wax: { n: 12, colors: ['#a3242c', '#c8383c', '#6e1418'], speed: [0.05, 0.14], up: 0.09, fall: 0.0005, life: [450, 700], size: [1, 3] },
  paper: { n: 6, colors: ['#f3ead6', '#e6dcc4'], speed: [0.01, 0.04], up: 0.05, fall: 0.00012, life: [900, 1300], size: [2, 3], sway: 1.6 },
  chime: { n: 14, colors: ['#f2c14e', '#fff0b8', '#e8d48a'], speed: [0.01, 0.05], up: 0.045, fall: 0, life: [700, 1100], size: [1, 2], sway: 1 },
};

export class Particles {
  private list: Particle[] = [];
  private seed = 0x51ed;

  private rand(): number {
    this.seed = (Math.imul(this.seed, 1103515245) + 12345) >>> 0;
    return (this.seed >>> 8) / 16777216;
  }

  private between([a, b]: [number, number]): number {
    return a + (b - a) * this.rand();
  }

  burst(x: number, y: number, kind: BurstKind): void {
    const b = BURSTS[kind];
    for (let i = 0; i < b.n; i++) {
      const angle = this.rand() * Math.PI * 2;
      const speed = this.between(b.speed);
      const size = Math.round(this.between(b.size));
      this.list.push({
        x: x + (this.rand() - 0.5) * 10,
        y: y + (this.rand() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - b.up,
        fall: b.fall,
        age: 0,
        life: this.between(b.life),
        color: b.colors[i % b.colors.length] ?? '#fff',
        w: kind === 'paper' ? size + 1 : size,
        h: size,
        sway: b.sway ?? 0,
      });
    }
  }

  update(dt: number): void {
    for (const p of this.list) {
      p.age += dt;
      p.vy += p.fall * dt;
      p.x += p.vx * dt + (p.sway ? Math.sin(p.age / 120) * p.sway * 0.05 * dt : 0);
      p.y += p.vy * dt;
    }
    this.list = this.list.filter((p) => p.age < p.life);
  }

  draw(g: CanvasRenderingContext2D): void {
    for (const p of this.list) {
      g.globalAlpha = Math.max(0, 1 - p.age / p.life);
      g.fillStyle = p.color;
      g.fillRect(Math.round(p.x), Math.round(p.y), p.w, p.h);
    }
    g.globalAlpha = 1;
  }
}

export type Ambient = 'leaves' | 'motes' | 'soot' | 'spray' | 'dust' | null;

/** The field's ambient effect for a map's region and theme. */
export function ambientFor(region: string, theme: string | undefined, kind: string): Ambient {
  if (theme === 'office' || theme === 'mine' || kind === 'interior') return 'dust';
  switch (region) {
    case 'thistle':
    case 'oldfront':
      return 'leaves';
    case 'fen':
    case 'abbey':
      return 'motes';
    case 'copperhill':
      return 'soot';
    case 'salt':
    case 'gulls':
      return 'spray';
    default:
      return null;
  }
}

const AMBIENT: Record<Exclude<Ambient, null>, { n: number; colors: string[]; fall: number; drift: number; sway: number; w: number; h: number; blink?: boolean }> = {
  leaves: { n: 10, colors: ['#c8783a', '#a85a2a', '#d8a048'], fall: 0.018, drift: 0.012, sway: 10, w: 2, h: 1 },
  motes: { n: 14, colors: ['#e8f0a0', '#c8e8a8'], fall: -0.004, drift: 0.006, sway: 8, w: 1, h: 1, blink: true },
  soot: { n: 16, colors: ['#3a3430', '#5a504a'], fall: 0.012, drift: 0.004, sway: 5, w: 1, h: 1 },
  spray: { n: 12, colors: ['#e8f4f0', '#c8e4e0'], fall: 0.006, drift: 0.03, sway: 3, w: 1, h: 1 },
  dust: { n: 8, colors: ['#e8dcc0'], fall: 0.002, drift: 0.003, sway: 6, w: 1, h: 1, blink: true },
};

/** Ambient drifting specks in screen space. A pure function of time, so it needs no state. */
export function drawAmbient(g: CanvasRenderingContext2D, kind: Ambient, t: number): void {
  if (!kind) return;
  const a = AMBIENT[kind];
  const W = LOGICAL_WIDTH + 40;
  const H = LOGICAL_HEIGHT + 40;
  for (let i = 0; i < a.n; i++) {
    const phase = i * 7919;
    const x = (((phase % W) + t * a.drift * (1 + (i % 3) * 0.3)) % W + W) % W - 20 + Math.sin(t / 900 + i) * a.sway;
    const y = (((Math.floor(phase / 7) % H) + t * a.fall * (1 + (i % 4) * 0.25)) % H + H) % H - 20;
    g.globalAlpha = a.blink ? 0.35 + 0.35 * Math.sin(t / 400 + i * 1.7) : 0.7;
    g.fillStyle = a.colors[i % a.colors.length] ?? '#fff';
    const flip = kind === 'leaves' && Math.sin(t / 300 + i) > 0;
    g.fillRect(Math.round(x), Math.round(y), flip ? a.h : a.w, flip ? a.w : a.h);
  }
  g.globalAlpha = 1;
}
