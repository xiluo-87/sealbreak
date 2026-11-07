/**
 * Tier 1 enemies and the tutorial rats. Regular enemies are 48-72 px and
 * face right, toward the party, with idle, attack, hit and defeat frames.
 */
import { manual, type Material, ramp } from '../palette';
import type { Pose, Rig } from '../rig';
import { capsule, ellipse, limb, path, poly, roundRect } from '../shapes';
import { anim, type CharacterSprites, type SpriteSetDef } from '../types';

const EYE = manual('eye', ['#f0c060', '#c03030', '#601818', '#200808'], '#100404');
const BLACK_EYE = manual('eye', ['#8a8a9a', '#3a3a46', '#202028', '#101016'], '#08080c');

function set(id: string, name: string, rig: Rig, anims: SpriteSetDef['anims']): CharacterSprites {
  return { id, name, sets: () => [{ id: `${id}-battle`, character: id, kind: 'enemy', rig, anims }] };
}

// ---------------------------------------------------------------------------
// Sorting Room Rat, 48x48.

const RAT_M: Record<string, Material> = {
  fur: ramp('fur', '#7d7068', { step: 0.08 }),
  pink: manual('pink', ['#f2c4ba', '#d99c92', '#b47a72', '#8a5852'], '#5a3430'),
  dark: ramp('dark', '#4a3e3a', { step: 0.07 }),
  eye: BLACK_EYE,
};

function ratRig(): Rig {
  return {
    id: 'rat-battle',
    width: 48,
    height: 48,
    materials: RAT_M,
    bones: [
      { name: 'root', x: 22, y: 44 },
      { name: 'body', parent: 'root', x: 0, y: -7 },
      { name: 'head', parent: 'body', x: 9, y: -2 },
      { name: 'tail', parent: 'body', x: -9, y: 1 },
    ],
    parts: [
      { name: 'tail', bone: 'tail', z: 0, material: 'pink', shape: path('M 0 0 Q -8 2 -11 -5 Q -12 -10 -8 -12 L -7.4 -11 Q -10 -9 -9.4 -5.6 Q -7 0 0 1.6 Z'), shade: { shadow: 1, light: 0 }, thin: true },
      { name: 'legB', bone: 'body', z: 1, material: 'dark', shape: ellipse(-5, 5, 3, 2), shade: { shadow: 1, light: 0 } },
      { name: 'body', bone: 'body', z: 2, material: 'fur', shape: ellipse(-1, 0, 10, 6.4), shade: { shadow: 2, light: 1 }, marks: [{ tone: 0, shape: poly(-8, -4, 0, -6, 0, -5, -8, -3) }] },
      { name: 'legF', bone: 'body', z: 3, material: 'dark', shape: ellipse(5, 5.6, 2.6, 1.8), shade: { shadow: 1, light: 0 } },
      { name: 'head', bone: 'head', z: 4, material: 'fur', shape: path('M -5 -4 Q 0 -6 4 -3 L 9 0 Q 9 2 7 2.4 L -3 4 Q -6 2 -5 -4 Z'), shade: { shadow: 1, light: 1 } },
      { name: 'nose', bone: 'head', z: 5, material: 'pink', shape: ellipse(8.6, 0.6, 1.4, 1.2), shade: { flat: true }, cast: 0 },
      { name: 'ear', bone: 'head', z: 5, material: 'pink', shape: ellipse(-2, -6, 3, 3.4), shade: { shadow: 1, light: 1 } },
    ],
    details: [
      { name: 'eye', bone: 'head', x: 2, y: -2, grid: ['ab'], key: { a: 'eye:o', b: 'eye:0' }, clip: ['head'] },
      { name: 'whiskers', bone: 'head', x: 6, y: 1, grid: ['..dd', 'dd..'], key: { d: 'dark:2' } },
    ],
  };
}

