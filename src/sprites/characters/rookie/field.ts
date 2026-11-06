/**
 * The Rookie's field sprite, 32x48, in four directions. Root sits on the
 * ground between the feet. Side views are drawn facing left; facing right
 * mirrors the geometry before shading, so the light stays upper-left, and
 * swaps which side the satchel hangs on.
 */
import type { BoneDef, DetailDef, PartDef, Pose, Rig, ShapeContext } from '../../rig';
import { capsule, ellipse, limb, path, poly, roundRect } from '../../shapes';
import { anim, type Facing, SPRITE_SIZES, type SpriteSetDef } from '../../types';
import { WALK6 } from '../kit';
import { ROOKIE_MATERIALS } from './materials';

const CAP_TILT: Record<Facing, number> = { down: -9, up: 9, left: -6, right: -6 };

function bones(view: Facing): BoneDef[] {
  const side = view === 'left' || view === 'right';
  return [
    { name: 'root', x: 16, y: 46 },
    { name: 'body', parent: 'root', x: 0, y: -16 },
    { name: 'chest', parent: 'body', x: 0, y: -6 },
    { name: 'head', parent: 'chest', x: side ? -0.5 : 0, y: -5 },
    { name: 'cap', parent: 'head', x: side ? 0.5 : 0, y: -13, rot: CAP_TILT[view] },
    { name: 'armR', parent: 'chest', x: side ? 1 : -6.5, y: -3 },
    { name: 'armL', parent: 'chest', x: side ? 0 : 6.5, y: -3 },
    { name: 'footR', parent: 'root', x: side ? 0 : -3, y: 0 },
    { name: 'footL', parent: 'root', x: side ? 0 : 3, y: 0 },
    { name: 'hem', parent: 'body', x: 0, y: 0 },
    // The satchel hangs on the right hip: screen-left from the front,
    // screen-right from behind, toward the back from the side.
    { name: 'bag', parent: 'body', x: view === 'down' ? -8.5 : view === 'up' ? 8.5 : 4, y: 3 },
  ];
}

