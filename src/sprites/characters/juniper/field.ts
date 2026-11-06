/**
 * Juniper Quill's field sprite, 32x48, in four directions. Slim and quick:
 * a fitted waxed coat with a popped collar and flared tails, knee boots, a
 * short bob with an ink-blue streak and a jeweller's loupe pushed up on her
 * forehead. A bandolier of sealing-wax sticks crosses her chest.
 */
import type { BoneDef, DetailDef, PartDef, Pose, Rig, ShapeContext } from '../../rig';
import { capsule, ellipse, limb, path, poly, roundRect } from '../../shapes';
import { anim, type Facing, SPRITE_SIZES, type SpriteSetDef } from '../../types';
import { WALK6 } from '../kit';
import { gridFromPixels } from '../portraitKit';
import { JUNIPER_MATERIALS } from './materials';

function bones(view: Facing): BoneDef[] {
  const side = view === 'left' || view === 'right';
  return [
    { name: 'root', x: 16, y: 46 },
    { name: 'body', parent: 'root', x: 0, y: -16 },
    { name: 'chest', parent: 'body', x: 0, y: -6 },
    { name: 'head', parent: 'chest', x: side ? -0.5 : 0, y: -5 },
    { name: 'armR', parent: 'chest', x: side ? 1 : -6, y: -3 },
    { name: 'armL', parent: 'chest', x: side ? 0 : 6, y: -3 },
    { name: 'footR', parent: 'root', x: side ? 0 : -2.6, y: 0 },
    { name: 'footL', parent: 'root', x: side ? 0 : 2.6, y: 0 },
    { name: 'hem', parent: 'body', x: 0, y: 0 },
  ];
}

