/**
 * Odile Marsh's battle sprite, 64x96, three-quarter view facing left. She
 * stoops a little and keeps her stamp-topped stick in her near (left) hand.
 * Her attack swings the stick and stamps the target with the brass head.
 */
import type { BoneDef, DetailDef, PartDef, Pose, Rig, ShapeContext } from '../../rig';
import { capsule, ellipse, limb, path, poly, roundRect } from '../../shapes';
import { anim, SPRITE_SIZES, type SpriteSetDef } from '../../types';
import { ik, lerpPt, type Pt } from '../kit';
import { ODILE_MATERIALS } from './materials';

const UPPER_ARM = 11;
const FOREARM = 10.5;

function bones(): BoneDef[] {
  return [
    { name: 'root', x: 32, y: 93 },
    { name: 'pelvis', parent: 'root', x: 0, y: -33 },
    { name: 'chest', parent: 'pelvis', x: 0, y: -12, rot: -4 },
    { name: 'neck', parent: 'chest', x: -1.5, y: -9.5 },
    { name: 'head', parent: 'neck', x: 0, y: 0 },
    { name: 'hem', parent: 'pelvis', x: 0, y: 0 },
    { name: 'handR', parent: 'chest', x: -10, y: 12 },
    { name: 'handL', parent: 'chest', x: 11.5, y: 11 },
    { name: 'footR', parent: 'root', x: -5, y: 0 },
    { name: 'footL', parent: 'root', x: 4, y: 0 },
    // Stick: gripped in the left hand. `stickGrip` turns it, `stick` slides it along its length.
    { name: 'stickGrip', parent: 'handL', x: 0, y: 0, rot: 4 },
    { name: 'stick', parent: 'stickGrip', x: 0, y: 0 },
    { name: 'letter', parent: 'handR', x: -2, y: -4 },
  ];
}

function armChain(c: ShapeContext, side: 'L' | 'R'): { s: Pt; e: Pt; h: Pt } {
  const s = side === 'L' ? c.p('chest', 7.6, -6.8) : c.p('chest', -7.4, -6.6);
  const target = c.p(`hand${side}`);
  const bend = c.flags.has(`elbowOut${side}`) ? 1 : -1;
  const { joint, end } = ik(s, target, UPPER_ARM, FOREARM, bend);
  return { s, e: joint, h: end };
}

function armParts(side: 'L' | 'R', z: number): PartDef[] {
  return [
    {
      name: `sleeve${side}`,
      bone: 'chest',
      z,
      material: 'cardigan',
      shape: (c) => {
        const { s, e, h } = armChain(c, side);
        const w = lerpPt(e, h, 0.8);
        return limb([
          [s[0], s[1], 3.5],
          [e[0], e[1], 3.1],
          [w[0], w[1], 2.8],
        ]);
      },
      shade: { shadow: 2, light: 1 },
    },
    {
      name: `cuff${side}`,
      bone: 'chest',
      z: z + 0.1,
      material: 'cardigan',
      shape: (c) => {
        const { e, h } = armChain(c, side);
        const p = lerpPt(e, h, 0.78);
        const q = lerpPt(e, h, 0.95);
        return capsule(p[0], p[1], 2.9, q[0], q[1], 2.7);
      },
      shade: { shadow: 1, light: 1, base: 2 },
      sep: false,
    },
    {
      name: `glove${side}`,
      bone: 'chest',
      z: z + 0.2,
      material: 'gloves',
      shape: (c) => {
        const { e, h } = armChain(c, side);
        const dx = h[0] - e[0];
        const dy = h[1] - e[1];
        const len = Math.hypot(dx, dy) || 1;
        return ellipse(h[0] + (dx / len) * 1.4, h[1] + (dy / len) * 1.4, 2.6, 2.6);
      },
      shade: { shadow: 1, light: 1 },
      cast: 0,
    },
    {
      name: `fingers${side}`,
      bone: 'chest',
      z: z + 0.15,
      material: 'skin',
      shape: (c) => {
        const { e, h } = armChain(c, side);
        const dx = h[0] - e[0];
        const dy = h[1] - e[1];
        const len = Math.hypot(dx, dy) || 1;
        return ellipse(h[0] + (dx / len) * 3.8, h[1] + (dy / len) * 3.8, 1.9, 1.7);
      },
      shade: { shadow: 1, light: 0 },
      cast: 0,
    },
  ];
}

