/**
 * Town NPCs, assembled from shared body, hair, coat and accessory parts
 * (design section 13.1). Each spec gives a field sprite in four directions
 * with a two-frame idle and a six-frame walk. Named recipients get their own
 * touches through extras.
 */
import { manual, type Material, ramp } from '../palette';
import type { BoneDef, DetailDef, PartDef, Pose, Rig, ShapeContext } from '../rig';
import { capsule, ellipse, limb, path, poly, roundRect, type Shape } from '../shapes';
import { anim, type CharacterSprites, type Facing, SPRITE_SIZES, type SpriteSetDef } from '../types';
import { WALK6 } from './kit';

export type Build = 'average' | 'stout' | 'slim' | 'child' | 'tall';
export type HairStyle = 'short' | 'bald' | 'bun' | 'curly' | 'long' | 'tied';
export type TopStyle = 'jacket' | 'long' | 'dress' | 'shirt';
export type HatStyle = 'flatcap' | 'bonnet' | 'tophat' | 'baker' | 'kerchief';
export type Extra = 'beard' | 'moustache' | 'glasses' | 'sash' | 'chain' | 'shawl' | 'flour' | 'toolbelt' | 'stoop' | 'stubble' | 'scar' | 'sign' | 'patches' | 'badge' | 'ledger' | 'clipboard';

export interface FolkSpec {
  id: string;
  name: string;
  build: Build;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  topStyle: TopStyle;
  bottom: string;
  skirt?: boolean;
  shoes: string;
  hat?: { style: HatStyle; colour: string };
  apron?: string;
  accent?: string;
  extras?: Extra[];
}

function skinRamp(base: string): Material {
  return ramp('skin', base, { step: 0.07, hueShift: 6 });
}

function materials(s: FolkSpec): Record<string, Material> {
  return {
    skin: skinRamp(s.skin),
    hair: ramp('hair', s.hair, { step: 0.075 }),
    top: ramp('top', s.top, { step: 0.08 }),
    bottom: ramp('bottom', s.bottom, { step: 0.07 }),
    shoes: ramp('shoes', s.shoes, { step: 0.07 }),
    hat: ramp('hat', s.hat?.colour ?? '#555555', { step: 0.075 }),
    apron: ramp('apron', s.apron ?? '#e8e0cc', { step: 0.06 }),
    accent: ramp('accent', s.accent ?? '#b8463a', { step: 0.08 }),
    brass: manual('brass', ['#f4dc8c', '#d3a648', '#9c6e2e', '#6b4724'], '#432a19'),
    eye: manual('eye', ['#6f6a80', '#3a3546', '#252231', '#16141e'], '#0e0c14'),
    blush: manual('blush', ['#f2a28c', '#e48a78', '#c86c62', '#a2524e'], '#5a3030'),
    flour: manual('flour', ['#ffffff', '#f4efe4', '#ddd4c2', '#c2b8a4'], '#8a8070'),
    sign: manual('sign', ['#fbf6e8', '#efe4c8', '#d8c8a2', '#b0a07c'], '#5a4a34'),
  };
}

/** Body measurements per build, in pixels. */
function dims(b: Build): { body: number; chest: number; shoulder: number; waist: number; hem: number; arm: number; leg: number } {
  switch (b) {
    case 'stout':
      return { body: -15, chest: -6, shoulder: 7.4, waist: 8.2, hem: 9, arm: 7.4, leg: 2.8 };
    case 'slim':
      return { body: -16, chest: -6, shoulder: 6, waist: 5.4, hem: 7, arm: 6.2, leg: 2.4 };
    case 'child':
      return { body: -11, chest: -4.5, shoulder: 5.2, waist: 5, hem: 6, arm: 5.4, leg: 2.2 };
    case 'tall':
      return { body: -17.4, chest: -6.8, shoulder: 7.8, waist: 7, hem: 8.6, arm: 7.8, leg: 2.9 };
    default:
      return { body: -16, chest: -6, shoulder: 6.6, waist: 6.4, hem: 8, arm: 6.6, leg: 2.6 };
  }
}

