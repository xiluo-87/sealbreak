import type { MapDef } from '../../field/maps';

/** The Old Front, a day's detour from Copperhill: the overgrown lines of the Long Quarrel, and Moss's hut. */
export const OLD_FRONT: MapDef = {
  id: 'old-front',
  name: 'The Old Front',
  kind: 'road',
  region: 'oldfront',
  buildings: { O: { id: 'hut', name: 'Moss’s hut' } },
  grid: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTT.T..T.T.................,..,,..,...TT.T..TTT.TTTT...TTTT..TT',
    'TT........fTT.t..,.....^.,,.f,......,f....T...................TT',
    'TT......T.fT.....____________________......t..................TT',
    'TT........f......____________________.,..,.............OOOO...TT',
    'TT...t...tf......__f.........,..,..__f...T.+..T........OOOO....T',
    'T..........T....,__...,..,.........__f,.T.t...f........ODOO...TT',
    'TTt.t,Tt.........__f,.......f.,....__....+....f,..............,T',
    'T............T...__f,.^.....f......__f..^T.t..f...............TT',
    'T.,.......f.....+__f........f.t...,__f......^.f..___...........T',
    'T........,.......__f.T.............__.........f..___..........TT',
    '___________________^........f......__........Tf.,__,..........TT',
    '___________________f........f...^,.__............__............T',
    'T.........f,......,.,.......T......__f....T......__.....n......T',
    'T....,^...f.....,...........f....,.__f.T.....Tf,,__,__________.T',
    'T..T.....+f.................f...^..__f...........__.__________TT',
    'TT.......Tf..T..T..f...............__f.,,.....f,.__...........TT',
    'T............t.....ft.......f......________________..+.+.+.+...T',
    'TTT.......f.......tf.t..T...f......________________...+...+...TT',
    'TT..T....^.........f...t..Tt...,.+...f....,...f...............TT',
    'T.TTT,TTTT.T...tTT..TT.TTT.T..TT.........,....................,T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  exits: [
    { x: 0, y: 11, to: 'copperhill', toX: 46, toY: 10, facing: 'left', travel: 'return' },
    { x: 0, y: 12, to: 'copperhill', toX: 46, toY: 10, facing: 'left', travel: 'return' },
  ],
  npcs: [{ id: 'moss', sprite: 'moss', x: 57, y: 8, facing: 'down', dialogue: 'moss' }],
  events: [
    { id: 'front-arrive', on: 'enter', if: { notFlag: 'front.seen' }, dialogue: 'front-arrive' },
    { id: 'squad-marker', on: 'interact', x: 56, y: 13, dialogue: 'squad-marker' },
    { id: 'hut-door', on: 'interact', x: 56, y: 6, dialogue: 'moss' },
  ],
};
