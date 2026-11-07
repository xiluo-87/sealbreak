/**
 * Biscuit, the office goat: cream and tan, one bent horn, an ear tag and
 * small red post saddlebags. Always chewing something.
 */
import { manual, type Material, ramp } from '../palette';
import type { BoneDef, DetailDef, PartDef, Pose, Rig, ShapeContext } from '../rig';
import { capsule, ellipse, path, poly, roundRect } from '../shapes';
import { anim, type CharacterSprites, type Facing, SPRITE_SIZES, type SpriteSetDef } from '../types';

export const BISCUIT_MATERIALS: Record<string, Material> = {
  coat: manual('coat', ['#fbf3e2', '#eadcc0', '#cdb994', '#a8916c'], '#6e5a42'),
  tan: ramp('tan', '#c49a6c', { step: 0.08 }),
  horn: manual('horn', ['#d8ccb4', '#b3a68c', '#8c8068', '#685e4c'], '#463e30'),
  hoof: ramp('hoof', '#5a4636', { step: 0.07 }),
  bag: ramp('bag', '#b8463a', { step: 0.085 }),
  strap: ramp('strap', '#7a2e2a', { step: 0.07 }),
  brass: manual('brass', ['#f4dc8c', '#d3a648', '#9c6e2e', '#6b4724'], '#432a19'),
  eye: manual('eye', ['#c8a04a', '#8a6a2a', '#3a2a14', '#1a120a'], '#0e0a06'),
  nose: manual('nose', ['#d9a49a', '#b8807a', '#946060', '#6a4444'], '#3e2626'),
};

function bones(): BoneDef[] {
  return [
    { name: 'root', x: 16, y: 46 },
    { name: 'body', parent: 'root', x: 0, y: -13 },
    { name: 'head', parent: 'body', x: -6.4, y: -9 },
    { name: 'jaw', parent: 'head', x: 0, y: 0 },
    { name: 'tail', parent: 'body', x: 9, y: -3 },
    { name: 'legFN', parent: 'root', x: -5, y: 0 },
    { name: 'legFF', parent: 'root', x: -3, y: 0 },
    { name: 'legBN', parent: 'root', x: 5, y: 0 },
    { name: 'legBF', parent: 'root', x: 7, y: 0 },
  ];
}

function leg(name: string, z: number, hip: [number, number], far: boolean): PartDef[] {
  const bone = name;
  return [
    {
      name: `${name}Leg`,
      bone,
      z,
      material: far ? 'tan' : 'coat',
      shape: (c: ShapeContext) => {
        const [hx, hy] = c.p('body', hip[0], hip[1]);
        const [fx, fy] = c.p(bone, 0, -2);
        return capsule(hx, hy, 1.6, fx, fy, 1.2);
      },
      shade: { shadow: 1, light: 1, base: far ? 2 : 1 },
    },
    {
      name: `${name}Hoof`,
      bone,
      z: z + 0.1,
      material: 'hoof',
      shape: roundRect(-1.4, -2.2, 2.8, 2.4, 0.6),
      shade: { shadow: 1, light: 0 },
      cast: 0,
    },
  ];
}