function bones(s: FolkSpec, view: Facing): BoneDef[] {
  const side = view === 'left' || view === 'right';
  const d = dims(s.build);
  const stoop = s.extras?.includes('stoop') ? (side ? -7 : 0) : 0;
  return [
    { name: 'root', x: 16, y: 46 },
    { name: 'body', parent: 'root', x: 0, y: d.body },
    { name: 'chest', parent: 'body', x: side ? -0.5 : 0, y: d.chest, rot: stoop },
    { name: 'head', parent: 'chest', x: side ? -0.5 : 0, y: s.build === 'child' ? -4 : -5 },
    { name: 'armR', parent: 'chest', x: side ? 1 : -d.arm, y: s.build === 'child' ? -2.4 : -3 },
    { name: 'armL', parent: 'chest', x: side ? 0 : d.arm, y: s.build === 'child' ? -2.4 : -3 },
    { name: 'footR', parent: 'root', x: side ? 0 : -2.6, y: 0 },
    { name: 'footL', parent: 'root', x: side ? 0 : 2.6, y: 0 },
    { name: 'hem', parent: 'body', x: 0, y: 0 },
  ];
}

function headShape(side: boolean): Shape {
  return side
    ? [...ellipse(0, -6.2, 5.8, 5.9), ...ellipse(-5.5, -4.6, 1.0, 1.0)]
    : [...ellipse(0, -6.2, 6.1, 5.9), ...ellipse(-5.9, -5.4, 1.1, 1.4), ...ellipse(5.9, -5.4, 1.1, 1.4)];
}

function hairShape(style: HairStyle, view: Facing): Shape | null {
  const side = view === 'left' || view === 'right';
  const back = view === 'up';
  if (style === 'bald') {
    return side ? path('M 1.6 -9 Q 5.6 -9.4 6.2 -5 L 5.6 -2.6 L 2.6 -3.4 Z') : back ? path('M -6.4 -7 Q 0 -6 6.4 -7 L 6 -3 Q 0 -2 -6 -3 Z') : path('M -6.6 -7 L -5.4 -7 L -5.4 -3 L -6.4 -3.6 Z M 6.6 -7 L 5.4 -7 L 5.4 -3 L 6.4 -3.6 Z');
  }
  const longBack = style === 'long' || style === 'curly';
  if (back) {
    return longBack ? path('M -7 -6 Q -7.2 -13 0 -13 Q 7.2 -13 7 -6 L 6.8 0.4 Q 0 1.4 -6.8 0.4 Z') : path('M -6.6 -6 Q -6.8 -12.6 0 -12.6 Q 6.8 -12.6 6.6 -6 L 6.2 -2.4 Q 0 -1.4 -6.2 -2.4 Z');
  }
  if (side) {
    return longBack
      ? path('M -5.8 -7.2 Q -5.8 -12.8 0.6 -12.8 Q 6.8 -12.6 6.6 -5 L 6.4 0.4 Q 4 1 2.4 0 L 2.2 -6 L -1.6 -8.2 L -4.6 -7.4 Z')
      : path('M -5.8 -7.2 Q -5.6 -12.6 0.6 -12.6 Q 6.6 -12.4 6.4 -6 L 5.8 -2.6 Q 4 -2 2.6 -3 L 2.4 -6.4 L -1.6 -8 L -4.6 -7.6 Z');
  }
  if (style === 'curly') {
    return [...ellipse(0, -10.4, 7.4, 3.6), ...ellipse(-6.4, -6.4, 2.2, 3.4), ...ellipse(6.4, -6.4, 2.2, 3.4)];
  }
  return longBack
    ? path('M -6.8 -2 Q -7.4 -12.8 0 -12.8 Q 7.4 -12.8 6.8 -2 L 6.6 0.4 L 5.2 -1 L 5.0 -7.4 L 2 -8.6 L -2 -8.6 L -5 -7.4 L -5.2 -1 L -6.6 0.4 Z')
    : path('M -6.8 -5.6 Q -7 -12.6 0 -12.6 Q 7 -12.6 6.8 -5.6 L 6.2 -3.6 L 5.2 -6.4 L 2.4 -8.4 L -0.4 -7.8 L -3 -8.4 L -5.2 -6.6 L -6.2 -3.6 Z');
}

