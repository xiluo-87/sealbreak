/**
 * The Rookie's battle sprite, 64x96, three-quarter view facing left (the
 * party stands on the right of the battle screen). Arms and legs use
 * two-bone IK, so poses place hands and feet directly.
 *
 * Bones of note: `handL`/`handR` and `footL`/`footR` are IK targets. L is the
 * character's left side, which is the near side in this view.
 */
import type { BoneDef, DetailDef, PartDef, Pose, Rig, ShapeContext } from '../../rig';
import { capsule, ellipse, limb, path, poly, roundRect } from '../../shapes';
import { anim, SPRITE_SIZES, type SpriteSetDef } from '../../types';
import { ik, lerpPt, type Pt } from '../kit';
import { ROOKIE_EXTRA, ROOKIE_MATERIALS } from './materials';

const UPPER_ARM = 11.5;
const FOREARM = 11;
const THIGH = 15;
const SHIN = 14.6;

function bones(): BoneDef[] {
  return [
    { name: 'root', x: 32, y: 93 },
    { name: 'pelvis', parent: 'root', x: 0, y: -35 },
    { name: 'chest', parent: 'pelvis', x: 0, y: -13 },
    { name: 'neck', parent: 'chest', x: -1, y: -10 },
    { name: 'head', parent: 'neck', x: 0, y: 0 },
    { name: 'cap', parent: 'head', x: 0.5, y: -20.5, rot: -7 },
    { name: 'hem', parent: 'pelvis', x: 0, y: 0 },
    // IK targets. Hands follow the chest unless a pose moves them.
    { name: 'handR', parent: 'chest', x: -11, y: 13 },
    { name: 'handL', parent: 'chest', x: 10.5, y: 14 },
    { name: 'footR', parent: 'root', x: -6, y: 0 },
    { name: 'footL', parent: 'root', x: 5, y: 0 },
    // The satchel hangs from the left shoulder on a strap; rotating the
    // strap bone swings the bag.
    { name: 'strap', parent: 'chest', x: 6, y: -9 },
    { name: 'bag', parent: 'strap', x: -15, y: 22 },
    // A letter, used by the read and break-the-seal animations.
    { name: 'letter', parent: 'chest', x: -6, y: 2 },
  ];
}

function shoulder(c: ShapeContext, side: 'L' | 'R'): Pt {
  return side === 'L' ? c.p('chest', 7.6, -7.4) : c.p('chest', -7.4, -7.2);
}

function armChain(c: ShapeContext, side: 'L' | 'R'): { s: Pt; e: Pt; h: Pt } {
  const s = shoulder(c, side);
  const target = c.p(`hand${side}`);
  const bend = c.flags.has(`elbowOut${side}`) ? 1 : -1;
  const { joint, end } = ik(s, target, UPPER_ARM, FOREARM, c.mirrored ? (-bend as 1 | -1) : bend);
  return { s, e: joint, h: end };
}

