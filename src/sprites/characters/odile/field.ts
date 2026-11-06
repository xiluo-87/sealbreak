/**
 * Odile Marsh's field sprite, 32x48, in four directions. She stoops a
 * little, carries her stamp-topped walking stick in her left hand and plants
 * it in time with her steps.
 */
import type { BoneDef, DetailDef, PartDef, Pose, Rig, ShapeContext } from '../../rig';
import { ellipse, limb, path, poly, roundRect } from '../../shapes';
import { anim, type Facing, SPRITE_SIZES, type SpriteSetDef } from '../../types';
import { WALK6 } from '../kit';
import { ODILE_MATERIALS } from './materials';

function bones(view: Facing): BoneDef[] {
  const side = view === 'left' || view === 'right';
  return [
    { name: 'root', x: 16, y: 46 },
    { name: 'body', parent: 'root', x: 0, y: -16 },
    { name: 'chest', parent: 'body', x: side ? -0.5 : 0, y: -6, rot: side ? -5 : 0 },
    { name: 'head', parent: 'chest', x: side ? -0.5 : 0, y: -4.5 },
    { name: 'armR', parent: 'chest', x: side ? 1 : -6, y: -3, rot: view === 'right' ? 28 : 0 },
    { name: 'armL', parent: 'chest', x: side ? 0 : 6, y: -3 },
    { name: 'footR', parent: 'root', x: side ? 0 : -2.5, y: 0 },
    { name: 'footL', parent: 'root', x: side ? 0 : 2.5, y: 0 },
    { name: 'hem', parent: 'body', x: 0, y: 0 },
    // Stick: held in the left hand; the bone sits where the tip meets the ground.
    { name: 'stick', parent: 'root', x: view === 'down' ? 9 : view === 'up' ? -9 : view === 'right' ? -9 : -5.5, y: 0 },
  ];
}

function arm(side: 'L' | 'R', z: number, lean: number, holdsStick: boolean): PartDef[] {
  const bone = `arm${side}`;
  const s = lean;
  return [
    {
      name: `sleeve${side}`,
      bone,
      z,
      material: 'cardigan',
      shape: limb([
        [0, 0.5, 2.5],
        [s * 0.8, 6.5, 2.3],
      ]),
      shade: { shadow: 1, light: 1 },
    },
    {
      name: `glove${side}`,
      bone,
      z: z + 0.2,
      material: holdsStick ? 'gloves' : 'gloves',
      shape: ellipse(s * 0.9, 9.4, 1.8, 1.9),
      shade: { shadow: 1, light: 1 },
      cast: 0,
    },
  ];
}