function sideParts(): PartDef[] {
  return [
    ...leg('legFF', 1, [-4, 3], true),
    ...leg('legBF', 1, [6, 3], true),
    { name: 'tailTuft', bone: 'tail', z: 2, material: 'coat', shape: path('M 0 0 Q 3 -4 2 -6 Q 0 -4 -1 -1 Z'), shade: { shadow: 1, light: 1 } },
    { name: 'torso', bone: 'body', z: 3, material: 'coat', shape: ellipse(1, 0, 9.4, 5.6), shade: { shadow: 2, light: 1 }, marks: [{ tone: 2, shape: poly(-6, 3.4, 8, 3.4, 6, 5, -4, 5) }] },
    { name: 'neck', bone: 'body', z: 3.2, material: 'coat', shape: (c) => {
      const [ax, ay] = c.p('body', -6, -1);
      const [bx, by] = c.p('head', 1, 1);
      return capsule(ax, ay, 3.4, bx, by, 2.6);
    }, shade: { shadow: 1, light: 1 }, sep: false },
    { name: 'strapBag', bone: 'body', z: 3.5, material: 'strap', shape: poly(-1.6, -5.6, 1.6, -5.6, 1.2, -1, -1.2, -1), shade: { shadow: 1, light: 1 }, thin: true },
    { name: 'bag', bone: 'body', z: 3.6, material: 'bag', shape: roundRect(-3.6, -2, 7.2, 6, 1.4), shade: { shadow: 1, light: 1 } },
    ...leg('legFN', 4, [-5, 3.5], false),
    ...leg('legBN', 4, [5, 3.5], false),
    { name: 'head', bone: 'head', z: 6, material: 'coat', shape: [...ellipse(0, 0, 3.8, 3.4), ...ellipse(-3.6, 1.6, 2.6, 2)], shade: { shadow: 1, light: 1 } },
    { name: 'muzzle', bone: 'jaw', z: 6.2, material: 'tan', shape: ellipse(-4.6, 2, 1.9, 1.6), shade: { shadow: 1, light: 1 }, sep: false, cast: 0 },
    { name: 'beard', bone: 'jaw', z: 6.1, material: 'coat', shape: path('M -3.4 3 L -1.6 3 L -2.2 6.4 Z'), shade: { shadow: 1, light: 0 } },
    { name: 'ear', bone: 'head', z: 6.4, material: 'tan', shape: path('M 1.6 -0.6 Q 4.4 -0.4 6 2.2 Q 3.6 2.2 1.4 1 Z'), shade: { shadow: 1, light: 1 } },
    // One straight horn and one bent one.
    { name: 'hornFar', bone: 'head', z: 5.8, material: 'horn', shape: path('M -0.4 -2.6 Q 0 -6 -2.4 -7.4 L -1.6 -5.4 Q -1.6 -3.6 -1.6 -2.4 Z'), shade: { shadow: 1, light: 0 }, thin: true },
    { name: 'hornNear', bone: 'head', z: 6.6, material: 'horn', shape: path('M 0.6 -2.6 Q 2 -6.6 5.6 -6.4 L 5.4 -5.2 Q 2.8 -5.2 2 -2.2 Z'), shade: { shadow: 1, light: 1 }, thin: true },
  ];
}

function frontParts(back: boolean): PartDef[] {
  const out: PartDef[] = [
    ...leg('legBF', 1, [-2.4, 3], true),
    ...leg('legBN', 1, [2.4, 3], true),
    { name: 'torso', bone: 'body', z: 3, material: 'coat', shape: ellipse(0, 0, 6.6, 6.2), shade: { shadow: 2, light: 1 } },
    { name: 'bagL', bone: 'body', z: 3.4, material: 'bag', shape: roundRect(-9.4, -1, 4.4, 6, 1.2), shade: { shadow: 1, light: 1 } },
    { name: 'bagR', bone: 'body', z: 3.4, material: 'bag', shape: roundRect(5, -1, 4.4, 6, 1.2), shade: { shadow: 1, light: 1 } },
    { name: 'strap', bone: 'body', z: 3.5, material: 'strap', shape: poly(-6, -2.6, 6, -2.6, 6, -1, -6, -1), shade: { shadow: 1, light: 1 }, thin: true },
    ...leg('legFF', 4, [-2.4, 4], false),
    ...leg('legFN', 4, [2.4, 4], false),
  ];
  if (back) {
    out.push({ name: 'tailTuft', bone: 'tail', z: 4.5, material: 'coat', shape: path('M -9 1 Q -8 -5 -9.6 -7 Q -11 -4 -10.6 0 Z'), shade: { shadow: 1, light: 1 } });
  }
  out.push(
    { name: 'head', bone: 'head', z: back ? 2.6 : 6, material: 'coat', shape: back ? ellipse(8, -1, 4, 3.6) : [...ellipse(8, -1, 4.2, 3.8), ...ellipse(8, 2.6, 2.6, 2.2)], shade: { shadow: 1, light: 1 } },
    { name: 'earL', bone: 'head', z: back ? 2.7 : 6.2, material: 'tan', shape: path('M 4.4 -2 Q 1 -1.6 0.4 0.6 Q 3 0.6 4.6 -0.4 Z'), shade: { shadow: 1, light: 1 } },
    { name: 'earR', bone: 'head', z: back ? 2.7 : 6.2, material: 'tan', shape: path('M 11.6 -2 Q 15 -1.6 15.6 0.6 Q 13 0.6 11.4 -0.4 Z'), shade: { shadow: 1, light: 1 } },
    { name: 'hornL', bone: 'head', z: back ? 2.8 : 6.4, material: 'horn', shape: path('M 6 -3.6 Q 4.6 -7.4 2.4 -8 L 3.4 -6.4 Q 4.4 -5 5 -3.2 Z'), shade: { shadow: 1, light: 1 }, thin: true },
    // The bent one kinks sideways halfway up.
    { name: 'hornR', bone: 'head', z: back ? 2.8 : 6.4, material: 'horn', shape: path('M 10 -3.6 Q 10.6 -5.6 12.6 -5.8 Q 13.8 -6.2 13.6 -8 L 12.6 -7.2 Q 11.4 -6.8 10.6 -6.6 Q 9.6 -5.6 9 -3.4 Z'), shade: { shadow: 1, light: 1 }, thin: true },
  );
  if (!back) {
    out.push({ name: 'muzzle', bone: 'jaw', z: 6.3, material: 'tan', shape: ellipse(8, 3.2, 1.9, 1.5), shade: { shadow: 1, light: 1 }, sep: false, cast: 0 });
    out.push({ name: 'beard', bone: 'jaw', z: 6.2, material: 'coat', shape: path('M 7 4.4 L 9 4.4 L 8 7.6 Z'), shade: { shadow: 1, light: 0 } });
  }
  return out;
}