function legChain(c: ShapeContext, side: 'L' | 'R'): { hip: Pt; knee: Pt; ankle: Pt } {
  const hip = side === 'L' ? c.p('pelvis', 4, 1) : c.p('pelvis', -4, 1);
  const target = c.p(`foot${side}`, 0, -5.5);
  const { joint, end } = ik(hip, target, THIGH, SHIN, 1);
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
        const cuff = lerpPt(e, h, 0.3);
        return limb([
          [s[0], s[1], 3.7],
          [e[0], e[1], 3.2],
          [cuff[0], cuff[1], 3.0],
        ]);
      },
      shade: { shadow: 2, light: 1 },
    },
    {
      name: `cuff${side}`,
      bone: 'chest',
      z: z + 0.1,
      material: 'lining',
      shape: (c) => {
        const { e, h } = armChain(c, side);
        const p = lerpPt(e, h, 0.36);
        const q = lerpPt(e, h, 0.5);
        return capsule(p[0], p[1], 3.2, q[0], q[1], 3.0);
      },
      shade: { shadow: 1, light: 1 },
    },
    {
      name: `forearm${side}`,
      bone: 'chest',
      z: z - 0.05,
      material: 'skin',
      shape: (c) => {
        const { e, h } = armChain(c, side);
        const p = lerpPt(e, h, 0.5);
        return capsule(p[0], p[1], 2.2, h[0], h[1], 1.9);
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
        const cx = h[0] + (dx / len) * 1.8;
        const cy = h[1] + (dy / len) * 1.8;
        if (c.flags.has(`fist${side}`)) return ellipse(cx, cy, 2.8, 2.6);
        return [...ellipse(cx, cy, 2.5, 2.9), ...ellipse(cx - 1.8, cy - 0.8, 1.1, 1.3)];
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
      material: 'trousers',
      shape: (c) => {
        const { hip, knee, ankle } = legChain(c, side);
        return limb([
          [hip[0], hip[1], 4.2],
          [knee[0], knee[1], 3.5],
          [ankle[0], ankle[1], 3.0],
        ]);
      },
      shade: { shadow: 2, light: 1 },
    },
    {
      name: `boot${side}`,
      bone: `foot${side}`,
      z: z + 0.2,
      material: 'boots',
      shape: path('M -7.6 0.4 L -7.8 -2.2 Q -7 -4.4 -3.6 -4.8 L -3.4 -8.6 L 3.6 -8.6 L 4 -3 L 4.6 0.4 Z'),
      shade: { shadow: 2, light: 1 },
      marks: [{ tone: 3, shape: poly(-7.8, -0.6, 4.6, -0.6, 4.6, 0.4, -7.8, 0.4) }],
    },
  ];
}

