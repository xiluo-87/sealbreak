/**
 * Juniper Quill's battle sprite, 64x96, three-quarter view facing left.
 * A cutaway waxed coat over a wine waistcoat, knee boots, a bandolier of
 * sealing-wax sticks, and a letter opener for a weapon. Reading a letter,
 * she pulls her loupe down over one eye.
 */
import type { BoneDef, DetailDef, PartDef, Pose, Rig, ShapeContext } from '../../rig';
import { capsule, ellipse, limb, path, poly, type Shape } from '../../shapes';
import { anim, SPRITE_SIZES, type SpriteSetDef } from '../../types';
import { ik, lerpPt, type Pt } from '../kit';
import { JUNIPER_MATERIALS } from './materials';

const UPPER_ARM = 11.5;
const FOREARM = 11;
const THIGH = 15.8;
const SHIN = 15.2;

function bones(): BoneDef[] {
  return [
    { name: 'root', x: 32, y: 93 },
    { name: 'pelvis', parent: 'root', x: 0, y: -36 },
    { name: 'chest', parent: 'pelvis', x: 0, y: -13 },
    { name: 'neck', parent: 'chest', x: -1, y: -10 },
    { name: 'head', parent: 'neck', x: 0, y: 0 },
    { name: 'loupe', parent: 'head', x: -2.6, y: -18.6 },
    { name: 'hem', parent: 'pelvis', x: 0, y: 0 },
    { name: 'handR', parent: 'chest', x: -9.5, y: 13 },
    { name: 'handL', parent: 'chest', x: 9.5, y: 13.5 },
    { name: 'footR', parent: 'root', x: -6, y: 0 },
    { name: 'footL', parent: 'root', x: 5, y: 0 },
    { name: 'blade', parent: 'handL', x: 0, y: 0, rot: 180 },
    { name: 'letter', parent: 'handR', x: -2, y: -4 },
  ];
}

function armChain(c: ShapeContext, side: 'L' | 'R'): { s: Pt; e: Pt; h: Pt } {
  const s = side === 'L' ? c.p('chest', 7.0, -7.4) : c.p('chest', -7.0, -7.2);
  const bend = c.flags.has(`elbowOut${side}`) ? 1 : -1;
  const { joint, end } = ik(s, c.p(`hand${side}`), UPPER_ARM, FOREARM, bend);
  return { s, e: joint, h: end };
}

function legChain(c: ShapeContext, side: 'L' | 'R'): { hip: Pt; knee: Pt; ankle: Pt } {
  const hip = side === 'L' ? c.p('pelvis', 3.6, 1) : c.p('pelvis', -3.6, 1);
  const { joint, end } = ik(hip, c.p(`foot${side}`, 0, -5.5), THIGH, SHIN, 1);
  return { hip, knee: joint, ankle: end };
}

function armParts(side: 'L' | 'R', z: number): PartDef[] {
  return [
    {
      name: `sleeve${side}`,
      bone: 'chest',
      z,
      material: 'coat',
      shape: (c) => {
        const { s, e, h } = armChain(c, side);
        const w = lerpPt(e, h, 0.72);
        return limb([
          [s[0], s[1], 3.3],
          [e[0], e[1], 2.8],
          [w[0], w[1], 2.6],
        ]);
      },
      shade: { shadow: 2, light: 1 },
    },
    {
      name: `cuff${side}`,
      bone: 'chest',
      z: z + 0.1,
      material: 'wine',
      shape: (c) => {
        const { e, h } = armChain(c, side);
        const p = lerpPt(e, h, 0.7);
        const q = lerpPt(e, h, 0.86);
        return capsule(p[0], p[1], 2.9, q[0], q[1], 2.7);
      },
      shade: { shadow: 1, light: 1 },
    },
    {
      name: `hand${side}`,
      bone: 'chest',
      z: z + 0.3,
      material: 'skin',
      shape: (c) => {
        const { e, h } = armChain(c, side);
        const dx = h[0] - e[0];
        const dy = h[1] - e[1];
        const len = Math.hypot(dx, dy) || 1;
        const cx = h[0] + (dx / len) * 1.4;
        const cy = h[1] + (dy / len) * 1.4;
        const wrist = lerpPt(e, h, 0.86);
        const arm = capsule(wrist[0], wrist[1], 1.7, h[0], h[1], 1.6);
        if (c.flags.has(`fist${side}`)) return [...arm, ...ellipse(cx, cy, 2.4, 2.3)];
        return [...arm, ...ellipse(cx, cy, 2.1, 2.6), ...ellipse(cx - 1.6, cy - 0.8, 0.9, 1.1)];
      },
      shade: { shadow: 1, light: 1 },
      cast: 0,
    },
  ];
}