function arm(side: 'L' | 'R', z: number, lean: number): PartDef[] {
  const bone = `arm${side}`;
  const s = lean;
  return [
    {
      name: `sleeve${side}`,
      bone,
      z,
      material: 'coat',
      shape: limb([
        [0, 0.5, 2.3],
        [s * 0.8, 6.6, 2.0],
      ]),
      shade: { shadow: 1, light: 1 },
    },
    {
      name: `cuff${side}`,
      bone,
      z: z + 0.1,
      material: 'wine',
      shape: ellipse(s * 0.85, 7.4, 2.2, 1.1),
      shade: { shadow: 1, light: 1 },
    },
    {
      name: `hand${side}`,
      bone,
      z: z + 0.2,
      material: 'skin',
      shape: capsule(s * 0.9, 8.6, 1.3, s * 1.0, 10.0, 1.55),
      shade: { shadow: 1, light: 0 },
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
    const s = leg === 'L' ? 1 : -1;
    const near = leg === 'L';
    out.push({
      name: `leg${leg}`,
      bone: 'body',
      z: side ? (near ? 1.5 : 0.5) : 1,
      material: 'black',
      shape: (c: ShapeContext) => {
        const [hx, hy] = c.p('body', side ? 0.5 : s * 2.4, 3);
        const [fx, fy] = c.p(`foot${leg}`, side ? 0.2 : 0, -3);
        return capsule(hx, hy, side ? 2.4 : 2.1, fx, fy, 1.7);
      },
      shade: { shadow: 1, light: 1 },
    });
    out.push({
      name: `boot${leg}`,
      bone: `foot${leg}`,
      z: side ? (near ? 2.5 : 0.6) : 2,
      material: 'boots',
      shape: side ? path('M -3.6 0.2 L -3.7 -1.4 Q -3.2 -2.8 -1.4 -3 L -1.4 -7.4 L 1.8 -7.6 L 2.4 0.2 Z') : roundRect(-2.1, -7.4, 4.2, 7.6, 1.2),
      shade: { shadow: 1, light: 1 },
    });
  }

  // Fitted coat with a narrow waist, then flared tails on the hem bone.
  const upper = side
    ? 'M -3.2 -11.6 L 3.2 -11.6 Q 5.4 -11.2 5.4 -8 L 4.6 -2 L 4.6 1 L -4.8 1 L -4.8 -2 L -5.2 -8 Q -5.2 -11.2 -3.2 -11.6 Z'
    : 'M -4 -11.5 L 4 -11.5 Q 6.8 -11 6.8 -8 L 5.8 -2 L 5.8 1 L -5.8 1 L -5.8 -2 L -6.8 -8 Q -6.8 -11 -4 -11.5 Z';
  const tails = side ? 'M -4.8 -1 L 4.8 -1 L 8.4 7.6 L 3 7 L -4.6 5.6 Z' : back ? 'M -6 -1 L 6 -1 L 8.6 8 L -8.6 8 Z' : 'M -6 -1 L 6 -1 L 8.4 7 L -8.4 7 Z';
  out.push({
    name: 'coat',
    bone: 'body',
    z: 5,
    material: 'coat',
    shape: path(upper),
    shade: { shadow: side ? 2 : 3, light: 1 },
    marks: back ? [{ tone: 2, shape: poly(-0.4, -9, 0.4, -9, 0.4, 1, -0.4, 1) }] : [],
  });
  out.push({
    name: 'tails',
    bone: 'hem',
    z: 5.1,
    material: 'coat',
    shape: path(tails),
    cut: front ? poly(-2.8, 7.5, -0.9, -1.5, 0.9, -1.5, 2.8, 7.5) : back ? poly(-0.9, 8.5, 0, 3, 0.9, 8.5) : undefined,
    shade: { shadow: 2, light: 1 },
    sep: false,
    cast: 0,
  });
  out.push({
    name: 'belt',
    bone: 'body',
    z: 5.4,
    material: 'black',
    shape: side ? poly(-5, -1.2, 4.8, -1.2, 4.8, 0.4, -5, 0.4) : poly(-6, -1.2, 6, -1.2, 6, 0.4, -6, 0.4),
    shade: { shadow: 1, light: 1, dir: [0, 1] },
    cast: 0,
  });

  // Popped collar and neckerchief.
  out.push({
    name: 'collar',
    bone: 'chest',
    z: back ? 12 : 9,
    material: 'coat',
    shape: front
      ? [...poly(-5.2, -5.8, -2.9, -5.6, -2.8, -7.6, -4.8, -7.3), ...poly(5.2, -5.8, 2.9, -5.6, 2.8, -7.6, 4.8, -7.3)]
      : back
        ? poly(-4.6, -5.6, 4.6, -5.6, 4.4, -8.8, -4.4, -8.8)
        : poly(0.4, -5.6, 3.6, -5.6, 3.8, -9, 1.0, -8.8),
    shade: { shadow: 1, light: 1, base: 0 },
    cast: 1,
  });
  if (!back) {
    out.push({
      name: 'scarf',
      bone: 'chest',
      z: 5.6,
      material: 'wine',
      shape: front ? poly(-2.4, -5.8, 2.4, -5.8, 0.2, -1.8) : poly(-4.6, -5.6, -1.6, -5.6, -3.8, -2.2),
      shade: { shadow: 1, light: 1 },
    });
  }

  // Bandolier: right shoulder down to the left hip.
  out.push({
    name: 'strap',
    bone: 'body',
    z: 6,
    material: 'strap',
    shape: (c: ShapeContext) => {
      const a = side ? c.p('body', 2.2, -11.4) : c.p('body', back ? 4.4 : -4.4, -11.4);
      const b = side ? c.p('body', -4.6, 0) : c.p('body', back ? -5.4 : 5.4, 0.4);
      return poly(a[0] - 1, a[1], a[0] + 1, a[1], b[0] + 1, b[1], b[0] - 1, b[1]);
    },
    shade: { shadow: 1, light: 1, dir: [1, 1] },
    thin: true,
    threshold: 0.4,
  });

  if (side) {
    out.push(...arm('R', 3.5, -0.3), ...arm('L', 8, -0.3));
  } else {
    out.push(...arm('R', 8, -1), ...arm('L', 8, 1));
  }

  // Head, bob haircut, streak and loupe.
  out.push({
    name: 'head',
    bone: 'head',
    z: 10,
    material: 'skin',
    shape: side
      ? [...ellipse(0, -6.4, 5.9, 6.0), ...ellipse(-5.6, -4.6, 1.0, 1.0)]
      : [...ellipse(0, -6.4, 6.2, 6.0), ...ellipse(-6.0, -5.4, 1.1, 1.4), ...ellipse(6.0, -5.4, 1.1, 1.4)],
    shade: { shadow: 1, light: 1 },
  });
  out.push({
    name: 'hair',
    bone: 'head',
    z: 11,
    material: 'hair',
    shape: back
      ? path('M -7 -6 Q -7.2 -13 0 -13 Q 7.2 -13 7 -6 L 6.8 -1.6 Q 3 -0.6 0 -0.8 Q -3 -0.6 -6.8 -1.6 Z')
      : side
        ? path('M -6.2 -6.4 Q -6.4 -13 0.6 -13 Q 7 -12.8 6.8 -5 L 6.4 -1.2 Q 4 -0.6 2.6 -1.8 L 2.4 -6 L -0.6 -8.6 L -3.6 -7.8 L -5.6 -5.6 Z')
        : path('M -7 -3 Q -7.6 -13 0 -13 Q 7.6 -13 7.1 -3 L 6.8 -0.6 L 5.4 -2.4 L 5.2 -7 L 3.4 -8.8 L 1 -9.2 L -1.6 -8.4 L -3.8 -7 L -5.4 -4.8 L -5.6 -0.8 Z'),
    shade: { shadow: 1, light: 1 },
    cast: 1,
  });
  out.push({
    name: 'streak',
    bone: 'head',
    z: 11.2,
    material: 'streak',
    shape: front ? poly(1.4, -13, 3.0, -13, -2.6, -7.2, -3.8, -7.8) : side ? poly(-0.6, -13, 1.0, -13, -3.8, -7.4, -5.0, -7.9) : poly(-3.2, -13, -1.8, -13, -2.2, -1, -3.6, -1),
    clipTo: ['hair'],
    shade: { shadow: 0, light: 1 },
    sep: false,
    cast: 0,
    outline: false,
    thin: true,
  });
  if (!back) {
    out.push({
      name: 'loupe',
      bone: 'head',
      z: 12,
      material: 'brass',
      shape: side ? ellipse(-3.2, -10.8, 1.7, 1.7) : ellipse(3.0, -10.4, 1.8, 1.8),
      shade: { shadow: 1, light: 1 },
      cast: 1,
    });
  }
  return out;
}

function details(view: Facing): DetailDef[] {
  const d: DetailDef[] = [];
  const sticks = (pts: [number, number, string][]): DetailDef => {
    const g = gridFromPixels(pts);
    return { name: 'sticks', bone: 'body', x: g.x, y: g.y, grid: g.grid, key: { r: 'waxRed:1', R: 'waxRed:0', g: 'waxGold:1', w: 'wine:0' } };
  };
  if (view === 'down') {
    d.push(
      {
        name: 'face',
        bone: 'head',
        x: -4,
        y: -6,
        grid: ['ba.....ab', '.c.....c.', 'd.......d', '....m....'],
        key: { a: 'eye:o', b: 'eye:o', c: 'eye:3', d: 'lips:0', m: 'lips:1' },
        clip: ['head'],
        unless: 'blink',
      },
      {
        name: 'blink',
        bone: 'head',
        x: -4,
        y: -6,
        grid: ['.........', 'baa...aab', 'd.......d', '....m....'],
        key: { a: 'eye:o', b: 'eye:o', d: 'lips:0', m: 'lips:1' },
        clip: ['head'],
        when: 'blink',
      },
      { name: 'lens', bone: 'head', x: 2, y: -11, grid: ['g'], key: { g: 'glass:0' }, clip: ['loupe'] },
      { name: 'band', bone: 'head', x: 5, y: -12, grid: ['bb', '..b'], key: { b: 'black:2' }, clip: ['hair'] },
      sticks([
        [-3, -9, 'R'],
        [-3, -8, 'r'],
        [-1, -7, 'g'],
        [-1, -6, 'g'],
        [1, -5, 'w'],
        [1, -4, 'w'],
        [3, -2, 'R'],
        [3, -1, 'r'],
      ]),
      { name: 'buckle', bone: 'body', x: -1, y: -1, grid: ['ab'], key: { a: 'brass:0', b: 'brass:2' }, clip: ['belt'] },
      { name: 'pockets', bone: 'body', x: -6, y: -6, grid: ['pp.......pp'], key: { p: 'coat:3' }, clip: ['coat'] },
      { name: 'shine', bone: 'root', x: -4, y: -6, grid: ['a....a'], key: { a: 'boots:0' }, clip: ['bootL', 'bootR'] },
    );
  } else if (view === 'up') {
    d.push(
      { name: 'band', bone: 'head', x: -6, y: -10, grid: ['bbbbbbbbbbbbb'], key: { b: 'black:1' }, clip: ['hair'] },
      sticks([
        [3, -9, 'R'],
        [1, -7, 'g'],
        [-1, -5, 'w'],
        [-3, -3, 'R'],
      ]),
    );
  } else {
    d.push(
      {
        name: 'face',
        bone: 'head',
        x: -5,
        y: -6,
        grid: ['ba.', '.c.', '..d', 'm..'],
        key: { a: 'eye:o', b: 'eye:o', c: 'eye:3', d: 'lips:0', m: 'lips:1' },
        clip: ['head'],
        unless: 'blink',
      },
      {
        name: 'blink',
        bone: 'head',
        x: -5,
        y: -6,
        grid: ['...', 'baa', '..d', 'm..'],
        key: { a: 'eye:o', b: 'eye:o', d: 'lips:0', m: 'lips:1' },
        clip: ['head'],
        when: 'blink',
      },
      { name: 'lens', bone: 'head', x: -4, y: -11, grid: ['g'], key: { g: 'glass:0' }, clip: ['loupe'] },
      { name: 'band', bone: 'head', x: -2, y: -12, grid: ['bbb', '...bbb'], key: { b: 'black:2' }, clip: ['hair'] },
      sticks([
        [0, -9, 'R'],
        [0, -8, 'r'],
        [-2, -6, 'g'],
        [-2, -5, 'g'],
      ]),
    );
  }
  return d;
}

export function juniperFieldRig(view: Facing): Rig {
  return {
    id: `juniper-field-${view}`,
    ...SPRITE_SIZES.field,
    materials: JUNIPER_MATERIALS,
    bones: bones(view),
    parts: parts(view),
    details: details(view),
    mirror: view === 'right',
  };
}

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
          armL: { rot: -swing * 0.3, y: swing > 0 ? -0.5 : 0 },
          armR: { rot: -swing * 0.3, y: swing < 0 ? -0.5 : 0 },
          hem: { rot: sway * 3 },
        },
      });
    } else {
      const strideL = WALK6.strideL[i] ?? 0;
      frames.push({
        bones: {
          body: { y: bob },
          footL: { x: -strideL, y: -(WALK6.liftL[i] ?? 0) },
          footR: { x: strideL, y: -(WALK6.liftR[i] ?? 0) },
          armL: { rot: swing * 1.1 },
          armR: { rot: -swing * 1.1 },
          hem: { rot: -(2 + Math.abs(sway) * 3) },
        },
      });
    }
  }
  return frames;
}

function idle(): Pose[] {
  return [{ bones: {} }, { bones: { chest: { y: 0.6 }, hem: { rot: 1 } }, flags: ['blink'] }];
}

export function juniperFieldSets(): SpriteSetDef[] {
  const views: Facing[] = ['down', 'left', 'right', 'up'];
  return views.map((view) => ({
    id: `juniper-field-${view}`,
    character: 'juniper',
    kind: 'field',
    view,
    rig: juniperFieldRig(view),
    anims: [anim('idle', idle(), [900, 400]), anim('walk', walk(view), 100)],
  }));
}
