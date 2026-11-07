/**
 * Creatures from tier 2 onward, the Runaway Parcel and Old Brass. Regular
 * enemies are 48-72 px and face right, toward the party, with idle, attack,
 * hit and defeat frames; Old Brass is a boss and gets a bigger frame.
 */
import { manual, type Material, ramp } from '../palette';
import type { Pose, Rig } from '../rig';
import { capsule, ellipse, limb, path, poly, roundRect, type Shape } from '../shapes';
import { anim, type AnimDef, type CharacterSprites } from '../types';

const RED_EYE = manual('eye', ['#f0c060', '#c03030', '#601818', '#200808'], '#100404');
const DARK_EYE = manual('eye', ['#8a8a9a', '#3a3a46', '#202028', '#101016'], '#08080c');

function set(id: string, name: string, rig: Rig, anims: AnimDef[], kind: 'enemy' | 'battle' = 'enemy'): CharacterSprites {
  return { id, name, sets: () => [{ id: `${id}-battle`, character: id, kind, rig, anims }] };
}

/** Standard enemy timings: idle frames, then attack 3, hit 1, defeat 2. */
function basic(idle: Pose[], attack: [Pose, Pose, Pose], hit: Pose, defeat: [Pose, Pose], cast?: [Pose, Pose, Pose]): AnimDef[] {
  const out = [
    anim('idle', idle, 260),
    anim('attack', attack, [180, 90, 180], false),
    anim('hit', [hit], 220, false),
    anim('defeat', defeat, [180, 400], false),
  ];
  if (cast) out.push(anim('cast', cast, [150, 260, 150], false));
  return out;
}

// ---------------------------------------------------------------------------
// Leech Clump, 56x40: a knot of fat leeches that moves as one.

const LEECH_M: Record<string, Material> = {
  skin: ramp('skin', '#4a5a3a', { step: 0.085 }),
  belly: manual('belly', ['#c8b070', '#a08850', '#7a6638', '#544626'], '#2e2614'),
  mouth: manual('mouth', ['#e08a7a', '#b05050', '#7a3030', '#4a1a1a'], '#2a0c0c'),
  mud: ramp('mud', '#5a4632', { step: 0.07 }),
  eye: DARK_EYE,
};

function leechRig(): Rig {
  const worm = (name: string, z: number, pts: [number, number, number][]): Rig['parts'][number] => ({ name, bone: 'body', z, material: 'skin', shape: limb(pts), shade: { shadow: 2, light: 1 } });
  return {
    id: 'leech-battle',
    width: 56,
    height: 48,
    materials: LEECH_M,
    bones: [
      { name: 'root', x: 26, y: 45 },
      { name: 'body', parent: 'root', x: 0, y: -8 },
      { name: 'head', parent: 'body', x: 12, y: -8 },
    ],
    parts: [
      { name: 'puddle', bone: 'root', z: 0, material: 'mud', shape: ellipse(0, -1, 22, 3), shade: { shadow: 1, light: 0, flat: true }, cast: 0, outline: false },
      worm('w1', 1, [[-18, 4, 3.2], [-10, -2, 5], [-2, 2, 5.4], [6, -2, 4.6]]),
      worm('w2', 2, [[-14, -8, 3], [-6, -12, 4.6], [2, -8, 5], [10, -10, 4]]),
      worm('w3', 3, [[-10, 5, 4], [0, 3, 6], [10, 4, 5]]),
      { name: 'neck', bone: 'head', z: 4, material: 'skin', shape: limb([[-10, 4, 4.6], [-4, 0, 4.4], [2, -2, 4]]), shade: { shadow: 2, light: 1 } },
      { name: 'bellyStripe', bone: 'body', z: 3.1, material: 'belly', shape: limb([[-10, 8, 1.6], [0, 7, 2.2], [10, 8, 1.6]]), clipTo: ['w3'], shade: { shadow: 1, light: 0 }, cast: 0, outline: false, sep: false },
      { name: 'mouth', bone: 'head', z: 5, material: 'mouth', shape: ellipse(3.6, -2, 2.6, 3), shade: { shadow: 1, light: 1 }, cast: 0 },
    ],
    details: [
      { name: 'teeth', bone: 'head', x: 2, y: -4, grid: ['a.a', '.a.', 'a.a'], key: { a: 'belly:0' }, clip: ['mouth'] },
      { name: 'eyes', bone: 'head', x: -3, y: -5, grid: ['a.a'], key: { a: 'eye:o' }, clip: ['neck'] },
      { name: 'sheen', bone: 'body', x: -8, y: -15, grid: ['a.....a....', '..a.......a', '.....a.....'], key: { a: 'skin:0' }, clip: ['w2', 'w1'] },
    ],
  };
}

const LEECH = set(
  'leech',
  'Leech Clump',
  leechRig(),
  basic(
    [{}, { bones: { body: { sy: 0.94, y: 0.6 }, head: { y: 1 } } }, { bones: { body: { sy: 1.04 }, head: { y: -1, rot: -6 } } }],
    [{ bones: { head: { rot: -30, x: -3 }, body: { x: -2 } } }, { bones: { head: { rot: 20, x: 10 }, body: { x: 6, sx: 1.1 } } }, { bones: { head: { rot: 6, x: 4 }, body: { x: 3 } } }],
    { bones: { body: { x: -4, sy: 0.86 }, head: { rot: -20 } } },
    [{ bones: { body: { sy: 0.7, y: 3 }, head: { rot: 30, y: 3 } } }, { bones: { body: { sy: 0.4, y: 6 }, head: { rot: 70, y: 8 } } }],
  ),
);