function ratAnims(): SpriteSetDef['anims'] {
  return [
    anim('idle', [{}, { bones: { head: { rot: -4, y: -0.5 }, tail: { rot: 6 } } }], 260),
    anim('attack', [{ bones: { body: { x: -3, rot: -6 } } }, { bones: { body: { x: 8, rot: 6 }, head: { rot: 6 } } }, { bones: { body: { x: 4 } } }], [140, 90, 160], false),
    anim('hit', [{ bones: { body: { x: -5, rot: -10 } } }], 220, false),
    anim('defeat', [{ bones: { body: { rot: 40, y: 1 } } }, { bones: { body: { rot: 175, y: -6 } } }], [160, 400], false),
  ];
}

// ---------------------------------------------------------------------------
// Bramble Hog, 64x48.

const HOG_M: Record<string, Material> = {
  hide: ramp('hide', '#6b4a36', { step: 0.08 }),
  snout: manual('snout', ['#e2a890', '#c08670', '#9a6656', '#744a40'], '#4a2a24'),
  tusk: manual('tusk', ['#fffaf0', '#ece2cc', '#cfc0a0', '#a8987a'], '#6e6048'),
  bramble: ramp('bramble', '#4f6b3a', { step: 0.08 }),
  berry: manual('berry', ['#f07a6a', '#c8392f', '#962722', '#64191a'], '#3e0f12'),
  hoof: ramp('hoof', '#3a2c26', { step: 0.07 }),
  eye: EYE,
};

function hogRig(): Rig {
  const leg = (name: string, z: number, far: boolean): Rig['parts'] => [
    { name, bone: name, z, material: far ? 'hoof' : 'hide', shape: capsule(0, -9, 2.6, 0, -2, 2.2), shade: { shadow: 1, light: 1, base: far ? 2 : 1 } },
    { name: `${name}Hoof`, bone: name, z: z + 0.1, material: 'hoof', shape: roundRect(-2.4, -2.6, 4.8, 2.8, 0.8), shade: { shadow: 1, light: 0 } },
  ];
  return {
    id: 'hog-battle',
    width: 64,
    height: 48,
    materials: HOG_M,
    bones: [
      { name: 'root', x: 30, y: 46 },
      { name: 'body', parent: 'root', x: 0, y: -14 },
      { name: 'head', parent: 'body', x: 14, y: 1 },
      { name: 'legBF', parent: 'root', x: -9, y: 0 },
      { name: 'legFF', parent: 'root', x: 8, y: 0 },
      { name: 'legBN', parent: 'root', x: -12, y: 0 },
      { name: 'legFN', parent: 'root', x: 11, y: 0 },
    ],
    parts: [
      ...leg('legBF', 0, true),
      ...leg('legFF', 0, true),
      { name: 'body', bone: 'body', z: 2, material: 'hide', shape: path('M -16 2 Q -18 -9 -6 -11 L 6 -11 Q 15 -9 15 1 Q 13 8 2 9 L -10 9 Q -16 8 -16 2 Z'), shade: { shadow: 3, light: 1 }, marks: [{ tone: 0, shape: poly(-12, -8, 2, -10.4, 2, -9.4, -12, -7) }] },
      { name: 'tail', bone: 'body', z: 1.5, material: 'hide', shape: path('M -15 -2 Q -20 -4 -19 -8 Q -17 -6 -15 -5 Z'), shade: { shadow: 1, light: 1 }, thin: true },
      ...leg('legBN', 3, false),
      ...leg('legFN', 3, false),
      { name: 'head', bone: 'head', z: 4, material: 'hide', shape: path('M -6 -8 Q 2 -10 7 -4 L 10 0 Q 9 5 4 6 L -4 7 Q -8 2 -6 -8 Z'), shade: { shadow: 2, light: 1 } },
      { name: 'ear', bone: 'head', z: 5, material: 'hide', shape: poly(-3, -8, 1, -12.6, 2, -7), shade: { shadow: 1, light: 1 } },
      { name: 'snout', bone: 'head', z: 5, material: 'snout', shape: roundRect(7, -2, 5, 5.2, 1.6), shade: { shadow: 1, light: 1 } },
      { name: 'tusk', bone: 'head', z: 6, material: 'tusk', shape: path('M 6 3 Q 9 4 10 0.6 L 10.8 1 Q 10.4 6 6 4.6 Z'), shade: { shadow: 1, light: 1 }, thin: true },
      { name: 'bramble', bone: 'body', z: 3, material: 'bramble', shape: [...limb([[-12, -9, 1], [-6, -13, 0.9], [0, -11, 1]]), ...limb([[2, -10, 0.9], [7, -14, 0.8]]), ...limb([[-8, -10, 0.8], [-10, -15, 0.7]])], shade: { shadow: 1, light: 1 }, thin: true },
    ],
    details: [
      { name: 'eye', bone: 'head', x: 1, y: -4, grid: ['ab'], key: { a: 'eye:o', b: 'eye:1' }, clip: ['head'] },
      { name: 'nostrils', bone: 'head', x: 10, y: 0, grid: ['a', '.', 'a'], key: { a: 'snout:3' }, clip: ['snout'] },
      { name: 'berries', bone: 'body', x: -7, y: -15, grid: ['a.......', '........', '......a.', '.a......'], key: { a: 'berry:1' } },
      { name: 'bristles', bone: 'body', x: -13, y: -4, grid: ['a..a..a..a', '.a..a..a..'], key: { a: 'hide:3' }, clip: ['body'] },
    ],
  };
}

