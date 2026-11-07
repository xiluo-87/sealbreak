/**
 * Portraits for the rest of the cast, from parameters: 96x96 busts in the
 * same proportions as the party's hand-built portraits, sharing their eye,
 * brow and mouth grids so every expression reads the same way. Authored
 * facing left and mirrored by the pipeline.
 */
import { manual, type Material, ramp } from '../palette';
import type { DetailDef, PartDef, Rig } from '../rig';
import { capsule, ellipse, path, poly, roundRect, type Shape } from '../shapes';
import { SPRITE_SIZES, type SpriteSetDef } from '../types';
import { BROWS, EYES, FACE_KEY, MOUTHS } from './juniper/portrait';
import { faceDetails, portraitAnims, ringPixels, gridFromPixels } from './portraitKit';

export type PortraitHair = 'cropped' | 'short' | 'messy' | 'pinned' | 'bald' | 'long' | 'bun';
export type PortraitExtra = 'stubble' | 'scar' | 'moustache' | 'beard' | 'glasses' | 'epaulettes' | 'badge' | 'patches' | 'wrinkles' | 'freckles' | 'chain' | 'collar';

export interface PortraitSpec {
  id: string;
  skin: [string, string, string, string];
  hair: string;
  eye: string;
  lips: [string, string, string, string];
  coat: string;
  under: string;
  accent: string;
  metal?: 'brass' | 'silver';
  hairStyle: PortraitHair;
  hat?: { style: 'cap' | 'tophat' | 'bowler' | 'hardhat'; colour: string };
  jaw: 'square' | 'soft' | 'narrow';
  extras?: PortraitExtra[];
}

function has(s: PortraitSpec, e: PortraitExtra): boolean {
  return s.extras?.includes(e) ?? false;
}

function materials(s: PortraitSpec): Record<string, Material> {
  const skinOutline = s.skin[3];
  return {
    skin: manual('skin', s.skin, darken(skinOutline)),
    hair: ramp('hair', s.hair, { step: 0.075, outlineStep: 1.3 }),
    eye: manual('eye', [lighten(s.eye), s.eye, darken(s.eye), darken(darken(s.eye))], '#14100c'),
    white: manual('white', ['#ffffff', '#f2eee6', '#c9c6cf', '#9a98a8'], '#5d5b6e'),
    lips: manual('lips', s.lips, darken(s.lips[3])),
    coat: ramp('coat', s.coat, { step: 0.085 }),
    under: ramp('under', s.under, { step: 0.07 }),
    accent: ramp('accent', s.accent, { step: 0.08 }),
    hat: ramp('hat', s.hat?.colour ?? '#333333', { step: 0.075 }),
    metal:
      s.metal === 'silver'
        ? manual('metal', ['#f2f2f4', '#c4c6cc', '#8e9098', '#5e6068'], '#33343a')
        : manual('metal', ['#f4dc8c', '#d3a648', '#9c6e2e', '#6b4724'], '#432a19'),
    glass: manual('glass', ['#ffffff', '#d8eef0', '#a9cdd3', '#7aa3ab'], '#4a6a70'),
  };
}

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
}

function darken(h: string): string {
  const [r, g, b] = hexToRgb(h);
  return rgbToHex([r * 0.62, g * 0.6, b * 0.64]);
}

function lighten(h: string): string {
  const [r, g, b] = hexToRgb(h);
  return rgbToHex([r + (255 - r) * 0.35, g + (255 - g) * 0.35, b + (255 - b) * 0.35]);
}

function headShape(jaw: PortraitSpec['jaw']): Shape {
  const skull = ellipse(-1, -30, 20, 22);
  // Profile edge on the left: brow, nose, lips and chin, then the jaw.
  const chin =
    jaw === 'square'
      ? 'M -18.6 -36 L -20.2 -25 L -22.8 -19.4 L -20.6 -17.4 L -20 -15 L -20.4 -12.6 L -19.6 -10.4 L -18.6 -6.4 Q -15 -2.4 -9 -2.4 Q 2 -3.4 10 -11 L 16 -22 L 12 -36 Z'
      : jaw === 'narrow'
        ? 'M -18 -36 L -19.4 -25 L -21.6 -20 L -19.8 -17.6 L -19.2 -15 L -19.6 -12.6 L -18.4 -10.6 L -16.6 -7.4 Q -13 -4.4 -9 -4.6 Q -1 -6 8 -15 L 14 -24 L 10 -36 Z'
        : 'M -18.6 -36 L -20 -24 L -22 -19.6 L -20.2 -17.2 L -19.6 -15 L -20 -12.6 L -18.8 -10.6 L -17.6 -7.4 Q -15 -3.6 -11 -3.6 Q -2 -5.4 8 -14 L 15 -24 L 10 -36 Z';
  return [...skull, ...path(chin)];
}