// ---------------------------------------------------------------------------
// Marsh Wisp, 48x56: a cold green flame with a lonely face.

const WISP_M: Record<string, Material> = {
  glow: manual('glow', ['#f4fff0', '#bff2c8', '#7ad8a0', '#3c9a70'], '#1e5a40'),
  core: manual('core', ['#ffffff', '#f0fff4', '#d0f4dc', '#9ad8b4'], '#4a8a6a'),
  eye: manual('eye', ['#5a8a7a', '#2a5a4a', '#1a3a30', '#0e201a'], '#08140e'),
};

function wispRig(): Rig {
  return {
    id: 'wisp-battle',
    width: 48,
    height: 56,
    materials: WISP_M,
    bones: [
      { name: 'root', x: 24, y: 54 },
      { name: 'body', parent: 'root', x: 0, y: -18 },
      { name: 'tip', parent: 'body', x: -2, y: -12 },
    ],
    parts: [
      { name: 'flame', bone: 'body', z: 1, material: 'glow', shape: path('M -10 6 Q -14 -4 -8 -12 Q -4 -18 0 -26 Q 3 -18 7 -14 Q 13 -6 10 6 Q 6 13 0 13 Q -6 13 -10 6 Z'), shade: { shadow: 2, light: 2, dir: [0.6, 1] }, cast: 0 },
      { name: 'wisp', bone: 'tip', z: 0.6, material: 'glow', shape: path('M -2 -2 Q -8 -10 -4 -18 Q -2 -10 2 -6 Z'), shade: { shadow: 1, light: 1 }, thin: true, cast: 0 },
      { name: 'core', bone: 'body', z: 2, material: 'core', shape: ellipse(0, 2, 6, 7), shade: { shadow: 1, light: 1 }, cast: 0, outline: false, sep: false },
      { name: 'trail', bone: 'root', z: 0.4, material: 'glow', shape: [...ellipse(-3, -8, 2, 2), ...ellipse(2, -4, 1.4, 1.4), ...ellipse(-1, -1, 1, 1)], shade: { shadow: 0, light: 0, flat: true }, cast: 0, outline: false },
    ],
    details: [
      { name: 'eyes', bone: 'body', x: -2, y: 0, grid: ['a..a', 'a..a'], key: { a: 'eye:o' }, clip: ['core', 'flame'] },
      { name: 'mouth', bone: 'body', x: -1, y: 5, grid: ['.aa.', 'a..a'], key: { a: 'eye:1' }, clip: ['core'] },
    ],
  };
}

const WISP = set(
  'wisp',
  'Marsh Wisp',
  wispRig(),
  basic(
    [{ bones: { body: { y: 0 } } }, { bones: { body: { y: -2, sx: 0.96 }, tip: { rot: 10 } } }, { bones: { body: { y: -3 }, tip: { rot: -8 } } }, { bones: { body: { y: -1, sx: 1.04 } } }],
    [{ bones: { body: { x: -3, sy: 1.1 } } }, { bones: { body: { x: 10, sx: 1.2, sy: 0.9 } } }, { bones: { body: { x: 4 } } }],
    { bones: { body: { x: -5, sx: 0.8, sy: 1.1 } } },
    [{ bones: { body: { sx: 0.7, sy: 0.7, y: 2 } } }, { bones: { body: { sx: 0.25, sy: 0.25, y: 6 } } }],
    [{ bones: { body: { sy: 1.15, y: -2 } } }, { bones: { body: { sy: 1.25, sx: 1.1, y: -4 } } }, { bones: { body: { y: -1 } } }],
  ),
);

// ---------------------------------------------------------------------------
// Rust Hound, 64x52: a lean dog gone the colour of the slag heaps.

const HOUND_M: Record<string, Material> = {
  coat: ramp('coat', '#8a5a3a', { step: 0.085 }),
  rust: ramp('rust', '#a8582a', { step: 0.08 }),
  collar: manual('collar', ['#c8ccd0', '#8e949a', '#5e646a', '#3c4046'], '#22252a'),
  nose: ramp('nose', '#2e2622', { step: 0.07 }),
  eye: RED_EYE,
};

