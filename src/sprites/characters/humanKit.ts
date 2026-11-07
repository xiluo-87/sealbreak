/**
 * A parameterised humanoid for battle sprites: party members and bosses at
 * 64x96, regular human enemies at 72x72. Authored facing right, toward the
 * party; party members are mirrored to face left. Parts follow the same
 * pipeline as the hand-built characters: shaded materials, cast shadows,
 * selective outlines and small detail grids for faces and buttons.
 */
import { manual, type Material, ramp } from '../palette';
import type { DetailDef, PartDef, Pose, Rig } from '../rig';
import { capsule, ellipse, limb, path, poly, roundRect, type Shape } from '../shapes';
import { anim, type AnimDef, type CharacterSprites, type SpriteSetDef } from '../types';

export type HumanBuild = 'average' | 'broad' | 'slim' | 'stout';
export type CoatStyle = 'greatcoat' | 'jacket' | 'uniform' | 'robe' | 'vest' | 'wrap';
export type HumanHair = 'short' | 'cropped' | 'long' | 'bun' | 'pinned' | 'bald' | 'messy';
export type HumanHat = 'cap' | 'tophat' | 'bowler' | 'helmet' | 'bandana' | 'slouch' | 'tricorn' | 'hardhat';
export type HumanProp =
  | 'sign'
  | 'club'
  | 'pike'
  | 'gavel'
  | 'clipboard'
  | 'stampMace'
  | 'scimitar'
  | 'halberd'
  | 'spanner'
  | 'ledger'
  | 'pick'
  | 'stamp'
  | 'cutlass';
export type HumanExtra =
  | 'stubble'
  | 'scar'
  | 'mask'
  | 'beard'
  | 'moustache'
  | 'glasses'
  | 'epaulettes'
  | 'sash'
  | 'patches'
  | 'gloves'
  | 'belt'
  | 'badge'
  | 'buttons2'
  | 'apron'
  | 'earring';

export interface HumanSpec {
  id: string;
  name: string;
  /** battle: 64x96 (party and bosses); enemy: 72x72 (regular foes). */
  kind: 'battle' | 'enemy';
  build: HumanBuild;
  skin: string;
  hair: string;
  hairStyle: HumanHair;
  coat: string;
  coatStyle: CoatStyle;
  /** Shirt or waistcoat under the coat. */
  under: string;
  trousers: string;
  boots: string;
  /** Trim, sashes and painted things. */
  accent: string;
  metal?: 'brass' | 'silver' | 'iron';
  hat?: { style: HumanHat; colour: string };
  prop?: HumanProp;
  extras?: HumanExtra[];
  /** Party members face left. */
  mirror?: boolean;
  /** Eye colour. */
  eye?: string;
}

const METALS: Record<string, Material> = {
  brass: manual('metal', ['#f4dc8c', '#d3a648', '#9c6e2e', '#6b4724'], '#432a19'),
  silver: manual('metal', ['#f2f2f4', '#c4c6cc', '#8e9098', '#5e6068'], '#33343a'),
  iron: manual('metal', ['#c8ccd0', '#8e949a', '#5e646a', '#3c4046'], '#22252a'),
};

function materials(s: HumanSpec): Record<string, Material> {
  return {
    skin: ramp('skin', s.skin, { step: 0.07, hueShift: 6 }),
    hair: ramp('hair', s.hair, { step: 0.075 }),
    coat: ramp('coat', s.coat, { step: 0.08 }),
    under: ramp('under', s.under, { step: 0.07 }),
    trousers: ramp('trousers', s.trousers, { step: 0.07 }),
    boots: ramp('boots', s.boots, { step: 0.07 }),
    accent: ramp('accent', s.accent, { step: 0.08 }),
    hat: ramp('hat', s.hat?.colour ?? '#444444', { step: 0.075 }),
    metal: METALS[s.metal ?? 'brass'] ?? (METALS.brass as Material),
    wood: ramp('wood', '#8a6440', { step: 0.08 }),
    paper: manual('paper', ['#fbf6e8', '#efe4c8', '#d8c8a2', '#b0a07c'], '#6a5c44'),
    wax: manual('wax', ['#f08070', '#c8392f', '#962a24', '#64201c'], '#3a1210'),
    eye: manual('eye', ['#9a96aa', s.eye ?? '#3a3546', '#252231', '#16141e'], '#0e0c14'),
    blush: manual('blush', ['#f2a28c', '#e48a78', '#c86c62', '#a2524e'], '#5a3030'),
  };
}

interface Dims {
  k: number;
  root: [number, number];
  hip: number;
  torso: number;
  neck: number;
  shoulder: number;
  waist: number;
  leg: number;
  arm: number;
  headR: [number, number];
}

function dims(s: HumanSpec): Dims {
  const big = s.kind === 'battle';
  const k = big ? 1 : 0.83;
  const w = { average: [8.4, 7.2, 3.6, 3.1], broad: [10.4, 9, 4.3, 3.7], slim: [7.4, 6.2, 3.2, 2.8], stout: [9.4, 10.6, 4, 3.4] }[s.build] ?? [8.4, 7.2, 3.6, 3.1];
  return {
    k,
    root: big ? [30, 93] : [34, 71],
    hip: (s.build === 'broad' ? -37 : s.build === 'stout' ? -32 : -35) * k,
    torso: -14 * k,
    neck: -11 * k,
    shoulder: (w[0] ?? 8.4) * k,
    waist: (w[1] ?? 7.2) * k,
    leg: (w[2] ?? 3.6) * k,
    arm: (w[3] ?? 3.1) * k,
    headR: [6.2 * k, 7 * k],
  };
}

function has(s: HumanSpec, e: HumanExtra): boolean {
  return s.extras?.includes(e) ?? false;
}

