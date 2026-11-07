/**
 * Juniper Quill's dialogue portrait, 96x96. Authored facing left and
 * mirrored. A sleek dark bob with an ink-blue streak through the fringe, a
 * jeweller's loupe pushed up on her forehead, amber eyes, a confident
 * half-smile, a popped coat collar and a bandolier of sealing-wax sticks.
 */
import type { BoneDef, DetailDef, PartDef, Rig } from '../../rig';
import { capsule, ellipse, path, poly, type Shape } from '../../shapes';
import { SPRITE_SIZES, type SpriteSetDef } from '../../types';
import { type FaceGrids, faceDetails, portraitAnims } from '../portraitKit';
import { JUNIPER_MATERIALS } from './materials';

function pair(far: string[], near: string[], gap: number): string[] {
  const fw = Math.max(...far.map((r) => r.length));
  const rows = Math.max(far.length, near.length);
  const out: string[] = [];
  for (let i = 0; i < rows; i++) out.push((far[i] ?? '').padEnd(fw, '.') + '.'.repeat(gap) + (near[i] ?? ''));
  return out;
}

const GAP = 7;
const CLOSED = pair(['.......', '.......', '.......', 'o......', '.ooooo.', '..sss..'], ['..........', '..........', '..........', '.........o', '.oooooooo.', '..ssssss..'], GAP);

export const EYES: FaceGrids['eyes'] = {
  neutral: {
    open: pair(
      ['o......', 'ooooo..', 'oiiiiwo', 'ihpciW.', 'icpjw..', '.ijjw..', '..ss...'],
      ['.........o', '..oooooooo', '.oiiiiiwWo', '.ihpcciwW.', '.icpjjiw..', '..ijjjiw..', '...ssss...'],
      GAP,
    ),
    blink: CLOSED,
  },
  happy: {
    open: pair(
      ['o......', 'ooooo..', 'oiiiiwo', 'ihpciW.', '.sssss.'],
      ['.........o', '..oooooooo', '.oiiiiiwWo', '.ihpcciwW.', '..ssssss..'],
      GAP,
    ),
    blink: pair(['.......', '.......', '.......', 'o.ooo..', '.o...o.', '.......'], ['..........', '..........', '..........', '...ooooo.o', '..o.....o.', '.o........'], GAP),
  },
  sad: {
    open: pair(
      ['.......', '...oo..', 'ooooooo', 'ihpciW.', 'icpjw..', '.ijjw..', '..ss...'],
      ['..........', '.oo.......', '.oooooo...', '.ihpcooooo', '.icpjjiwW.', '..ijjjiw..', '...ssss...'],
      GAP,
    ),
    blink: pair(['.......', '.......', '.......', '.......', 'oooooo.', '..sss..'], ['..........', '..........', '..........', '..........', 'oooooooooo', '..ssssss..'], GAP),
  },
  angry: {
    open: pair(
      ['.......', '.......', 'oo.....', 'ooooooo', 'ihpciWo', '.ijjw..', '..ss...'],
      ['..........', '..........', '........oo', 'oooooooooo', '.ihpcciwWo', '..ijjjiw..', '...ssss...'],
      GAP,
    ),
    blink: pair(['.......', '.......', 'oo.....', '.ooooo.', '..sss..'], ['..........', '..........', '........oo', 'ooooooooo.', '..ssssss..'], GAP),
  },
  surprised: {
    open: pair(
      ['oooo...', 'owiiwo.', 'wihpiw.', 'wicpiw.', 'wwijw..', '.www...', '..ss...'],
      ['..oooooo.o', '.owwiiiwwo', 'wwihpciwW.', 'wwicpjiwW.', '.wwijjiww.', '..wwwwww..', '...ssss...'],
      GAP,
    ),
    blink: CLOSED,
  },
};