function houndRig(): Rig {
  const leg = (name: string, z: number, far: boolean, len: number): Rig['parts'] => [
    { name, bone: name, z, material: 'coat', shape: limb([[0, -len, 2.6], [0.6, -len / 2, 2], [0, -1.6, 1.6]]), shade: { shadow: 1, light: 1, base: far ? 2 : 1 } },
    { name: `${name}Paw`, bone: name, z: z + 0.1, material: 'nose', shape: ellipse(1.2, -1, 2.2, 1.4), shade: { shadow: 1, light: 0 }, cast: 0 },
  ];
  return {
    id: 'hound-battle',
    width: 64,
    height: 52,
    materials: HOUND_M,
    bones: [
      { name: 'root', x: 30, y: 50 },
      { name: 'body', parent: 'root', x: 0, y: -20 },
      { name: 'head', parent: 'body', x: 14, y: -6 },
      { name: 'tail', parent: 'body', x: -14, y: -3 },
      { name: 'legBF', parent: 'root', x: -9, y: 0 },
      { name: 'legFF', parent: 'root', x: 9, y: 0 },
      { name: 'legBN', parent: 'root', x: -12, y: 0 },
      { name: 'legFN', parent: 'root', x: 12, y: 0 },
    ],
    parts: [
      ...leg('legBF', 0, true, 14),
      ...leg('legFF', 0, true, 14),
      { name: 'tail', bone: 'tail', z: 1, material: 'coat', shape: limb([[0, 0, 2], [-6, -4, 1.4], [-9, -10, 0.8]]), shade: { shadow: 1, light: 1 }, thin: true },
      { name: 'body', bone: 'body', z: 2, material: 'coat', shape: path('M -15 -2 Q -14 -8 -6 -8 L 6 -9 Q 14 -9 15 -2 Q 14 5 6 5 L -2 3 Q -10 6 -15 -2 Z'), shade: { shadow: 3, light: 1 }, marks: [{ tone: 3, shape: poly(-8, 1, -4, -1, 0, 2, -5, 3) }] },
      { name: 'patches', bone: 'body', z: 2.1, material: 'rust', shape: [...ellipse(-7, -5, 4, 2.4), ...ellipse(4, -6, 3, 2)], clipTo: ['body'], shade: { shadow: 1, light: 1 }, cast: 0, outline: false, sep: false },
      ...leg('legBN', 3, false, 14),
      ...leg('legFN', 3, false, 15),
      { name: 'head', bone: 'head', z: 4, material: 'coat', shape: path('M -5 -4 Q -3 -9 3 -8 L 11 -4 Q 13 -2 12 0 L 4 2 Q -3 3 -5 -4 Z'), shade: { shadow: 2, light: 1 } },
      { name: 'ear', bone: 'head', z: 4.6, material: 'rust', shape: poly(-3, -7, -1, -13, 2, -7.4), shade: { shadow: 1, light: 1 } },
      { name: 'nose', bone: 'head', z: 4.8, material: 'nose', shape: ellipse(11.4, -3, 1.6, 1.4), shade: { shadow: 1, light: 1 }, cast: 0 },
      { name: 'collar', bone: 'body', z: 4.2, material: 'collar', shape: poly(10, -9, 13, -9, 14, 1, 11, 1), shade: { shadow: 1, light: 1 }, cast: 0 },
    ],
    details: [
      { name: 'eye', bone: 'head', x: 3, y: -6, grid: ['ab'], key: { a: 'eye:o', b: 'eye:1' }, clip: ['head'] },
      { name: 'teeth', bone: 'head', x: 6, y: 0, grid: ['a.a.a'], key: { a: 'collar:0' }, clip: ['head'] },
      { name: 'ribs', bone: 'body', x: -2, y: -4, grid: ['a.a.a', '.....', 'a.a.a'], key: { a: 'coat:3' }, clip: ['body'] },
    ],
  };
}

const HOUND = set(
  'hound',
  'Rust Hound',
  houndRig(),
  basic(
    [{}, { bones: { body: { y: 0.6 }, head: { rot: 4 }, tail: { rot: 12 } } }, { bones: { tail: { rot: -10 } } }],
    [{ bones: { body: { x: -4, rot: 8 }, head: { rot: 12 }, legFN: { x: -2 } } }, { bones: { body: { x: 14, rot: -10, y: -4 }, head: { rot: -12 }, legFN: { x: 6, y: -4 }, legFF: { x: 6, y: -4 }, legBN: { x: -2 } } }, { bones: { body: { x: 6 } } }],
    { bones: { body: { x: -5, rot: -10 }, head: { rot: -14 }, tail: { rot: 30 } } },
    [{ bones: { body: { rot: 10, y: 3 }, head: { rot: 20 } } }, { bones: { body: { y: 10, rot: 4 }, head: { rot: 30, y: 4 }, legFN: { x: 5 }, legFF: { x: 4 }, legBN: { x: -5 }, legBF: { x: -4 } } }],
  ),
);

// ---------------------------------------------------------------------------
// Slag Crawler, 72x44: a low armoured thing with embers in the cracks.

const SLAG_M: Record<string, Material> = {
  shell: ramp('shell', '#4a4648', { step: 0.08 }),
  ember: manual('ember', ['#fff0a0', '#f8a040', '#d05020', '#802010'], '#401008'),
  legs: ramp('legs', '#2e2a2c', { step: 0.07 }),
  eye: RED_EYE,
};