function bones(s: HumanSpec): Rig['bones'] {
  const d = dims(s);
  const k = d.k;
  return [
    { name: 'root', x: d.root[0], y: d.root[1] },
    { name: 'pelvis', parent: 'root', x: 0, y: d.hip },
    { name: 'chest', parent: 'pelvis', x: 0, y: d.torso },
    { name: 'head', parent: 'chest', x: 1 * k, y: d.neck },
    { name: 'hem', parent: 'pelvis', x: 0, y: 0 },
    { name: 'armF', parent: 'chest', x: (d.shoulder - 2.6 * k), y: -8 * k, rot: -8 },
    { name: 'armB', parent: 'chest', x: -(d.shoulder - 2.6 * k), y: -8 * k, rot: 8 },
    { name: 'prop', parent: 'armF', x: 0, y: 21 * k, rot: -70 },
    { name: 'letter', parent: 'armB', x: 0, y: 21 * k, rot: 0 },
    { name: 'footF', parent: 'root', x: 6 * k, y: 0 },
    { name: 'footB', parent: 'root', x: -5 * k, y: 0 },
  ];
}

/** Coat bottom, in chest space. */
function hemOf(s: HumanSpec, k: number): number {
  switch (s.coatStyle) {
    case 'greatcoat':
      return 30 * k;
    case 'robe':
      return 32 * k;
    case 'uniform':
      return 19 * k;
    case 'vest':
      return 13 * k;
    case 'wrap':
      return 22 * k;
    default:
      return 16 * k;
  }
}

function hairShape(style: HumanHair, k: number): Shape | null {
  const sc = (n: number): number => n * k;
  switch (style) {
    case 'bald':
      return path(`M ${sc(-6.4)} ${sc(-9)} Q ${sc(-7)} ${sc(-5)} ${sc(-5.6)} ${sc(-3)} L ${sc(-4.4)} ${sc(-6)} Z`);
    case 'cropped':
      return path(`M ${sc(-6.4)} ${sc(-7)} Q ${sc(-6.6)} ${sc(-14.2)} ${sc(0.6)} ${sc(-14.4)} Q ${sc(6.4)} ${sc(-14)} ${sc(6.2)} ${sc(-9.6)} L ${sc(3)} ${sc(-11)} L ${sc(-2)} ${sc(-10.4)} L ${sc(-4.4)} ${sc(-8)} L ${sc(-5.2)} ${sc(-4)} L ${sc(-6.4)} ${sc(-4)} Z`);
    case 'long':
      return path(`M ${sc(-6.8)} ${sc(-6)} Q ${sc(-7.2)} ${sc(-15)} ${sc(0.6)} ${sc(-15)} Q ${sc(7)} ${sc(-14.6)} ${sc(6.6)} ${sc(-9)} L ${sc(3)} ${sc(-10.6)} L ${sc(-1.6)} ${sc(-10)} L ${sc(-3.6)} ${sc(-6)} L ${sc(-3.4)} ${sc(4)} L ${sc(-7.4)} ${sc(5)} Z`);
    case 'messy':
      return path(`M ${sc(-7)} ${sc(-5)} L ${sc(-7.6)} ${sc(-10)} L ${sc(-5.6)} ${sc(-12)} L ${sc(-6)} ${sc(-15)} L ${sc(-2)} ${sc(-14.2)} L ${sc(0)} ${sc(-16.4)} L ${sc(2.6)} ${sc(-14.4)} L ${sc(6)} ${sc(-15)} L ${sc(5.6)} ${sc(-12)} L ${sc(7.4)} ${sc(-9.6)} L ${sc(3)} ${sc(-10.6)} L ${sc(-1.6)} ${sc(-10)} L ${sc(-4)} ${sc(-7)} L ${sc(-4.6)} ${sc(-2)} Z`);
    default:
      return path(`M ${sc(-6.6)} ${sc(-5)} Q ${sc(-7)} ${sc(-14.8)} ${sc(0.6)} ${sc(-14.8)} Q ${sc(7)} ${sc(-14.6)} ${sc(6.6)} ${sc(-9.4)} L ${sc(3.4)} ${sc(-10.8)} L ${sc(-1.4)} ${sc(-10.2)} L ${sc(-4)} ${sc(-8)} L ${sc(-4.8)} ${sc(-3.4)} Z`);
  }
}