function hatParts(s: FolkSpec, view: Facing): PartDef[] {
  const h = s.hat;
  if (!h) return [];
  const side = view === 'left' || view === 'right';
  const back = view === 'up';
  const z = 12;
  switch (h.style) {
    case 'tophat':
      return [
        { name: 'hatBrim', bone: 'head', z, material: 'hat', shape: side ? ellipse(0, -11.6, 7.2, 1.4) : ellipse(0, -11.6, 7.6, 1.6), shade: { shadow: 1, light: 1 }, cast: 2 },
        { name: 'hatCrown', bone: 'head', z: z + 0.1, material: 'hat', shape: roundRect(-4.6, -18, 9.2, 6.8, 1), shade: { shadow: 2, light: 1 }, marks: [{ tone: 3, shape: poly(-4.6, -13.4, 4.6, -13.4, 4.6, -12, -4.6, -12) }] },
      ];
    case 'flatcap':
      return [
        { name: 'hat', bone: 'head', z, material: 'hat', shape: side ? path('M -8.6 -9 Q -6 -10.4 -2 -10.6 Q -1 -13.6 2 -13.6 Q 6.8 -13.4 6.8 -9 Z') : back ? path('M -6.8 -9 Q -6.8 -13.6 0 -13.6 Q 6.8 -13.6 6.8 -9 Z') : path('M -6.8 -8.6 Q -6.8 -13.6 0 -13.6 Q 6.8 -13.6 6.8 -8.6 Q 0 -7.4 -6.8 -8.6 Z'), shade: { shadow: 1, light: 1 }, cast: 2 },
      ];
    case 'bonnet':
      return [
        { name: 'hat', bone: 'head', z, material: 'hat', shape: side ? path('M -6.4 -4 Q -7 -13.6 1 -13.6 Q 7.6 -13 7 -4 L 4 -4 L 2 -8 L -3.6 -8.6 Z') : back ? path('M -7.4 -4 Q -7.6 -14 0 -14 Q 7.6 -14 7.4 -4 Z') : path('M -7.6 -3 Q -8 -14 0 -14 Q 8 -14 7.6 -3 L 6 -3 Q 5.6 -9.4 0 -9.4 Q -5.6 -9.4 -6 -3 Z'), shade: { shadow: 1, light: 1 }, cast: 2 },
      ];
    case 'baker':
      return [
        { name: 'hat', bone: 'head', z, material: 'apron', shape: [...ellipse(0, -14, 6.2, 3.8), ...roundRect(-5.4, -13, 10.8, 4.4, 1)], shade: { shadow: 1, light: 1 }, cast: 1 },
      ];
    case 'kerchief':
      return [
        { name: 'hat', bone: 'head', z, material: 'hat', shape: side ? path('M -5.4 -8.4 Q -5 -13 0.6 -13 Q 6.6 -12.8 6.4 -7 L 7.6 -4 L 4 -6 L -1 -9 Z') : back ? path('M -6.8 -7 Q -7 -13 0 -13 Q 7 -13 6.8 -7 L 1.6 -4 L 0 -2.6 L -1.6 -4 Z') : path('M -6.8 -7.6 Q -7 -13 0 -13 Q 7 -13 6.8 -7.6 Q 0 -9 -6.8 -7.6 Z'), shade: { shadow: 1, light: 1 }, cast: 1 },
      ];
  }
}