function legParts(side: 'L' | 'R', z: number): PartDef[] {
  return [
    {
      name: `leg${side}`,
      bone: 'pelvis',
      z,
      material: 'black',
      shape: (c) => {
        const { hip, knee, ankle } = legChain(c, side);
        return limb([
          [hip[0], hip[1], 3.6],
          [knee[0], knee[1], 2.9],
          [ankle[0], ankle[1], 2.5],
        ]);
      },
      shade: { shadow: 2, light: 1 },
    },
    {
      name: `boot${side}`,
      bone: `foot${side}`,
      z: z + 0.2,
      material: 'boots',
      shape: (c) => {
        const { knee, ankle } = legChain(c, side);
        const top = lerpPt(knee, ankle, 0.12);
        const foot = path('M -7.2 0.4 L -7.4 -2 Q -6.6 -4 -3.4 -4.4 L -3 -6.4 L 3.2 -6.4 L 3.4 -2.6 L 3.8 0.4 Z');
        const m = c.m(`foot${side}`);
        const placed: Shape = foot.map((ct) => {
          const o: number[] = [];
          for (let i = 0; i < ct.length; i += 2) {
            const x = ct[i] ?? 0;
            const y = ct[i + 1] ?? 0;
            o.push(m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]);
          }
          return o;
        });
        return [...placed, ...capsule(top[0], top[1], 3.4, ankle[0], ankle[1], 3.0)];
      },
      shade: { shadow: 2, light: 1 },
      marks: (c) => {
        const { knee, ankle } = legChain(c, side);
        const a = lerpPt(knee, ankle, 0.12);
        const b = lerpPt(knee, ankle, 0.22);
        return [{ tone: 0, shape: capsule(a[0], a[1], 3.0, b[0], b[1], 3.0) }];
      },
    },
  ];
}

/** Sealing-wax sticks standing in the bandolier's loops. */
function stickPart(name: string, material: string, ts: number[]): PartDef {
  return {
    name,
    bone: 'chest',
    z: 6.2,
    material,
    shape: (c) => {
      const a = c.p('chest', -6.4, -9);
      const b = c.p('pelvis', 8, 0);
      const out: Shape = [];
      for (const t of ts) {
        const p = lerpPt(a, b, t);
        const up = c.p('chest', 0, -1);
        const o = c.p('chest', 0, 0);
        const ux = up[0] - o[0];
        const uy = up[1] - o[1];
        out.push(...capsule(p[0] - 0.4, p[1], 0.9, p[0] - 0.4 + ux * 3.6, p[1] + uy * 3.6, 0.9));
      }
      return out;
    },
    shade: { shadow: 1, light: 1, dir: [1, 0] },
    cast: 0,
    thin: true,
  };
}