function hatParts(s: HumanSpec, k: number): PartDef[] {
  const h = s.hat;
  if (!h) return [];
  const sc = (n: number): number => n * k;
  const z = 9;
  const P = (name: string, shape: Shape, extra: Partial<PartDef> = {}): PartDef => ({ name, bone: 'head', z, material: 'hat', shape, shade: { shadow: 1, light: 1 }, cast: 2, ...extra });
  switch (h.style) {
    case 'cap':
      return [
        P('hatCrown', path(`M ${sc(-6.6)} ${sc(-10)} Q ${sc(-7)} ${sc(-17)} ${sc(0.4)} ${sc(-17.2)} Q ${sc(7.4)} ${sc(-17)} ${sc(7)} ${sc(-10)} Z`)),
        P('hatBand', roundRect(sc(-6.8), sc(-11.4), sc(13.8), sc(2.2), sc(0.4)), { material: 'accent', z: z + 0.1, cast: 0 }),
        P('hatPeak', path(`M ${sc(3)} ${sc(-10.4)} L ${sc(11)} ${sc(-9.6)} Q ${sc(10.6)} ${sc(-8.2)} ${sc(4)} ${sc(-8.6)} Z`), { z: z + 0.2, cast: 1 }),
      ];
    case 'tophat':
      return [
        P('hatBrim', ellipse(sc(0.6), sc(-11), sc(9), sc(1.8))),
        P('hatCrown', roundRect(sc(-5), sc(-21), sc(10.6), sc(10.4), sc(1)), { z: z + 0.1, marks: [{ tone: 3, shape: poly(sc(-5), sc(-13), sc(5.6), sc(-13), sc(5.6), sc(-11.6), sc(-5), sc(-11.6)) }] }),
      ];
    case 'bowler':
      return [P('hatBrim', ellipse(sc(0.6), sc(-10.6), sc(8.6), sc(1.8))), P('hatCrown', ellipse(sc(0.4), sc(-13.6), sc(6.2), sc(5)), { z: z + 0.1 })];
    case 'helmet':
      return [
        P('hatCrown', path(`M ${sc(-7)} ${sc(-6)} Q ${sc(-7.6)} ${sc(-17.4)} ${sc(0.4)} ${sc(-17.4)} Q ${sc(8)} ${sc(-17.2)} ${sc(7.6)} ${sc(-6)} L ${sc(4)} ${sc(-8.6)} L ${sc(-3)} ${sc(-8.6)} Z`), { material: 'metal' }),
        P('plume', path(`M ${sc(-1)} ${sc(-17)} Q ${sc(-8)} ${sc(-22)} ${sc(-12)} ${sc(-14)} Q ${sc(-6)} ${sc(-17)} ${sc(-1)} ${sc(-15)} Z`), { material: 'accent', z: z - 0.5, cast: 0 }),
      ];
    case 'bandana':
      return [
        P('hatCrown', path(`M ${sc(-6.8)} ${sc(-7)} Q ${sc(-7)} ${sc(-15.6)} ${sc(0.6)} ${sc(-15.6)} Q ${sc(7.2)} ${sc(-15.2)} ${sc(6.8)} ${sc(-8.6)} Q ${sc(0)} ${sc(-11)} ${sc(-6.8)} ${sc(-7)} Z`)),
        P('hatTail', path(`M ${sc(-6)} ${sc(-9)} L ${sc(-12)} ${sc(-6)} L ${sc(-10)} ${sc(-3)} L ${sc(-5.4)} ${sc(-7)} Z`), { z: z - 0.6, cast: 0 }),
      ];
    case 'slouch':
      return [
        P('hatBrim', ellipse(sc(0.6), sc(-10.4), sc(10), sc(2.2))),
        P('hatCrown', path(`M ${sc(-5.6)} ${sc(-10.4)} Q ${sc(-5.6)} ${sc(-17.4)} ${sc(0.6)} ${sc(-17.4)} Q ${sc(6.6)} ${sc(-17.4)} ${sc(6.6)} ${sc(-10.4)} Z`), { z: z + 0.1, marks: [{ tone: 3, shape: poly(sc(-5.6), sc(-12.2), sc(6.6), sc(-12.2), sc(6.6), sc(-10.8), sc(-5.6), sc(-10.8)) }] }),
      ];
    case 'tricorn':
      return [P('hatCrown', path(`M ${sc(-9)} ${sc(-10)} L ${sc(-4)} ${sc(-17)} L ${sc(1)} ${sc(-14.4)} L ${sc(6)} ${sc(-17)} L ${sc(10)} ${sc(-10)} Q ${sc(0.6)} ${sc(-12)} ${sc(-9)} ${sc(-10)} Z`))];
    case 'hardhat':
      return [P('hatCrown', path(`M ${sc(-8.4)} ${sc(-9.6)} Q ${sc(-7.6)} ${sc(-17.6)} ${sc(0.4)} ${sc(-17.6)} Q ${sc(8.6)} ${sc(-17.6)} ${sc(9.4)} ${sc(-9.6)} Z`), { material: 'metal' })];
  }
}