function hairParts(s: PortraitSpec): PartDef[] {
  const capped = !!s.hat;
  const out: PartDef[] = [];
  const P = (name: string, shape: Shape, z = 6, extra: Partial<PartDef> = {}): PartDef => ({ name, bone: 'head', z, material: 'hair', shape, shade: { shadow: 3, light: 1 }, cast: 2, ...extra });
  switch (s.hairStyle) {
    case 'bald':
      out.push(P('hair', path('M 12 -44 Q 21 -40 21.6 -28 L 20.6 -18 L 17 -20 L 16 -32 Z')));
      break;
    case 'cropped':
      out.push(
        P('hair', path('M -20.4 -34 L -21.6 -40 Q -21 -53 -2 -53.4 Q 19.6 -53.6 21.6 -34 L 21.4 -20 L 18 -18 L 17 -26 L 14.6 -33 L 10 -36.4 L 7 -35 L 4 -38 L 0 -36.4 L -3 -38.6 L -7 -36.6 L -10 -38.4 L -13.6 -36 L -16 -37.6 Z'), 6, {
          marks: [
            { tone: 0, shape: poly(-14, -47, -4, -51, -3.4, -50.2, -13.4, -46.2) },
            { tone: 2, shape: poly(-8, -42, 2, -46, 2.4, -45.2, -7.6, -41.2) },
            { tone: 2, shape: poly(6, -44, 15, -40, 14.6, -39.2, 5.6, -43.2) },
            { tone: 0, shape: poly(4, -50, 12, -47, 11.6, -46.2, 3.6, -49.2) },
          ],
        }),
      );
      break;
    case 'messy':
      out.push(P('hair', path('M -23 -28 L -25 -36 L -21.6 -40 L -24 -46 L -16 -50 L -14 -56 L -6 -53 L -2 -58 L 4 -53.6 L 12 -56 L 13 -50 L 21 -48 L 19 -42 L 24 -36 L 21.4 -30 L 23 -18 L 18 -16 L 16.4 -30 L 11 -37 L 4 -40 L -4 -38 L -9 -40 L -13 -36 L -18 -35 L -20 -30 Z'), 6, { marks: [{ tone: 0, shape: poly(-12, -50, -4, -54, -3, -53, -11, -49) }] }));
      break;
    case 'pinned':
      out.push(
        P('bun', ellipse(13, -50, 8.6, 7.4), 4.6, { shade: { shadow: 2, light: 1 } }),
        P('hair', path('M -20.6 -30 Q -22.6 -52 -2 -53.6 Q 19.6 -54 21.6 -34 L 20.6 -20 L 17.2 -20 L 16 -32 L 10 -39 L 0 -41.4 L -10 -40 L -16.4 -36 Z'), 6, { marks: [{ tone: 0, shape: poly(-15, -46, 2, -51, 2.6, -50, -14.4, -45.2) }, { tone: 2, shape: poly(-6, -41, 10, -48, 10.6, -47, -5.4, -40) }] }),
      );
      break;
    case 'long':
      out.push(P('hair', path('M -22 -24 Q -24 -54 -2 -55 Q 21 -55 23 -32 L 24 4 L 14 6 L 13.4 -18 L 11 -30 L 4 -38.6 L -6 -38.6 L -14 -36 L -20 -30 Z')));
      break;
    case 'bun':
      out.push(P('bun', ellipse(16, -42, 7.4, 7), 4.6, { shade: { shadow: 2, light: 1 } }), P('hair', path('M -21 -30 Q -22.6 -53 -2 -54 Q 19.6 -54 21.6 -34 L 21 -20 L 17 -20 L 16 -32 L 11 -38 L 2 -40.6 L -8 -40 L -15 -36.6 Z')));
      break;
    default:
      out.push(P('hair', path('M -21.4 -28 Q -23 -53 -2 -54 Q 20 -54.4 22 -34 L 21.6 -18 L 17.2 -17 L 16.6 -30 L 12 -38 L 6 -39.6 L -2 -38.6 L -10 -39 L -16 -35.4 L -19.6 -31 Z')));
  }
  if (capped && s.hairStyle !== 'messy') {
    // Keep the hairline below the cap band.
    out.forEach((p) => {
      p.cut = poly(-30, -70, 30, -70, 30, -45, -30, -45);
    });
  }
  return out;
}