function parts(): PartDef[] {
  const out: PartDef[] = [];
  out.push(...legParts('R', 1), ...legParts('L', 2.5));
  out.push(...armParts('R', 3));
  out.push({
    name: 'vest',
    bone: 'chest',
    z: 4.6,
    material: 'wine',
    shape: poly(-7.4, -11, 1.4, -11.2, 0.6, 12.4, -7.2, 12.4),
    shade: { shadow: 1, light: 1 },
    marks: [{ tone: 3, shape: poly(-3.6, -4, -2.9, -4, -2.9, 12.4, -3.6, 12.4) }],
  });
  out.push({
    name: 'neck',
    bone: 'neck',
    z: 4.8,
    material: 'skin',
    shape: capsule(0.8, -4, 2.8, 1.2, 1.6, 3.0),
    shade: { shadow: 1, light: 0 },
  });
  out.push({
    name: 'coat',
    bone: 'chest',
    z: 5,
    material: 'coat',
    shape: path('M -5.4 -10.6 L 5.4 -11 Q 9 -10.2 9.2 -6 L 8 2 L 7.6 11.6 L -7.2 11.6 L -7.6 2 L -8.6 -6 Q -8.8 -9.8 -5.4 -10.6 Z'),
    cut: poly(-6.2, -11.6, 0.6, -11.6, -2.0, 12, -4.6, 12),
    shade: { shadow: 3, light: 1 },
    marks: [
      { tone: 3, shape: poly(-8.4, -3.2, -5.8, -3.2, -5.8, -2.4, -8.4, -2.4) },
      { tone: 2, shape: poly(3.4, -1, 4.2, 0.8, 3.6, 4, 2.8, 2.4) },
      { tone: 0, shape: poly(-4.6, 6, -4.0, 6, -3.6, 11.6, -4.2, 11.6) },
    ],
  });
  out.push({
    name: 'tails',
    bone: 'hem',
    z: 5.1,
    material: 'coat',
    shape: path('M -7.4 -2.5 L 8 -2.5 L 14.4 18 L 9 18.6 Q 1 16 -3.6 9 Q -6.6 4 -7.4 -2.5 Z'),
    shade: { shadow: 3, light: 1 },
    marks: [
      { tone: 3, shape: poly(3, 5, 8.6, 5, 8.6, 5.8, 3, 5.8) },
      { tone: 2, shape: poly(6, 1, 6.8, 1, 11, 17, 10.2, 17) },
    ],
    sep: false,
    cast: 0,
  });
  out.push({
    name: 'belt',
    bone: 'pelvis',
    z: 5.4,
    material: 'black',
    shape: poly(-8, -3.4, 8.6, -3.4, 8.6, -1, -8, -1),
    shade: { shadow: 1, light: 1, dir: [0, 1] },
    cast: 1,
  });
  out.push({
    name: 'collar',
    bone: 'chest',
    z: 9.5,
    material: 'coat',
    shape: [...poly(2.4, -11.2, 8.6, -10.6, 9.0, -16.2, 4.2, -15.6), ...poly(-8.8, -9.8, -5.6, -11.0, -5.0, -14.4, -8.4, -13.6)],
    shade: { shadow: 1, light: 2, base: 0 },
    cast: 1,
  });
  out.push({
    name: 'strap',
    bone: 'chest',
    z: 6,
    material: 'strap',
    shape: (c) => {
      const a = c.p('chest', -6.4, -9);
      const b = c.p('pelvis', 8, 0);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * 1.5;
      const ny = (dx / len) * 1.5;
      return poly(a[0] - nx, a[1] - ny, a[0] + nx, a[1] + ny, b[0] + nx, b[1] + ny, b[0] - nx, b[1] - ny);
    },
    shade: { shadow: 1, light: 1 },
    thin: true,
  });
  out.push(stickPart('sticksRed', 'waxRed', [0.22, 0.62]));
  out.push(stickPart('sticksGold', 'waxGold', [0.36, 0.76]));
  out.push(stickPart('sticksWine', 'wine', [0.49]));

  // Props.
  out.push({
    name: 'envelope',
    bone: 'letter',
    z: 8.6,
    material: 'paper',
    shape: path('M -6 -4 L 6 -4 L 6 4.4 L -6 4.4 Z'),
    shade: { shadow: 1, light: 1 },
    marks: [{ tone: 2, shape: poly(-6, -4, 0, 0.8, 6, -4, 6, -3, 0, 2, -6, -3) }],
    when: 'envelope',
  });
  out.push({
    name: 'sheet',
    bone: 'letter',
    z: 8.6,
    material: 'paper',
    shape: poly(-7, -9, 6.4, -10, 7.4, 6, -6.2, 7),
    shade: { shadow: 1, light: 1 },
    when: 'sheet',
  });
  out.push({
    name: 'bladeHandle',
    bone: 'blade',
    z: 9.2,
    material: 'black',
    shape: capsule(-1.2, 0, 1.1, 2.6, 0, 1.1),
    shade: { shadow: 1, light: 1 },
    when: 'blade',
  });
  out.push({
    name: 'blade',
    bone: 'blade',
    z: 9.25,
    material: 'steel',
    shape: poly(2.8, -1.1, 12.5, -0.2, 13.2, 0.3, 2.8, 1.1),
    shade: { shadow: 1, light: 1, dir: [0, 1] },
    when: 'blade',
    thin: true,
  });
  out.push(...armParts('L', 9));

  // Head, hair, streak and loupe.
  out.push({
    name: 'head',
    bone: 'head',
    z: 10,
    material: 'skin',
    shape: [
      ...ellipse(0.6, -13, 8.3, 9.1),
      ...path('M -7.6 -14 L -8.2 -11.6 L -9.0 -9.8 L -8.0 -9.0 L -7.8 -6.8 Q -6.6 -2.6 -3.6 -2.0 Q 1 -2.4 5 -6 L 7.2 -10 Z'),
    ],
    shade: { shadow: 2, light: 1 },
  });
  out.push({
    name: 'hair',
    bone: 'head',
    z: 11,
    material: 'hair',
    shape: path(
      'M -8.9 -13 Q -9.6 -22.6 0.6 -23 Q 10.6 -22.8 10.6 -13 L 10.4 -5 Q 9 -2.2 6.2 -3.2 L 5.8 -8 L 4.6 -10 L 4.2 -14.6 L 1.6 -17.4 L -2.4 -17.0 L -5.4 -16.6 L -7.4 -15.2 L -8.6 -13.0 Z',
    ),
    shade: { shadow: 2, light: 1 },
    marks: [
      { tone: 0, shape: poly(-5, -20.6, 2, -21.6, 1.6, -20.8, -4.6, -19.8) },
      { tone: 2, shape: poly(7, -16, 8, -16, 8.6, -5, 7.6, -5) },
    ],
    cast: 1,
  });
  out.push({
    name: 'streak',
    bone: 'head',
    z: 11.1,
    material: 'streak',
    shape: poly(1.4, -23.6, 4.2, -23.4, -5.0, -11.4, -7.2, -12.2),
    clipTo: ['hair'],
    shade: { shadow: 1, light: 1 },
    sep: false,
    cast: 0,
    outline: false,
  });
  out.push({
    name: 'band',
    bone: 'head',
    z: 11.3,
    material: 'black',
    shape: (c) => {
      const a = c.p('loupe', 1.6, -0.6);
      const b = c.p('head', 9.8, -15);
      return poly(a[0], a[1] - 0.6, b[0], b[1] - 0.6, b[0], b[1] + 0.6, a[0], a[1] + 0.6);
    },
    clipTo: ['hair', 'head'],
    shade: { flat: true },
    sep: false,
    cast: 0,
    outline: false,
    thin: true,
    threshold: 0.35,
  });
  out.push({
    name: 'loupe',
    bone: 'loupe',
    z: 12,
    material: 'brass',
    shape: ellipse(0, 0, 3.0, 3.0),
    shade: { shadow: 1, light: 1 },
    cast: 1,
  });
  out.push({
    name: 'lens',
    bone: 'loupe',
    z: 12.1,
    material: 'glass',
    shape: ellipse(-0.2, -0.2, 1.8, 1.8),
    shade: { shadow: 1, light: 1 },
    sep: false,
    cast: 0,
  });
  return out;
}