function stickParts(z: number): PartDef[] {
  return [
    {
      name: 'stick',
      bone: 'stick',
      z,
      material: 'wood',
      shape: poly(-0.9, -8, 0.9, -8, 0.8, 33, -0.8, 33),
      shade: { shadow: 1, light: 1, dir: [1, 0] },
      thin: true,
    },
    {
      name: 'stamp',
      bone: 'stick',
      z: z + 0.1,
      material: 'brass',
      shape: [...capsule(0, -7.6, 1.6, 0, -10.4, 1.3), ...roundRect(-3.4, -14.4, 6.8, 4, 1)],
      marks: [{ tone: 3, shape: poly(-3.4, -14.4, 3.4, -14.4, 3.4, -13.4, -3.4, -13.4) }],
      shade: { shadow: 1, light: 1 },
      cast: 0,
    },
  ];
}

function parts(): PartDef[] {
  const out: PartDef[] = [];
  out.push(...armParts('R', 2));
  for (const side of ['R', 'L'] as const) {
    out.push({
      name: `boot${side}`,
      bone: `foot${side}`,
      z: side === 'L' ? 3.2 : 3.1,
      material: 'boots',
      shape: path('M -5.8 0.4 L -6 -1.6 Q -5.4 -3.8 -2.6 -4 L 3 -4 L 3.4 0.4 Z'),
      shade: { shadow: 1, light: 1 },
    });
  }
  out.push({
    name: 'skirt',
    bone: 'hem',
    z: 3.5,
    material: 'skirt',
    shape: path('M -7.6 -1 L 8.2 -1 L 11.6 29.6 L -11.2 29.6 Z'),
    shade: { shadow: 3, light: 1 },
    marks: [
      { tone: 2, shape: poly(-3, 12, -2.2, 12, -3.4, 29.6, -4.2, 29.6) },
      { tone: 2, shape: poly(3.4, 12, 4.2, 12, 6.0, 29.6, 5.2, 29.6) },
      { tone: 0, shape: poly(-8.2, 16, -7.4, 16, -8.6, 29.6, -9.4, 29.6) },
    ],
  });
  out.push({
    name: 'blouse',
    bone: 'chest',
    z: 4,
    material: 'blouse',
    shape: poly(-6.4, -10.6, 2.4, -10.8, 0.4, 12.4, -5.6, 12.4),
    shade: { shadow: 1, light: 1 },
    marks: [{ tone: 2, shape: poly(-3.4, -4, -2.8, -4, -2.8, 12, -3.4, 12) }],
  });
  out.push({
    name: 'neck',
    bone: 'neck',
    z: 4.5,
    material: 'skin',
    shape: capsule(0.8, -4, 3.0, 1.2, 1.4, 3.1),
    shade: { shadow: 1, light: 0 },
  });
  out.push({
    name: 'collar',
    bone: 'chest',
    z: 4.6,
    material: 'blouse',
    shape: [...ellipse(-4.6, -10.2, 3.2, 1.8), ...ellipse(1.2, -10.4, 3.0, 1.7)],
    shade: { shadow: 1, light: 1, base: 0 },
  });
  out.push({
    name: 'cardigan',
    bone: 'chest',
    z: 5,
    material: 'cardigan',
    shape: path('M -5.4 -10 L 5.6 -10.4 Q 9.4 -9.6 9.8 -5.6 L 9.6 4 L 9.2 12.4 L -8.2 12.4 L -8.6 4 L -8.8 -5.6 Q -9 -9.4 -5.4 -10 Z'),
    cut: poly(-5.8, -11, 1.6, -11, -1.6, 13, -5.0, 13),
    shade: { shadow: 3, light: 1 },
    marks: [
      { tone: 0, shape: poly(-5.8, -9.8, -4.8, -9.8, -4.0, 12.4, -5.0, 12.4) },
      { tone: 2, shape: poly(3.6, 0, 4.4, 1.6, 3.8, 5, 3.0, 3.4) },
    ],
  });
  out.push({
    name: 'cardiganHem',
    bone: 'hem',
    z: 5.1,
    material: 'cardigan',
    shape: path('M -8.6 -2.5 L 9.4 -2.5 L 11.6 15.4 L -10.8 15.4 Z'),
    cut: poly(-5.2, -3, -1.4, -3, 0.2, 16, -6.2, 16),
    shade: { shadow: 3, light: 1 },
    marks: [
      { tone: 0, shape: poly(-6.0, -2.5, -5.0, -2.5, -6.0, 15.4, -7.0, 15.4) },
      { tone: 2, shape: poly(-10.8, 13.8, 11.6, 13.8, 11.6, 15.4, -10.8, 15.4) },
      { tone: 2, shape: poly(5, 2, 5.8, 2, 7.6, 14, 6.8, 14) },
      { tone: 3, shape: poly(1.6, 4, 6.2, 4, 6.2, 4.8, 1.6, 4.8) },
    ],
    sep: false,
    cast: 0,
  });

  out.push(...stickParts(9.05));
  out.push({
    name: 'envelope',
    bone: 'letter',
    z: 8.6,
    material: 'paper',
    shape: roundRect(-6, -4, 12, 8.4, 0.8),
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
  out.push(...armParts('L', 9));

  out.push({
    name: 'head',
    bone: 'head',
    z: 10,
    material: 'skin',
    shape: [
      ...ellipse(0.6, -12.6, 8.2, 8.8),
      ...path('M -7.4 -13.6 L -7.9 -11.4 L -8.9 -9.4 L -7.8 -8.6 L -7.6 -6.6 Q -6.2 -2.4 -3 -2 Q 1.6 -2 5.2 -5.6 L 7.2 -10 Z'),
    ],
    shade: { shadow: 2, light: 1 },
  });
  out.push({
    name: 'hair',
    bone: 'head',
    z: 11,
    material: 'hair',
    shape: path(
      'M -8.6 -13.2 Q -8.4 -21.8 1 -22 Q 9.8 -21.8 9.4 -12.4 L 8.8 -7 Q 7.6 -4.8 5.6 -5.8 L 5.0 -10 L 3.2 -11.6 L 1.6 -15.4 L -2.2 -16.6 L -5.8 -16.0 L -8.0 -14.6 Z',
    ),
    shade: { shadow: 2, light: 1 },
    marks: [
      { tone: 0, shape: poly(-5, -19.6, 1, -20.6, 0.6, -19.8, -4.6, -18.8) },
      { tone: 2, shape: poly(2, -18, 7.6, -16, 7.4, -15.2, 2, -17.2) },
    ],
    cast: 1,
  });
  out.push({
    name: 'bun',
    bone: 'head',
    z: 11.2,
    material: 'hair',
    shape: ellipse(6.6, -21.4, 5.4, 4.6),
    shade: { shadow: 2, light: 1 },
    cast: 1,
  });
  out.push({
    name: 'ear',
    bone: 'head',
    z: 11.5,
    material: 'skin',
    shape: ellipse(6.4, -11, 1.8, 2.6),
    shade: { shadow: 1, light: 1 },
    cast: 0,
  });
  return out;
}

function details(): DetailDef[] {
  const faceKey = {
    o: 'eye:o',
    e: 'eye:1',
    h: 'glass:0',
    g: 'brass:3',
    l: 'skin:2',
    b: 'hair:2',
    m: 'skin:3',
    c: 'blush:1',
    w: 'white:1',
    r: 'blush:3',
  };
  return [
    {
      name: 'eyes',
      bone: 'head',
      x: -10,
      y: -16,
      grid: [
        '...bb.....bbb...', //
        '.gggg....ggggg..',
        'gh..ggggghh...g.',
        'g.oo.g..g.ooo.gg',
        'g.eo.g..g.eoo.g.',
        '.gggg....ggggg..',
        '..l........ll...',
      ],
      key: faceKey,
      clip: ['head', 'hair'],
      unless: 'blink|grit|happy',
    },
    {
      name: 'eyesClosed',
      bone: 'head',
      x: -10,
      y: -16,
      grid: ['...bb.....bbb...', '.gggg....ggggg..', 'gh..ggggghh...g.', 'g....g..g.....gg', 'g.oo.g..g.ooo.g.', '.gggg....ggggg..', '..l........ll...'],
      key: faceKey,
      clip: ['head', 'hair'],
      when: 'blink',
    },
    {
      name: 'eyesHappy',
      bone: 'head',
      x: -10,
      y: -16,
      grid: ['...bb.....bbb...', '.gggg....ggggg..', 'gh..ggggghh...g.', 'g.oo.g..g.ooo.gg', 'go..og..go...og.', '.gggg....ggggg..', '..l........ll...'],
      key: faceKey,
      clip: ['head', 'hair'],
      when: 'happy',
    },
    {
      name: 'eyesGrit',
      bone: 'head',
      x: -10,
      y: -16,
      grid: ['....b.....b.....', '.ggbg....gbggg..', 'gh..ggggghh...g.', 'g.oo.g..g.ooo.gg', 'g..o.g..g..o..g.', '.gggg....ggggg..', '..l........ll...'],
      key: faceKey,
      clip: ['head', 'hair'],
      when: 'grit',
    },
    {
      name: 'face',
      bone: 'head',
      x: -10,
      y: -9,
      grid: ['.l..............', '..cc.......cc...', '................'],
      key: faceKey,
      clip: ['head'],
    },
    {
      name: 'temple',
      bone: 'head',
      x: 4,
      y: -14,
      grid: ['gg', '..g'],
      key: faceKey,
      clip: ['head', 'hair', 'ear'],
    },
    {
      name: 'mouth',
      bone: 'head',
      x: -7,
      y: -6,
      grid: ['m...m', '.mmm.'],
      key: faceKey,
      clip: ['head'],
      unless: 'grit|open',
    },
    {
      name: 'mouthOpen',
      bone: 'head',
      x: -7,
      y: -6,
      grid: ['.mmm.', 'mrrrm', '.mmm.'],
      key: faceKey,
      clip: ['head'],
      when: 'open',
    },
    {
      name: 'mouthGrit',
      bone: 'head',
      x: -7,
      y: -6,
      grid: ['mmmmm', '.mmm.'],
      key: faceKey,
      clip: ['head'],
      when: 'grit',
    },
    {
      name: 'braid',
      bone: 'head',
      x: 2,
      y: -25,
      grid: ['..a..a..', '.a..a..a', 'a..a..a.', '.a..a..a', '..a..a..'],
      key: { a: 'hair:3' },
      clip: ['bun'],
    },
    {
      name: 'chain',
      bone: 'chest',
      x: -6,
      y: -10,
      grid: ['.........a', '........a.', '.......a..', '......a...', '.....a....', '....a.....', '..aa......', '.a........', 'a.........'],
      key: { a: 'brass:1' },
      clip: ['blouse', 'collar', 'neck', 'cardigan'],
    },
    {
      name: 'buttons',
      bone: 'chest',
      x: -6,
      y: -2,
      grid: ['a', '.', '.', '.', '.', 'a', '.', '.', '.', '.', 'a'],
      key: { a: 'cardigan:0' },
      clip: ['cardigan'],
    },
    {
      name: 'ink',
      bone: 'handR',
      x: -4,
      y: 2,
      grid: ['a.b', '.a.'],
      key: { a: 'inkStain:1', b: 'inkStain:2' },
      clip: ['fingersR', 'gloveR'],
    },
    {
      name: 'stampFace',
      bone: 'stick',
      x: -2,
      y: -13,
      grid: ['abba'],
      key: { a: 'brass:2', b: 'brass:0' },
      clip: ['stamp'],
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

export function odileBattleRig(): Rig {
  return {
    id: 'odile-battle',
    ...SPRITE_SIZES.battle,
    materials: ODILE_MATERIALS,
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
  const breath = [0, 0.5, 1, 0.5];
  return breath.map((b, i) =>
    p(
      {
        chest: { y: b * 0.5 },
        head: { rot: b * 1.2, y: b * 0.2 },
        hem: { rot: [0, -0.4, -0.8, -0.4][i] ?? 0 },
        handR: { y: -b * 0.5 },
      },
      i === 3 ? ['blink'] : [],
    ),
  );
}

function attack(): Pose[] {
  // Stamped: she slides her grip to the foot of the stick, lifts it, swings it
  // over and brings the brass head down on the target.
  return [
    p(
      {
        pelvis: { x: 1 },
        chest: { rot: 6 },
        head: { rot: 4 },
        handL: { x: -4, y: -14 },
        stickGrip: { rot: -14 },
        stick: { y: -18 },
        handR: { x: 2, y: -2 },
      },
      ['elbowOutL'],
    ),
    p(
      {
        pelvis: { x: -2 },
        chest: { rot: -4 },
        head: { rot: -2 },
        handL: { x: -10, y: -18 },
        stickGrip: { rot: -62 },
        stick: { y: -20 },
        footR: { x: -3 },
      },
      ['grit', 'elbowOutL'],
    ),
    p(
      {
        pelvis: { x: -6, y: 1 },
        chest: { rot: -14 },
        head: { rot: -6 },
        handL: { x: -16, y: -10 },
        stickGrip: { rot: -118 },
        stick: { y: -20 },
        footR: { x: -7 },
        hem: { rot: 4 },
      },
      ['grit', 'elbowOutL'],
    ),
    p(
      {
        pelvis: { x: -6, y: 1 },
        chest: { rot: -15 },
        head: { rot: -6 },
        handL: { x: -16, y: -8 },
        stickGrip: { rot: -126 },
        stick: { y: -20 },
        footR: { x: -7 },
        hem: { rot: 3 },
      },
      ['open', 'elbowOutL'],
    ),
    p({ pelvis: { x: -2 }, chest: { rot: -6 }, handL: { x: -3, y: -3 }, stickGrip: { rot: -8 }, stick: { y: -2 } }),
  ];
}

function read(): Pose[] {
  // Holds the letter out at arm's length to read it through her spectacles.
  return [
    p({ handR: { x: -2, y: -8 } }, ['envelope']),
    p({ handR: { x: -4, y: -16 }, head: { rot: -2 } }, ['envelope']),
    p({ handR: { x: -12, y: -18 }, head: { rot: 6 }, chest: { rot: 2 } }, ['sheet']),
    p({ handR: { x: -14, y: -20 }, head: { rot: 8 }, chest: { rot: 3 } }, ['sheet', 'open']),
    p({ handR: { x: -8, y: -12 }, head: { rot: 2 } }, ['sheet', 'happy']),
  ];
}

function breakSeal(): Pose[] {
  return [
    p({ handR: { x: -4, y: -14 }, head: { rot: -2 } }, ['envelope']),
    p({ handR: { x: -5, y: -16 }, chest: { rot: -3 }, head: { rot: -4 } }, ['envelope', 'grit']),
    p({ handR: { x: -5, y: -16 }, chest: { rot: -3 }, head: { rot: -4 } }, ['envelope', 'cracked', 'grit']),
    p({ handR: { x: -8, y: -26 }, chest: { rot: 6 }, head: { rot: 6 }, pelvis: { y: -1 } }, ['sheet', 'burst', 'open']),
    p({ handR: { x: -9, y: -28 }, chest: { rot: 7 }, head: { rot: 7 }, pelvis: { y: -1 } }, ['sheet', 'open']),
    p({ handR: { x: -6, y: -16 }, chest: { rot: 2 } }, ['sheet']),
  ];
}

function hit(): Pose[] {
  return [
    p(
      { pelvis: { x: 3 }, chest: { rot: 10, x: 1 }, head: { rot: 12 }, handR: { x: 6, y: -4 }, handL: { x: 2, y: -2 }, stickGrip: { rot: 10 }, hem: { rot: -4 } },
      ['grit'],
    ),
    p({ pelvis: { x: 1 }, chest: { rot: 5 }, head: { rot: 6 }, handR: { x: 3, y: -2 }, stickGrip: { rot: 7 }, hem: { rot: -2 } }, ['grit']),
  ];
}

function guard(): Pose[] {
  // The stick held crosswise in both hands.
  const g: B = {
    pelvis: { y: 1 },
    chest: { rot: 4 },
    head: { rot: 6, y: 1 },
    handL: { x: -6, y: -14 },
    handR: { x: 7, y: -17 },
    stickGrip: { rot: -76 },
    stick: { y: -9.5 },
  };
  return [p(g, ['grit']), p({ ...g, pelvis: { y: 1.5 }, chest: { rot: 5 } }, ['grit'])];
}

function knockedOut(): Pose[] {
  return [
    p(
      { pelvis: { x: 2, y: 3 }, chest: { rot: 12 }, head: { rot: 14 }, handR: { x: 5, y: 4 }, handL: { x: 1, y: 2 }, stickGrip: { rot: 12 }, hem: { rot: -5 } },
      ['grit'],
    ),
    // Down to her knees, leaning on the stick.
    p(
      {
        pelvis: { y: 14, x: 1 },
        hem: { sy: 0.55, rot: -3 },
        chest: { rot: -14 },
        head: { rot: -16 },
        handL: { x: -6, y: -2 },
        stickGrip: { rot: -10 },
        stick: { y: -12 },
        handR: { x: 1, y: 6 },
      },
      ['blink'],
    ),
    // Slumped forward with the stick fallen beside her.
    p(
      {
        pelvis: { y: 20, x: 2 },
        hem: { sy: 0.4, rot: -2 },
        chest: { rot: -48 },
        neck: { rot: -10 },
        head: { rot: -24 },
        handL: { x: -2, y: 6 },
        handR: { x: -4, y: 8 },
        stickGrip: { rot: -96 },
        stick: { y: 2 },
      },
      ['blink'],
    ),
  ];
}

function victory(): Pose[] {
  // Taps the stick down and settles her spectacles.
  return [
    p({ head: { rot: -2 } }, ['happy']),
    p({ handL: { y: -4 }, stickGrip: { rot: 2 }, handR: { x: 3, y: -22 }, head: { rot: -4 } }, ['happy']),
    p({ handR: { x: 3, y: -34 }, head: { rot: -5 } }, ['happy']),
    p({ handR: { x: 3, y: -33 }, head: { rot: -4 } }, ['happy', 'open']),
  ];
}

export function odileBattleSets(): SpriteSetDef[] {
  return [
    {
      id: 'odile-battle',
      character: 'odile',
      kind: 'battle',
      rig: odileBattleRig(),
      anims: [
        anim('idle', idle(), 260),
        anim('attack', attack(), [150, 90, 80, 140, 180], false),
        anim('read', read(), [150, 150, 220, 320, 180], false),
        anim('breakSeal', breakSeal(), [160, 160, 120, 90, 260, 200], false),
        anim('hit', hit(), [120, 200], false),
        anim('guard', guard(), 260),
        anim('knockedOut', knockedOut(), [160, 200, 400], false),
        anim('victory', victory(), [200, 140, 260, 300]),
      ],
    },
  ];
}