function propParts(s: HumanSpec, k: number): PartDef[] {
  const sc = (n: number): number => n * k;
  const z = 7.6;
  const P = (name: string, material: string, shape: Shape, extra: Partial<PartDef> = {}): PartDef => ({ name: `prop-${name}`, bone: 'prop', z, material, shape, shade: { shadow: 1, light: 1 }, cast: 1, ...extra });
  switch (s.prop) {
    case 'sign':
      // A toll-gate sign worn as a shield on the forearm.
      return [
        {
          name: 'sign',
          bone: 'armF',
          z: 8.4,
          material: 'paper',
          shape: roundRect(sc(-2), sc(8), sc(15), sc(17), sc(1.2)),
          shade: { shadow: 2, light: 1, dir: [1, 0.6] },
          cast: 2,
        },
        {
          name: 'signStripes',
          bone: 'armF',
          z: 8.5,
          material: 'accent',
          shape: [...poly(sc(-2), sc(11), sc(13), sc(14.6), sc(13), sc(17.6), sc(-2), sc(14)), ...poly(sc(-2), sc(18), sc(13), sc(21.6), sc(13), sc(24.6), sc(-2), sc(21))],
          clipTo: ['sign'],
          shade: { shadow: 1, light: 0 },
          cast: 0,
          sep: false,
          outline: false,
        },
        { name: 'signFrame', bone: 'armF', z: 8.2, material: 'wood', shape: roundRect(sc(-2.8), sc(7.2), sc(16.6), sc(18.6), sc(1.6)), shade: { shadow: 1, light: 1 }, cast: 0 },
      ];
    case 'club':
      return [P('club', 'wood', path(`M ${sc(-1.4)} ${sc(2)} L ${sc(1.4)} ${sc(2)} L ${sc(2.6)} ${sc(-16)} Q 0 ${sc(-19)} ${sc(-2.6)} ${sc(-16)} Z`), { shade: { shadow: 1, light: 1, dir: [1, 0] } })];
    case 'pike':
      return [
        P('shaft', 'wood', poly(sc(-0.8), sc(6), sc(0.8), sc(6), sc(0.8), sc(-26), sc(-0.8), sc(-26)), { thin: true }),
        P('blade', 'metal', path(`M ${sc(-1.6)} ${sc(-25)} L ${sc(1.6)} ${sc(-25)} L 0 ${sc(-33)} Z`), { z: z + 0.1 }),
      ];
    case 'halberd':
      return [
        P('shaft', 'wood', poly(sc(-0.9), sc(8), sc(0.9), sc(8), sc(0.9), sc(-30), sc(-0.9), sc(-30)), { thin: true }),
        P('blade', 'metal', path(`M ${sc(0.6)} ${sc(-29)} L ${sc(7)} ${sc(-27)} Q ${sc(8)} ${sc(-21)} ${sc(0.6)} ${sc(-20)} Z M ${sc(-0.6)} ${sc(-30)} L 0 ${sc(-37)} L ${sc(0.8)} ${sc(-30)} Z`), { z: z + 0.1 }),
      ];
    case 'gavel':
      return [
        P('handle', 'wood', poly(sc(-0.9), sc(4), sc(0.9), sc(4), sc(0.9), sc(-12), sc(-0.9), sc(-12))),
        P('head', 'wood', roundRect(sc(-5), sc(-17), sc(10), sc(5.6), sc(1.4)), { z: z + 0.1 }),
        P('band', 'metal', [...poly(sc(-3.6), sc(-17), sc(-2.4), sc(-17), sc(-2.4), sc(-11.4), sc(-3.6), sc(-11.4)), ...poly(sc(2.4), sc(-17), sc(3.6), sc(-17), sc(3.6), sc(-11.4), sc(2.4), sc(-11.4))], { z: z + 0.2, clipTo: ['prop-head'], cast: 0, sep: false, outline: false }),
      ];
    case 'clipboard':
      return [
        P('board', 'wood', roundRect(sc(-5), sc(-5), sc(10), sc(13), sc(0.8)), { z: z + 0.2 }),
        P('sheet', 'paper', roundRect(sc(-4), sc(-3.4), sc(8), sc(10.4), sc(0.4)), { z: z + 0.3, cast: 0, marks: [{ tone: 3, shape: poly(sc(-3), sc(0), sc(3), sc(0), sc(3), sc(0.6), sc(-3), sc(0.6)) }, { tone: 3, shape: poly(sc(-3), sc(3), sc(2), sc(3), sc(2), sc(3.6), sc(-3), sc(3.6)) }] }),
        P('clip', 'metal', roundRect(sc(-2), sc(-6), sc(4), sc(2.4), sc(0.6)), { z: z + 0.4, cast: 0 }),
      ];
    case 'stampMace':
      return [
        P('handle', 'wood', poly(sc(-1.2), sc(4), sc(1.2), sc(4), sc(1.2), sc(-16), sc(-1.2), sc(-16))),
        P('head', 'metal', path(`M ${sc(-6)} ${sc(-16)} L ${sc(6)} ${sc(-16)} L ${sc(5)} ${sc(-24)} L ${sc(-5)} ${sc(-24)} Z`), { z: z + 0.1 }),
        P('pad', 'wax', roundRect(sc(-6.6), sc(-25.6), sc(13.2), sc(2.4), sc(0.6)), { z: z + 0.2, cast: 0 }),
      ];
    case 'scimitar':
    case 'cutlass':
      return [
        P('grip', 'wood', poly(sc(-0.9), sc(3), sc(0.9), sc(3), sc(0.9), sc(-2), sc(-0.9), sc(-2))),
        P('guard', 'metal', roundRect(sc(-3), sc(-3), sc(6), sc(1.6), sc(0.6)), { z: z + 0.1 }),
        P('blade', 'metal', path(`M ${sc(-1.2)} ${sc(-2.4)} L ${sc(1.4)} ${sc(-2.4)} Q ${sc(3.6)} ${sc(-14)} ${sc(-1)} ${sc(-22)} Q ${sc(0.4)} ${sc(-12)} ${sc(-1.2)} ${sc(-2.4)} Z`), { z: z + 0.05, shade: { shadow: 1, light: 1, dir: [1, 0] } }),
      ];
    case 'spanner':
      return [P('spanner', 'metal', path(`M ${sc(-1.2)} ${sc(4)} L ${sc(1.2)} ${sc(4)} L ${sc(1.2)} ${sc(-11)} L ${sc(3.4)} ${sc(-13)} L ${sc(2)} ${sc(-17)} L ${sc(0.6)} ${sc(-14.4)} L ${sc(-0.6)} ${sc(-14.4)} L ${sc(-2)} ${sc(-17)} L ${sc(-3.4)} ${sc(-13)} L ${sc(-1.2)} ${sc(-11)} Z`))];
    case 'ledger':
      return [
        P('ledger', 'accent', roundRect(sc(-5), sc(-6), sc(10), sc(12), sc(1)), { z: z + 0.2 }),
        P('pages', 'paper', poly(sc(3.4), sc(-5), sc(5), sc(-5), sc(5), sc(5), sc(3.4), sc(5)), { z: z + 0.3, clipTo: ['prop-ledger'], cast: 0, sep: false, outline: false }),
      ];
    case 'pick':
      return [
        P('handle', 'wood', poly(sc(-0.9), sc(4), sc(0.9), sc(4), sc(0.9), sc(-16), sc(-0.9), sc(-16))),
        P('head', 'metal', path(`M ${sc(-8)} ${sc(-14)} Q 0 ${sc(-19)} ${sc(8)} ${sc(-14)} L ${sc(7)} ${sc(-13)} Q 0 ${sc(-16)} ${sc(-7)} ${sc(-13)} Z`), { z: z + 0.1, thin: true }),
      ];
    case 'stamp':
      return [
        P('handle', 'wood', ellipse(0, sc(-4), sc(2.2), sc(3))),
        P('base', 'metal', roundRect(sc(-3.6), sc(-1.4), sc(7.2), sc(3), sc(0.6)), { z: z + 0.1 }),
      ];
    default:
      return [];
  }
}

