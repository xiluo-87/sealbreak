import type { MapDef } from '../../field/maps';

/** The Old Mine's upper workings, opened by a Miners' Token. */
export const OLD_MINE: MapDef = {
  id: 'old-mine',
  name: 'The Old Mine',
  kind: 'interior',
  region: 'copperhill',
  theme: 'mine',
  grid: [
    'wWWWWWWWWWWWWWWWWWWWWw',
    'wWWWWWWWWWWWWWWWWWWWWw',
    'w----------^^--------w',
    'w--j--xx-----------x-w',
    'w--j----------x------w',
    'w--j-----------------w',
    'w--j-^---------------w',
    'w--j-------------xx--w',
    'w--j-----x-----------w',
    'w--j-----------------w',
    'w--j-----------------w',
    'w--jjjjjjjjjjjjjjjj--w',
    'w---------m----------w',
    'wWWWWWWWWWDWWWWWWWWWWw',
  ],
  exits: [{ x: 10, y: 13, to: 'copperhill', toX: 41, toY: 8, facing: 'down' }],
  npcs: [],
  events: [
    { id: 'mine-enter', on: 'enter', if: { notFlag: 'mine.seen' }, dialogue: 'mine-enter' },
    { id: 'crate-a', on: 'interact', x: 6, y: 3, dialogue: 'mine-crate-a' },
    { id: 'crate-a2', on: 'interact', x: 7, y: 3, dialogue: 'mine-crate-a' },
    { id: 'crate-b', on: 'interact', x: 17, y: 7, dialogue: 'mine-crate-b' },
    { id: 'crate-b2', on: 'interact', x: 18, y: 7, dialogue: 'mine-crate-b' },
    { id: 'orders', on: 'interact', x: 19, y: 3, dialogue: 'mine-orders' },
  ],
};
