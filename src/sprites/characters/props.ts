/** Small props that stand on the map like characters, such as the HELD sack. */
import { manual } from '../palette';
import type { Rig } from '../rig';
import { path, poly, roundRect } from '../shapes';
import { anim, type CharacterSprites, type Facing, SPRITE_SIZES } from '../types';

function sackRig(view: Facing): Rig {
  return {
    id: `sack-field-${view}`,
    ...SPRITE_SIZES.field,
    materials: {
      canvas: manual('canvas', ['#e2d8c0', '#c8b894', '#a8966e', '#86744e'], '#54462e'),
      string: manual('string', ['#e8dcc0', '#c0a878', '#8c7a54', '#6a5a3c'], '#40361e'),
      tag: manual('tag', ['#f0786a', '#c8392f', '#962722', '#64191a'], '#3e0f12'),
    },
    bones: [{ name: 'root', x: 16, y: 46 }],
    parts: [
      { name: 'sack', bone: 'root', z: 1, material: 'canvas', shape: path('M -9 0 Q -11 -8 -6 -14 L -3 -17 L 3 -17 L 6 -14 Q 11 -8 9 0 Z'), shade: { shadow: 2, light: 1 }, marks: [{ tone: 2, shape: poly(-2, -12, -1, -12, 1, -2, 0, -2) }] },
      { name: 'neck', bone: 'root', z: 2, material: 'canvas', shape: path('M -3 -16 L 3 -16 L 4 -21 L 1 -19 L -1 -21 L -4 -20 Z'), shade: { shadow: 1, light: 1 } },
      { name: 'tie', bone: 'root', z: 3, material: 'string', shape: roundRect(-3.6, -17.4, 7.2, 1.8, 0.6), shade: { shadow: 1, light: 1 } },
      { name: 'tag', bone: 'root', z: 4, material: 'tag', shape: poly(3, -16, 8, -14, 7, -10, 2, -12), shade: { shadow: 1, light: 1 } },
    ],
    details: [{ name: 'stencil', bone: 'root', x: -4, y: -8, grid: ['a.a.aa', '......', 'aaa.a.'], key: { a: 'canvas:3' }, clip: ['sack'] }],
  };
}

export const SACK: CharacterSprites = {
  id: 'sack',
  name: 'HELD sack',
  sets: () =>
    (['down', 'left', 'right', 'up'] as Facing[]).map((view) => ({
      id: `sack-field-${view}`,
      character: 'sack',
      kind: 'field' as const,
      view,
      rig: sackRig(view),
      anims: [anim('idle', [{}, { dy: 0 }], [1000, 1000]), anim('walk', [{}, { dy: 0 }], [1000, 1000])],
    })),
};