export const BROWS: FaceGrids['brows'] = {
  neutral: pair(['..bbb..', 'bb...b.', '.......'], ['...bbbbb..', '.bbB....bb', 'b.........'], GAP),
  happy: pair(['..bbb..', 'bb...b.', '.......'], ['...bbbbb..', '.bb.....bb', 'b.........'], GAP),
  sad: pair(['....bb.', '.bbb...', 'b......'], ['bb........', '..bbbbb...', '.......bbb'], GAP),
  angry: pair(['bb.....', '..bbb..', '.....bb'], ['.......bbb', '..bbbbb...', 'bb........'], GAP),
  surprised: pair(['.bbb...', 'b...b..', '.......'], ['..bbbbbb..', '.b......b.', '..........'], GAP),
};

export const MOUTHS: FaceGrids['mouths'] = {
  neutral: {
    closed: ['........m.', '..mmmmmm..', '...lLLl...'],
    half: ['........m.', '..mmmmmmm.', '..mrrrrm..', '...lLLl...'],
    open: ['...mmmmm..', '..mrrrrrm.', '..mrtttrm.', '...lLLl...'],
  },
  happy: {
    closed: ['..m.....m.', '...mmmmm..', '....lLl...'],
    half: ['..m.....m.', '..mmmmmmm.', '..mTTTTTm.', '...mrrrm..'],
    open: ['..mmmmmmm.', '..mTTTTTm.', '..mrrtrrm.', '...lLLl...'],
  },
  sad: {
    closed: ['..........', '...mmmmm..', '..m.lLl.m.'],
    half: ['..........', '...mmmmm..', '..mrrrrrm.', '..m.lLl.m.'],
    open: ['...mmmmm..', '..mrrrrrm.', '..mrtttrm.', '..mm...mm.'],
  },
  angry: {
    closed: ['..........', '..mmmmmmm.', '...l...l..'],
    half: ['..........', '..mmmmmmm.', '..mTTTTTm.', '..mmmmmmm.'],
    open: ['..mmmmmmm.', '.mTTTTTTTm', '.mrrrrrrrm', '..mmmmmmm.'],
  },
  surprised: {
    closed: ['..........', '....mm....', '...mrrm...', '....mm....'],
    half: ['....mmm...', '...mrrrm..', '...mrrrm..', '....mmm...'],
    open: ['...mmmmm..', '..mrrrrrm.', '..mrtttrm.', '...mmmmm..'],
  },
};

export const FACE_KEY: Record<string, string> = {
  o: 'eye:o',
  i: 'eye:3',
  c: 'eye:1',
  j: 'eye:0',
  p: 'eye:o',
  h: 'white:0',
  w: 'white:1',
  W: 'white:2',
  s: 'skin:2',
  S: 'skin:3',
  b: 'hair:1',
  B: 'hair:2',
  m: 'lips:2',
  l: 'lips:1',
  L: 'lips:0',
  r: 'lips:3',
  t: 'lips:1',
  T: 'white:1',
};

function bones(): BoneDef[] {
  return [
    { name: 'root', x: 50, y: 96 },
    { name: 'chest', parent: 'root', x: 0, y: -11 },
    { name: 'neck', parent: 'chest', x: 2, y: -14 },
    { name: 'head', parent: 'neck', x: 0, y: 0 },
    { name: 'loupe', parent: 'head', x: -8, y: -44 },
  ];
}

/** Wax sticks standing in the bandolier, as capsules along the strap. */
function sticks(ts: number[]): Shape {
  const a: [number, number] = [-30, -4];
  const b: [number, number] = [24, 15];
  const out: Shape = [];
  for (const t of ts) {
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    out.push(...capsule(x, y - 1, 1.6, x - 0.6, y - 8.5, 1.6));
  }
  return out;
}