function parts(s: FolkSpec, view: Facing): PartDef[] {
  const front = view === 'down';
  const back = view === 'up';
  const side = !front && !back;
  const d = dims(s.build);
  const out: PartDef[] = [];
  const legLen = s.build === 'child' ? 2 : 3;

  for (const leg of ['L', 'R'] as const) {
    const sgn = leg === 'L' ? 1 : -1;
    const near = leg === 'L';
    if (!s.skirt) {
      out.push({
        name: `leg${leg}`,
        bone: 'body',
        z: side ? (near ? 1.5 : 0.5) : 1,
        material: 'bottom',
        shape: (c: ShapeContext) => {
          const [hx, hy] = c.p('body', side ? 0.5 : sgn * (d.leg - 0.2), legLen);
          const [fx, fy] = c.p(`foot${leg}`, side ? 0.2 : 0, -2.6);
          return capsule(hx, hy, d.leg, fx, fy, d.leg * 0.8);
        },
        shade: { shadow: 1, light: 1 },
      });
    }
    out.push({
      name: `shoe${leg}`,
      bone: `foot${leg}`,
      z: side ? (near ? 2.5 : 0.6) : 2,
      material: 'shoes',
      shape: side ? path('M -3.4 0.2 L -3.5 -1.4 Q -3 -2.8 -1 -3 L 2.2 -3 L 2.4 0.2 Z') : roundRect(-2.2, -2.8, 4.4, 3.0, 1.2),
      shade: { shadow: 1, light: 1 },
    });
  }

  if (s.skirt) {
    out.push({
      name: 'skirt',
      bone: 'hem',
      z: 3,
      material: 'bottom',
      shape: side ? path(`M -${d.waist - 1.4} -1 L ${d.waist - 1} -1 L ${d.hem + 0.6} 13.6 L -${d.hem - 0.4} 13.6 Z`) : path(`M -${d.waist} -1 L ${d.waist} -1 L ${d.hem + 1} 13.6 L -${d.hem + 1} 13.6 Z`),
      shade: { shadow: 2, light: 1 },
      marks: front ? [{ tone: 2, shape: poly(-2.4, 4, -1.8, 4, -2.8, 13.6, -3.4, 13.6) }] : [],
    });
  }

  // Torso and coat.
  const sh = d.shoulder;
  const w = d.waist;
  const bottomY = s.topStyle === 'long' ? 9 : s.topStyle === 'dress' ? 1.4 : s.topStyle === 'shirt' ? 1 : 4.4;
  const sideW = Math.max(4.4, w - 1.6);
  const childShift = s.build === 'child' ? 3 : 0;
  const top = -11.4 + childShift;
  const torso = side
    ? `M ${-(sideW - 0.8)} ${top} L ${sideW - 0.8} ${top} Q ${sideW + 1} ${top + 0.4} ${sideW + 1} ${top + 3.4} L ${sideW + 1.2} ${bottomY} L ${-sideW} ${bottomY} L ${-sideW} ${top + 3.4} Q ${-sideW} ${top + 0.4} ${-(sideW - 0.8)} ${top} Z`
    : `M ${-(sh - 2.2)} ${top} L ${sh - 2.2} ${top} Q ${sh + 0.6} ${top + 0.4} ${sh + 0.6} ${top + 3.4} L ${w + 0.4} ${bottomY - 3} L ${w + 1} ${bottomY} L ${-(w + 1)} ${bottomY} L ${-(w + 0.4)} ${bottomY - 3} L ${-(sh + 0.6)} ${top + 3.4} Q ${-(sh + 0.6)} ${top + 0.4} ${-(sh - 2.2)} ${top} Z`;
  out.push({
    name: 'torso',
    bone: 'body',
    z: 5,
    material: 'top',
    shape: path(torso),
    shade: { shadow: side ? 2 : 3, light: 1 },
    marks:
      front && s.topStyle !== 'dress'
        ? [{ tone: 3, shape: poly(-0.3, -6 + childShift, 0.5, -6 + childShift, 0.5, bottomY, -0.3, bottomY) }]
        : back
          ? [{ tone: 2, shape: poly(-0.4, -8 + childShift, 0.4, -8 + childShift, 0.4, bottomY, -0.4, bottomY) }]
          : [],
  });
  if (s.build === 'stout') {
    out.push({
      name: 'belly',
      bone: 'body',
      z: 5.2,
      material: 'top',
      shape: side ? ellipse(-3.6, -2, 4.4, 5) : ellipse(0, -1.6, 7.4, 5.4),
      shade: { shadow: 2, light: 1 },
      sep: false,
      cast: 0,
    });
  }
  if (s.apron && !back) {
    out.push({
      name: 'apron',
      bone: 'body',
      z: 5.6,
      material: 'apron',
      shape: side ? poly(-sideW - 1.4, -8 + childShift, -sideW + 0.8, -8 + childShift, -sideW + 1.4, 8, -sideW - 2.6, 8) : poly(-4.4, -8 + childShift, 4.4, -8 + childShift, 5.4, 8, -5.4, 8),
      shade: { shadow: 1, light: 1 },
      cast: 0,
    });
  }
  if (s.extras?.includes('shawl')) {
    out.push({
      name: 'shawl',
      bone: 'chest',
      z: 6,
      material: 'accent',
      shape: side ? path('M -4.6 -6 L 4.6 -6 Q 5.6 -2 4 2 L -2 1 Q -5 -2 -4.6 -6 Z') : back ? path('M -7 -6 L 7 -6 L 0 4.4 Z') : path('M -7 -6 L 7 -6 Q 7.6 -2 5.6 0 L 0 3 L -5.6 0 Q -7.6 -2 -7 -6 Z'),
      shade: { shadow: 1, light: 1 },
      cast: 1,
    });
  }
  if (s.extras?.includes('sash') && !back) {
    out.push({
      name: 'sash',
      bone: 'body',
      z: 6.2,
      material: 'accent',
      shape: side ? poly(-sideW, -10 + childShift, -sideW + 2, -10 + childShift, -sideW + 2, -2, -sideW, -2) : poly(-sh + 1, -11 + childShift, -sh + 3.4, -11 + childShift, w - 0.4, 1, w - 2.8, 1),
      shade: { shadow: 1, light: 1 },
      thin: true,
      cast: 0,
    });
  }
  if (s.extras?.includes('toolbelt')) {
    out.push({
      name: 'toolbelt',
      bone: 'body',
      z: 6.3,
      material: 'shoes',
      shape: side ? poly(-sideW - 0.4, -1.6, sideW + 1.4, -1.6, sideW + 1.4, 0.4, -sideW - 0.4, 0.4) : poly(-w - 0.4, -1.6, w + 0.4, -1.6, w + 0.4, 0.4, -w - 0.4, 0.4),
      shade: { shadow: 1, light: 1, dir: [0, 1] },
      cast: 0,
    });
  }

  // Arms.
  const arm = (side2: 'L' | 'R', z: number, lean: number): PartDef[] => {
    const bone = `arm${side2}`;
    const len = s.build === 'child' ? 0.8 : 1;
    return [
      {
        name: `sleeve${side2}`,
        bone,
        z,
        material: 'top',
        shape: limb([
          [0, 0.5, s.build === 'stout' ? 2.6 : 2.3],
          [lean * 0.8, 6.6 * len, 2.0],
        ]),
        shade: { shadow: 1, light: 1 },
      },
      {
        name: `hand${side2}`,
        bone,
        z: z + 0.2,
        material: 'skin',
        shape: capsule(lean * 0.9, 8.4 * len, 1.3, lean * 1.0, 9.8 * len, 1.5),
        shade: { shadow: 1, light: 0 },
        cast: 0,
      },
    ];
  };
  if (side) out.push(...arm('R', 3.5, -0.3), ...arm('L', 8, -0.3));
  else out.push(...arm('R', 8, -1), ...arm('L', 8, 1));

  // The toll-gate sign, slung on the back.
  if (s.extras?.includes('sign')) {
    const board = back ? roundRect(-6, -10, 12, 13, 1) : side ? roundRect(-sideW - 3.4, -11, 3, 13, 0.6) : roundRect(-8.6, -11, 3, 7, 0.6);
    out.push({ name: 'sign', bone: 'body', z: back ? 9 : 2.4, material: 'sign', shape: board, shade: { shadow: 1, light: 1 }, cast: 1 });
    if (back) {
      out.push({ name: 'signStripe', bone: 'body', z: 9.1, material: 'accent', shape: [...poly(-6, -7, 6, -4, 6, -2, -6, -5), ...poly(-6, -1, 6, 2, 6, 3, -6, 0)], clipTo: ['sign'], shade: { shadow: 1, light: 0 }, cast: 0, sep: false, outline: false });
    }
  }
  if ((s.extras?.includes('ledger') || s.extras?.includes('clipboard')) && !back) {
    const clip = s.extras.includes('clipboard');
    out.push({ name: 'book', bone: side ? 'armL' : 'armR', z: side ? 8.6 : 8.4, material: clip ? 'sign' : 'accent', shape: roundRect(-2.6, 6, 5.2, 6, 0.6), shade: { shadow: 1, light: 1 }, cast: 0 });
  }

  // Head.
  out.push({ name: 'head', bone: 'head', z: 10, material: 'skin', shape: headShape(side), shade: { shadow: 1, light: 1 } });
  const hs = hairShape(s.hairStyle, view);
  if (hs) out.push({ name: 'hair', bone: 'head', z: 11, material: 'hair', shape: hs, shade: { shadow: 1, light: 1 }, cast: 1 });
  if (s.hairStyle === 'bun') {
    out.push({ name: 'bun', bone: 'head', z: back ? 12 : 9.5, material: 'hair', shape: side ? ellipse(4.4, -12, 3, 2.6) : ellipse(0, -13.2, 3.2, 2.4), shade: { shadow: 1, light: 1 }, cast: 1 });
  }
  if (s.hairStyle === 'tied' && !front) {
    out.push({ name: 'tail', bone: 'head', z: back ? 12 : 9.5, material: 'hair', shape: side ? capsule(6, -7, 1.6, 7.4, -1, 1.2) : capsule(0, -6, 1.8, 0, 0, 1.4), shade: { shadow: 1, light: 1 } });
  }
  if (s.extras?.includes('beard') && !back) {
    out.push({ name: 'beard', bone: 'head', z: 10.6, material: 'hair', shape: side ? path('M -5.6 -3.6 Q -5 -0.4 -1 -0.4 L 2 -2.6 L 1.6 -5 Z') : path('M -5.2 -4.4 Q -5 0.4 0 0.6 Q 5 0.4 5.2 -4.4 L 3 -3 Q 0 -2 -3 -3 Z'), shade: { shadow: 1, light: 1 }, cast: 0 });
  }
  out.push(...hatParts(s, view));
  return out;
}

