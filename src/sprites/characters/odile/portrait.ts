/**
 * Odile Marsh's dialogue portrait, 96x96. Authored facing left and mirrored.
 * Grey hair swept back into a braided bun, round spectacles on a chain, a
 * plum cardigan over a cream blouse.
 */
import type { BoneDef, DetailDef, PartDef, Rig } from '../../rig';
import { capsule, ellipse, path, poly } from '../../shapes';
import { SPRITE_SIZES, type SpriteSetDef } from '../../types';
import { dottedPixels, type FaceGrids, faceDetails, gridFromPixels, portraitAnims, ringPixels } from '../portraitKit';
import { ODILE_MATERIALS } from './materials';

function pair(far: string[], near: string[], gap: number): string[] {
  const fw = Math.max(...far.map((r) => r.length));
  const rows = Math.max(far.length, near.length);
  const out: string[] = [];
  for (let i = 0; i < rows; i++) out.push((far[i] ?? '').padEnd(fw, '.') + '.'.repeat(gap) + (near[i] ?? ''));
  return out;
}

const GAP = 8;
const CLOSED = pair(['......', '......', '......', '.oooo.', 'o.ss.o'], ['........', '........', '........', '.oooooo.', 'o.ssss.o'], GAP);

const EYES: FaceGrids['eyes'] = {
  neutral: {
    open: pair(['......', '.oooo.', 'oiiiwo', 'ihIjW.', '.iiw..', '..ss..'], ['........', '..oooooo', '.oiiiiwo', '.ihIjiW.', '..iijw..', '...sss..'], GAP),
    blink: CLOSED,
  },
  happy: {
    open: pair(['......', '.oooo.', 'oihIwo', '.ssss.'], ['........', '..oooooo', '.oihIiwo', '..ssssss'], GAP),
    blink: pair(['......', '......', '.ooo..', 'o...o.'], ['........', '........', '..oooo..', '.o....o.', 'o......o'], GAP),
  },
  sad: {
    open: pair(['......', '...oo.', '.ooooo', 'ihIjW.', '.iiw..', '..ss..'], ['........', '..oo....', '.ooooooo', '.oiIjiwo', '..iijw..', '...sss..'], GAP),
    blink: pair(['......', '......', '......', 'ooooo.', '..ss..'], ['........', '........', '........', 'oooooooo', '..ssss..'], GAP),
  },
  angry: {
    open: pair(['......', '......', 'oo....', 'oooooo', 'ihIjWo', '.iiw..'], ['........', '........', '......oo', 'oooooooo', '.ihIjiWo', '..iijw..'], GAP),
    blink: pair(['......', '......', 'oo....', '.oooo.', '..ss..'], ['........', '........', '......oo', 'ooooooo.', '..ssss..'], GAP),
  },
  surprised: {
    open: pair(['.oooo.', 'owiiwo', 'whIjw.', 'wiiiw.', '.www..', '..ss..'], ['..oooooo', '.owiiiwo', 'wwhIjiw.', 'wwiiiiw.', '.wwwww..', '...sss..'], GAP),
    blink: CLOSED,
  },
};

const BROWS: FaceGrids['brows'] = {
  neutral: pair(['......', '.bbbb.', 'b....B'], ['........', '.bbbbbb.', 'B......b'], GAP),
  happy: pair(['......', '.bbbb.', 'b....b'], ['........', '.bbbbbb.', 'b......b'], GAP),
  sad: pair(['....bb', '.bbb..', 'b.....'], ['bb......', '..bbbb..', '......bb'], GAP),
  angry: pair(['bb....', '..bbb.', '.....B'], ['......bb', '..bbbb..', 'B.......'], GAP),
  surprised: pair(['.bbbb.', 'b....b', '......'], ['.bbbbbb.', 'b......b', '........'], GAP),
};

const MOUTHS: FaceGrids['mouths'] = {
  neutral: {
    closed: ['..s.....s..', '...SSSSS...', '....LLL....'],
    half: ['...........', '..sSSSSSs..', '...SrrrS...', '....LLL....'],
    open: ['...SSSSS...', '..SrrrrrS..', '..SrtttrS..', '...SLLLS...'],
  },
  happy: {
    closed: ['..S.....S..', '...SSSSS...', '....LLL....'],
    half: ['..S.....S..', '..SSSSSSS..', '..STTTTTS..', '...SrrrS...'],
    open: ['..SSSSSSS..', '..STTTTTS..', '..SrrtrrS..', '...SLLLS...'],
  },
  sad: {
    closed: ['...........', '...SSSSS...', '..S.LLL.S..'],
    half: ['...........', '...SSSSS...', '..SrrrrrS..', '..S.LLL.S..'],
    open: ['...SSSSS...', '..SrrrrrS..', '..SrtttrS..', '..SS...SS..'],
  },
  angry: {
    closed: ['...........', '..SSSSSSS..', '...s...s...'],
    half: ['...........', '..SSSSSSS..', '..STTTTTS..', '..SSSSSSS..'],
    open: ['..SSSSSSS..', '.STTTTTTTS.', '.SrrrrrrrS.', '..SSSSSSS..'],
  },
  surprised: {
    closed: ['...........', '....SS.....', '...SrrS....', '....SS.....'],
    half: ['....SSS....', '...SrrrS...', '...SrrrS...', '....SSS....'],
    open: ['...SSSSS...', '..SrrrrrS..', '..SrtttrS..', '...SSSSS...'],
  },
};