function slagRig(): Rig {
  const legs: Shape = [];
  for (const x of [-18, -8, 2, 12]) legs.push(...limb([[x, -6, 2], [x + 3, -2, 1.6], [x + 5, 0, 1.2]]));
  return {
    id: 'slag-battle',
    width: 72,
    height: 48,
    materials: SLAG_M,
    bones: [
      { name: 'root', x: 34, y: 45 },
      { name: 'body', parent: 'root', x: 0, y: -10 },
      { name: 'head', parent: 'body', x: 20, y: 2 },
    ],
    parts: [
      { name: 'legs', bone: 'root', z: 0, material: 'legs', shape: legs, shade: { shadow: 1, light: 1 }, thin: true },
      { name: 'shell', bone: 'body', z: 2, material: 'shell', shape: path('M -26 6 Q -28 -6 -16 -14 Q -4 -20 8 -16 Q 20 -12 22 0 Q 22 6 16 8 L -20 9 Q -26 9 -26 6 Z'), shade: { shadow: 3, light: 1 }, marks: [{ tone: 0, shape: poly(-16, -12, -4, -17, -3, -16, -15, -11) }] },
      { name: 'cracks', bone: 'body', z: 2.2, material: 'ember', shape: [...limb([[-14, -6, 0.9], [-8, -2, 0.8], [-10, 4, 0.7]]), ...limb([[0, -12, 0.9], [4, -4, 0.8], [10, -2, 0.7]]), ...limb([[-2, 2, 0.7], [6, 5, 0.6]])], clipTo: ['shell'], shade: { shadow: 0, light: 1 }, cast: 0, outline: false, sep: false, thin: true },
      { name: 'head', bone: 'head', z: 3, material: 'shell', shape: path('M -4 -6 Q 4 -8 8 -2 Q 9 4 2 5 L -4 4 Z'), shade: { shadow: 2, light: 1 } },
      { name: 'mandible', bone: 'head', z: 3.4, material: 'legs', shape: [...limb([[6, 2, 1.2], [10, 4, 0.8]]), ...limb([[6, -1, 1.2], [10, -2, 0.8]])], shade: { shadow: 1, light: 0 }, thin: true, cast: 0 },
    ],
    details: [
      { name: 'eyes', bone: 'head', x: 2, y: -4, grid: ['a.a'], key: { a: 'ember:1' }, clip: ['head'] },
      { name: 'grit', bone: 'body', x: -20, y: 2, grid: ['a...a...a...a...a', '..a...a...a...a..'], key: { a: 'shell:3' }, clip: ['shell'] },
    ],
  };
}

const SLAG = set(
  'slag',
  'Slag Crawler',
  slagRig(),
  basic(
    [{}, { bones: { body: { y: 0.6, sx: 1.02 } } }],
    [{ bones: { body: { x: -4, rot: 6 } } }, { bones: { body: { x: 12, rot: -8, y: -3 }, head: { rot: -14 } } }, { bones: { body: { x: 5 } } }],
    { bones: { body: { x: -4, rot: -6 } } },
    [{ bones: { body: { y: 2, rot: 6 } } }, { bones: { body: { y: 5, rot: 10, sy: 0.85 }, head: { rot: 20, y: 2 } } }],
  ),
);

// ---------------------------------------------------------------------------
// Salt Crab, 64x52: a big crab crusted white with dried salt.

const CRAB_M: Record<string, Material> = {
  shell: ramp('shell', '#b84a36', { step: 0.08 }),
  salt: manual('salt', ['#ffffff', '#f2f0ea', '#d8d4ca', '#b0aca0'], '#6e6a60'),
  claw: ramp('claw', '#a8402e', { step: 0.08 }),
  eye: DARK_EYE,
};

function crabRig(): Rig {
  const legs: Shape = [];
  for (const [x, d] of [[-14, -1], [-8, -1], [8, 1], [14, 1]] as [number, number][]) legs.push(...limb([[x, -10, 1.8], [x + d * 5, -6, 1.4], [x + d * 7, 0, 1]]));
  return {
    id: 'crab-battle',
    width: 64,
    height: 52,
    materials: CRAB_M,
    bones: [
      { name: 'root', x: 26, y: 50 },
      { name: 'body', parent: 'root', x: 0, y: -14 },
      { name: 'clawF', parent: 'body', x: 14, y: -6 },
      { name: 'clawB', parent: 'body', x: -12, y: -8 },
    ],
    parts: [
      { name: 'legs', bone: 'root', z: 0, material: 'claw', shape: legs, shade: { shadow: 1, light: 1 }, thin: true },
      { name: 'clawB', bone: 'clawB', z: 0.5, material: 'claw', shape: path('M 0 0 L -6 -8 Q -10 -16 -4 -18 L -2 -12 L 2 -16 Q 4 -10 0 -6 Z'), shade: { shadow: 2, light: 1, base: 2 } },
      { name: 'shell', bone: 'body', z: 2, material: 'shell', shape: path('M -18 2 Q -20 -10 -8 -13 L 8 -13 Q 20 -10 18 2 Q 12 8 0 8 Q -12 8 -18 2 Z'), shade: { shadow: 3, light: 1 } },
      { name: 'crust', bone: 'body', z: 2.2, material: 'salt', shape: [...ellipse(-8, -9, 5, 2), ...ellipse(6, -10, 4, 1.6), ...ellipse(-2, -5, 3, 1.2)], clipTo: ['shell'], shade: { shadow: 1, light: 0 }, cast: 0, outline: false, sep: false },
      { name: 'stalks', bone: 'body', z: 1.8, material: 'shell', shape: [...capsule(6, -12, 1, 7, -17, 1), ...capsule(10, -11, 1, 12, -16, 1)], shade: { shadow: 1, light: 0 }, thin: true },
      { name: 'clawF', bone: 'clawF', z: 4, material: 'claw', shape: path('M 0 0 L 6 -6 Q 12 -14 18 -10 L 14 -6 L 20 -4 Q 16 4 8 2 Z'), shade: { shadow: 2, light: 1 } },
    ],
    details: [
      { name: 'eyes', bone: 'body', x: 6, y: -18, grid: ['a...a'], key: { a: 'eye:o' } },
      { name: 'pores', bone: 'body', x: -12, y: -4, grid: ['a.....a.....a', '...a.....a...'], key: { a: 'shell:3' }, clip: ['shell'] },
    ],
  };
}

