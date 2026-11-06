/**
 * The Rookie's dialogue portrait, 96x96. Authored facing left in world
 * coordinates and mirrored by the rig, so it faces right on screen.
 */
import type { BoneDef, DetailDef, PartDef, Rig } from '../../rig';
import { capsule, ellipse, path, poly } from '../../shapes';
import { SPRITE_SIZES, type SpriteSetDef } from '../../types';
import { type FaceGrids, faceDetails, portraitAnims } from '../portraitKit';
import { ROOKIE_EXTRA, ROOKIE_MATERIALS } from './materials';

/** Places two eye grids side by side in one grid. */
function pair(far: string[], near: string[], gap: number): string[] {
  const fw = Math.max(...far.map((r) => r.length));
  const rows = Math.max(far.length, near.length);
  const out: string[] = [];
  for (let i = 0; i < rows; i++) out.push((far[i] ?? '').padEnd(fw, '.') + '.'.repeat(gap) + (near[i] ?? ''));
  return out;
}

const GAP = 7;

const EYES: FaceGrids['eyes'] = {
  neutral: {
    open: pair(
      ['..ooo..', '.ooooo.', 'oiiiiwo', 'ihhiwW.', 'iIIiwW.', 'iIjjw..', '.ijjw..', '..ss...'],
      ['...oooooo.', '.ooooooooo', 'oiiiiiwwWo', '.ihhIiwwW.', '.ihIIiwwW.', '.iIIjjiwW.', '..ijjjiw..', '...ssss...'],
      GAP,
    ),
    blink: pair(
      ['.......', '.......', '.......', '.......', '.ooooo.', 'o.sss.o'],
      ['..........', '..........', '..........', '..........', '.oooooooo.', 'o.ssssss.o'],
      GAP,
    ),
  },
  happy: {
    open: pair(
      ['.......', '..ooo..', '.ooooo.', 'oiiiiwo', 'ihhiwW.', 'iIjjw..', '.sssss.'],
      ['..........', '...oooooo.', '.ooooooooo', 'oiiiiiwwWo', '.ihhIiwwW.', '.iIjjjiw..', '..ssssss..'],
      GAP,
    ),
    blink: pair(
      ['.......', '.......', '.......', '..ooo..', '.o...o.', 'o.....o'],
      ['..........', '..........', '..........', '...oooo...', '.oo....oo.', 'o........o'],
      GAP,
    ),
  },
  sad: {
    open: pair(
      ['.......', '...oo..', '..oooo.', 'ooiiiwo', 'ihhiwW.', 'iIIiwW.', '.ijjw..', '..ss...'],
      ['..........', '.oo.......', '.ooooo....', 'oiiiioooo.', '.ihhIiwwWo', '.iIIjjiwW.', '..ijjjiw..', '...ssss...'],
      GAP,
    ),
    blink: pair(
      ['.......', '.......', '.......', '.......', 'ooooo..', '..sss..'],
      ['..........', '..........', '..........', '..........', 'oooooooooo', '..ssssss..'],
      GAP,
    ),
  },
  angry: {
    open: pair(
      ['.......', '.......', 'oo.....', 'ooooooo', 'ihhiwWo', 'iIjjwW.', '.ijjw..', '..ss...'],
      ['..........', '..........', '........oo', 'oooooooooo', '.ihhIiwwW.', '.iIIjjiwW.', '..ijjjiw..', '...ssss...'],
      GAP,
    ),
    blink: pair(
      ['.......', '.......', '.......', 'oo.....', '.ooooo.', '..sss..'],
      ['..........', '..........', '..........', '.......ooo', 'ooooooooo.', '..ssssss..'],
      GAP,
    ),
  },
  surprised: {
    open: pair(
      ['..ooo..', '.ooooo.', 'owiiiwo', 'wihhiw.', 'wiIiwW.', 'wwiiw..', '.www...', '..ss...'],
      ['...oooooo.', '.ooooooooo', 'owwiiiiwwo', 'wwihhIiwW.', 'wwiIIjiwW.', '.wwiijiww.', '..wwwwww..', '...ssss...'],
      GAP,
    ),
    blink: pair(
      ['.......', '.......', '.......', '.......', '.ooooo.', 'o.sss.o'],
      ['..........', '..........', '..........', '..........', '.oooooooo.', 'o.ssssss.o'],
      GAP,
    ),
  },
};