function parts(view: Facing): PartDef[] {
  const front = view === 'down';
  const back = view === 'up';
  const side = !front && !back;
  const out: PartDef[] = [];

  for (const leg of ['L', 'R'] as const) {
    const near = leg === 'L';
    out.push({
      name: `boot${leg}`,
      bone: `foot${leg}`,
      z: side ? (near ? 2.5 : 0.6) : 2,
      material: 'boots',
      shape: side ? path('M -3.4 0.2 L -3.5 -1.4 Q -3 -2.8 -1 -3 L 2.4 -3 L 2.6 0.2 Z') : roundRect(-2.2, -3, 4.4, 3.2, 1.3),
      shade: { shadow: 1, light: 1 },
    });
  }

  // Long skirt: A-line from the waist to the ankles.
  out.push({
    name: 'skirt',
    bone: 'hem',
    z: 3,
    material: 'skirt',
    shape: side ? path('M -4.4 -1 L 4.6 -1 L 6.8 13.4 L -6.2 13.4 Z') : path('M -5.6 -1 L 5.6 -1 L 8 13.4 L -8 13.4 Z'),
    shade: { shadow: 2, light: 1 },
    marks: front
      ? [
          { tone: 2, shape: poly(-3.0, 4, -2.4, 4, -3.4, 13.4, -4.0, 13.4) },
          { tone: 2, shape: poly(2.6, 4, 3.2, 4, 4.4, 13.4, 3.8, 13.4) },
        ]
      : [{ tone: 2, shape: poly(0.2, 3, 0.8, 3, 1.6, 13.4, 1.0, 13.4) }],
  });

  // Blouse front shows between the open cardigan.
  if (front) {
    out.push({
      name: 'blouse',
      bone: 'chest',
      z: 4,
      material: 'blouse',
      shape: poly(-2.6, -5.8, 2.6, -5.8, 1.8, 6.2, -1.8, 6.2),
      shade: { shadow: 1, light: 1 },
    });
  }

  // Cardigan: long, open at the front, to the knee.
  const cardi = side
    ? 'M -3.6 -11 L 3.4 -11 Q 5.6 -10.6 5.8 -7.4 L 6.6 3 L 7.2 9.4 L -5.4 9.4 L -5.2 -7.4 Q -5.4 -10.6 -3.6 -11 Z'
    : 'M -4.4 -11 L 4.4 -11 Q 7.2 -10.6 7.2 -7.4 L 7.6 3 L 8.4 9.4 L -8.4 9.4 L -7.6 3 L -7.2 -7.4 Q -7.2 -10.6 -4.4 -11 Z';
  out.push({
    name: 'cardigan',
    bone: 'body',
    z: 5,
    material: 'cardigan',
    shape: path(cardi),
    cut: front ? poly(-2.0, -11.5, 2.0, -11.5, 1.2, 10, -1.2, 10) : undefined,
    shade: { shadow: side ? 2 : 3, light: 1 },
    marks: front
      ? [
          { tone: 3, shape: poly(-2.6, -11, -2.0, -11, -1.4, 9.4, -2.0, 9.4) },
          { tone: 3, shape: poly(2.0, -11, 2.6, -11, 2.0, 9.4, 1.4, 9.4) },
          { tone: 2, shape: poly(-8.4, 8.4, 8.4, 8.4, 8.4, 9.4, -8.4, 9.4) },
        ]
      : back
        ? [{ tone: 2, shape: poly(-8.4, 8.4, 8.4, 8.4, 8.4, 9.4, -8.4, 9.4) }]
        : [
            { tone: 3, shape: poly(-5.6, -8, -4.8, -8, -4.6, 9.4, -5.4, 9.4) },
            { tone: 2, shape: poly(-5.4, 8.4, 7.2, 8.4, 7.2, 9.4, -5.4, 9.4) },
          ],
  });
  if (side) {
    // A sliver of blouse and skirt at the open front edge.
    out.push({
      name: 'blouse',
      bone: 'chest',
      z: 4,
      material: 'blouse',
      shape: poly(-5.6, -5.4, -4.4, -5.4, -4.2, 5.8, -5.6, 5.8),
      shade: { flat: true },
    });
  }

  // Stick: from its tip on the ground up through the left hand, brass stamp on top.
  // From behind and facing right, her left hand is the screen-left or far one.
  const stickZ = view === 'right' ? 1.5 : 9;
  const stickArm = back || view === 'right' ? 'armR' : 'armL';
  const leanL = side ? -0.6 : back ? -1 : 1;
  const stickLine = (c: ShapeContext, extra: number): { g: [number, number]; t: [number, number]; ux: number; uy: number } => {
    const g = c.p('stick');
    const h = c.p(stickArm, leanL * 0.9, 9.4);
    const dx = h[0] - g[0];
    const dy = h[1] - g[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    return { g, t: [h[0] + ux * extra, h[1] + uy * extra], ux, uy };
  };
  out.push({
    name: 'stick',
    bone: 'stick',
    z: stickZ,
    material: 'wood',
    shape: (c) => {
      const { g, t, ux, uy } = stickLine(c, 2.2);
      const nx = -uy * 0.7;
      const ny = ux * 0.7;
      return poly(g[0] - nx, g[1] - ny, g[0] + nx, g[1] + ny, t[0] + nx, t[1] + ny, t[0] - nx, t[1] - ny);
    },
    shade: { shadow: 1, light: 0, dir: [1, 0] },
    thin: true,
  });
  out.push({
    name: 'stamp',
    bone: 'stick',
    z: stickZ + 0.1,
    material: 'brass',
    shape: (c) => {
      const { t } = stickLine(c, 3.2);
      return [...roundRect(t[0] - 1.8, t[1] - 1.1, 3.6, 2.2, 0.5), ...ellipse(t[0], t[1] - 2.0, 1.2, 1.2)];
    },
    shade: { shadow: 1, light: 1 },
    cast: 0,
  });

  if (side) {
    out.push(...arm('R', 2, -0.3, false), ...arm('L', 8, -0.6, true));
  } else {
    out.push(...arm('R', 8, -1, false), ...arm('L', 8, 1, true));
  }

  // Head, hair and bun.
  out.push({
    name: 'head',
    bone: 'head',
    z: 10,
    material: 'skin',
    shape: side
      ? [...ellipse(0, -6.2, 5.8, 5.9), ...ellipse(-5.5, -4.6, 1.0, 1.0)]
      : [...ellipse(0, -6.2, 6.2, 5.9), ...ellipse(-6.0, -5.4, 1.1, 1.4), ...ellipse(6.0, -5.4, 1.1, 1.4)],
    shade: { shadow: 1, light: 1 },
  });
  out.push({
    name: 'hair',
    bone: 'head',
    z: 11,
    material: 'hair',
    shape: back
      ? path('M -6.6 -6 Q -6.8 -12.6 0 -12.8 Q 6.8 -12.6 6.6 -6 L 6 -2.6 Q 3 -1.6 0 -1.8 Q -3 -1.6 -6 -2.6 Z')
      : side
        ? path('M -6.2 -7.2 Q -6 -12.8 0.6 -12.8 Q 6.6 -12.6 6.4 -6 L 5.8 -3 Q 4 -2.2 2.6 -3.2 L 2.2 -6.4 L -1.6 -7.8 L -4.2 -7.4 L -5.6 -6.2 Z')
        : path('M -6.8 -5.4 Q -7 -12.6 0 -12.6 Q 7 -12.6 6.8 -5.4 L 6 -3.6 L 5.2 -7 L 2.2 -9 L 0 -8.2 L -2.2 -9 L -5.2 -7 L -6 -3.6 Z'),
    shade: { shadow: 1, light: 1 },
    cast: 1,
  });
  out.push({
    name: 'bun',
    bone: 'head',
    z: back ? 12 : 9.5,
    material: 'hair',
    shape: side ? ellipse(4.6, -12.4, 3.4, 3.0) : ellipse(0, -13.4, 3.6, 2.8),
    shade: { shadow: 1, light: 1 },
    cast: 1,
  });
  return out;
}

function details(view: Facing): DetailDef[] {
  const d: DetailDef[] = [];
  if (view === 'down') {
    d.push(
      {
        name: 'face',
        bone: 'head',
        x: -5,
        y: -7,
        grid: ['.ggg...ggg.', '.lag.g.lag.', 'c.........c', '.....m.....'],
        key: { g: 'brass:2', l: 'glass:0', a: 'eye:o', c: 'blush:1', m: 'skin:3' },
        clip: ['head'],
        unless: 'blink',
      },
      {
        name: 'blink',
        bone: 'head',
        x: -5,
        y: -7,
        grid: ['.ggg...ggg.', '.lsg.g.lsg.', 'c.........c', '.....m.....'],
        key: { g: 'brass:2', l: 'glass:0', s: 'skin:3', c: 'blush:1', m: 'skin:3' },
        clip: ['head'],
        when: 'blink',
      },
      {
        name: 'braid',
        bone: 'head',
        x: -2,
        y: -15,
        grid: ['.a.a', 'a.a.'],
        key: { a: 'hair:3' },
        clip: ['bun'],
      },
      {
        name: 'buttons',
        bone: 'body',
        x: -3,
        y: -8,
        grid: ['a....a', '......', '......', 'a....a'],
        key: { a: 'cardigan:0' },
        clip: ['cardigan'],
      },
      {
        name: 'ink',
        bone: 'armR',
        x: -2,
        y: 10,
        grid: ['ab'],
        key: { a: 'inkStain:1', b: 'skin:1' },
        clip: ['gloveR'],
      },
      {
        name: 'fingersL',
        bone: 'armL',
        x: 0,
        y: 10,
        grid: ['bb'],
        key: { b: 'skin:1' },
        clip: ['gloveL'],
      },
    );
  } else if (view === 'up') {
    d.push({
      name: 'strands',
      bone: 'head',
      x: -4,
      y: -10,
      grid: ['..a..b..', '.a....b.', 'a..a...b', '...a..b.'],
      key: { a: 'hair:0', b: 'hair:2' },
      clip: ['hair'],
    });
    d.push({
      name: 'braid',
      bone: 'head',
      x: -2,
      y: -16,
      grid: ['.a.a', 'a.a.', '.a.a', 'a.a.'],
      key: { a: 'hair:3' },
      clip: ['bun'],
    });
  } else {
    d.push(
      {
        name: 'face',
        bone: 'head',
        x: -6,
        y: -7,
        grid: ['ggg.', 'lag.', '...c', '.m..'],
        key: { g: 'brass:2', l: 'glass:0', a: 'eye:o', c: 'blush:1', m: 'skin:3' },
        clip: ['head'],
        unless: 'blink',
      },
      {
        name: 'blink',
        bone: 'head',
        x: -6,
        y: -7,
        grid: ['ggg.', 'lsg.', '...c', '.m..'],
        key: { g: 'brass:2', l: 'glass:0', s: 'skin:3', c: 'blush:1', m: 'skin:3' },
        clip: ['head'],
        when: 'blink',
      },
      {
        name: 'braid',
        bone: 'head',
        x: 3,
        y: -14,
        grid: ['.a.', 'a.a', '.a.'],
        key: { a: 'hair:3' },
        clip: ['bun'],
      },
    );
  }
  return d;
}

export function odileFieldRig(view: Facing): Rig {
  return {
    id: `odile-field-${view}`,
    ...SPRITE_SIZES.field,
    materials: ODILE_MATERIALS,
    bones: bones(view),
    parts: parts(view),
    details: details(view),
    mirror: view === 'right',
  };
}

/** Where the stick's tip sits relative to its rest point while walking. */
const STICK_SIDE = [-4, -3, -1, 1, 0, -2];
const STICK_LIFT = [0, 0, 1, 1, 0, 0];

function walk(view: Facing): Pose[] {
  const side = view === 'left' || view === 'right';
  const frames: Pose[] = [];
  for (let i = 0; i < 6; i++) {
    const bob = WALK6.bob[i] ?? 0;
    const sway = WALK6.sway[i] ?? 0;
    const swing = WALK6.swing[i] ?? 0;
    if (!side) {
      frames.push({
        bones: {
          body: { y: bob },
          footL: { y: -(WALK6.liftL[i] ?? 0) },
          footR: { y: -(WALK6.liftR[i] ?? 0) },
          armR: { rot: -swing * 0.25 },
          armL: { y: -(STICK_LIFT[i] ?? 0) },
          hem: { rot: sway * 2.5 },
          stick: { y: -(STICK_LIFT[i] ?? 0) + bob },
        },
      });
    } else {
      const strideL = (WALK6.strideL[i] ?? 0) * 0.7;
      const stickX = STICK_SIDE[i] ?? 0;
      frames.push({
        bones: {
          body: { y: bob },
          footL: { x: -strideL, y: -(WALK6.liftL[i] ?? 0) },
          footR: { x: strideL, y: -(WALK6.liftR[i] ?? 0) },
          // The free arm swings; the stick arm follows the stick.
          [view === 'right' ? 'armL' : 'armR']: { rot: -swing * 0.8 },
          [view === 'right' ? 'armR' : 'armL']: { rot: -stickX * 3, x: stickX * 0.3 },
          hem: { rot: -(1 + Math.abs(sway) * 2) },
          stick: { x: stickX, y: -(STICK_LIFT[i] ?? 0), rot: stickX * 2 },
        },
      });
    }
  }
  return frames;
}

function idle(view: Facing): Pose[] {
  const side = view === 'left' || view === 'right';
  return [
    { bones: side ? { stick: { x: -1 } } : {} },
    { bones: { chest: { y: 0.6 }, head: { y: 0.2 }, ...(side ? { stick: { x: -1 } } : {}) }, flags: ['blink'] },
  ];
}

export function odileFieldSets(): SpriteSetDef[] {
  const views: Facing[] = ['down', 'left', 'right', 'up'];
  return views.map((view) => ({
    id: `odile-field-${view}`,
    character: 'odile',
    kind: 'field',
    view,
    rig: odileFieldRig(view),
    anims: [anim('idle', idle(view), [1000, 450]), anim('walk', walk(view), 125)],
  }));
}