const FACE_KEY: Record<string, string> = {
  o: 'eye:o',
  i: 'eye:2',
  I: 'eye:1',
  j: 'eye:0',
  h: 'white:0',
  w: 'white:1',
  W: 'white:2',
  s: 'skin:2',
  S: 'skin:3',
  L: 'blush:2',
  b: 'hair:2',
  B: 'hair:3',
  r: 'blush:3',
  t: 'blush:1',
  T: 'white:1',
};

function bones(): BoneDef[] {
  return [
    { name: 'root', x: 50, y: 96 },
    { name: 'chest', parent: 'root', x: 0, y: -11 },
    { name: 'neck', parent: 'chest', x: 2, y: -14 },
    { name: 'head', parent: 'neck', x: 0, y: 0 },
  ];
}

function parts(): PartDef[] {
  return [
    {
      name: 'neck',
      bone: 'neck',
      z: 1,
      material: 'skin',
      shape: capsule(1, -8, 8, 3, 4, 8.6),
      shade: { shadow: 2, light: 0 },
    },
    {
      name: 'blouse',
      bone: 'chest',
      z: 1.5,
      material: 'blouse',
      shape: poly(-19, -11, 13, -12.5, 3, 14, -11, 14),
      shade: { shadow: 2, light: 1 },
    },
    {
      name: 'cardigan',
      bone: 'chest',
      z: 2,
      material: 'cardigan',
      shape: path('M -44 14 L -41 0 Q -34 -8 -18 -10 L 16 -11 Q 36 -9 42 2 L 46 14 Z'),
      cut: poly(-15, -12, 9, -13, -1, 15, -9, 15),
      shade: { shadow: 4, light: 1 },
      marks: [
        { tone: 0, shape: poly(-16.5, -10, -14.5, -10.5, -8.4, 14, -10.4, 14) },
        { tone: 3, shape: poly(9, -12.5, 11, -12, 1, 14, -0.8, 14) },
        { tone: 2, shape: poly(24, -4, 26, -4, 30, 14, 28, 14) },
        { tone: 2, shape: poly(-32, -2, -22, -4, -22, -3, -32, -1) },
      ],
    },
    {
      name: 'collar',
      bone: 'chest',
      z: 3,
      material: 'blouse',
      shape: [...ellipse(-9.5, -8.5, 7.5, 4.2), ...ellipse(5, -9.2, 6.8, 3.8)],
      shade: { shadow: 1, light: 1, base: 0 },
    },
    {
      name: 'head',
      bone: 'head',
      z: 5,
      material: 'skin',
      shape: [
        ...ellipse(-1, -30, 20.5, 22),
        ...path(
          'M -19 -36 L -20.4 -24 L -22.2 -19.5 L -20.6 -17 L -20.2 -15 L -20.4 -12.6 L -19.4 -10.6 L -18.6 -8 Q -17 -4.4 -12.4 -4 L -6 -4.6 Q 6 -8 12 -16 L 16 -24 L 10 -36 Z',
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
        'M -20.6 -34 Q -21.6 -50 -4 -52.6 Q 16 -53.2 21.6 -36 L 21.2 -18 Q 19 -10.6 14.2 -11.4 L 13.2 -20 L 10.4 -24 L 9.4 -32 L 5 -37.6 L -2 -40.2 L -10 -40 L -16 -38 Z',
      ),
      shade: { shadow: 3, light: 1 },
      marks: [
        { tone: 0, shape: poly(-16, -43, -4, -47.5, -3.6, -46.6, -15.6, -42) },
        { tone: 0, shape: poly(-12, -40.8, 2, -44.6, 2.4, -43.8, -11.6, -40) },
        { tone: 2, shape: poly(4, -41, 16, -38, 16, -37, 4, -40) },
        { tone: 2, shape: poly(14, -32, 15.2, -32, 16.2, -18, 15, -18) },
      ],
      cast: 2,
    },
    {
      name: 'ear',
      bone: 'head',
      z: 6.5,
      material: 'skin',
      shape: ellipse(14.6, -26, 3.6, 5.4),
      shade: { shadow: 2, light: 1 },
      marks: [{ tone: 2, shape: poly(13.6, -29, 15, -29, 15, -23, 13.6, -23) }],
      cast: 1,
    },
    {
      name: 'bun',
      bone: 'head',
      z: 7,
      material: 'hair',
      shape: [...ellipse(12.5, -48.5, 9.6, 7.8), ...ellipse(17, -42, 4.6, 4)],
      shade: { shadow: 3, light: 1 },
      cast: 2,
    },
  ];
}

function spectacles(): DetailDef[] {
  const frame = [
    ...ringPixels(-17.5, -27.5, 4.6, 5.4, 'g'),
    ...ringPixels(-2.5, -27.5, 6.2, 5.6, 'g'),
    // Bridge and the arm back to the ear.
    [-13, -29, 'g'] as [number, number, string],
    [-12, -30, 'g'] as [number, number, string],
    [-11, -30, 'g'] as [number, number, string],
    [-10, -30, 'g'] as [number, number, string],
    [-9, -29, 'g'] as [number, number, string],
    ...dottedPixels(
      [
        [4, -29],
        [11, -29],
      ],
      1,
      'G',
    ),
  ];
  const glint: [number, number, string][] = [
    [-20, -31, 'h'],
    [-19, -32, 'h'],
    [-6, -31, 'h'],
    [-5, -32, 'h'],
    [-4, -32, 'h'],
  ];
  const chain = dottedPixels(
    [
      [12, -27],
      [15, -18],
      [15, -8],
      [12, 1],
      [6, 9],
      [-2, 13],
      [-10, 14],
    ],
    2,
    'c',
  );
  const f = gridFromPixels([...frame, ...glint]);
  const c = gridFromPixels(chain);
  return [
    { name: 'spectacles', bone: 'head', x: f.x, y: f.y, grid: f.grid, key: { g: 'brass:2', G: 'brass:3', h: 'glass:0' } },
    { name: 'chain', bone: 'head', x: c.x, y: c.y, grid: c.grid, key: { c: 'brass:1' }, clip: ['neck', 'collar', 'blouse', 'cardigan', 'head'] },
  ];
}

function details(): DetailDef[] {
  return [
    ...faceDetails(
      { eyes: EYES, brows: BROWS, mouths: MOUTHS },
      { bone: 'head', eyes: [-20, -31], brows: [-20, -35], mouth: [-18, -13] },
      FACE_KEY,
      ['head'],
    ),
    {
      name: 'lines',
      bone: 'head',
      x: -22,
      y: -27,
      grid: [
        '.........................s', //
        '........................s.',
        '.....s...................s',
        '......s..................',
        '.......s.................',
        '.SS.....s................',
        '.........................',
        '.......s.................',
        '........s................',
      ],
      key: FACE_KEY,
      clip: ['head'],
    },
    {
      name: 'blush',
      bone: 'head',
      x: -19,
      y: -21,
      grid: ['.cc..........c.c.c'],
      key: { c: 'blush:1' },
      clip: ['head'],
    },
    {
      name: 'braid',
      bone: 'head',
      x: 4,
      y: -55,
      grid: [
        '....a...a...a...', //
        '..a...a...a...a.',
        '.a..a...a...a...',
        'a.a...a...a...a.',
        '...a...a...a...a',
        '.a...a...a...a..',
        '...a...a...a....',
        '.....a...a......',
      ],
      key: { a: 'hair:3' },
      clip: ['bun'],
    },
    {
      name: 'buttons',
      bone: 'chest',
      x: -13,
      y: 0,
      grid: ['.a.', 'abc', '.c.', '...', '...', '...', '...', '.a.', 'abc', '.c.'],
      key: { a: 'cardigan:0', b: 'cardigan:1', c: 'cardigan:3' },
      clip: ['cardigan'],
    },
    {
      name: 'knit',
      bone: 'chest',
      x: -40,
      y: 4,
      grid: [
        'a...a...a...a...a...........................a...a...a...a...a...a...a',
        '..a...a...a...a...........................a...a...a...a...a...a...a..',
      ],
      key: { a: 'cardigan:2' },
      clip: ['cardigan'],
    },
    ...spectacles(),
  ];
}

export function odilePortraitRig(): Rig {
  return {
    id: 'odile-portrait',
    ...SPRITE_SIZES.portrait,
    materials: ODILE_MATERIALS,
    bones: bones(),
    parts: parts(),
    details: details(),
    mirror: true,
  };
}

export function odilePortraitSets(): SpriteSetDef[] {
  return [
    {
      id: 'odile-portrait',
      character: 'odile',
      kind: 'portrait',
      rig: odilePortraitRig(),
      anims: portraitAnims((f) =>
        f.expr === 'sad' ? { bones: { head: { rot: 3, y: 1 } } } : f.expr === 'surprised' ? { bones: { head: { y: -1 } } } : {},
      ),
    },
  ];
}