const CRAB = set(
  'crab',
  'Salt Crab',
  crabRig(),
  basic(
    [{}, { bones: { clawF: { rot: -8 }, clawB: { rot: 6 }, body: { y: 0.6 } } }, { bones: { clawF: { rot: 4 }, body: { x: 1 } } }],
    [{ bones: { clawF: { rot: -40 }, body: { x: -3 } } }, { bones: { clawF: { rot: 20, x: 6 }, body: { x: 10 } } }, { bones: { clawF: { rot: 0 }, body: { x: 4 } } }],
    { bones: { body: { x: -4, rot: -6 }, clawF: { rot: -20 } } },
    [{ bones: { body: { y: 3, rot: 8 } } }, { bones: { body: { y: 8, rot: 170 }, clawF: { rot: 30 } } }],
  ),
);

// ---------------------------------------------------------------------------
// Gull Swarm, 64x56: three gulls who have decided you have chips.

const GULL_M: Record<string, Material> = {
  white: manual('white', ['#ffffff', '#eef0f2', '#c8ccd2', '#9aa0a8'], '#5a6068'),
  wing: ramp('wing', '#8a929c', { step: 0.08 }),
  beak: manual('beak', ['#ffe080', '#f0b030', '#c07820', '#804a10'], '#4a2a08'),
  eye: DARK_EYE,
};

function gullRig(): Rig {
  const gull = (bone: string, z: number): Rig['parts'] => [
    { name: `${bone}WingB`, bone, z, material: 'wing', shape: path('M -2 -2 Q -10 -12 -16 -10 Q -10 -6 -4 1 Z'), shade: { shadow: 1, light: 1, base: 2 }, thin: true },
    { name: `${bone}Body`, bone, z: z + 0.1, material: 'white', shape: path('M -8 0 Q -6 -5 2 -5 Q 7 -6 9 -3 L 12 -2 L 9 0 Q 4 4 -4 3 Q -8 2 -8 0 Z'), shade: { shadow: 2, light: 1 } },
    { name: `${bone}Beak`, bone, z: z + 0.2, material: 'beak', shape: poly(9, -3, 14, -2, 9, -1), shade: { shadow: 1, light: 0 }, thin: true, cast: 0 },
    { name: `${bone}WingF`, bone: `${bone}w`, z: z + 0.3, material: 'wing', shape: path('M 0 0 Q -6 -12 -14 -14 Q -10 -6 -6 2 Z'), shade: { shadow: 1, light: 1 }, thin: true },
  ];
  return {
    id: 'gull-battle',
    width: 64,
    height: 56,
    materials: GULL_M,
    bones: [
      { name: 'root', x: 30, y: 54 },
      { name: 'g1', parent: 'root', x: -12, y: -33 },
      { name: 'g1w', parent: 'g1', x: -1, y: -2 },
      { name: 'g2', parent: 'root', x: 10, y: -22 },
      { name: 'g2w', parent: 'g2', x: -1, y: -2 },
      { name: 'g3', parent: 'root', x: -6, y: -11 },
      { name: 'g3w', parent: 'g3', x: -1, y: -2 },
    ],
    parts: [...gull('g1', 1), ...gull('g3', 2), ...gull('g2', 3)],
    details: [
      { name: 'e1', bone: 'g1', x: 6, y: -4, grid: ['a'], key: { a: 'eye:o' }, clip: ['g1Body'] },
      { name: 'e2', bone: 'g2', x: 6, y: -4, grid: ['a'], key: { a: 'eye:o' }, clip: ['g2Body'] },
      { name: 'e3', bone: 'g3', x: 6, y: -4, grid: ['a'], key: { a: 'eye:o' }, clip: ['g3Body'] },
    ],
  };
}

const flap = (a: number): Pose => ({ bones: { g1w: { rot: a }, g2w: { rot: -a }, g3w: { rot: a * 0.6 }, g1: { y: a * 0.05 }, g2: { y: -a * 0.05 } } });
const GULL = set(
  'gull',
  'Gull Swarm',
  gullRig(),
  basic(
    [flap(0), flap(40), flap(70), flap(30)],
    [{ ...flap(60), bones: { ...flap(60).bones, g2: { x: -4 } } }, { bones: { g1: { x: 14, y: 6 }, g2: { x: 16, y: 4 }, g3: { x: 12 }, g1w: { rot: 80 } } }, flap(20)],
    { bones: { g1: { x: -4, rot: -14 }, g2: { x: -5, rot: -10 }, g3: { x: -3 } } },
    [{ bones: { g1: { y: 8, rot: 30 }, g2: { y: 6, rot: 20 }, g3: { y: 4 } } }, { bones: { g1: { y: 30, rot: 80 }, g2: { y: 22, rot: 70 }, g3: { y: 10, rot: 60 } } }],
  ),
);