/** Sleeve, rolled cuff and hand, in arm space hanging down +y. */
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
        [0, 0.5, 2.6],
        [s * 0.9, 5, 2.4],
      ]),
      shade: { shadow: 1, light: 1 },
    },
    {
      name: `cuff${side}`,
      bone,
      z: z + 0.1,
      material: 'lining',
      shape: ellipse(s * 1.0, 7.0, 2.5, 1.4),
      shade: { shadow: 1, light: 1 },
    },
    {
      name: `hand${side}`,
      bone,
      z: z + 0.2,
      material: 'skin',
      shape: capsule(s * 1.0, 8.6, 1.4, s * 1.1, 10.4, 1.7),
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

  // Legs stretch from the hip to the foot bone, so they are built in sprite space.
  for (const leg of ['L', 'R'] as const) {
    const s = leg === 'L' ? 1 : -1;
    // From the side, the left leg is the near one when facing left.
    const near = leg === 'L';
    out.push({
      name: `leg${leg}`,
      bone: 'body',
      z: side ? (near ? 1.5 : 0.5) : 1,
      material: 'trousers',
      shape: (c: ShapeContext) => {
        const [hx, hy] = c.p('body', side ? 0.5 : s * 2.8, 4);
        const [fx, fy] = c.p(`foot${leg}`, side ? 0.4 : 0, -3);
        return capsule(hx, hy, side ? 2.6 : 2.4, fx, fy, 2.0);
      },
      shade: { shadow: 1, light: 1 },
    });
    out.push({
      name: `boot${leg}`,
      bone: `foot${leg}`,
      z: side ? (near ? 2.5 : 0.6) : 2,
      material: 'boots',
      shape: side ? path('M -3.8 0.2 L -3.9 -1.6 Q -3.4 -3 -1.6 -3.2 L -0.6 -4.4 L 2.6 -4.4 L 2.8 0.2 Z') : roundRect(-2.6, -3.6, 5.2, 3.8, 1.4),
      shade: { shadow: 1, light: 1 },
    });
  }

  // Coat: upper body, then a separate skirt on the hem bone so the tails can sway.
  const upper = side
    ? 'M -3.4 -11.6 L 3.4 -11.6 Q 5.6 -11.2 5.8 -8 L 6 1 L -5.4 1 L -5.4 -8 Q -5.4 -11.2 -3.4 -11.6 Z'
    : 'M -4.5 -11.5 L 4.5 -11.5 Q 7.6 -11 7.6 -8 L 7.9 1 L -7.9 1 L -7.6 -8 Q -7.6 -11 -4.5 -11.5 Z';
  const skirt = side
    ? 'M -5.4 -1 L 5.8 -1 L 6.8 8.4 L -6.0 8.4 Z'
    : 'M -8 -1 L 8 -1 L 8.8 8.6 L -8.8 8.6 Z';
  out.push({
    name: 'coat',
    bone: 'body',
    z: 5,
    material: 'coat',
    shape: path(upper),
    shade: { shadow: side ? 2 : 3, light: 1 },
    marks: back ? [{ tone: 2, shape: poly(-0.4, -9, 0.4, -9, 0.4, 1, -0.4, 1) }] : front ? [{ tone: 3, shape: poly(-0.2, -6, 0.6, -6, 0.6, 1, -0.2, 1) }] : [],
  });
  out.push({
    name: 'skirt',
    bone: 'hem',
    z: 5.1,
    material: 'coat',
    shape: path(skirt),
    cut: front ? poly(-1.6, 9, 0, 5.4, 1.6, 9) : back ? poly(-0.9, 9, 0, 4.6, 0.9, 9) : undefined,
    shade: { shadow: side ? 2 : 3, light: 1 },
    marks: front
      ? [
          { tone: 3, shape: poly(-0.2, -1, 0.6, -1, 0.6, 9, -0.2, 9) },
          { tone: 2, shape: poly(3.6, 2.4, 6.6, 2.4, 6.6, 3.0, 3.6, 3.0) },
        ]
      : side
        ? [{ tone: 2, shape: poly(2.4, 1.6, 3.0, 1.6, 3.6, 8.6, 3.0, 8.6) }]
        : [],
    sep: false,
    cast: 0,
  });
  out.push({
    name: 'belt',
    bone: 'body',
    z: 5.4,
    material: 'belt',
    shape: side ? poly(-5.7, -1.4, 6.1, -1.4, 6.2, 0.8, -5.8, 0.8) : poly(-8.1, -1.4, 8.1, -1.4, 8.2, 0.8, -8.2, 0.8),
    shade: { shadow: 1, light: 1, dir: [0, 1] },
    cast: 0,
  });

  if (front) {
    out.push({
      name: 'shirt',
      bone: 'chest',
      z: 5.5,
      material: 'shirt',
      shape: poly(-2.2, -5.6, 2.2, -5.6, 0, -2.4),
      shade: { shadow: 1, light: 0 },
      sep: false,
    });
    out.push({
      name: 'collar',
      bone: 'chest',
      z: 5.6,
      material: 'coat',
      shape: [...poly(-4.8, -6, -2.2, -5.8, -0.2, -1.2, -3.6, -2.6), ...poly(4.8, -6, 2.2, -5.8, 0.2, -1.2, 3.6, -2.6)],
      shade: { shadow: 1, light: 2, base: 0 },
    });
  }

  // Strap: over the left shoulder to the bag on the right hip.
  if (!back || back) {
    out.push({
      name: 'strap',
      bone: 'body',
      z: side ? 5.8 : 6,
      material: 'leather',
      shape: (c: ShapeContext) => {
        if (side) {
          const [ax, ay] = c.p('chest', 0.6, -6);
          const [bx, by] = c.p('body', -4.6, -1.6);
          return poly(ax - 1.0, ay, ax + 1.0, ay, bx + 1.0, by + 0.6, bx - 0.4, by - 1.2);
        }
        const [ax, ay] = c.p('chest', front ? 4.6 : -4.6, -5.6);
        const [bx, by] = c.p('bag', front ? 2.5 : -2.5, -1.5);
        const k = front ? 1 : -1;
        return poly(ax - 0.9 * k, ay - 0.9, ax + 1.1 * k, ay + 0.6, bx + 1.2 * k, by + 1.0, bx - 1.0 * k, by - 0.6);
      },
      shade: { shadow: 1, light: 1, dir: [0, 1] },
      thin: true,
      threshold: 0.4,
    });
  }

  // Satchel: in front of the coat from the front, behind and the right; tucked behind facing left.
  const bagZ = view === 'left' ? 3 : 7;
  out.push({
    name: 'bag',
    bone: 'bag',
    z: bagZ,
    material: 'leather',
    shape: side ? roundRect(-3.2, -2, 6.4, 7.4, 1.6) : roundRect(-4, -2, 8, 7.4, 1.6),
    shade: { shadow: 2, light: 1 },
  });
  if (!back) {
    out.push({
      name: 'flap',
      bone: 'bag',
      z: bagZ + 0.1,
      material: 'leather',
      shape: side ? path('M -3.4 -2.4 L 3.4 -2.4 L 3.4 1.2 Q 0 3.0 -3.4 1.2 Z') : path('M -4.2 -2.4 L 4.2 -2.4 L 4.2 1.2 Q 0 3.2 -4.2 1.2 Z'),
      shade: { shadow: 1, light: 1, base: 2 },
      cast: 1,
    });
  }

  // Arms: both visible from front and back; near and far from the side.
  if (side) {
    out.push(...arm('R', 3.5, -0.3), ...arm('L', 8, -0.3));
  } else {
    out.push(...arm('R', 8, -1), ...arm('L', 8, 1));
  }

  // Head, hair and cap.
  out.push({
    name: 'head',
    bone: 'head',
    z: 10,
    material: 'skin',
    shape: side
      ? [...ellipse(0, -6.4, 6.0, 6.0), ...ellipse(-5.8, -4.6, 1.1, 1.0)]
      : [...ellipse(0, -6.4, 6.4, 6.0), ...ellipse(-6.2, -5.6, 1.2, 1.5), ...ellipse(6.2, -5.6, 1.2, 1.5)],
    shade: { shadow: 1, light: 1 },
  });
  if (side) {
    out.push({
      name: 'ear',
      bone: 'head',
      z: 11.5,
      material: 'skin',
      shape: ellipse(1.6, -5.4, 1.3, 1.6),
      shade: { shadow: 1, light: 1 },
      cast: 0,
    });
  }
  out.push({
    name: 'hair',
    bone: 'head',
    z: 11,
    material: 'hair',
    shape: back
      ? path('M -6.6 -7 Q -6.8 -13 0 -13 Q 6.8 -13 6.6 -7 L 6.2 -2.5 Q 3 -1.0 0 -1.4 Q -3 -1.0 -6.2 -2.5 Z')
      : side
        ? path('M -5.8 -7.4 Q -5.6 -12.8 0.6 -12.8 Q 6.6 -12.6 6.4 -6 L 5.8 -2.2 Q 4 -1.4 2.6 -2.6 L 2.4 -6.6 L -0.6 -7.6 L -2.6 -6.8 L -4.4 -7.8 Z')
        : path('M -6.8 -6 Q -7 -12.6 0 -12.6 Q 7 -12.6 6.8 -6 L 6.4 -3.6 L 5.2 -5.6 L 3.6 -7.6 L 1.4 -6.8 L -0.6 -8 L -2.6 -6.8 L -4.6 -7.6 L -5.4 -5 L -6.4 -3.4 Z'),
    shade: { shadow: 1, light: 1 },
    cast: 1,
  });
  out.push({
    name: 'capCrown',
    bone: 'cap',
    z: 12,
    material: 'coat',
    shape: side
      ? path('M -6.2 3.4 L -6.0 -0.4 Q -5.4 -3.4 0.4 -3.6 Q 6.2 -3.4 6.6 -0.4 L 6.4 3.4 Z')
      : path('M -6.8 3.4 L -6.6 -0.6 Q -6 -3.4 0 -3.6 Q 6 -3.4 6.6 -0.6 L 6.8 3.4 Z'),
    shade: { shadow: 2, light: 1 },
    marks: [{ tone: 3, shape: side ? poly(-6.2, 2.6, 6.4, 2.6, 6.4, 3.4, -6.2, 3.4) : poly(-6.8, 2.6, 6.8, 2.6, 6.8, 3.4, -6.8, 3.4) }],
    cast: 2,
  });
  if (!back) {
    out.push({
      name: 'visor',
      bone: 'cap',
      z: 12.5,
      material: 'visor',
      shape: side ? path('M -9.4 3.6 Q -6 2.4 -1.6 2.8 L -1.6 4.6 Q -6 4.8 -9.4 3.6 Z') : path('M -6.4 3.2 Q 0 2.4 6.4 3.2 Q 6 5.4 0 5.4 Q -6 5.4 -6.4 3.2 Z'),
      shade: { shadow: 1, light: 1 },
      cast: 2,
    });
  }
  return out;
}

