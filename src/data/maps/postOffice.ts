import type { MapDef } from '../../field/maps';

const DONE = 'intro.done';

/** The Thistle Cross post office, where the game begins in earnest. */
export const POST_OFFICE: MapDef = {
  id: 'post-office',
  name: 'Thistle Cross Post Office',
  kind: 'interior',
  region: 'thistle',
  grid: [
    'WWWWWWWWWWWWWWWW',
    'WkkkkWWWWWWsskkW',
    'w--------------w',
    'w--cccccccc----w',
    'w--------------w',
    'w-ee---rrrr--x-w',
    'w-ee---rrrr--x-w',
    'w--------------w',
    'w---v----------w',
    'w------m-------w',
    'wwwwwwwDwwwwwwww',
  ],
  exits: [{ x: 7, y: 10, to: 'thistle-cross', toX: 19, toY: 7, facing: 'down' }],
  npcs: [
    { id: 'odile', sprite: 'odile', x: 7, y: 2, facing: 'down', turns: false, if: { notFlag: DONE } },
    { id: 'biscuit', sprite: 'biscuit', x: 12, y: 8, facing: 'left', turns: false, if: { notFlag: DONE } },
    { id: 'sack', sprite: 'sack', x: 12, y: 2, facing: 'down', turns: false, if: { all: [{ flag: 'intro.sackFell' }, { notFlag: 'intro.sackTaken' }] } },
  ],
  events: [{ id: 'office', on: 'enter', if: { notFlag: DONE }, cutscene: 'office' }],
};