// ---------------------------------------------------------------------------
// Wire Crawler, 72x56: a tangle of copper wire and porcelain insulators.

const WIRE_M: Record<string, Material> = {
  copper: manual('copper', ['#f8c890', '#d88a48', '#a85a28', '#6e3818'], '#3a1c0c'),
  porcelain: manual('porcelain', ['#ffffff', '#e8eef2', '#b8c8d2', '#88a0b0'], '#4a5a68'),
  spark: manual('spark', ['#ffffff', '#f0f8ff', '#a8e0ff', '#58a8f0'], '#2a5a90'),
  eye: manual('eye', ['#ffffff', '#a8e0ff', '#58a8f0', '#2a5a90'], '#163050'),
};

function wireRig(): Rig {
  const legs: Shape = [];
  for (const [x, s] of [[-16, -1], [-8, -1], [6, 1], [14, 1]] as [number, number][]) legs.push(...limb([[x * 0.5, -16, 1.2], [x, -12, 1], [x + s * 4, -4, 0.9], [x + s * 5, 0, 0.8]]));
  return {
    id: 'wire-battle',
    width: 72,
    height: 56,
    materials: WIRE_M,
    bones: [
      { name: 'root', x: 34, y: 54 },
      { name: 'body', parent: 'root', x: 0, y: -22 },
    ],
    parts: [
      { name: 'legs', bone: 'root', z: 0, material: 'copper', shape: legs, shade: { shadow: 1, light: 1 }, thin: true },
      { name: 'coil', bone: 'body', z: 1, material: 'copper', shape: [...ellipse(0, 0, 13, 9), ...ellipse(-6, -6, 7, 5)], cut: [...ellipse(0, 0, 9.4, 5.6)], shade: { shadow: 2, light: 1 } },
      { name: 'windings', bone: 'body', z: 1.2, material: 'copper', shape: [...limb([[-12, 2, 0.8], [-4, -4, 0.8], [6, 4, 0.8], [12, -2, 0.8]]), ...limb([[-10, -6, 0.7], [0, 6, 0.7], [10, -6, 0.7]])], shade: { shadow: 1, light: 1 }, thin: true, cast: 0 },
      { name: 'insulatorA', bone: 'body', z: 2, material: 'porcelain', shape: path('M -4 -14 Q -4 -20 0 -20 Q 4 -20 4 -14 L 3 -10 L -3 -10 Z'), shade: { shadow: 1, light: 1 } },
      { name: 'insulatorB', bone: 'body', z: 2, material: 'porcelain', shape: path('M 8 -10 Q 8 -15 11 -15 Q 14 -15 14 -10 L 13 -7 L 9 -7 Z'), shade: { shadow: 1, light: 1 } },
      { name: 'eye', bone: 'body', z: 2.4, material: 'eye', shape: ellipse(0, 0, 4, 3.4), shade: { shadow: 1, light: 1 }, cast: 0 },
      { name: 'spark', bone: 'body', z: 3, material: 'spark', shape: path('M 12 -18 L 16 -24 L 15 -20 L 20 -22 L 14 -14 L 15 -18 Z'), shade: { shadow: 0, light: 0, flat: true }, cast: 0, when: 'spark' },
    ],
    details: [{ name: 'pupil', bone: 'body', x: 0, y: -1, grid: ['aa', 'aa'], key: { a: 'eye:o' }, clip: ['eye'] }],
  };
}

const WIRE = set(
  'wire',
  'Wire Crawler',
  wireRig(),
  basic(
    [{}, { bones: { body: { y: -1, rot: 3 } }, flags: ['spark'] }, { bones: { body: { y: 0.5, rot: -2 } } }],
    [{ bones: { body: { x: -4, rot: -10 } } }, { bones: { body: { x: 12, rot: 12, y: -2 } }, flags: ['spark'] }, { bones: { body: { x: 5 } } }],
    { bones: { body: { x: -5, rot: -12 } }, flags: ['spark'] },
    [{ bones: { body: { y: 4, rot: 20 } }, flags: ['spark'] }, { bones: { body: { y: 12, rot: 50, sy: 0.8 } } }],
    [{ bones: { body: { y: -2 } }, flags: ['spark'] }, { bones: { body: { y: -4, sx: 1.1 } }, flags: ['spark'] }, { bones: { body: { y: -1 } } }],
  ),
);

// ---------------------------------------------------------------------------
// Runaway Parcel, 48x48: a brown-paper parcel with string and somewhere to be.

const PARCEL_M: Record<string, Material> = {
  paper: ramp('paper', '#b88a5a', { step: 0.08 }),
  string: manual('string', ['#fff8e8', '#ecdcc0', '#cfb890', '#a08a68'], '#5a4a34'),
  stamp: manual('stamp', ['#f08070', '#c8392f', '#962a24', '#64201c'], '#3a1210'),
  legs: ramp('legs', '#4a3a2e', { step: 0.07 }),
  eye: DARK_EYE,
};