function details(view: Facing): DetailDef[] {
  const d: DetailDef[] = [];
  const scuffs: DetailDef = {
    name: 'scuffs',
    bone: 'root',
    x: -5,
    y: -2,
    grid: ['a.......a'],
    key: { a: 'boots:0' },
    clip: ['bootL', 'bootR'],
  };
  if (view === 'down') {
    d.push(
      {
        name: 'face',
        bone: 'head',
        x: -4,
        y: -6,
        grid: ['.a.....a.', '.b.....b.', 'c.......c', '....m....'],
        key: { a: 'eye:o', b: 'eye:1', c: 'blush:1', m: 'skin:3' },
        clip: ['head'],
        unless: 'blink',
      },
      {
        name: 'blink',
        bone: 'head',
        x: -4,
        y: -5,
        grid: ['.a.....a.', 'c.......c', '....m....'],
        key: { a: 'eye:o', c: 'blush:1', m: 'skin:3' },
        clip: ['head'],
        when: 'blink',
      },
      {
        name: 'buttons',
        bone: 'body',
        x: -2,
        y: -7,
        grid: ['b', '.', '.', '.', 'b'],
        key: { b: 'brass:0' },
        clip: ['coat'],
      },
      {
        name: 'beltBuckle',
        bone: 'body',
        x: -1,
        y: -1,
        grid: ['ab'],
        key: { a: 'brass:0', b: 'brass:2' },
        clip: ['belt'],
      },
      {
        name: 'badge',
        bone: 'cap',
        x: -1,
        y: -1,
        grid: ['ab', 'bc'],
        key: { a: 'brass:0', b: 'brass:1', c: 'brass:2' },
        clip: ['capCrown'],
      },
      {
        name: 'buckle',
        bone: 'bag',
        x: -1,
        y: 0,
        grid: ['ab', 'bc'],
        key: { a: 'brass:0', b: 'brass:1', c: 'brass:3' },
        clip: ['flap', 'bag'],
      },
      {
        name: 'tin',
        bone: 'body',
        x: -6,
        y: -5,
        grid: ['.tt', 'ppp'],
        key: { t: 'tin:0', p: 'coat:3' },
        clip: ['coat'],
      },
      scuffs,
    );
  } else if (view === 'up') {
    d.push(
      {
        name: 'hairLines',
        bone: 'head',
        x: -3,
        y: -6,
        grid: ['.aa....', 'a..a...', '....b.b', '.b.....'],
        key: { a: 'hair:0', b: 'hair:2' },
        clip: ['hair'],
      },
      {
        name: 'vent',
        bone: 'body',
        x: -1,
        y: -1,
        grid: ['bb'],
        key: { b: 'brass:1' },
        clip: ['belt'],
      },
    );
  } else {
    // Side views are authored facing left; the grids flip for facing right.
    d.push(
      {
        name: 'face',
        bone: 'head',
        x: -5,
        y: -6,
        grid: ['.a.', '.b.', '..c', 'm..'],
        key: { a: 'eye:o', b: 'eye:1', c: 'blush:1', m: 'skin:3' },
        clip: ['head'],
        unless: 'blink',
      },
      {
        name: 'blink',
        bone: 'head',
        x: -5,
        y: -5,
        grid: ['.a.', '..c', 'm..'],
        key: { a: 'eye:o', c: 'blush:1', m: 'skin:3' },
        clip: ['head'],
        when: 'blink',
      },
      {
        name: 'badge',
        bone: 'cap',
        x: -6,
        y: -1,
        grid: ['a', 'b'],
        key: { a: 'brass:0', b: 'brass:2' },
        clip: ['capCrown'],
      },
      {
        name: 'buttons',
        bone: 'body',
        x: -5,
        y: -8,
        grid: ['b', '.', '.', '.', 'b'],
        key: { b: 'brass:1' },
        clip: ['coat'],
      },
      {
        name: 'buckle',
        bone: 'bag',
        x: -1,
        y: 0,
        grid: ['a', 'c'],
        key: { a: 'brass:0', c: 'brass:3' },
        clip: ['flap'],
      },
      scuffs,
    );
    if (view === 'right') {
      // Gran's tin is in the right breast pocket, so it only shows on this side.
      d.push({
        name: 'tin',
        bone: 'body',
        x: -4,
        y: -5,
        grid: ['tt.', 'ppp'],
        key: { t: 'tin:0', p: 'coat:3' },
        clip: ['coat'],
      });
    }
  }
  return d;
}