function hogAnims(): SpriteSetDef['anims'] {
  return [
    anim('idle', [{}, { bones: { head: { rot: 4, y: 0.5 }, body: { y: 0.5 } } }], 300),
    anim('attack', [{ bones: { body: { x: -4, rot: 6 }, head: { rot: 10 } } }, { bones: { body: { x: 12, rot: -4 }, head: { rot: -6 }, legFN: { x: 4 }, legBN: { x: -4 } } }, { bones: { body: { x: 6 } } }], [180, 90, 180], false),
    anim('hit', [{ bones: { body: { x: -5, rot: -8 }, head: { rot: -8 } } }], 220, false),
    anim('defeat', [{ bones: { body: { rot: 8, y: 2 }, head: { rot: 16 } } }, { bones: { body: { rot: 4, y: 7 }, head: { rot: 24, y: 2 }, legFN: { x: 4, y: -1 }, legFF: { x: 3, y: -1 }, legBN: { x: -4, y: -1 }, legBF: { x: -3, y: -1 } } }], [180, 400], false),
  ];
}

// ---------------------------------------------------------------------------
// Angry Goose, 48x64.

const GOOSE_M: Record<string, Material> = {
  feather: manual('feather', ['#ffffff', '#ecebe6', '#c9c7c2', '#a09ea0'], '#5e5c66'),
  wing: ramp('wing', '#b4b2b0', { step: 0.075 }),
  beak: manual('beak', ['#ffc070', '#f0902c', '#c06a1c', '#8a4610'], '#542a08'),
  eye: BLACK_EYE,
  brow: ramp('brow', '#3a3a46', { step: 0.06 }),
};