function hatParts(s: PortraitSpec): PartDef[] {
  const h = s.hat;
  if (!h) return [];
  const P = (name: string, shape: Shape, material = 'hat', z = 8): PartDef => ({ name, bone: 'head', z, material, shape, shade: { shadow: 2, light: 1 }, cast: 3 });
  switch (h.style) {
    case 'cap':
      return [
        P('capCrown', path('M -23 -44 Q -26 -64 -2 -66 Q 22 -66 24 -48 L 22 -42 Q 0 -46 -23 -44 Z')),
        P('capBand', path('M -23.4 -46 Q 0 -49 22.6 -44 L 22 -39.4 Q 0 -43.6 -23 -40.6 Z'), 'accent', 8.2),
        P('capPeak', path('M -24 -41 Q -34 -40 -38 -34 Q -26 -35.6 -12 -37.6 Z'), 'hat', 8.4),
      ];
    case 'tophat':
      return [P('hatBrim', ellipse(-1, -46, 27, 4.6)), P('hatCrown', roundRect(-16, -78, 31, 32, 2), 'hat', 8.2)];
    case 'bowler':
      return [P('hatBrim', ellipse(-1, -46, 26, 4.4)), P('hatCrown', ellipse(-1, -54, 18, 13), 'hat', 8.2)];
    case 'hardhat':
      return [P('hatCrown', path('M -27 -42 Q -25 -66 -1 -66 Q 23 -66 25 -42 Z'), 'metal', 8)];
  }
}

function parts(s: PortraitSpec): PartDef[] {
  const out: PartDef[] = [
    { name: 'collarBack', bone: 'chest', z: 0.5, material: 'coat', shape: path('M 6 -10 L 21 -8 Q 25 -18 23 -26 Q 17 -29 11 -27 Z'), shade: { shadow: 3, light: 1, base: 2 } },
    { name: 'neck', bone: 'neck', z: 1, material: 'skin', shape: capsule(1, -8, 7.6, 3, 4, 8.2), shade: { shadow: 2, light: 0 } },
    { name: 'under', bone: 'chest', z: 1.5, material: 'under', shape: poly(-15, -10, 11, -11, 2, 15, -10, 15), shade: { shadow: 2, light: 1 } },
    {
      name: 'coat',
      bone: 'chest',
      z: 2,
      material: 'coat',
      shape: path('M -44 14 L -41 1 Q -35 -8 -17 -10 L 15 -11 Q 36 -9 42 2 L 46 14 Z'),
      cut: poly(-13, -12, 8, -13, -1, 15, -7, 15),
      shade: { shadow: 4, light: 1 },
      marks: [
        { tone: 0, shape: poly(-14, -10.4, -12.2, -11, -5.6, 14, -7.4, 14) },
        { tone: 2, shape: poly(25, -3, 27, -3, 31, 14, 29, 14) },
        ...(has(s, 'patches') ? [{ tone: 3, shape: roundRect(-36, -4, 9, 7, 1) }, { tone: 3, shape: roundRect(26, -6, 9, 7, 1) }] : []),
      ],
    },
    { name: 'collarFront', bone: 'chest', z: 2.5, material: 'coat', shape: poly(-24, -6, -14, -11, -13, -18, -20, -16), shade: { shadow: 1, light: 2, base: 0 }, cast: 1 },
  ];
  if (has(s, 'collar')) out.push({ name: 'trim', bone: 'chest', z: 2.6, material: 'accent', shape: poly(-23, -6.6, -15, -10.2, -14.4, -12, -22, -8.6), shade: { shadow: 1, light: 1 }, cast: 0 });
  if (has(s, 'epaulettes')) {
    out.push(
      { name: 'epauletteL', bone: 'chest', z: 2.8, material: 'metal', shape: roundRect(-42, -6, 15, 5, 2), shade: { shadow: 1, light: 1 }, cast: 1 },
      { name: 'epauletteR', bone: 'chest', z: 2.8, material: 'metal', shape: roundRect(26, -8, 15, 5, 2), shade: { shadow: 1, light: 1 }, cast: 1 },
    );
  }
  out.push({ name: 'head', bone: 'head', z: 5, material: 'skin', shape: headShape(s.jaw), shade: { shadow: 2, light: 1 } });
  out.push({ name: 'ear', bone: 'head', z: 5.2, material: 'skin', shape: ellipse(16, -27, 3.4, 5), shade: { shadow: 1, light: 0, base: 2 }, cast: 0 });
  if (has(s, 'beard')) out.push({ name: 'beard', bone: 'head', z: 5.6, material: 'hair', shape: path('M -20 -20 Q -20 -2 -10 -0.6 Q 4 -1.6 13 -12 L 16 -24 L 10 -17 Q -2 -9 -12 -12 Z'), shade: { shadow: 2, light: 1 }, cast: 0 });
  if (has(s, 'moustache')) out.push({ name: 'moustache', bone: 'head', z: 5.8, material: 'hair', shape: path('M -22 -14 Q -18 -19 -11 -17 Q -6 -19 0 -15 Q -6 -14.4 -11 -15 Q -16 -13 -22 -14 Z'), shade: { shadow: 1, light: 1 }, cast: 0 });
  out.push(...hairParts(s), ...hatParts(s));
  if (has(s, 'glasses')) {
    out.push({ name: 'lensL', bone: 'head', z: 7, material: 'glass', shape: ellipse(-15, -29, 5.6, 5), shade: { shadow: 0, light: 1 }, cast: 0, sep: false });
    out.push({ name: 'lensR', bone: 'head', z: 7, material: 'glass', shape: ellipse(1, -29, 6.4, 5.4), shade: { shadow: 0, light: 1 }, cast: 0, sep: false });
  }
  return out;
}