/** Keeps only clip targets this spec actually has. */
function clipTo(s: FolkSpec, names: string[]): string[] {
  return names.filter((n) => (n === 'belly' ? s.build === 'stout' : n === 'sash' ? !!s.extras?.includes('sash') : n === 'apron' ? !!s.apron : true));
}

function details(s: FolkSpec, view: Facing): DetailDef[] {
  const d: DetailDef[] = [];
  const glasses = s.extras?.includes('glasses');
  const moustache = s.extras?.includes('moustache');
  if (view === 'down') {
    d.push({
      name: 'face',
      bone: 'head',
      x: -4,
      y: -7,
      grid: glasses ? ['bbb...bbb', '.a.....a.', 'c.......c', moustache ? '...hhh...' : '....m....'] : ['.........', '.a.....a.', 'c.......c', moustache ? '...hhh...' : '....m....'],
      key: { a: 'eye:o', b: 'brass:2', c: 'blush:1', m: 'skin:3', h: 'hair:2' },
      clip: ['head'],
    });
    if (s.extras?.includes('chain')) {
      d.push({ name: 'chain', bone: 'body', x: -4, y: -10, grid: ['a.......a', '.a.....a.', '..a...a..', '...aba...'], key: { a: 'brass:1', b: 'brass:0' }, clip: clipTo(s, ['torso', 'belly', 'sash']) });
    }
    if (s.extras?.includes('flour')) {
      d.push({ name: 'flour', bone: 'body', x: -3, y: -4, grid: ['a...', '..a.', 'a..a', '.a..'], key: { a: 'flour:0' }, clip: clipTo(s, ['apron', 'torso']) });
    }
    if (s.topStyle === 'jacket' || s.topStyle === 'long') {
      d.push({ name: 'buttons', bone: 'body', x: -2, y: -7, grid: ['b', '.', '.', 'b'], key: { b: 'brass:1' }, clip: clipTo(s, ['torso', 'belly']) });
    }
    if (s.extras?.includes('stubble')) d.push({ name: 'stubble', bone: 'head', x: -3, y: -4, grid: ['h.h.h.h', '.h.h.h.'], key: { h: 'hair:2' }, clip: ['head'] });
    if (s.extras?.includes('scar')) d.push({ name: 'scar', bone: 'head', x: 2, y: -9, grid: ['m', 'm'], key: { m: 'skin:3' }, clip: ['head', 'hair'] });
    if (s.extras?.includes('patches')) d.push({ name: 'patches', bone: 'body', x: -6, y: -10, grid: ['tt.......tt', 'tt.......tt'], key: { t: 'top:3' }, clip: ['torso'] });
    if (s.extras?.includes('badge')) d.push({ name: 'badge', bone: 'body', x: 2, y: -8, grid: ['b'], key: { b: 'brass:0' }, clip: ['torso'] });
  } else if (view !== 'up') {
    if (s.extras?.includes('stubble')) d.push({ name: 'stubble', bone: 'head', x: -5, y: -4, grid: ['h.h', '.h.'], key: { h: 'hair:2' }, clip: ['head'] });
    d.push({
      name: 'face',
      bone: 'head',
      x: -6,
      y: -7,
      grid: glasses ? ['.bb.', '..a.', '...c', moustache ? '.hh.' : '.m..'] : ['....', '..a.', '...c', moustache ? '.hh.' : '.m..'],
      key: { a: 'eye:o', b: 'brass:2', c: 'blush:1', m: 'skin:3', h: 'hair:2' },
      clip: ['head'],
    });
  }
  return d;
}