function parcelRig(): Rig {
  return {
    id: 'parcel-battle',
    width: 48,
    height: 48,
    materials: PARCEL_M,
    bones: [
      { name: 'root', x: 24, y: 46 },
      { name: 'box', parent: 'root', x: 0, y: -14 },
      { name: 'legL', parent: 'root', x: -5, y: 0 },
      { name: 'legR', parent: 'root', x: 5, y: 0 },
    ],
    parts: [
      { name: 'legL', bone: 'legL', z: 0, material: 'legs', shape: limb([[0, -7, 1.2], [1, 0, 1.2]]), shade: { shadow: 1, light: 0 }, thin: true },
      { name: 'legR', bone: 'legR', z: 0, material: 'legs', shape: limb([[0, -7, 1.2], [1, 0, 1.2]]), shade: { shadow: 1, light: 0 }, thin: true },
      { name: 'box', bone: 'box', z: 1, material: 'paper', shape: path('M -12 -10 L 10 -12 L 13 8 L -10 10 Z'), shade: { shadow: 3, light: 1 } },
      { name: 'string', bone: 'box', z: 1.2, material: 'string', shape: [...poly(-1.6, -11, 0.6, -11, 1.6, 9, -0.6, 9), ...poly(-11, -1, 12, -2.4, 12, -0.6, -11, 1)], clipTo: ['box'], shade: { shadow: 0, light: 0, flat: true }, cast: 0, outline: false, sep: false },
      { name: 'bow', bone: 'box', z: 1.4, material: 'string', shape: [...ellipse(-3, -13, 3, 1.8), ...ellipse(3, -13.4, 3, 1.8)], shade: { shadow: 1, light: 0 }, thin: true, cast: 0 },
      { name: 'stamp', bone: 'box', z: 1.3, material: 'stamp', shape: roundRect(4, -9, 5, 6, 0.6), shade: { shadow: 1, light: 0 }, cast: 0 },
    ],
    details: [
      { name: 'eyes', bone: 'box', x: -7, y: -5, grid: ['a..a'], key: { a: 'eye:o' }, clip: ['box'] },
      { name: 'address', bone: 'box', x: -9, y: 3, grid: ['aaaa.aa', '.......', 'aaa.aaa'], key: { a: 'legs:1' }, clip: ['box'] },
    ],
  };
}

const PARCEL = set(
  'parcel',
  'Runaway Parcel',
  parcelRig(),
  basic(
    [{ bones: { legL: { y: -1 } } }, { bones: { legR: { y: -1 }, box: { rot: 3 } } }, { bones: { legL: { y: -1 }, box: { rot: -3 } } }],
    [{ bones: { box: { rot: -10 } } }, { bones: { box: { rot: 10, x: 8 } } }, { bones: { box: { x: 3 } } }],
    { bones: { box: { rot: -14, x: -3 } } },
    [{ bones: { box: { x: -10, rot: -10 } } }, { bones: { box: { x: -30, rot: -20 }, legL: { x: -24 }, legR: { x: -24 } } }],
    [{ bones: { box: { y: -4 } } }, { bones: { box: { y: -6, rot: 8 } } }, { bones: { box: { y: -1 } } }],
  ),
);

// ---------------------------------------------------------------------------
// Old Brass, 64x96: a war-era mining engine still following its last orders.

const BRASS_M: Record<string, Material> = {
  brass: manual('brass', ['#f4dc8c', '#d3a648', '#9c6e2e', '#6b4724'], '#432a19'),
  iron: ramp('iron', '#5a5e64', { step: 0.08 }),
  boiler: ramp('boiler', '#7a4a32', { step: 0.08 }),
  fire: manual('fire', ['#fff0a0', '#f8a040', '#d05020', '#802010'], '#401008'),
  steam: manual('steam', ['#ffffff', '#f0f0f2', '#d8d8de', '#b0b0ba'], '#7a7a86'),
  paint: ramp('paint', '#3a5a3a', { step: 0.08 }),
  eye: RED_EYE,
};