function details(s: PortraitSpec): DetailDef[] {
  const out: DetailDef[] = faceDetails({ eyes: EYES, brows: BROWS, mouths: MOUTHS }, { bone: 'head', eyes: [-20, -32], brows: [-20, -36], mouth: [-18, -13] }, FACE_KEY, ['head']);
  const key = { s: 'skin:3', S: 'skin:2', h: 'hair:2', H: 'hair:3', m: 'metal:1', M: 'metal:0', g: 'metal:2', f: 'skin:2' };
  if (has(s, 'stubble')) {
    out.push({ name: 'stubble', bone: 'head', x: -21, y: -12, grid: ['h..h...h..h...h.h...h..h...h.', '..h...h..h..h.....h...h..h...', '.h..h...h...h.h..h..h....h...', '...h..h..h.h...h....h..h.....', '.....h...h...h..h.h..........'], key: { ...key, h: 'skin:3' }, clip: ['head'] });
  }
  if (has(s, 'scar')) out.push({ name: 'scar', bone: 'head', x: -14, y: -40, grid: ['.s', 's.', '.s', 's.', '..', '..', '..', '.s', 's.'], key, clip: ['head', 'hair'] });
  if (has(s, 'wrinkles')) out.push({ name: 'wrinkles', bone: 'head', x: -22, y: -26, grid: ['S...................S', '.S.................S.', '..........................', 'S.........................'], key, clip: ['head'] });
  if (has(s, 'freckles')) out.push({ name: 'freckles', bone: 'head', x: -20, y: -24, grid: ['f.f..f.....f..f.f', '.f..f.......f.f..'], key, clip: ['head'] });
  if (has(s, 'glasses')) {
    const g = gridFromPixels([...ringPixels(-15, -29, 6, 5.4, 'g'), ...ringPixels(1, -29, 7, 5.8, 'g'), [-8, -30, 'g'], [-7, -30, 'g'], [-9, -30, 'g']]);
    out.push({ name: 'frames', bone: 'head', ...g, key });
  }
  if (has(s, 'badge')) out.push({ name: 'badge', bone: 'chest', x: -32, y: 0, grid: ['.MM.', 'MmmM', 'MmgM', '.gg.'], key });
  if (has(s, 'chain')) out.push({ name: 'chain', bone: 'chest', x: -30, y: -4, grid: ['m...........................', '.m.......................m..', '..m.m.m.m.m.m.m.m.m.m.m.m...'], key });
  return out;
}

export function portraitRig(s: PortraitSpec): Rig {
  return {
    id: `${s.id}-portrait`,
    ...SPRITE_SIZES.portrait,
    materials: materials(s),
    bones: [
      { name: 'root', x: 50, y: 96 },
      { name: 'chest', parent: 'root', x: 0, y: -11 },
      { name: 'neck', parent: 'chest', x: 2, y: -14 },
      { name: 'head', parent: 'neck', x: 0, y: s.hat?.style === 'tophat' ? 4 : 0 },
    ],
    parts: parts(s),
    details: details(s),
    mirror: true,
  };
}

export function portraitSets(s: PortraitSpec): SpriteSetDef[] {
  return [
    {
      id: `${s.id}-portrait`,
      character: s.id,
      kind: 'portrait',
      rig: portraitRig(s),
      anims: portraitAnims((f) => (f.expr === 'sad' ? { bones: { head: { rot: 3, y: 1 } } } : f.expr === 'happy' ? { bones: { head: { rot: -2 } } } : f.expr === 'surprised' ? { bones: { head: { y: -1 } } } : {})),
    },
  ];
}