const BROWS: FaceGrids['brows'] = {
  neutral: ['........................', '..bbbbb........bbbbbbbb.', '.bB...........bB.......b'],
  happy: ['........................', '..bbbbb........bbbbbbb..', '.b.....b......b.......b.'],
  sad: ['.....bb........bb.......', '..bbbB..........Bbbbbbb.', '.bb....................b'],
  angry: ['.bbb...............bbbbb', '...bbbB.........bbbbB...', '......B........B........'],
  surprised: ['..bbbbb.......bbbbbbbb..', '.b.....b.....b........b.', '........................'],
};

const MOUTHS: FaceGrids['mouths'] = {
  neutral: {
    closed: ['...........', '...SSSSS...', '....sss....'],
    half: ['...........', '...SSSSS...', '...SrrrS...', '....SSS....'],
    open: ['...SSSSS...', '..SrrrrrS..', '..SrtttrS..', '...SSSSS...'],
  },
  happy: {
    closed: ['...........', '..S.....S..', '...SSSSS...', '....sss....'],
    half: ['...........', '..SSSSSSS..', '..STTTTTS..', '...SrrrS...'],
    open: ['..SSSSSSS..', '..STTTTTS..', '..SrrtrrS..', '...SSSSS...'],
  },
  sad: {
    closed: ['...........', '...SSSSS...', '..S.....S..'],
    half: ['...........', '...SSSSS...', '..SrrrrrS..', '..S.....S..'],
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
  b: 'hair:1',
  B: 'hair:2',
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
    { name: 'cap', parent: 'head', x: 0, y: -50, rot: -6 },
  ];
}