function parts(): PartDef[] {
  return [
    {
      name: 'collarBack',
      bone: 'chest',
      z: 0.5,
      material: 'coat',
      shape: path('M 6 -10 L 21 -8 Q 25 -18 23 -26 Q 17 -29 11 -27 Z'),
      shade: { shadow: 3, light: 1, base: 2 },
    },
    {
      name: 'neck',
      bone: 'neck',
      z: 1,
      material: 'skin',
      shape: capsule(1, -8, 7.2, 3, 4, 7.8),
      shade: { shadow: 2, light: 0 },
    },
    {
      name: 'vest',
      bone: 'chest',
      z: 1.5,
      material: 'wine',
      shape: poly(-17, -10, 11, -11, 2, 15, -10, 15),
      shade: { shadow: 2, light: 1 },
    },
    {
      name: 'coat',
      bone: 'chest',
      z: 2,
      material: 'coat',
      shape: path('M -42 14 L -39 1 Q -33 -7 -17 -9 L 15 -10 Q 34 -8 40 2 L 44 14 Z'),
      cut: poly(-14, -11, 7, -12, -1, 15, -7, 15),
      shade: { shadow: 4, light: 1 },
      marks: [
        { tone: 0, shape: poly(-15, -9.4, -13.2, -10, -6.6, 14, -8.4, 14) },
        { tone: 2, shape: poly(25, -3, 27, -3, 31, 14, 29, 14) },
        { tone: 3, shape: poly(-34, 6, -22, 4.4, -22, 5.6, -34, 7.2) },
      ],
    },
    {
      name: 'collarFront',
      bone: 'chest',
      z: 2.5,
      material: 'coat',
      shape: poly(-24, -6, -14, -10, -13, -17, -20, -15),
      shade: { shadow: 1, light: 2, base: 0 },
      cast: 1,
    },
    {
      name: 'strap',
      bone: 'chest',
      z: 3,
      material: 'strap',
      shape: poly(-32, -7, -27, -2, 26, 18, 22, 12),
      shade: { shadow: 1, light: 1 },
    },
    { name: 'sticksRed', bone: 'chest', z: 3.5, material: 'waxRed', shape: sticks([0.2, 0.62]), shade: { shadow: 1, light: 1, dir: [1, 0] }, cast: 0 },
    { name: 'sticksGold', bone: 'chest', z: 3.5, material: 'waxGold', shape: sticks([0.34, 0.76]), shade: { shadow: 1, light: 1, dir: [1, 0] }, cast: 0 },
    { name: 'sticksWine', bone: 'chest', z: 3.5, material: 'wine', shape: sticks([0.48, 0.9]), shade: { shadow: 1, light: 1, dir: [1, 0] }, cast: 0 },
    {
      name: 'head',
      bone: 'head',
      z: 5,
      material: 'skin',
      shape: [
        ...ellipse(-1, -30, 20, 22),
        ...path(
          'M -18.6 -36 L -20.0 -24 L -22.0 -19.6 L -20.2 -17.2 L -19.6 -15 L -20.0 -12.6 L -18.8 -10.6 L -17.6 -7.4 Q -15 -3.6 -11 -3.6 Q -2 -5.4 8 -14 L 15 -24 L 10 -36 Z',
        ),
      ],
      shade: { shadow: 2, light: 1 },
    },
    {
      name: 'hair',
      bone: 'head',
      z: 6,
      material: 'hair',
      shape: path(
        'M -21.6 -26 Q -23.4 -52 -2 -53.8 Q 20.4 -54.2 22.6 -34 L 22.2 -14 Q 21 -6.2 16 -6 L 13.4 -6.6 L 13.2 -18 L 10.6 -24 L 9.6 -32 L 6 -38.2 L 1 -39.6 L -5 -39 L -10.6 -37.2 L -15.6 -34.2 L -19.4 -30.4 Z',
      ),
      shade: { shadow: 3, light: 1 },
      marks: [
        { tone: 0, shape: poly(-16, -45, -4, -50, -3.4, -49, -15.4, -44) },
        { tone: 0, shape: poly(4, -50.6, 14, -46, 13.6, -45.2, 4, -49.6) },
        { tone: 2, shape: poly(-6, -40, 4, -46, 4.6, -45.2, -5.4, -39.2) },
        { tone: 2, shape: poly(17, -32, 18.2, -32, 19, -10, 17.8, -10) },
      ],
      cast: 2,
    },
    {
      name: 'streak',
      bone: 'head',
      z: 6.2,
      material: 'streak',
      shape: path('M 0.4 -55 Q -10 -47 -20.4 -31.6 L -18.6 -30.6 Q -8.6 -43.6 3.6 -54.4 Z'),
      clipTo: ['hair'],
      shade: { shadow: 1, light: 1 },
      marks: [{ tone: 2, shape: path('M 1.4 -54.6 Q -7 -48 -15 -37 L -14.4 -36.6 Q -6 -47 2.4 -54.2 Z') }],
      sep: false,
      cast: 0,
      outline: false,
    },
    {
      name: 'band',
      bone: 'head',
      z: 6.4,
      material: 'strap',
      shape: (c) => {
        const a = c.p('loupe', 3.8, -1.2);
        const b = c.p('head', 21.6, -40);
        return poly(a[0], a[1] - 1, b[0], b[1] - 1, b[0], b[1] + 1, a[0], a[1] + 1);
      },
      clipTo: ['hair'],
      shade: { shadow: 0, light: 0, flat: true },
      sep: false,
      cast: 0,
      outline: false,
    },
    {
      name: 'loupe',
      bone: 'loupe',
      z: 7,
      material: 'brass',
      shape: [...ellipse(0, 0, 5.4, 5.2), ...capsule(3.6, 1.6, 1.4, 6, 2.6, 1.2)],
      shade: { shadow: 2, light: 1 },
      cast: 2,
    },
    {
      name: 'lens',
      bone: 'loupe',
      z: 7.1,
      material: 'glass',
      shape: ellipse(-0.3, -0.3, 3.4, 3.3),
      shade: { shadow: 1, light: 1 },
      marks: [{ tone: 0, shape: poly(-2.6, -1.6, -1.2, -3, -0.6, -2.4, -2, -1) }],
      sep: false,
      cast: 0,
    },
  ];
}