function parts(): PartDef[] {
  const out: PartDef[] = [];
  // Far side first (character's right), then body, then near side.
  out.push(...legParts('R', 1), ...legParts('L', 2.5));
  out.push(...armParts('R', 3));

  out.push({
    name: 'coat',
    bone: 'chest',
    z: 5,
    material: 'coat',
    shape: path('M -6 -10.6 L 6 -11 Q 10 -10.2 10.4 -6 L 10.2 4 L 9.8 11.6 L -8.6 11.6 L -9 4 L -9.4 -6 Q -9.6 -9.8 -6 -10.6 Z'),
    shade: { shadow: 3, light: 1 },
    marks: [
      { tone: 3, shape: poly(-2.8, -4.6, -2.0, -4.6, -2.0, 12, -2.8, 12) },
      { tone: 2, shape: poly(3.4, -1, 4.2, 0.8, 3.6, 4, 2.8, 2.4) },
    ],
  });
  out.push({
    name: 'skirt',
    bone: 'hem',
    z: 5.1,
    material: 'coat',
    shape: path('M -9 -2.5 L 9.8 -2.5 L 12 17 L -11.8 17 Z'),
    cut: poly(-5, 17.5, -2.6, 9, -0.6, 17.5),
    shade: { shadow: 3, light: 1 },
    marks: [
      { tone: 3, shape: poly(-2.8, -2.5, -2.0, -2.5, -2.4, 8, -3.0, 8) },
      { tone: 2, shape: poly(4.6, 2, 5.4, 2, 7.8, 16.6, 7.0, 16.6) },
      { tone: 2, shape: poly(-8.2, 4.2, -4.8, 4.2, -4.8, 5.0, -8.2, 5.0) },
    ],
    sep: false,
    cast: 0,
  });
  out.push({
    name: 'belt',
    bone: 'pelvis',
    z: 5.4,
    material: 'belt',
    shape: poly(-9.6, -3.6, 10.2, -3.6, 10.3, -0.6, -9.7, -0.6),
    shade: { shadow: 1, light: 1, dir: [0, 1] },
    cast: 1,
  });
  out.push({
    name: 'neck',
    bone: 'neck',
    z: 4.8,
    material: 'skin',
    shape: capsule(0.8, -4, 3.3, 1.2, 1.6, 3.4),
    shade: { shadow: 1, light: 0 },
  });
  out.push({
    name: 'shirt',
    bone: 'chest',
    z: 5.5,
    material: 'shirt',
    shape: poly(-4.2, -11, 1.8, -11.2, -2.0, -5.6),
    shade: { shadow: 1, light: 0, base: 2 },
    sep: false,
  });
  out.push({
    name: 'collar',
    bone: 'chest',
    z: 5.6,
    material: 'coat',
    shape: [...poly(-7.6, -11.4, -4.8, -11.4, -2.6, -4.2, -6.4, -7.2), ...poly(7.4, -12.2, 2.4, -11.6, -2.0, -4.2, 4.6, -7.4)],
    shade: { shadow: 1, light: 2, base: 0 },
  });

  // Satchel strap, bag and flap.
  out.push({
    name: 'strap',
    bone: 'strap',
    z: 6,
    material: 'leather',
    shape: (c) => {
      const a = c.p('strap', 0, 0);
      const b = c.p('bag', 3.5, -3.6);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * 1.3;
      const ny = (dx / len) * 1.3;
      return poly(a[0] - nx, a[1] - ny, a[0] + nx, a[1] + ny, b[0] + nx, b[1] + ny, b[0] - nx, b[1] - ny);
    },
    shade: { shadow: 1, light: 1, dir: [1, 1] },
    thin: true,
  });
  out.push({
    name: 'bag',
    bone: 'bag',
    z: 6.5,
    material: 'leather',
    shape: roundRect(-6.4, -4, 12.8, 11.4, 2.6),
    shade: { shadow: 2, light: 1 },
    marks: [{ tone: 3, shape: poly(-6.4, 6.2, 6.4, 6.2, 6.4, 7.4, -6.4, 7.4) }],
  });
  out.push({
    name: 'flap',
    bone: 'bag',
    z: 6.6,
    material: 'leather',
    shape: path('M -6.8 -4.4 L 6.8 -4.4 L 6.8 1.6 Q 0 4.6 -6.8 1.6 Z'),
    shade: { shadow: 1, light: 1, base: 0 },
    cast: 1,
  });

  // The letter (read and break the seal).
  out.push({
    name: 'envelope',
    bone: 'letter',
    z: 8.5,
    material: 'paper',
    shape: roundRect(-6, -4, 12, 8.4, 0.8),
    shade: { shadow: 1, light: 1 },
    marks: [{ tone: 2, shape: poly(-6, -4, 0, 0.8, 6, -4, 6, -3, 0, 2, -6, -3) }],
    when: 'envelope',
  });
  out.push({
    name: 'sheet',
    bone: 'letter',
    z: 8.5,
    material: 'paper',
    shape: poly(-7, -9, 6.4, -10, 7.4, 6, -6.2, 7),
    shade: { shadow: 1, light: 1 },
    when: 'sheet',
  });

  out.push(...armParts('L', 9));

  // Head.
  out.push({
    name: 'head',
    bone: 'head',
    z: 10,
    material: 'skin',
    shape: [
      ...ellipse(0.6, -13, 8.6, 9.2),
      ...path('M -7.8 -14 L -8.4 -11.6 L -9.4 -9.6 L -8.2 -8.8 L -8.0 -6.6 Q -6.6 -2.2 -3.2 -1.8 Q 1.6 -1.8 5.4 -5.6 L 7.4 -10 Z'),
    ],
    shade: { shadow: 2, light: 1 },
  });
  out.push({
    name: 'hair',
    bone: 'head',
    z: 11,
    material: 'hair',
    shape: path(
      'M -8.2 -14.6 Q -8 -22.6 1 -22.8 Q 10 -22.6 9.8 -13 L 9.4 -6.8 Q 8 -4.4 5.8 -5.4 L 5.4 -9.6 L 3.8 -10.4 L 3.6 -14 L 1.2 -15.6 L -1.6 -14.4 L -3.8 -15.8 L -5.8 -14 L -7.4 -15 Z',
    ),
    shade: { shadow: 2, light: 1 },
    cast: 1,
  });
  out.push({
    name: 'ear',
    bone: 'head',
    z: 11.5,
    material: 'skin',
    shape: ellipse(6.8, -11.4, 1.9, 2.7),
    shade: { shadow: 1, light: 1 },
    cast: 0,
  });
  out.push({
    name: 'capCrown',
    bone: 'cap',
    z: 12,
    material: 'coat',
    shape: path('M -9.6 3.8 L -9.2 -1 Q -8 -5.4 0.6 -5.6 Q 9.2 -5.4 10 -0.6 L 10.2 4 Z'),
    shade: { shadow: 3, light: 1 },
    marks: [{ tone: 3, shape: poly(-9.6, 2.6, 10.2, 2.6, 10.2, 4, -9.6, 4) }],
    cast: 2,
  });
  out.push({
    name: 'visor',
    bone: 'cap',
    z: 12.5,
    material: 'visor',
    shape: path('M -14.4 5 Q -10.6 2.6 -2.6 3 L -2.2 5.8 Q -8.6 6.8 -14.4 5 Z'),
    shade: { shadow: 1, light: 1 },
    cast: 2,
  });
  return out;
}