function details(): DetailDef[] {
  const key = {
    o: 'eye:o',
    i: 'eye:3',
    c: 'eye:1',
    j: 'eye:0',
    w: 'white:1',
    e: 'hair:1',
    m: 'lips:2',
    L: 'lips:0',
    l: 'lips:1',
    r: 'lips:3',
    t: 'white:1',
    b: 'lips:0',
    n: 'skin:2',
  };
  const face = (name: string, grid: string[], when?: string, unless?: string): DetailDef => ({
    name,
    bone: 'head',
    x: -9,
    y: -17,
    grid,
    key,
    clip: ['head'],
    ...(when ? { when } : {}),
    ...(unless ? { unless } : {}),
  });
  return [
    face('eyes', ['...ee....eeee..', '.o...........o.', '..ooo....ooooo.', '..jiw....jciw..', '..ciw....ciiw..'], undefined, 'blink|grit|happy|wink'),
    face('eyesClosed', ['...ee....eeee..', '...............', '...............', '.oooo....ooooo.', '...............'], 'blink'),
    face('eyesGrit', ['....e....e.....', '...ee.....ee...', '..ooo....oooo..', '..oio....oiio..', '...............'], 'grit'),
    face('eyesHappy', ['...ee....eeee..', '.o...........o.', '..ooo....ooooo.', '.o...o..o....o.', '...............'], 'happy'),
    face('eyesWink', ['...ee....eeee..', '.o...........o.', '..ooo..........', '..jiw...ooooo..', '..ciw..........'], 'wink'),
    { name: 'cheeks', bone: 'head', x: -9, y: -11, grid: ['.n.............', '...b.....bb....'], key, clip: ['head'] },
    { name: 'mouth', bone: 'head', x: -7, y: -7, grid: ['....', '.mml', '..L.'], key, clip: ['head'], unless: 'grit|happy|open|wink' },
    { name: 'mouthSmile', bone: 'head', x: -7, y: -7, grid: ['m..l', '.mm.', '.LL.'], key, clip: ['head'], when: 'happy|wink' },
    { name: 'mouthOpen', bone: 'head', x: -7, y: -7, grid: ['.mm.', 'mrrm', '.LL.'], key, clip: ['head'], when: 'open' },
    { name: 'mouthGrit', bone: 'head', x: -7, y: -7, grid: ['mmmm', 'tttt', '.LL.'], key, clip: ['head'], when: 'grit' },
    {
      name: 'earring',
      bone: 'head',
      x: 6,
      y: -4,
      grid: ['a', 'b'],
      key: { a: 'brass:0', b: 'brass:2' },
    },
    { name: 'vestButtons', bone: 'chest', x: -5, y: 0, grid: ['a', '.', '.', '.', 'a', '.', '.', '.', 'a'], key: { a: 'brass:0' }, clip: ['vest'] },
    { name: 'buckle', bone: 'pelvis', x: -4, y: -4, grid: ['abb', 'b.c', 'bcc'], key: { a: 'brass:0', b: 'brass:1', c: 'brass:2' }, clip: ['belt'] },
    { name: 'pocketButtons', bone: 'hem', x: 5, y: 5, grid: ['a'], key: { a: 'brass:1' }, clip: ['tails'] },
    { name: 'breastPocket', bone: 'chest', x: -8, y: -4, grid: ['..a'], key: { a: 'brass:1' }, clip: ['coat'] },
    {
      name: 'seal',
      bone: 'letter',
      x: -1,
      y: 0,
      grid: ['.a.', 'abc', '.c.'],
      key: { a: 'waxRed:0', b: 'waxRed:1', c: 'waxRed:2' },
      clip: ['envelope'],
      when: 'envelope',
      unless: 'cracked',
    },
    {
      name: 'sealCracked',
      bone: 'letter',
      x: -2,
      y: 0,
      grid: ['.a..', 'ab.c', '..c.'],
      key: { a: 'waxRed:0', b: 'waxRed:1', c: 'waxRed:2' },
      clip: ['envelope'],
      when: 'cracked',
    },
    {
      name: 'waxBits',
      bone: 'letter',
      x: -6,
      y: -9,
      grid: ['a.......', '.....b..', '..b.....', '........a'],
      key: { a: 'waxRed:1', b: 'waxRed:2' },
      when: 'burst',
    },
    {
      name: 'lines',
      bone: 'letter',
      x: -5,
      y: -7,
      grid: ['aaaaaa.aa', '.........', 'aaa.aaaaa', '.........', 'aaaaa.aaa', '.........', 'aa.aaaa..', '.........', '....aaa..'],
      key: { a: 'ink:0' },
      clip: ['sheet'],
      when: 'sheet',
    },
  ];
}