function parts(s: HumanSpec): PartDef[] {
  const d = dims(s);
  const k = d.k;
  const sc = (n: number): number => n * k;
  const sw = d.shoulder;
  const ww = d.waist;
  const hem = hemOf(s, k);
  const long = s.coatStyle === 'greatcoat' || s.coatStyle === 'robe';
  const out: PartDef[] = [];

  // Back arm, behind everything.
  out.push(
    { name: 'armB', bone: 'armB', z: 0, material: 'coat', shape: limb([[0, 0, d.arm], [0, sc(11), d.arm * 0.88], [0, sc(19), d.arm * 0.8]]), shade: { shadow: 1, light: 1, base: 2 } },
    { name: 'handB', bone: 'armB', z: 0.2, material: has(s, 'gloves') ? 'hat' : 'skin', shape: ellipse(0, sc(21), sc(2.4), sc(2.4)), shade: { shadow: 1, light: 0, base: 2 }, cast: 0 },
    { name: 'letter', bone: 'letter', z: 0.4, material: 'paper', shape: roundRect(sc(-1), sc(-6), sc(9), sc(6.4), sc(0.6)), shade: { shadow: 1, light: 1 }, when: 'letter', cast: 0 },
    { name: 'seal', bone: 'letter', z: 0.5, material: 'wax', shape: ellipse(sc(3.6), sc(-2.8), sc(1.4), sc(1.4)), shade: { shadow: 1, light: 0 }, when: 'letter', cast: 0, outline: false },
  );

  // Legs and boots.
  for (const leg of ['B', 'F'] as const) {
    const front = leg === 'F';
    out.push(
      {
        name: `leg${leg}`,
        bone: 'pelvis',
        z: front ? 2 : 1,
        material: 'trousers',
        shape: (c) => {
          const [hx, hy] = c.p('pelvis', front ? sc(2.6) : sc(-2.6), sc(1));
          const [fx, fy] = c.p(`foot${leg}`, 0, sc(-5));
          return capsule(hx, hy, d.leg, fx, fy, d.leg * 0.82);
        },
        shade: { shadow: 1, light: 1, ...(front ? {} : { base: 2 }) },
      },
      {
        name: `boot${leg}`,
        bone: `foot${leg}`,
        z: front ? 2.2 : 1.2,
        material: 'boots',
        shape: path(`M ${sc(-3.2)} ${sc(0.4)} L ${sc(-3.2)} ${sc(-6)} L ${sc(3)} ${sc(-6)} L ${sc(3.4)} ${sc(-2.4)} L ${sc(7.2)} ${sc(-1.4)} L ${sc(7.2)} ${sc(0.4)} Z`),
        shade: { shadow: 1, light: 1 },
      },
    );
  }

  // Coat tails sway on their own bone.
  if (long || s.coatStyle === 'wrap') {
    const tail = s.coatStyle === 'robe' ? sc(33) : s.coatStyle === 'wrap' ? sc(23) : sc(31);
    out.push({
      name: 'tails',
      bone: 'hem',
      z: 2.6,
      material: 'coat',
      shape: path(`M ${-(ww + sc(0.6))} ${sc(-2)} L ${ww + sc(0.6)} ${sc(-2)} L ${ww + sc(2.4)} ${tail - sc(14)} L ${sc(1.2)} ${tail - sc(13)} L ${-(ww + sc(3))} ${tail - sc(13.4)} Z`),
      shade: { shadow: 2, light: 1 },
      marks: s.coatStyle === 'robe' ? [] : [{ tone: 3, shape: poly(sc(0.6), sc(-1), sc(1.4), sc(-1), sc(1.6), tail - sc(13.4), sc(0.8), tail - sc(13.4)) }],
    });
  }

  // Torso.
  const bottom = long ? sc(16) : Math.min(hem, sc(20));
  out.push({
    name: 'coat',
    bone: 'chest',
    z: 3,
    material: 'coat',
    shape: path(
      `M ${-(sw - sc(1.4))} ${sc(-10)} L ${sw - sc(1.4)} ${sc(-10)} Q ${sw + sc(1)} ${sc(-9.4)} ${sw + sc(1)} ${sc(-5)} L ${ww + sc(0.8)} ${bottom} L ${-(ww + sc(1.2))} ${bottom} L ${-(sw + sc(1))} ${sc(-5)} Q ${-(sw + sc(1))} ${sc(-9.4)} ${-(sw - sc(1.4))} ${sc(-10)} Z`,
    ),
    shade: { shadow: 3, light: 1 },
    marks: [
      // Lapel and front edge.
      { tone: 3, shape: poly(sc(1.6), sc(-9.6), sc(2.6), sc(-9.6), sc(2.6), bottom, sc(1.6), bottom) },
      ...(has(s, 'patches') ? [{ tone: 3, shape: roundRect(sw - sc(4.6), sc(-8), sc(3.6), sc(4), sc(0.6)) }, { tone: 3, shape: roundRect(-sw + sc(0.6), sc(-8), sc(3.6), sc(4), sc(0.6)) }] : []),
    ],
  });
  if (s.build === 'stout') {
    out.push({ name: 'belly', bone: 'chest', z: 3.1, material: 'coat', shape: ellipse(sc(2.4), sc(6), sc(8.6), sc(8)), shade: { shadow: 2, light: 1 }, sep: false, cast: 0 });
  }
  // Shirt or waistcoat showing at the collar.
  out.push({
    name: 'under',
    bone: 'chest',
    z: 3.2,
    material: 'under',
    shape: path(`M ${sc(0.4)} ${sc(-10)} L ${sc(4.6)} ${sc(-10)} L ${sc(3.2)} ${s.coatStyle === 'vest' ? sc(10) : sc(-2)} L ${sc(1.4)} ${s.coatStyle === 'vest' ? sc(10) : sc(-2)} Z`),
    shade: { shadow: 1, light: 1 },
    cast: 0,
  });
  if (s.coatStyle === 'uniform' || has(s, 'belt')) {
    out.push({ name: 'belt', bone: 'pelvis', z: 3.4, material: 'boots', shape: roundRect(-(ww + sc(1.4)), sc(-3), (ww + sc(1.2)) * 2 + sc(0.2), sc(2.8), sc(0.4)), shade: { shadow: 1, light: 1, dir: [0, 1] }, cast: 0 });
  }
  if (has(s, 'apron')) {
    out.push({ name: 'apron', bone: 'chest', z: 3.5, material: 'accent', shape: poly(sc(-2), sc(-4), sc(7), sc(-4), sc(8), sc(26), sc(-3), sc(26)), shade: { shadow: 1, light: 1 }, cast: 0 });
  }
  if (has(s, 'sash')) {
    out.push({ name: 'sash', bone: 'chest', z: 3.6, material: 'accent', shape: poly(-sw + sc(1), sc(-9), -sw + sc(4), sc(-9), ww + sc(1), sc(12), ww - sc(2), sc(12)), shade: { shadow: 1, light: 1 }, cast: 0, thin: true });
  }
  if (has(s, 'epaulettes')) {
    out.push({ name: 'epaulette', bone: 'chest', z: 3.7, material: 'metal', shape: roundRect(sw - sc(3.6), sc(-10.6), sc(5.6), sc(2.6), sc(1)), shade: { shadow: 1, light: 1 }, cast: 0 });
  }
  if (has(s, 'mask')) {
    out.push({ name: 'mask', bone: 'head', z: 6.6, material: 'accent', shape: path(`M ${sc(-6)} ${sc(-4.6)} L ${sc(6.6)} ${sc(-4.6)} L ${sc(6.8)} ${sc(-0.4)} Q ${sc(3)} ${sc(3)} ${sc(-1)} ${sc(1.6)} L ${sc(-6.2)} ${sc(-1)} Z`), shade: { shadow: 1, light: 1 }, cast: 0 });
  }

  // Head.
  out.push(
    { name: 'neck', bone: 'head', z: 4.6, material: 'skin', shape: roundRect(sc(-2.4), sc(-2), sc(4.6), sc(4), sc(1)), shade: { shadow: 1, light: 0, base: 2 }, cast: 0 },
    { name: 'head', bone: 'head', z: 5, material: 'skin', shape: [...ellipse(sc(0.4), sc(-7), d.headR[0], d.headR[1]), ...ellipse(sc(6.4), sc(-5.6), sc(1.2), sc(1.2))], shade: { shadow: 2, light: 1 } },
    { name: 'ear', bone: 'head', z: 5.2, material: 'skin', shape: ellipse(sc(-2.4), sc(-6.4), sc(1.4), sc(2)), shade: { shadow: 1, light: 0, base: 2 }, cast: 0, sep: true },
  );
  const hair = hairShape(s.hairStyle, k);
  if (hair) out.push({ name: 'hair', bone: 'head', z: 6, material: 'hair', shape: hair, shade: { shadow: 1, light: 1 }, cast: 1 });
  if (s.hairStyle === 'bun' || s.hairStyle === 'pinned') {
    out.push({ name: 'bun', bone: 'head', z: 5.8, material: 'hair', shape: s.hairStyle === 'pinned' ? ellipse(sc(-4.4), sc(-14), sc(3.4), sc(2.8)) : ellipse(sc(-6.6), sc(-10), sc(3), sc(3.2)), shade: { shadow: 1, light: 1 }, cast: 1 });
  }
  if (has(s, 'beard')) {
    out.push({ name: 'beard', bone: 'head', z: 6.4, material: 'hair', shape: path(`M ${sc(-3)} ${sc(-5)} Q ${sc(-3)} ${sc(1.4)} ${sc(2.6)} ${sc(1.6)} Q ${sc(7)} ${sc(0.6)} ${sc(6.6)} ${sc(-3)} L ${sc(4)} ${sc(-2.6)} L ${sc(0)} ${sc(-4.6)} Z`), shade: { shadow: 1, light: 1 }, cast: 0 });
  }
  out.push(...hatParts(s, k));

  // Front arm and its prop.
  out.push(
    { name: 'armF', bone: 'armF', z: 7, material: 'coat', shape: limb([[0, 0, d.arm + sc(0.2)], [0, sc(11), d.arm], [0, sc(19), d.arm * 0.86]]), shade: { shadow: 1, light: 1 } },
    { name: 'cuff', bone: 'armF', z: 7.1, material: s.coatStyle === 'uniform' ? 'accent' : 'coat', shape: roundRect(-d.arm, sc(17), d.arm * 2, sc(2.4), sc(0.6)), shade: { shadow: 1, light: 0, base: 2 }, cast: 0 },
    { name: 'handF', bone: 'armF', z: 7.8, material: has(s, 'gloves') ? 'hat' : 'skin', shape: ellipse(0, sc(21.2), sc(2.6), sc(2.6)), shade: { shadow: 1, light: 1 }, cast: 0 },
  );
  out.push(...propParts(s, k));
  return out;
}