function gooseRig(): Rig {
  return {
    id: 'goose-battle',
    width: 48,
    height: 64,
    materials: GOOSE_M,
    bones: [
      { name: 'root', x: 22, y: 61 },
      { name: 'body', parent: 'root', x: 0, y: -16 },
      { name: 'neck', parent: 'body', x: 7, y: -4 },
      { name: 'head', parent: 'neck', x: 3, y: -20 },
      { name: 'wing', parent: 'body', x: -2, y: -1 },
      { name: 'footN', parent: 'root', x: 2, y: 0 },
      { name: 'footF', parent: 'root', x: -3, y: 0 },
    ],
    parts: [
      { name: 'legF', bone: 'footF', z: 0, material: 'beak', shape: (c) => {
        const [hx, hy] = c.p('body', -3, 6);
        const [fx, fy] = c.p('footF', 0, -1);
        return capsule(hx, hy, 1.1, fx, fy, 1);
      }, shade: { shadow: 1, light: 0, base: 2 }, thin: true },
      { name: 'footFw', bone: 'footF', z: 0.1, material: 'beak', shape: poly(-2, 0, 4, 0, 2, -2), shade: { flat: true, base: 2 } },
      { name: 'tail', bone: 'body', z: 1, material: 'feather', shape: path('M -10 -2 L -17 -9 L -15 -1 Z'), shade: { shadow: 1, light: 1 } },
      { name: 'body', bone: 'body', z: 2, material: 'feather', shape: ellipse(-1, 0, 12, 8.4), shade: { shadow: 3, light: 1 } },
      { name: 'neck', bone: 'neck', z: 3, material: 'feather', shape: (c) => {
        const a = c.p('neck', 0, 0);
        const b = c.p('neck', 4, -10);
        const d = c.p('head', -1, 2);
        return limb([
          [a[0], a[1], 4.2],
          [b[0], b[1], 3],
          [d[0], d[1], 2.8],
        ]);
      }, shade: { shadow: 1, light: 1 }, sep: false },
      { name: 'head', bone: 'head', z: 4, material: 'feather', shape: ellipse(0, 0, 4.6, 3.8), shade: { shadow: 1, light: 1 } },
      { name: 'beak', bone: 'head', z: 5, material: 'beak', shape: path('M 3 -1.6 L 10 0.6 L 3 2 Z'), shade: { shadow: 1, light: 1 }, unless: 'honk' },
      { name: 'beakOpen', bone: 'head', z: 5, material: 'beak', shape: [...poly(3, -1.8, 10, -3.4, 4, 0), ...poly(3, 1, 9.6, 3.6, 3, 2.6)], shade: { shadow: 1, light: 1 }, when: 'honk' },
      { name: 'wing', bone: 'wing', z: 3.5, material: 'wing', shape: path('M -9 -4 Q 0 -8 8 -2 Q 2 5 -8 3 Z'), shade: { shadow: 2, light: 1 }, marks: [{ tone: 2, shape: poly(-7, 0, 4, -1, 4, 0, -7, 1) }] },
      { name: 'legN', bone: 'footN', z: 6, material: 'beak', shape: (c) => {
        const [hx, hy] = c.p('body', 2, 6);
        const [fx, fy] = c.p('footN', 0, -1);
        return capsule(hx, hy, 1.2, fx, fy, 1);
      }, shade: { shadow: 1, light: 0 }, thin: true },
      { name: 'footNw', bone: 'footN', z: 6.1, material: 'beak', shape: poly(-2, 0, 5, 0, 2.6, -2.2), shade: { flat: true } },
    ],
    details: [
      { name: 'eye', bone: 'head', x: 1, y: -1, grid: ['a'], key: { a: 'eye:o' }, clip: ['head'] },
      { name: 'brow', bone: 'head', x: -1, y: -3, grid: ['bb..', '..bb'], key: { b: 'brow:1' }, clip: ['head'] },
    ],
  };
}

function gooseAnims(): SpriteSetDef['anims'] {
  return [
    anim('idle', [{}, { bones: { neck: { rot: -6 }, head: { rot: 4 } } }, { bones: { neck: { rot: 3 }, wing: { rot: -4 } } }], 240),
    anim('attack', [{ bones: { neck: { rot: -30 }, head: { rot: 20 }, wing: { rot: -20 } } }, { bones: { body: { x: 6 }, neck: { rot: 45 }, head: { rot: -30 }, wing: { rot: -35 } } }, { bones: { body: { x: 3 }, neck: { rot: 20 } } }], [150, 90, 170], false),
    anim('cast', [{ bones: { neck: { rot: -15 }, wing: { rot: -30 } }, flags: ['honk'] }, { bones: { neck: { rot: -20 }, head: { rot: -15 }, wing: { rot: -45 }, body: { y: -2 } }, flags: ['honk'] }, { bones: { neck: { rot: -5 } } }], [150, 260, 150], false),
    anim('hit', [{ bones: { body: { x: -4, rot: -8 }, neck: { rot: -20 }, wing: { rot: -25 } } }], 220, false),
    anim('defeat', [{ bones: { body: { rot: 20, y: 2 }, neck: { rot: 50 } } }, { bones: { body: { rot: 85, y: 8 }, neck: { rot: 80 } } }], [180, 400], false),
  ];
}