function details(): DetailDef[] {
  return [
    {
      name: 'eyes',
      bone: 'head',
      x: -9,
      y: -15,
      grid: [
        '..ee....eee...', //
        '..............',
        '..oo....ooo...',
        '..hb....whb...',
        '..bb....wbb...',
      ],
      key: { e: 'hair:1', o: 'eye:o', h: 'white:0', b: 'eye:1', w: 'white:1' },
      clip: ['head'],
      unless: 'blink|grit|happy',
    },
    {
      name: 'eyesClosed',
      bone: 'head',
      x: -9,
      y: -15,
      grid: ['..ee....eee...', '..............', '..............', '..oo....ooo...'],
      key: { e: 'hair:1', o: 'eye:o' },
      clip: ['head'],
      when: 'blink',
    },
    {
      name: 'eyesGrit',
      bone: 'head',
      x: -9,
      y: -15,
      grid: ['...e....e.....', '..ee.....ee...', '..............', '..oo....ooo...', '...o.....o....'],
      key: { e: 'hair:1', o: 'eye:o' },
      clip: ['head'],
      when: 'grit',
    },
    {
      name: 'eyesHappy',
      bone: 'head',
      x: -9,
      y: -15,
      grid: ['..ee....eee...', '..............', '..oo....ooo...', '.o..o..o...o..'],
      key: { e: 'hair:1', o: 'eye:o' },
      clip: ['head'],
      when: 'happy',
    },
    {
      name: 'cheeks',
      bone: 'head',
      x: -9,
      y: -9,
      grid: ['.n............', '..cc....cc....'],
      key: { n: 'skin:2', c: 'blush:1' },
      clip: ['head'],
    },
    {
      name: 'mouth',
      bone: 'head',
      x: -6,
      y: -6,
      grid: ['.mm.'],
      key: { m: 'skin:3' },
      clip: ['head'],
      unless: 'grit|happy|open',
    },
    {
      name: 'mouthOpen',
      bone: 'head',
      x: -6,
      y: -6,
      grid: ['.mm.', '.mm.'],
      key: { m: 'blush:3' },
      clip: ['head'],
      when: 'open',
    },
    {
      name: 'mouthGrit',
      bone: 'head',
      x: -6,
      y: -6,
      grid: ['mmmm', 'wwww'],
      key: { m: 'skin:3', w: 'white:1' },
      clip: ['head'],
      when: 'grit',
    },
    {
      name: 'mouthHappy',
      bone: 'head',
      x: -6,
      y: -6,
      grid: ['mmmm', '.ww.'],
      key: { m: 'blush:3', w: 'white:1' },
      clip: ['head'],
      when: 'happy',
    },
    {
      name: 'badge',
      bone: 'cap',
      x: -7,
      y: -2,
      grid: ['.a.', 'abc', '.c.'],
      key: { a: 'brass:0', b: 'brass:1', c: 'brass:2' },
      clip: ['capCrown'],
    },
    {
      name: 'buttons',
      bone: 'chest',
      x: -5,
      y: -3,
      grid: ['ab', 'bc', '..', '..', '..', 'ab', 'bc', '..', '..', '..', 'ab', 'bc'],
      key: { a: 'brass:0', b: 'brass:1', c: 'brass:3' },
      clip: ['coat'],
    },
    {
      name: 'buckle',
      bone: 'pelvis',
      x: -5,
      y: -4,
      grid: ['abbb', 'b..c', 'bccc'],
      key: { a: 'brass:0', b: 'brass:1', c: 'brass:2' },
      clip: ['belt'],
    },
    {
      name: 'tin',
      bone: 'chest',
      x: -9,
      y: -4,
      grid: ['.htt', '.ttt', 'pppp'],
      key: { h: 'tin:0', t: 'tin:1', p: 'coat:3' },
      clip: ['coat'],
    },
    {
      name: 'bagBuckle',
      bone: 'bag',
      x: -1,
      y: 1,
      grid: ['ab', 'bc', 'bc'],
      key: { a: 'brass:0', b: 'brass:1', c: 'brass:3' },
      clip: ['flap', 'bag'],
    },
    {
      name: 'stitch',
      bone: 'bag',
      x: -5,
      y: 5,
      grid: ['a.a.a.a.a.a'],
      key: { a: 'leather:0' },
      clip: ['bag'],
    },
    {
      name: 'scuffL',
      bone: 'footL',
      x: -6,
      y: -3,
      grid: ['a..', '.a.'],
      key: { a: 'boots:0' },
      clip: ['bootL'],
    },
    {
      name: 'scuffR',
      bone: 'footR',
      x: -5,
      y: -3,
      grid: ['aa'],
      key: { a: 'boots:0' },
      clip: ['bootR'],
    },
    {
      name: 'seal',
      bone: 'letter',
      x: -1,
      y: 0,
      grid: ['.a.', 'abc', '.c.'],
      key: { a: 'wax:0', b: 'wax:1', c: 'wax:2' },
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
      key: { a: 'wax:0', b: 'wax:1', c: 'wax:2' },
      clip: ['envelope'],
      when: 'cracked',
    },
    {
      name: 'waxBits',
      bone: 'letter',
      x: -6,
      y: -9,
      grid: ['a.......', '.....b..', '..b.....', '........a'],
      key: { a: 'wax:1', b: 'wax:2' },
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

export function rookieBattleRig(): Rig {
  return {
    id: 'rookie-battle',
    ...SPRITE_SIZES.battle,
    materials: { ...ROOKIE_MATERIALS, ...ROOKIE_EXTRA },
    bones: bones(),
    parts: parts(),
    details: details(),
  };
}

// ---------------------------------------------------------------------------
// Animations. Hand and foot bones are IK targets; offsets are in pixels.

type B = NonNullable<Pose['bones']>;

function p(bones: B, flags: string[] = [], extra: Partial<Pose> = {}): Pose {
  return { bones, flags, ...extra };
}

function idle(): Pose[] {
  const breath = [0, 0.5, 1, 0.5];
  return breath.map((b, i) =>
    p(
      {
        pelvis: { y: b * 0.5 },
        chest: { y: b * 0.5 },
        head: { y: b * 0.2, rot: b * 0.8 },
        strap: { rot: [0, 1, 2, 1][i] ?? 0 },
        hem: { rot: [0, -0.5, -1, -0.5][i] ?? 0 },
        handL: { y: -b * 0.6 },
      },
      i === 2 ? ['blink'] : [],
    ),
  );
}

function attack(): Pose[] {
  // Express: a quick swing of the heavy satchel.
  const behind = { bag: 2, flap: 2.1, strap: 2.2 };
  return [
    // Wind-up: lean back, the bag swings behind.
    p(
      {
        pelvis: { x: 2, y: 1 },
        chest: { rot: 8, x: 1 },
        head: { rot: 4 },
        strap: { rot: -55 },
        handR: { x: 9, y: -4 },
        handL: { x: 3, y: -4 },
        footL: { x: 1 },
        hem: { rot: 2 },
      },
      ['fistL'],
      { z: behind },
    ),
    // Step in; the bag comes round past the hip.
    p(
      {
        pelvis: { x: -4, y: 1 },
        chest: { rot: -6, x: -1 },
        head: { rot: -4 },
        strap: { rot: 5 },
        handR: { x: 2, y: -6 },
        handL: { x: -2, y: -3 },
        footR: { x: -6 },
        footL: { x: -1 },
        hem: { rot: 4 },
      },
      ['fistL', 'grit'],
    ),
    // Swing: the bag arcs forward at chest height.
    p(
      {
        pelvis: { x: -7, y: 2 },
        chest: { rot: -12, x: -2 },
        head: { rot: -6 },
        strap: { rot: 50 },
        handR: { x: -8, y: -12 },
        handL: { x: -4, y: -5 },
        footR: { x: -10 },
        footL: { x: -2 },
        hem: { rot: 6 },
      },
      ['fistL', 'grit', 'fistR'],
    ),
    // Follow-through.
    p(
      {
        pelvis: { x: -5, y: 2 },
        chest: { rot: -14, x: -2 },
        head: { rot: -5 },
        strap: { rot: 62 },
        handR: { x: -10, y: -8 },
        handL: { x: -5, y: -6 },
        footR: { x: -10 },
        footL: { x: -2 },
        hem: { rot: 3 },
      },
      ['fistL', 'open', 'fistR'],
    ),
    // Recover.
    p({
      pelvis: { x: -2, y: 1 },
      chest: { rot: -4 },
      strap: { rot: 22 },
      handR: { x: -2, y: -3 },
      footR: { x: -3 },
      hem: { rot: -2 },
    }),
  ];
}

function read(): Pose[] {
  // Take a letter from the satchel and read it aloud.
  const hold = (lx: number, ly: number): B => ({
    letter: { x: lx, y: ly },
    handR: { x: 11 + lx - 7, y: -13 + ly + 1 },
    handL: { x: -10.5 + lx + 6, y: -14 + ly + 2 },
  });
  return [
    p({ handR: { x: 2, y: 1 }, chest: { rot: -4 }, head: { rot: -6 } }),
    p({ ...hold(-4, -2), chest: { rot: -2 }, head: { rot: -3 } }, ['envelope']),
    p({ ...hold(-6, -10), chest: { rot: 2 }, head: { rot: 2 } }, ['sheet', 'open']),
    p({ ...hold(-6, -11), chest: { rot: 3, y: -0.5 }, head: { rot: 3 } }, ['sheet', 'open', 'elbowOutL']),
    p({ ...hold(-5, -6), chest: { rot: 1 } }, ['sheet']),
  ];
}

function breakSeal(): Pose[] {
  const hold = (lx: number, ly: number): B => ({
    letter: { x: lx, y: ly },
    handR: { x: 11 + lx - 7, y: -13 + ly + 1 },
    handL: { x: -10.5 + lx + 5, y: -14 + ly + 1 },
  });
  return [
    p({ ...hold(-4, -6), head: { rot: -4 } }, ['envelope']),
    p({ ...hold(-5, -9), chest: { rot: -3 }, head: { rot: -6 } }, ['envelope', 'grit']),
    p({ ...hold(-5, -9), chest: { rot: -3 }, head: { rot: -6 } }, ['envelope', 'cracked', 'grit']),
    p({ ...hold(-7, -16), chest: { rot: 6 }, head: { rot: 6 }, pelvis: { y: -1 } }, ['sheet', 'burst', 'open']),
    p({ ...hold(-8, -18), chest: { rot: 7 }, head: { rot: 7 }, pelvis: { y: -1 } }, ['sheet', 'open']),
    p({ ...hold(-6, -8), chest: { rot: 2 } }, ['sheet']),
  ];
}

function hit(): Pose[] {
  return [
    p(
      {
        pelvis: { x: 4, y: 1 },
        chest: { rot: 10, x: 1 },
        head: { rot: 12, x: 1 },
        cap: { rot: -14, x: 1 },
        strap: { rot: -14 },
        handR: { x: 8, y: -4 },
        handL: { x: 4, y: -2 },
        hem: { rot: -4 },
      },
      ['grit'],
    ),
    p(
      {
        pelvis: { x: 2, y: 1 },
        chest: { rot: 5 },
        head: { rot: 6 },
        cap: { rot: -10 },
        strap: { rot: -6 },
        handR: { x: 4, y: -2 },
        hem: { rot: -2 },
      },
      ['grit'],
    ),
  ];
}

function guard(): Pose[] {
  // Hold the satchel up as a shield.
  const g: B = {
    pelvis: { x: 1, y: 2 },
    chest: { rot: 4 },
    head: { rot: 6, y: 1 },
    strap: { rot: 62 },
    handR: { x: 0, y: -16 },
    handL: { x: -12, y: -14 },
    footR: { x: -2 },
    hem: { rot: -1 },
  };
  return [p(g, ['grit']), p({ ...g, pelvis: { x: 1, y: 2.5 }, chest: { rot: 5 } }, ['grit'])];
}

function knockedOut(): Pose[] {
  // Knocked back: stagger, drop to the knees, then fall on the back.
  return [
    p(
      {
        pelvis: { y: 4, x: 3 },
        chest: { rot: 14 },
        head: { rot: 16 },
        cap: { rot: -18, x: 1 },
        strap: { rot: -10 },
        handR: { x: 6, y: 4 },
        handL: { x: 3, y: 6 },
        footR: { x: -3 },
        hem: { rot: -6 },
      },
      ['grit'],
    ),
    p(
      {
        pelvis: { y: 15, x: 4, rot: 10 },
        chest: { rot: 22 },
        head: { rot: 18 },
        cap: { rot: -24, x: 1 },
        strap: { rot: -24 },
        handR: { x: 2, y: 12 },
        handL: { x: 0, y: 12 },
        footR: { x: -9 },
        footL: { x: 3 },
        hem: { rot: -10 },
      },
      ['blink'],
    ),
    p(
      {
        pelvis: { y: 24, x: -15, rot: 78 },
        chest: { rot: 6 },
        neck: { rot: 8 },
        head: { rot: 10 },
        cap: { rot: 30, x: 4, y: 2 },
        strap: { rot: -40 },
        handR: { x: 2, y: -2 },
        handL: { x: -4, y: -1 },
        footR: { x: -20, y: 0 },
        footL: { x: -14, y: 0 },
        hem: { rot: -6 },
      },
      ['blink'],
      { z: { capCrown: 4, visor: 4.1 } },
    ),
  ];
}

function victory(): Pose[] {
  // A fist thrown up on the far side, the other hand on the hip.
  return [
    p({ chest: { rot: -2 }, handL: { x: -3, y: -3 }, handR: { x: -2, y: -10 } }, ['fistR', 'happy', 'elbowOutL']),
    p(
      { chest: { rot: -5 }, pelvis: { y: -1 }, head: { rot: -4 }, handL: { x: -3, y: -3 }, handR: { x: -6, y: -30 }, strap: { rot: 4 } },
      ['fistR', 'happy', 'elbowOutL', 'elbowOutR'],
    ),
    p(
      { chest: { rot: -7 }, pelvis: { y: -2 }, head: { rot: -6 }, handL: { x: -3, y: -3 }, handR: { x: -8, y: -38 }, footL: { y: -2 }, strap: { rot: 8 } },
      ['fistR', 'happy', 'elbowOutL', 'elbowOutR'],
    ),
    p(
      { chest: { rot: -6 }, pelvis: { y: -1 }, head: { rot: -5 }, handL: { x: -3, y: -3 }, handR: { x: -7, y: -35 }, strap: { rot: 4 } },
      ['fistR', 'happy', 'elbowOutL', 'elbowOutR'],
    ),
  ];
}

export function rookieBattleSets(): SpriteSetDef[] {
  return [
    {
      id: 'rookie-battle',
      character: 'rookie',
      kind: 'battle',
      rig: rookieBattleRig(),
      anims: [
        anim('idle', idle(), 220),
        anim('attack', attack(), [120, 70, 70, 110, 160], false),
        anim('read', read(), [140, 140, 200, 300, 160], false),
        anim('breakSeal', breakSeal(), [160, 160, 120, 90, 260, 200], false),
        anim('hit', hit(), [120, 200], false),
        anim('guard', guard(), 240),
        anim('knockedOut', knockedOut(), [160, 160, 400], false),
        anim('victory', victory(), [160, 120, 260, 200]),
      ],
    },
  ];
}