export function folkRig(s: FolkSpec, view: Facing): Rig {
  return {
    id: `${s.id}-field-${view}`,
    ...SPRITE_SIZES.field,
    materials: materials(s),
    bones: bones(s, view),
    parts: parts(s, view),
    details: details(s, view),
    mirror: view === 'right',
  };
}

function walk(view: Facing): Pose[] {
  const side = view === 'left' || view === 'right';
  return [0, 1, 2, 3, 4, 5].map((i) => {
    const bob = WALK6.bob[i] ?? 0;
    const swing = WALK6.swing[i] ?? 0;
    const sway = WALK6.sway[i] ?? 0;
    if (!side) {
      return {
        bones: {
          body: { y: bob },
          footL: { y: -(WALK6.liftL[i] ?? 0) },
          footR: { y: -(WALK6.liftR[i] ?? 0) },
          armL: { rot: -swing * 0.25 },
          armR: { rot: -swing * 0.25 },
          hem: { rot: sway * 2 },
        },
      };
    }
    const strideL = (WALK6.strideL[i] ?? 0) * 0.8;
    return {
      bones: {
        body: { y: bob },
        footL: { x: -strideL, y: -(WALK6.liftL[i] ?? 0) },
        footR: { x: strideL, y: -(WALK6.liftR[i] ?? 0) },
        armL: { rot: swing * 0.9 },
        armR: { rot: -swing * 0.9 },
        hem: { rot: -(1 + Math.abs(sway) * 2) },
      },
    };
  });
}

export function folkSprites(s: FolkSpec): CharacterSprites {
  return {
    id: s.id,
    name: s.name,
    sets: (): SpriteSetDef[] =>
      (['down', 'left', 'right', 'up'] as Facing[]).map((view) => ({
        id: `${s.id}-field-${view}`,
        character: s.id,
        kind: 'field',
        view,
        rig: folkRig(s, view),
        anims: [anim('idle', [{}, { bones: { chest: { y: 0.6 } } }], [1100, 500]), anim('walk', walk(view), 120)],
      })),
  };
}