function details(view: Facing): DetailDef[] {
  if (view === 'down') {
    return [
      { name: 'eyes', bone: 'head', x: 5, y: -1, grid: ['a....a'], key: { a: 'eye:o' }, clip: ['head'] },
      { name: 'nose', bone: 'jaw', x: 7, y: 2, grid: ['bb'], key: { b: 'nose:1' }, clip: ['muzzle'] },
      { name: 'tag', bone: 'head', x: 14, y: -1, grid: ['t'], key: { t: 'brass:0' }, clip: ['earR'] },
      { name: 'emblem', bone: 'body', x: 6, y: 1, grid: ['e'], key: { e: 'brass:0' }, clip: ['bagR'] },
      { name: 'emblemL', bone: 'body', x: -8, y: 1, grid: ['e'], key: { e: 'brass:0' }, clip: ['bagL'] },
    ];
  }
  if (view === 'up') return [{ name: 'tag', bone: 'head', x: 1, y: -1, grid: ['t'], key: { t: 'brass:0' }, clip: ['earL'] }];
  return [
    { name: 'eye', bone: 'head', x: -2, y: -1, grid: ['a'], key: { a: 'eye:o' }, clip: ['head'] },
    { name: 'nose', bone: 'jaw', x: -6, y: 1, grid: ['b'], key: { b: 'nose:2' }, clip: ['muzzle', 'head'] },
    { name: 'tag', bone: 'head', x: 4, y: 1, grid: ['t'], key: { t: 'brass:0' }, clip: ['ear'] },
    { name: 'emblem', bone: 'body', x: -1, y: 0, grid: ['ab', 'bc'], key: { a: 'brass:0', b: 'brass:1', c: 'brass:2' }, clip: ['bag'] },
  ];
}

export function biscuitRig(view: Facing): Rig {
  const side = view === 'left' || view === 'right';
  const b = bones();
  if (!side) {
    // Front and back: the head sits over the middle of the body.
    for (const bone of b) {
      if (bone.name === 'head') {
        bone.x = -8;
        bone.y = view === 'down' ? -4 : -9;
      }
      if (bone.name === 'tail') {
        bone.x = 9;
        bone.y = -2;
      }
      if (bone.name === 'legFN') bone.x = 2.4;
      if (bone.name === 'legFF') bone.x = -2.4;
      if (bone.name === 'legBN') bone.x = 2.4;
      if (bone.name === 'legBF') bone.x = -2.4;
    }
  }
  return {
    id: `biscuit-field-${view}`,
    ...SPRITE_SIZES.field,
    materials: BISCUIT_MATERIALS,
    bones: b,
    parts: side ? sideParts() : frontParts(view === 'up'),
    details: details(view),
    mirror: view === 'right',
  };
}

function idle(): Pose[] {
  // Chewing: the jaw works side to side, the ear twitches.
  return [{ bones: { jaw: { x: 0.4 } } }, { bones: { jaw: { x: -0.4, y: 0.5 }, head: { rot: 2 } } }];
}