export function juniperBattleRig(): Rig {
  return {
    id: 'juniper-battle',
    ...SPRITE_SIZES.battle,
    materials: JUNIPER_MATERIALS,
    bones: bones(),
    parts: parts(),
    details: details(),
  };
}

type B = NonNullable<Pose['bones']>;

function p(bones: B, flags: string[] = [], extra: Partial<Pose> = {}): Pose {
  return { bones, flags, ...extra };
}

function idle(): Pose[] {
  // Weight on the back foot, hand on hip, an easy bounce.
  const b = [0, 0.5, 1, 0.5];
  return b.map((v, i) =>
    p(
      {
        pelvis: { x: 1, y: v * 0.5, rot: 2 },
        chest: { rot: -3, y: v * 0.3 },
        head: { rot: -2 + v, y: v * 0.2 },
        handL: { x: -1, y: -6 },
        handR: { y: -v * 0.5 },
        footL: { x: 2 },
        hem: { rot: [0, -0.6, -1.2, -0.6][i] ?? 0 },
      },
      ['elbowOutL', ...(i === 1 ? ['blink'] : [])],
    ),
  );
}

function attack(): Pose[] {
  // A quick lunge with the letter opener.
  return [
    p(
      {
        pelvis: { x: 3, y: 2 },
        chest: { rot: 8 },
        head: { rot: 2 },
        handL: { x: 4, y: -8 },
        blade: { rot: -20 },
        handR: { x: -2, y: -6 },
        footL: { x: 2 },
        hem: { rot: 2 },
      },
      ['blade', 'grit', 'elbowOutL'],
    ),
    p(
      {
        pelvis: { x: -6, y: 2 },
        chest: { rot: -10 },
        head: { rot: -4 },
        handL: { x: -8, y: -12 },
        blade: { rot: 10 },
        handR: { x: 6, y: -2 },
        footR: { x: -9 },
        footL: { x: 0 },
        hem: { rot: 8 },
      },
      ['blade', 'grit'],
    ),
    p(
      {
        pelvis: { x: -10, y: 3 },
        chest: { rot: -16 },
        head: { rot: -6 },
        handL: { x: -22, y: -12 },
        blade: { rot: 2 },
        handR: { x: 8, y: 0 },
        footR: { x: -13 },
        footL: { x: 1 },
        hem: { rot: 12 },
      },
      ['blade', 'grit'],
    ),
    p(
      {
        pelvis: { x: -10, y: 3 },
        chest: { rot: -14 },
        head: { rot: -5 },
        handL: { x: -20, y: -6 },
        blade: { rot: -20 },
        handR: { x: 7, y: -1 },
        footR: { x: -13 },
        footL: { x: 1 },
        hem: { rot: 6 },
      },
      ['blade', 'open'],
    ),
    p({ pelvis: { x: -3, y: 1 }, chest: { rot: -4 }, handL: { x: -4, y: -6 }, blade: { rot: 20 }, footR: { x: -4 }, hem: { rot: -3 } }, ['blade']),
  ];
}