// ---------------------------------------------------------------------------
// Road Brigand, 64x72.

const BRIGAND_M: Record<string, Material> = {
  coat: ramp('coat', '#6a5040', { step: 0.08 }),
  patch: ramp('patch', '#8a7a52', { step: 0.08 }),
  trousers: ramp('trousers', '#3e3a40', { step: 0.07 }),
  hat: ramp('hat', '#2e2a30', { step: 0.07 }),
  mask: ramp('mask', '#a8342c', { step: 0.08 }),
  skin: manual('skin', ['#e6b08a', '#c88e68', '#a06a4a', '#784a34'], '#4a2a1e'),
  club: ramp('club', '#7a5a3a', { step: 0.08 }),
  boots: ramp('boots', '#3a2c26', { step: 0.07 }),
  eye: BLACK_EYE,
};

function brigandRig(): Rig {
  return {
    id: 'brigand-battle',
    width: 64,
    height: 72,
    materials: BRIGAND_M,
    bones: [
      { name: 'root', x: 28, y: 70 },
      { name: 'pelvis', parent: 'root', x: 0, y: -24 },
      { name: 'chest', parent: 'pelvis', x: 0, y: -10 },
      { name: 'head', parent: 'chest', x: 1, y: -9 },
      { name: 'armF', parent: 'chest', x: 4, y: -6, rot: -20 },
      { name: 'armB', parent: 'chest', x: -5, y: -6, rot: 10 },
      { name: 'club', parent: 'armF', x: 0, y: 14, rot: -60 },
      { name: 'footF', parent: 'root', x: 6, y: 0 },
      { name: 'footB', parent: 'root', x: -5, y: 0 },
    ],
    parts: [
      { name: 'armB', bone: 'armB', z: 0, material: 'coat', shape: limb([[0, 0, 2.8], [0, 12, 2.4]]), shade: { shadow: 1, light: 1, base: 2 } },
      { name: 'legB', bone: 'pelvis', z: 1, material: 'trousers', shape: (c) => {
        const [hx, hy] = c.p('pelvis', -3, 1);
        const [fx, fy] = c.p('footB', 0, -4);
        return capsule(hx, hy, 3.2, fx, fy, 2.6);
      }, shade: { shadow: 1, light: 1, base: 2 } },
      { name: 'bootB', bone: 'footB', z: 1.2, material: 'boots', shape: path('M -3 0.4 L -3 -5 L 3 -5 L 6.4 -1.6 L 6.4 0.4 Z'), shade: { shadow: 1, light: 1 } },
      { name: 'legF', bone: 'pelvis', z: 2, material: 'trousers', shape: (c) => {
        const [hx, hy] = c.p('pelvis', 3, 1);
        const [fx, fy] = c.p('footF', 0, -4);
        return capsule(hx, hy, 3.4, fx, fy, 2.8);
      }, shade: { shadow: 1, light: 1 } },
      { name: 'bootF', bone: 'footF', z: 2.2, material: 'boots', shape: path('M -3 0.4 L -3 -5 L 3 -5 L 6.8 -1.6 L 6.8 0.4 Z'), shade: { shadow: 1, light: 1 } },
      { name: 'coat', bone: 'chest', z: 3, material: 'coat', shape: path('M -6 -9 L 6 -9 Q 9 -8 9 -4 L 8.6 14 L 1 15 L -8 14 L -8.6 -4 Q -9 -8 -6 -9 Z'), shade: { shadow: 3, light: 1 }, marks: [{ tone: 3, shape: poly(1, -6, 1.8, -6, 1.8, 15, 1, 15) }] },
      { name: 'patch', bone: 'chest', z: 3.2, material: 'patch', shape: roundRect(-6, 4, 5, 5, 1), shade: { shadow: 1, light: 1 } },
      { name: 'head', bone: 'head', z: 4, material: 'skin', shape: ellipse(0, -5, 5.6, 6.2), shade: { shadow: 2, light: 1 } },
      { name: 'mask', bone: 'head', z: 4.5, material: 'mask', shape: path('M -5.8 -4 L 6 -4 L 6.4 0 Q 3 3.4 -1 2 L -6 -0.4 Z'), shade: { shadow: 1, light: 1 } },
      { name: 'knot', bone: 'head', z: 3.8, material: 'mask', shape: path('M -5 -3 L -10 -1 L -8 1 L -5 -1 Z'), shade: { shadow: 1, light: 1 } },
      { name: 'hatBrim', bone: 'head', z: 5, material: 'hat', shape: ellipse(0.6, -9, 9.4, 2), shade: { shadow: 1, light: 1 }, cast: 2 },
      { name: 'hatCrown', bone: 'head', z: 5.1, material: 'hat', shape: path('M -5 -9 Q -5 -15.6 0.6 -15.6 Q 6 -15.6 6 -9 Z'), shade: { shadow: 1, light: 1 }, marks: [{ tone: 3, shape: poly(-5, -10.6, 6, -10.6, 6, -9.4, -5, -9.4) }] },
      { name: 'armF', bone: 'armF', z: 6, material: 'coat', shape: limb([[0, 0, 3], [0, 12, 2.6]]), shade: { shadow: 1, light: 1 } },
      { name: 'handF', bone: 'armF', z: 6.2, material: 'skin', shape: ellipse(0, 14, 2.6, 2.6), shade: { shadow: 1, light: 1 }, cast: 0 },
      { name: 'club', bone: 'club', z: 5.9, material: 'club', shape: path('M -1.4 2 L 1.4 2 L 2.6 -15 Q 0 -18 -2.6 -15 Z'), shade: { shadow: 1, light: 1, dir: [1, 0] } },
    ],
    details: [
      { name: 'eyes', bone: 'head', x: 0, y: -7, grid: ['a..a'], key: { a: 'eye:o' }, clip: ['head'] },
      { name: 'brow', bone: 'head', x: -1, y: -8, grid: ['bb.bb'], key: { b: 'hat:2' }, clip: ['head'] },
      { name: 'stitch', bone: 'chest', x: -6, y: 4, grid: ['a.a.a', '.....', 'a...a', '.....', 'a.a.a'], key: { a: 'patch:3' }, clip: ['patch'] },
      { name: 'nails', bone: 'club', x: -2, y: -14, grid: ['a..', '..a', 'a..'], key: { a: 'hat:0' }, clip: ['club'] },
    ],
  };
}