function walk(view: Facing): Pose[] {
  const side = view === 'left' || view === 'right';
  const swing = [3, 1.5, -1.5, -3, -1.5, 1.5];
  const lift = [0, 1, 0, 0, 1, 0];
  return swing.map((s, i): Pose => {
    const l = lift[i] ?? 0;
    if (side) {
      return {
        bones: {
          body: { y: -(l * 0.5) },
          legFN: { x: -s, y: -(i < 3 ? l : 0) },
          legBF: { x: -s, y: -(i < 3 ? l : 0) },
          legFF: { x: s, y: -(i >= 3 ? l : 0) },
          legBN: { x: s, y: -(i >= 3 ? l : 0) },
          head: { y: i % 3 === 1 ? 0.6 : 0 },
          tail: { rot: s * 4 },
          jaw: { x: (i % 2) * 0.4 },
        },
      };
    }
    return {
      bones: {
        body: { y: -(l * 0.5) },
        legFN: { y: -(i < 3 ? l * 1.5 : 0) },
        legBF: { y: -(i < 3 ? l * 1.5 : 0) },
        legFF: { y: -(i >= 3 ? l * 1.5 : 0) },
        legBN: { y: -(i >= 3 ? l * 1.5 : 0) },
        head: { rot: s * 0.8 },
        tail: { rot: s * 3 },
      },
    };
  });
}

/** Biscuit in battle: the side view, scaled up, beside the party and facing the enemy. */
function battleRig(): Rig {
  const r = biscuitRig('left');
  const root = r.bones.find((b) => b.name === 'root');
  if (root) {
    root.x = 36;
    root.y = 92;
  }
  return { ...r, id: 'biscuit-battle', width: 64, height: 96, mirror: false };
}

function big(p: Pose): Pose {
  return { ...p, bones: { ...p.bones, root: { sx: 1.8, sy: 1.8, ...(p.bones?.root ?? {}) } } };
}

function battleAnims(): SpriteSetDef['anims'] {
  const w = walk('left');
  const P = (xs: Pose[]): Pose[] => xs.map(big);
  return [
    anim('idle', P([{ bones: { jaw: { x: 0.4 } } }, { bones: { jaw: { x: -0.4, y: 0.5 } } }, { bones: { jaw: { x: 0.4 }, head: { rot: 2 } } }, { bones: { jaw: { x: -0.4, y: 0.5 }, tail: { rot: 10 } } }]), 220),
    anim(
      'attack',
      P([
        { bones: { head: { rot: -10, y: 1 }, body: { x: 2 } } },
        { bones: { head: { rot: 18, y: 2 }, body: { x: 3, rot: 4 } } },
        { bones: { head: { rot: 22, y: 2 }, body: { x: -6, rot: 6 }, legFN: { x: -3 }, legBN: { x: -2 } } },
        { bones: { head: { rot: 8 }, body: { x: -9, rot: 2 }, legFN: { x: -4 } } },
        { bones: { head: { rot: -4 }, body: { x: -2 } } },
      ]),
      [140, 120, 80, 160, 160],
      false,
    ),
    anim('eat', P([{ bones: { head: { rot: 14, y: 2 } } }, { bones: { head: { rot: 14, y: 2 }, jaw: { x: 0.6, y: 0.6 } } }, { bones: { head: { rot: 10, y: 1 }, jaw: { x: -0.6 } } }]), 180, false),
    anim('wander', P(w), 120),
    anim('victory', P([{ bones: { body: { y: -3 }, legFN: { y: -3 }, legFF: { y: -3 }, head: { rot: -10 } } }, { bones: { body: { y: -1 } } }, {}, { bones: { tail: { rot: 20 }, head: { rot: -6 } } }]), [140, 140, 200, 300]),
  ];
}

export const BISCUIT_BATTLE: CharacterSprites = {
  id: 'biscuit-battle',
  name: 'Biscuit in battle',
  sets: () => [{ id: 'biscuit-battle', character: 'biscuit', kind: 'battle', rig: battleRig(), anims: battleAnims() }],
};

export const BISCUIT: CharacterSprites = {
  id: 'biscuit',
  name: 'Biscuit',
  sets: (): SpriteSetDef[] =>
    (['down', 'left', 'right', 'up'] as Facing[]).map((view) => ({
      id: `biscuit-field-${view}`,
      character: 'biscuit',
      kind: 'field',
      view,
      rig: biscuitRig(view),
      anims: [anim('idle', idle(), [380, 380]), anim('walk', walk(view), 110)],
    })),
};