function read(): Pose[] {
  // Takes a letter from a pocket and checks it through her loupe.
  return [
    p({ handR: { x: 4, y: -2 }, chest: { rot: -2 } }, []),
    p({ handR: { x: -2, y: -16 }, head: { rot: -3 } }, ['envelope']),
    p({ handR: { x: -6, y: -20 }, head: { rot: -4 }, loupe: { x: -2, y: 5.4 } }, ['envelope']),
    p({ handR: { x: -6, y: -21 }, head: { rot: -5 }, loupe: { x: -2.6, y: 5.6 }, handL: { x: -12, y: -26 } }, ['envelope', 'wink', 'elbowOutL']),
    p({ handR: { x: -4, y: -16 }, head: { rot: -2 }, handL: { x: -1, y: -6 } }, ['envelope', 'happy', 'elbowOutL']),
  ];
}

function breakSeal(): Pose[] {
  // Flicks the seal off with the letter opener.
  return [
    p({ handR: { x: -2, y: -16 }, handL: { x: -8, y: -8 }, blade: { rot: 40 } }, ['envelope', 'blade']),
    p({ handR: { x: -3, y: -17 }, handL: { x: -12, y: -14 }, blade: { rot: 20 }, head: { rot: -4 } }, ['envelope', 'blade', 'grit']),
    p({ handR: { x: -3, y: -17 }, handL: { x: -10, y: -18 }, blade: { rot: -30 }, head: { rot: -4 } }, ['envelope', 'blade', 'cracked', 'grit']),
    p({ handR: { x: -6, y: -26 }, handL: { x: -2, y: -8 }, blade: { rot: -60 }, chest: { rot: 5 }, head: { rot: 5 }, pelvis: { y: -1 } }, ['sheet', 'burst', 'blade', 'open']),
    p({ handR: { x: -7, y: -28 }, handL: { x: -1, y: -6 }, chest: { rot: 6 }, head: { rot: 6 }, pelvis: { y: -1 } }, ['sheet', 'happy', 'elbowOutL']),
    p({ handR: { x: -4, y: -17 }, handL: { x: -1, y: -6 }, chest: { rot: 2 } }, ['sheet', 'elbowOutL']),
  ];
}