function details(s: HumanSpec): DetailDef[] {
  const d = dims(s);
  const k = d.k;
  const big = s.kind === 'battle';
  const out: DetailDef[] = [];
  const key = { a: 'eye:o', w: 'paper:0', b: 'hair:2', m: 'skin:3', n: 'skin:2', s: 'hair:3', c: 'blush:1', g: 'metal:1', x: 'skin:3', h: 'hair:2' };
  const eyeY = Math.round(-8.4 * k);
  out.push({ name: 'eyes', bone: 'head', x: Math.round(1 * k), y: eyeY, grid: big ? ['.aa..aa', '.a...a.'] : ['a..a'], key, clip: ['head'], unless: 'ko' });
  out.push({ name: 'eyesShut', bone: 'head', x: Math.round(1 * k), y: eyeY + 1, grid: big ? ['.aa..aa'] : ['a..a'], key, clip: ['head'], when: 'ko' });
  out.push({ name: 'brows', bone: 'head', x: Math.round(1 * k), y: eyeY - 2, grid: big ? ['bbb.bbb'] : ['bb.bb'], key, clip: ['head', 'hair'], unless: 'angry' });
  out.push({ name: 'browsAngry', bone: 'head', x: Math.round(1 * k), y: eyeY - 2, grid: big ? ['bb...bb', '..b.b..'] : ['b...b', '.b.b.'], key, clip: ['head', 'hair'], when: 'angry' });
  if (!has(s, 'mask')) {
    out.push({ name: 'mouth', bone: 'head', x: Math.round(3 * k), y: Math.round(-3 * k), grid: big ? ['mmm.'] : ['mm'], key, clip: ['head', 'beard'].filter((p) => p !== 'beard' || has(s, 'beard')), unless: 'open' });
    out.push({ name: 'mouthOpen', bone: 'head', x: Math.round(3 * k), y: Math.round(-3 * k), grid: big ? ['.mm.', 'mxxm'] : ['mm', 'mm'], key, clip: ['head'], when: 'open' });
  }
  if (has(s, 'moustache')) out.push({ name: 'moustache', bone: 'head', x: Math.round(2 * k), y: Math.round(-4.6 * k), grid: big ? ['hhhhh'] : ['hhh'], key, clip: ['head'] });
  if (has(s, 'stubble')) out.push({ name: 'stubble', bone: 'head', x: Math.round(-1 * k), y: Math.round(-3 * k), grid: big ? ['s.s.s.s.', '.s.s.s.s', 's.s.s.s.'] : ['s.s.s', '.s.s.'], key, clip: ['head'] });
  if (has(s, 'scar')) out.push({ name: 'scar', bone: 'head', x: Math.round(5 * k), y: eyeY - 3, grid: big ? ['x', 'x', '.', 'x'] : ['x', 'x'], key, clip: ['head', 'hair'] });
  if (has(s, 'glasses')) out.push({ name: 'glasses', bone: 'head', x: Math.round(1 * k), y: eyeY - 1, grid: big ? ['gggg.gggg', 'g..ggg..g', 'gggg.gggg'] : ['gg.gg'], key, clip: ['head'] });
  if (has(s, 'earring')) out.push({ name: 'earring', bone: 'head', x: Math.round(-3 * k), y: Math.round(-4 * k), grid: ['g'], key });
  const buttons = has(s, 'buttons2') ? ['g.g', '...', '...', 'g.g', '...', '...', 'g.g'] : ['g', '.', '.', '.', 'g', '.', '.', '.', 'g'];
  out.push({ name: 'buttons', bone: 'chest', x: Math.round(3 * k), y: Math.round(-6 * k), grid: buttons, key, clip: ['coat', 'belly'].filter((p) => p !== 'belly' || s.build === 'stout') });
  if (has(s, 'badge')) out.push({ name: 'badge', bone: 'chest', x: Math.round(-3 * k), y: Math.round(-6 * k), grid: ['.g.', 'ggg', '.g.'], key, clip: ['coat'] });
  return out;
}