function parts(): PartDef[] {
  return [
    {
      name: 'coat',
      bone: 'chest',
      z: 2,
      material: 'coat',
      shape: path('M -44 14 L -41 0 Q -34 -8 -16 -10 L 16 -11 Q 36 -9 42 2 L 46 14 Z'),
      shade: { shadow: 4, light: 1 },
      marks: [
        { tone: 2, shape: poly(-30, -2, -18, -4, -18, -3, -30, -1) },
        { tone: 2, shape: poly(24, -4, 26, -4, 30, 10, 28, 10) },
      ],
    },
    {
      name: 'neck',
      bone: 'neck',
      z: 1,
      material: 'skin',
      shape: capsule(1, -8, 8.5, 3, 4, 9),
      shade: { shadow: 2, light: 0 },
    },
    {
      name: 'shirt',
      bone: 'chest',
      z: 2.5,
      material: 'shirt',
      shape: poly(-13, -10.5, 6, -11.5, -5, 6),
      shade: { shadow: 2, light: 0, base: 2 },
      sep: false,
    },
    {
      name: 'collar',
      bone: 'chest',
      z: 3,
      material: 'coat',
      shape: [...poly(-19, -11, -11, -11, -5, 6, -17, -2), ...poly(16, -12.5, 5, -11.5, -4, 6, 9, -2)],
      shade: { shadow: 2, light: 2, base: 0 },
    },
    {
      name: 'strap',
      bone: 'chest',
      z: 3.5,
      material: 'leather',
      shape: poly(19, -12, 25, -10, -18, 12, -25, 12),
      shade: { shadow: 1, light: 1 },
    },
    {
      name: 'head',
      bone: 'head',
      z: 5,
      material: 'skin',
      shape: [
        ...ellipse(-1, -30, 21, 22.5),
        ...path(
          'M -19 -36 L -20.6 -24 L -22.8 -19.5 L -21 -17 L -20.4 -15 L -20.8 -12.6 L -19.6 -10.6 L -19.2 -8 Q -18 -4 -13 -3.4 L -6 -4 Q 6 -8 12 -16 L 16 -24 L 10 -36 Z',
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
        'M -21 -38 Q -20 -50 -2 -51 Q 21 -50 21.5 -32 L 20.5 -16 Q 18 -8 13 -9 L 12.5 -20 L 9.5 -22 L 9 -32 L 5 -38.5 L 1 -36.6 L -3 -39.6 L -7 -37.4 L -11 -40 L -15 -37.6 L -19 -39.4 Z',
      ),
      shade: { shadow: 3, light: 1 },
      marks: [
        { tone: 0, shape: poly(-14, -44, -6, -46, -8, -44.6, -14, -42.8) },
        { tone: 2, shape: poly(14, -30, 15, -30, 16, -18, 15, -18) },
      ],
      cast: 2,
    },
    {
      name: 'ear',
      bone: 'head',
      z: 6.5,
      material: 'skin',
      shape: ellipse(14.5, -27, 3.8, 5.6),
      shade: { shadow: 2, light: 1 },
      marks: [{ tone: 2, shape: poly(13.5, -30, 15, -30, 15, -24, 13.5, -24) }],
      cast: 1,
    },
    {
      name: 'capCrown',
      bone: 'cap',
      z: 7,
      material: 'coat',
      shape: path('M -23 9 L -22 -2 Q -19 -12.5 1 -13 Q 21 -12.5 23.5 -2 L 24.5 9 Z'),
      shade: { shadow: 4, light: 1 },
      marks: [
        { tone: 3, shape: poly(-23, 6, 24.5, 6, 24.5, 9, -23, 9) },
        { tone: 0, shape: poly(-16, -8, -6, -10.5, -6, -9.5, -16, -7) },
      ],
      cast: 3,
    },
    {
      name: 'visor',
      bone: 'cap',
      z: 7.5,
      material: 'visor',
      shape: path('M -34 11.5 Q -25 6.5 -6 7.2 L -5 12.8 Q -20 15 -34 11.5 Z'),
      shade: { shadow: 1, light: 1 },
      cast: 2,
    },
  ];
}

function details(): DetailDef[] {
  return [
    ...faceDetails(
      { eyes: EYES, brows: BROWS, mouths: MOUTHS },
      { bone: 'head', eyes: [-21, -31], brows: [-21, -35], mouth: [-17, -13] },
      FACE_KEY,
      ['head'],
    ),
    {
      name: 'nose',
      bone: 'head',
      x: -22,
      y: -22,
      grid: ['.....s', '....s.', '..ss..', 'SS....'],
      key: FACE_KEY,
      clip: ['head'],
    },
    {
      name: 'blush',
      bone: 'head',
      x: -21,
      y: -20,
      grid: ['...cc.........c.c.c'],
      key: { c: 'blush:1' },
      clip: ['head'],
    },
    {
      name: 'badge',
      bone: 'cap',
      x: -17,
      y: -6,
      grid: ['..aaa..', '.abbbc.', 'abcccbc', 'ab.c.bc', '.bcccc.', '..ccc..'],
      key: { a: 'brass:0', b: 'brass:1', c: 'brass:2' },
      clip: ['capCrown'],
    },
    {
      name: 'buttons',
      bone: 'chest',
      x: -12,
      y: 1,
      grid: ['.ab.', 'abbc', 'bbcc', '.cc.'],
      key: { a: 'brass:0', b: 'brass:1', c: 'brass:2' },
      clip: ['coat'],
    },
    {
      name: 'tin',
      bone: 'chest',
      x: -33,
      y: -4,
      grid: ['.hhtt.', 'htttts', 'pppppp', '.PPPP.'],
      key: { h: 'tin:0', t: 'tin:1', s: 'tin:2', p: 'coat:3', P: 'coat:2' },
      clip: ['coat'],
    },
    {
      name: 'stitches',
      bone: 'chest',
      x: -16,
      y: -6,
      grid: [
        '.................................a',
        '..............................a...',
        '...........................a......',
        '........................a.........',
        '.....................a............',
        '..................a...............',
        '...............a..................',
        '............a.....................',
        '.........a........................',
        '......a...........................',
        '...a..............................',
      ],
      key: { a: 'leather:0' },
      clip: ['strap'],
    },
  ];
}

export function rookiePortraitRig(): Rig {
  return {
    id: 'rookie-portrait',
    ...SPRITE_SIZES.portrait,
    materials: { ...ROOKIE_MATERIALS, ...ROOKIE_EXTRA },
    bones: bones(),
    parts: parts(),
    details: details(),
    mirror: true,
  };
}

export function rookiePortraitSets(): SpriteSetDef[] {
  return [
    {
      id: 'rookie-portrait',
      character: 'rookie',
      kind: 'portrait',
      rig: rookiePortraitRig(),
      anims: portraitAnims((f) =>
        f.expr === 'sad' ? { bones: { head: { rot: 3, y: 1 } } } : f.expr === 'surprised' ? { bones: { head: { y: -1 } } } : {},
      ),
    },
  ];
}