function hit(): Pose[] {
  return [
    p({ pelvis: { x: 4, y: 1 }, chest: { rot: 12, x: 1 }, head: { rot: 14 }, handR: { x: 8, y: -4 }, handL: { x: 4, y: -2 }, hem: { rot: -6 } }, ['grit']),
    p({ pelvis: { x: 2, y: 1 }, chest: { rot: 6 }, head: { rot: 7 }, handR: { x: 4, y: -2 }, hem: { rot: -3 } }, ['grit']),
  ];
}

function guard(): Pose[] {
  const g: B = {
    pelvis: { x: 1, y: 3 },
    chest: { rot: 6 },
    head: { rot: 8, y: 1 },
    handR: { x: 1, y: -24 },
    handL: { x: -14, y: -22 },
    footR: { x: -3 },
    footL: { x: 2 },
    hem: { rot: -2 },
  };
  return [p(g, ['grit', 'fistR', 'fistL']), p({ ...g, pelvis: { x: 1, y: 3.5 }, chest: { rot: 7 } }, ['grit', 'fistR', 'fistL'])];
}

function knockedOut(): Pose[] {
  return [
    p({ pelvis: { y: 4, x: 3 }, chest: { rot: 14 }, head: { rot: 16 }, handR: { x: 6, y: 4 }, handL: { x: 3, y: 6 }, footR: { x: -3 }, hem: { rot: -6 } }, ['grit']),
    p(
      { pelvis: { y: 15, x: 4, rot: 10 }, chest: { rot: 22 }, head: { rot: 18 }, handR: { x: 2, y: 12 }, handL: { x: 0, y: 12 }, footR: { x: -9 }, footL: { x: 3 }, hem: { rot: -10 } },
      ['blink'],
    ),
    p(
      {
        pelvis: { y: 24, x: -15, rot: 78 },
        chest: { rot: 6 },
        neck: { rot: 8 },
        head: { rot: 10 },
        handR: { x: 2, y: -2 },
        handL: { x: -4, y: -1 },
        footR: { x: -20, y: 0 },
        footL: { x: -14, y: 0 },
        hem: { rot: -6 },
      },
      ['blink'],
    ),
  ];
}

function victory(): Pose[] {
  // Flips the letter opener, catches it, and winks.
  return [
    p({ handL: { x: -2, y: -10 }, blade: { rot: 90 }, chest: { rot: -2 } }, ['blade', 'happy', 'elbowOutL']),
    p({ handL: { x: -2, y: -16 }, blade: { rot: -180 }, chest: { rot: -3 }, pelvis: { y: -1 } }, ['blade', 'happy', 'elbowOutL']),
    p({ handL: { x: -2, y: -14 }, blade: { rot: -90 }, chest: { rot: -3 } }, ['blade', 'happy', 'elbowOutL']),
    p({ handL: { x: -3, y: -12 }, blade: { rot: 90 }, chest: { rot: -2 }, head: { rot: -4 }, handR: { x: 2, y: -6 } }, ['blade', 'wink', 'elbowOutL']),
  ];
}

export function juniperBattleSets(): SpriteSetDef[] {
  return [
    {
      id: 'juniper-battle',
      character: 'juniper',
      kind: 'battle',
      rig: juniperBattleRig(),
      anims: [
        anim('idle', idle(), 200),
        anim('attack', attack(), [100, 60, 60, 110, 150], false),
        anim('read', read(), [130, 150, 160, 360, 180], false),
        anim('breakSeal', breakSeal(), [150, 150, 110, 90, 240, 200], false),
        anim('hit', hit(), [120, 200], false),
        anim('guard', guard(), 230),
        anim('knockedOut', knockedOut(), [150, 150, 400], false),
        anim('victory', victory(), [120, 90, 90, 400]),
      ],
    },
  ];
}