export function humanRig(s: HumanSpec): Rig {
  const big = s.kind === 'battle';
  return {
    id: `${s.id}-battle`,
    width: big ? 64 : 72,
    height: big ? 96 : 72,
    materials: materials(s),
    bones: bones(s),
    parts: parts(s),
    details: details(s),
    mirror: !!s.mirror,
  };
}

/** The full set of battle animations; enemies use a subset. */
export function humanAnims(s: HumanSpec): AnimDef[] {
  const k = dims(s).k;
  const sc = (n: number): number => n * k;
  const breathe = (y: number, arm = 0): Pose => ({ bones: { chest: { y }, head: { y: y * 0.4 }, armF: { rot: arm }, armB: { rot: -arm }, hem: { rot: y * 2 } } });
  const guardArm = s.prop === 'sign' ? -70 : -100;
  const all: AnimDef[] = [
    anim('idle', [breathe(0), breathe(0.6, 2), breathe(1, 3), breathe(0.6, 2)], [260, 200, 260, 200]),
    anim(
      'attack',
      [
        { bones: { armF: { rot: -150 }, prop: { rot: -40 }, chest: { rot: -8 }, head: { rot: -4 } }, flags: ['angry'] },
        { bones: { armF: { rot: -160 }, prop: { rot: -30 }, chest: { rot: -12 }, pelvis: { x: sc(-2) } }, flags: ['angry'] },
        { bones: { pelvis: { x: sc(10) }, armF: { rot: 10 }, prop: { rot: -80 }, chest: { rot: 12 }, footF: { x: sc(9) }, hem: { rot: -10 } }, flags: ['angry', 'open'] },
        { bones: { pelvis: { x: sc(7) }, armF: { rot: 24 }, prop: { rot: -90 }, chest: { rot: 8 }, footF: { x: sc(6) }, hem: { rot: -6 } }, flags: ['angry'] },
        { bones: { pelvis: { x: sc(2) }, armF: { rot: -10 }, chest: { rot: 2 } } },
      ],
      [110, 70, 70, 120, 150],
      false,
    ),
    anim(
      'read',
      [
        { bones: { armB: { rot: -40 } }, flags: ['letter'] },
        { bones: { armB: { rot: -100 }, letter: { rot: 90 }, head: { rot: 4 } }, flags: ['letter'] },
        { bones: { armB: { rot: -110 }, letter: { rot: 95 }, head: { rot: 6 } }, flags: ['letter', 'open'] },
        { bones: { armB: { rot: -110 }, letter: { rot: 95 }, head: { rot: 6 }, chest: { y: sc(-0.6) } }, flags: ['letter'] },
        { bones: { armB: { rot: -40 } }, flags: ['letter'] },
      ],
      [130, 150, 160, 360, 180],
      false,
    ),
    anim(
      'breakSeal',
      [
        { bones: { armB: { rot: -60 }, armF: { rot: -50 } }, flags: ['letter'] },
        { bones: { armB: { rot: -90 }, armF: { rot: -80 }, letter: { rot: 80 } }, flags: ['letter'] },
        { bones: { armB: { rot: -96 }, armF: { rot: -96 }, letter: { rot: 90 }, chest: { rot: -4 } }, flags: ['letter', 'angry'] },
        { bones: { armB: { rot: -130 }, armF: { rot: -70 }, letter: { rot: 130 }, chest: { rot: 6 } }, flags: ['letter', 'open'] },
        { bones: { armB: { rot: -150 }, armF: { rot: -40 }, letter: { rot: 160 }, chest: { rot: 8, y: sc(-1) } }, flags: ['letter', 'open'] },
        { bones: { armB: { rot: -40 }, armF: { rot: -20 } }, flags: ['letter'] },
      ],
      [150, 150, 110, 90, 240, 200],
      false,
    ),
    anim(
      'cast',
      [
        { bones: { armF: { rot: -70 }, chest: { rot: -4 } } },
        { bones: { armF: { rot: -110 }, chest: { rot: 4 }, pelvis: { x: sc(3) } }, flags: ['open'] },
        { bones: { armF: { rot: -40 } } },
      ],
      [150, 260, 150],
      false,
    ),
    anim(
      'hit',
      [
        { bones: { pelvis: { x: sc(-4) }, chest: { rot: -14 }, head: { rot: -12 }, armF: { rot: 20 }, hem: { rot: 10 } }, flags: ['angry', 'open'] },
        { bones: { pelvis: { x: sc(-2) }, chest: { rot: -6 }, head: { rot: -4 } } },
      ],
      [120, 200],
      false,
    ),
    anim('guard', [{ bones: { armF: { rot: guardArm }, prop: { rot: -20 }, chest: { rot: -4 }, pelvis: { y: sc(1) } } }, { bones: { armF: { rot: guardArm + 4 }, prop: { rot: -20 }, chest: { rot: -4 }, pelvis: { y: sc(1.6) } } }], 230),
    anim(
      'knockedOut',
      [
        { bones: { pelvis: { y: sc(6), rot: -6 }, chest: { rot: 16 }, head: { rot: 14 }, hem: { rot: 6 } }, flags: ['ko'] },
        { bones: { pelvis: { y: sc(16), x: sc(-2), rot: -10 }, chest: { rot: 32 }, head: { rot: 22 }, armF: { rot: 30 }, armB: { rot: 20 }, hem: { rot: 12 } }, flags: ['ko'] },
        { bones: { pelvis: { y: sc(25), x: sc(-4), rot: -16 }, chest: { rot: 52 }, head: { rot: 30 }, armF: { rot: 64 }, armB: { rot: 50 }, prop: { rot: -10 }, hem: { rot: 18 } }, flags: ['ko'] },
      ],
      [150, 150, 400],
      false,
    ),
    anim(
      'victory',
      [
        { bones: { armF: { rot: -150 }, prop: { rot: -10 }, chest: { y: sc(-1) } }, flags: ['open'] },
        { bones: { armF: { rot: -160 }, prop: { rot: -10 }, chest: { y: sc(-2) }, pelvis: { y: sc(-2) } }, flags: ['open'] },
        { bones: { armF: { rot: -155 }, prop: { rot: -10 }, chest: { y: sc(-1) } } },
        { bones: { armF: { rot: -150 }, prop: { rot: -10 } } },
      ],
      [120, 90, 90, 400],
    ),
  ];
  if (s.kind === 'enemy' || !s.mirror) {
    // Foes fall over rather than being knocked out, and need no letters.
    const pick = (name: string, frames: number[]): AnimDef | null => {
      const a = all.find((x) => x.name === name);
      if (!a) return null;
      return { ...a, frames: frames.map((i) => a.frames[i] ?? {}), durations: frames.map((i) => a.durations[i] ?? 150) };
    };
    const keep: AnimDef[] = [];
    const idle = pick('idle', [0, 1, 2, 3]);
    const attack = pick('attack', [0, 2, 4]);
    const cast = pick('cast', [0, 1, 2]);
    const hit = pick('hit', [0]);
    const ko = pick('knockedOut', s.kind === 'enemy' ? [1, 2] : [0, 1, 2]);
    for (const a of [idle, attack, cast, hit]) if (a) keep.push(a);
    if (ko) keep.push({ ...ko, name: 'defeat' });
    return keep;
  }
  return all;
}

export function humanSprites(s: HumanSpec): CharacterSprites {
  const set: SpriteSetDef = { id: `${s.id}-battle`, character: s.id, kind: s.kind, rig: humanRig(s), anims: humanAnims(s) };
  return { id: s.id, name: s.name, sets: () => [set] };
}