function brigandAnims(): SpriteSetDef['anims'] {
  const breathe = (y: number): Pose => ({ bones: { chest: { y }, head: { y: y * 0.5 } } });
  return [
    anim('idle', [breathe(0), breathe(0.6)], 320),
    anim('attack', [{ bones: { armF: { rot: -130 }, club: { rot: -20 }, chest: { rot: -8 } } }, { bones: { pelvis: { x: 8 }, armF: { rot: 20 }, club: { rot: -40 }, chest: { rot: 12 }, footF: { x: 8 } } }, { bones: { pelvis: { x: 5 }, armF: { rot: 30 }, chest: { rot: 8 }, footF: { x: 5 } } }], [180, 90, 180], false),
    anim('hit', [{ bones: { pelvis: { x: -4 }, chest: { rot: -14 }, head: { rot: -12 } } }], 220, false),
    anim('defeat', [{ bones: { pelvis: { y: 8, rot: -10 }, chest: { rot: 20 }, head: { rot: 20 } } }, { bones: { pelvis: { y: 18, x: -6, rot: -80 }, chest: { rot: 4 }, head: { rot: 10 } } }], [200, 400], false),
  ];
}

export const RAT = set('rat', 'Sorting Room Rat', ratRig(), ratAnims());
export const HOG = set('hog', 'Bramble Hog', hogRig(), hogAnims());
export const GOOSE = set('goose', 'Angry Goose', gooseRig(), gooseAnims());
export const BRIGAND = set('brigand', 'Road Brigand', brigandRig(), brigandAnims());

export const ENEMY_SPRITES: CharacterSprites[] = [RAT, HOG, GOOSE, BRIGAND];