export function rookieFieldRig(view: Facing): Rig {
  return {
    id: `rookie-field-${view}`,
    ...SPRITE_SIZES.field,
    materials: ROOKIE_MATERIALS,
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
          armL: { rot: -swing * 0.25, y: swing > 0 ? -0.5 : 0 },
          armR: { rot: -swing * 0.25, y: swing < 0 ? -0.5 : 0 },
          hem: { rot: sway * 2 },
          bag: { y: -sway * 0.6 + bob * 0.5, rot: sway * 3 },
        },
      });
    } else {
      // Facing left: forward is -x. strideL > 0 puts the left foot forward.
      const strideL = WALK6.strideL[i] ?? 0;
      frames.push({
        bones: {
          body: { y: bob },
          footL: { x: -strideL, y: -(WALK6.liftL[i] ?? 0) },
          footR: { x: strideL, y: -(WALK6.liftR[i] ?? 0) },
          armL: { rot: swing },
          armR: { rot: -swing },
          hem: { rot: -(1 + Math.abs(sway) * 2) },
          bag: { x: 0.5 + Math.abs(sway) * 0.5, y: bob * 0.5, rot: 6 + sway * 4 },
          },
      });
    }
  }
  return frames;
}

function idle(): Pose[] {
  return [{ bones: {} }, { bones: { chest: { y: 0.6 }, bag: { y: 0.4 }, hem: { rot: 0 } }, flags: ['blink'] }];
}

export function rookieFieldSets(): SpriteSetDef[] {
  const views: Facing[] = ['down', 'left', 'right', 'up'];
  return views.map((view) => ({
    id: `rookie-field-${view}`,
    character: 'rookie',
    kind: 'field',
    view,
    rig: rookieFieldRig(view),
    anims: [anim('idle', idle(), [900, 450]), anim('walk', walk(view), 110)],
  }));
}