function details(): DetailDef[] {
  return [
    ...faceDetails(
      { eyes: EYES, brows: BROWS, mouths: MOUTHS },
      { bone: 'head', eyes: [-20, -32], brows: [-20, -36], mouth: [-18, -13] },
      FACE_KEY,
      ['head'],
    ),
    {
      name: 'nose',
      bone: 'head',
      x: -22,
      y: -22,
      grid: ['......s', '.....s.', '..ss...', 'SS.....'],
      key: FACE_KEY,
      clip: ['head'],
    },
    { name: 'blush', bone: 'head', x: -20, y: -20, grid: ['.LL..........L.L.L'], key: FACE_KEY, clip: ['head'] },
    { name: 'beautyMark', bone: 'head', x: 4, y: -20, grid: ['o'], key: FACE_KEY, clip: ['head'] },
    {
      name: 'earring',
      bone: 'head',
      x: 12,
      y: -9,
      grid: ['.aa.', 'a..c', 'b..c', '.cc.'],
      key: { a: 'brass:0', b: 'brass:1', c: 'brass:2' },
    },
    {
      name: 'vestButtons',
      bone: 'chest',
      x: -6,
      y: 2,
      grid: ['.a.', 'abc', '.c.', '...', '...', '...', '...', '.a.', 'abc', '.c.'],
      key: { a: 'brass:0', b: 'brass:1', c: 'brass:2' },
      clip: ['vest'],
    },
    {
      name: 'loops',
      bone: 'chest',
      x: -30,
      y: -5,
      grid: [
        '.aa...................................................',
        '......aaa.............................................',
        '..............aaa.....................................',
        '.....................aaa..............................',
        '...........................................................',
      ],
      key: { a: 'strap:0' },
      clip: ['strap'],
    },
  ];
}

export function juniperPortraitRig(): Rig {
  return {
    id: 'juniper-portrait',
    ...SPRITE_SIZES.portrait,
    materials: JUNIPER_MATERIALS,
    bones: bones(),
    parts: parts(),
    details: details(),
    mirror: true,
  };
}

export function juniperPortraitSets(): SpriteSetDef[] {
  return [
    {
      id: 'juniper-portrait',
      character: 'juniper',
      kind: 'portrait',
      rig: juniperPortraitRig(),
      anims: portraitAnims((f) =>
        f.expr === 'sad'
          ? { bones: { head: { rot: 3, y: 1 } } }
          : f.expr === 'happy'
            ? { bones: { head: { rot: -2 } } }
            : f.expr === 'surprised'
              ? { bones: { head: { y: -1 } } }
              : {},
      ),
    },
  ];
}
