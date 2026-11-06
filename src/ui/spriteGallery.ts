/**
 * Debug page at `?sprites`: every sprite and animation at 1x and 4x on light
 * and dark backgrounds, frame strips, and the field-size silhouette test.
 */
import { frameAt } from '../sprites/anim';
import { ALL_CHARACTERS } from '../sprites/characters';
import { drawFrame, getSheet, type SpriteSheet } from '../sprites/sheet';
import type { AnimDef, SpriteSetDef } from '../sprites/types';

const BACKGROUNDS = { light: '#e9e4d6', dark: '#23212d' } as const;

interface Player {
  canvas: HTMLCanvasElement;
  sheet: SpriteSheet;
  anim: AnimDef;
  scale: number;
  bg: string;
  last: number;
  silhouette: boolean;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function makeCanvas(w: number, h: number, scale: number): HTMLCanvasElement {
  const c = el('canvas', 'pix');
  c.width = w * scale;
  c.height = h * scale;
  c.style.width = `${w * scale}px`;
  c.style.height = `${h * scale}px`;
  return c;
}

function setTitle(set: SpriteSetDef): string {
  const kind = set.kind[0]?.toUpperCase() + set.kind.slice(1);
  return set.view ? `${kind} · facing ${set.view}` : kind;
}

export function startSpriteGallery(root: HTMLElement): void {
  document.title = 'Sealbreak · sprite gallery';
  document.body.classList.add('gallery-page');
  const page = el('main', 'gallery');
  root.appendChild(page);

  const header = el('header', 'gallery-head');
  header.appendChild(el('h1', undefined, 'Sprite gallery'));
  const note = el('p', 'gallery-note');
  header.appendChild(note);
  const controls = el('div', 'gallery-controls');
  const pause = el('button', undefined, 'Pause');
  const speed = el('select');
  for (const s of [0.25, 0.5, 1, 2]) {
    const o = el('option', undefined, `${s}× speed`);
    o.value = String(s);
    if (s === 1) o.selected = true;
    speed.appendChild(o);
  }
  const back = el('a', undefined, 'Back to the game');
  back.href = './';
  controls.append(pause, speed, back);
  header.appendChild(controls);
  page.appendChild(header);

  const players: Player[] = [];
  let builtMs = 0;
  let frames = 0;

  const addPlayer = (sheet: SpriteSheet, anim: AnimDef, scale: number, bg: string, silhouette = false): HTMLCanvasElement => {
    const c = makeCanvas(sheet.frameWidth, sheet.frameHeight, scale);
    players.push({ canvas: c, sheet, anim, scale, bg, last: -1, silhouette });
    return c;
  };

  // Silhouette test: every party member's field sprite in solid black.
  const sil = el('section', 'gallery-section');
  sil.appendChild(el('h2', undefined, 'Silhouette test'));
  sil.appendChild(el('p', 'gallery-note', 'Field sprites in solid black at 1× and 4×. Every party member should be easy to tell apart.'));
  for (const scale of [1, 4]) {
    const row = el('div', 'sil-row');
    for (const view of ['down', 'left', 'right', 'up'] as const) {
      for (const ch of ALL_CHARACTERS) {
        const set = ch.sets().find((s) => s.kind === 'field' && s.view === view);
        if (!set) continue;
        const sheet = getSheet(set);
        const idle = set.anims.find((a) => a.name === 'idle');
        if (!idle) continue;
        const fig = el('figure', 'sil');
        fig.appendChild(addPlayer(sheet, idle, scale, BACKGROUNDS.light, true));
        fig.appendChild(el('figcaption', undefined, scale === 4 ? `${ch.name}, ${view}` : ''));
        row.appendChild(fig);
      }
    }
    sil.appendChild(row);
  }
  page.appendChild(sil);

  for (const ch of ALL_CHARACTERS) {
    const section = el('section', 'gallery-section');
    section.appendChild(el('h2', undefined, ch.name));
    for (const set of ch.sets()) {
      const sheet = getSheet(set);
      builtMs += sheet.buildMs;
      frames += set.anims.reduce((n, a) => n + a.frames.length, 0);
      section.appendChild(el('h3', undefined, `${setTitle(set)} — ${set.rig.width}×${set.rig.height}`));
      const grid = el('div', 'anim-grid');
      for (const a of set.anims) {
        const card = el('article', 'anim-card');
        card.appendChild(el('h4', undefined, `${a.name} · ${a.frames.length} frames${a.loop ? '' : ' · once'}`));
        const small = el('div', 'anim-row');
        small.append(addPlayer(sheet, a, 1, BACKGROUNDS.light), addPlayer(sheet, a, 1, BACKGROUNDS.dark));
        const big = el('div', 'anim-row');
        big.append(addPlayer(sheet, a, 4, BACKGROUNDS.light), addPlayer(sheet, a, 4, BACKGROUNDS.dark));
        const strip = el('div', 'anim-row strip');
        a.frames.forEach((_, i) => {
          const c = makeCanvas(sheet.frameWidth, sheet.frameHeight, 2);
          const g = c.getContext('2d');
          if (g) {
            g.imageSmoothingEnabled = false;
            g.fillStyle = BACKGROUNDS.light;
            g.fillRect(0, 0, c.width, c.height);
            drawFrame(g, sheet, a.name, i, 0, 0, 2);
          }
          strip.appendChild(c);
        });
        card.append(small, big, strip);
        grid.appendChild(card);
      }
      section.appendChild(grid);
    }
    page.appendChild(section);
  }
  note.textContent = `${frames} frames from ${ALL_CHARACTERS.length} characters, rendered in ${builtMs.toFixed(0)} ms. Everything is drawn in code.`;

  // One animation clock for every preview.
  let paused = false;
  let rate = 1;
  let clock = 0;
  let lastNow = performance.now();
  pause.addEventListener('click', () => {
    paused = !paused;
    pause.textContent = paused ? 'Play' : 'Pause';
  });
  speed.addEventListener('change', () => {
    rate = Number(speed.value) || 1;
  });

  const tick = (now: number): void => {
    if (!paused) clock += (now - lastNow) * rate;
    lastNow = now;
    for (const p of players) {
      const f = frameAt(p.anim, clock);
      if (f === p.last) continue;
      p.last = f;
      const g = p.canvas.getContext('2d');
      if (!g) continue;
      g.imageSmoothingEnabled = false;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = p.bg;
      g.fillRect(0, 0, p.canvas.width, p.canvas.height);
      if (p.silhouette) {
        // Draw the sprite, then fill everything it covers with black.
        g.clearRect(0, 0, p.canvas.width, p.canvas.height);
        drawFrame(g, p.sheet, p.anim.name, f, 0, 0, p.scale);
        g.globalCompositeOperation = 'source-in';
        g.fillStyle = '#000';
        g.fillRect(0, 0, p.canvas.width, p.canvas.height);
        g.globalCompositeOperation = 'destination-over';
        g.fillStyle = p.bg;
        g.fillRect(0, 0, p.canvas.width, p.canvas.height);
        g.globalCompositeOperation = 'source-over';
      } else {
        drawFrame(g, p.sheet, p.anim.name, f, 0, 0, p.scale);
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