function brassRig(): Rig {
  return {
    id: 'brass-battle',
    width: 64,
    height: 96,
    materials: BRASS_M,
    bones: [
      { name: 'root', x: 28, y: 94 },
      { name: 'body', parent: 'root', x: 0, y: -22 },
      { name: 'head', parent: 'body', x: 4, y: -46 },
      { name: 'arm', parent: 'body', x: 16, y: -24 },
      { name: 'gun', parent: 'body', x: -6, y: -36 },
      { name: 'stack', parent: 'body', x: -13, y: -36 },
    ],
    parts: [
      { name: 'tracks', bone: 'root', z: 0, material: 'iron', shape: roundRect(-26, -12, 52, 12, 6), shade: { shadow: 2, light: 1 } },
      { name: 'wheels', bone: 'root', z: 0.2, material: 'brass', shape: [-17, -6, 5, 16].flatMap((x) => ellipse(x, -6, 3.6, 3.6)), shade: { shadow: 1, light: 1 }, cast: 0 },
      { name: 'stack', bone: 'stack', z: 0.5, material: 'iron', shape: roundRect(-4, -18, 8, 20, 1.4), shade: { shadow: 2, light: 1 } },
      { name: 'stackRim', bone: 'stack', z: 0.6, material: 'brass', shape: roundRect(-5.6, -20, 11.2, 3.4, 1), shade: { shadow: 1, light: 1 }, cast: 0 },
      { name: 'gun', bone: 'gun', z: 0.8, material: 'iron', shape: [...roundRect(-2, -3, 30, 5, 2), ...roundRect(-2, 4, 26, 4, 2)], shade: { shadow: 1, light: 1 }, when: 'guns' },
      { name: 'boiler', bone: 'body', z: 1, material: 'boiler', shape: path('M -20 12 L -20 -34 Q -20 -42 -12 -42 L 12 -42 Q 20 -42 20 -34 L 20 12 Z'), shade: { shadow: 3, light: 1 } },
      { name: 'bands', bone: 'body', z: 1.2, material: 'brass', shape: [...poly(-20, -30, 20, -30, 20, -27, -20, -27), ...poly(-20, -6, 20, -6, 20, -3, -20, -3)], clipTo: ['boiler'], shade: { shadow: 1, light: 1, dir: [0, 1] }, cast: 0, outline: false },
      { name: 'gunBase', bone: 'gun', z: 1.3, material: 'paint', shape: roundRect(-6, -5, 10, 14, 2), shade: { shadow: 1, light: 1 } },
      { name: 'firebox', bone: 'body', z: 1.4, material: 'iron', shape: roundRect(-12, -18, 16, 11, 2), shade: { shadow: 1, light: 1 }, cast: 0 },
      { name: 'fire', bone: 'body', z: 1.5, material: 'fire', shape: roundRect(-9.6, -15.6, 11, 6.4, 1.4), shade: { shadow: 1, light: 1, dir: [0, -1] }, cast: 0, outline: false },
      { name: 'head', bone: 'head', z: 2, material: 'paint', shape: path('M -10 6 L -10 -6 Q -10 -12 -4 -12 L 8 -12 Q 14 -12 14 -6 L 14 6 Z'), shade: { shadow: 2, light: 1 } },
      { name: 'visor', bone: 'head', z: 2.2, material: 'iron', shape: roundRect(-2, -7, 15, 6, 1), shade: { shadow: 1, light: 1 }, cast: 0 },
      { name: 'arm', bone: 'arm', z: 3, material: 'iron', shape: limb([[0, 0, 4], [6, 8, 3.6], [8, 16, 3.2]]), shade: { shadow: 1, light: 1 } },
      { name: 'piston', bone: 'arm', z: 3.2, material: 'brass', shape: roundRect(2, 15, 11, 10, 2), shade: { shadow: 2, light: 1 } },
      { name: 'steam', bone: 'stack', z: 4, material: 'steam', shape: [...ellipse(-1, -23, 5, 3.4), ...ellipse(4, -27, 4, 2.8), ...ellipse(0, -30, 3, 2.2)], shade: { shadow: 1, light: 1 }, cast: 0, when: 'steam' },
    ],
    details: [
      { name: 'eyes', bone: 'head', x: 1, y: -5, grid: ['aa..aa..aa'], key: { a: 'eye:1' }, clip: ['visor'] },
      { name: 'rivets', bone: 'body', x: -17, y: -39, grid: ['a.....a.....a.....a', '...................', 'a.................a', '...................', '...................', 'a.................a'], key: { a: 'brass:0' }, clip: ['boiler'] },
      { name: 'stencil', bone: 'body', x: -6, y: 0, grid: ['a.aa.a.aaa', 'a.a..a.a.a', 'aaa..a.aaa'], key: { a: 'paint:0' }, clip: ['boiler'] },
    ],
  };
}

const BRASS = set(
  'brass',
  'Old Brass',
  brassRig(),
  [
    anim('idle', [{ flags: ['guns'] }, { bones: { body: { y: 0.6 }, arm: { rot: -4 } }, flags: ['guns', 'steam'] }, { bones: { body: { y: 0.2 } }, flags: ['guns'] }, { bones: { arm: { rot: 3 } }, flags: ['guns', 'steam'] }], 300),
    anim('attack', [{ bones: { arm: { rot: -40 }, body: { x: -4 } }, flags: ['guns'] }, { bones: { arm: { rot: 20, x: 10 }, body: { x: 8 } }, flags: ['guns', 'steam'] }, { bones: { arm: { rot: 0 }, body: { x: 3 } }, flags: ['guns'] }], [180, 90, 180], false),
    anim('cast', [{ bones: { gun: { rot: -10 } }, flags: ['guns', 'steam'] }, { bones: { gun: { rot: -18, x: -3 }, body: { x: -2 } }, flags: ['guns', 'steam'] }, { bones: { gun: { rot: -4 } }, flags: ['guns'] }], [150, 260, 150], false),
    anim('hit', [{ bones: { body: { x: -4, rot: -3 } }, flags: ['guns', 'steam'] }], 220, false),
    anim('defeat', [{ bones: { body: { y: 2, rot: 4 }, head: { rot: 10 }, arm: { rot: 30 } }, flags: ['steam'] }, { bones: { body: { y: 6, rot: 6 }, head: { rot: 24, y: 4 }, arm: { rot: 60 }, gun: { rot: 30 } }, flags: ['steam'] }], [180, 400], false),
  ],
  'battle',
);

export const CREATURE_SPRITES: CharacterSprites[] = [LEECH, WISP, HOUND, SLAG, CRAB, GULL, WIRE, PARCEL, BRASS];
