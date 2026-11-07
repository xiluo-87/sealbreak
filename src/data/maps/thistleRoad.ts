import type { EventDef, MapDef } from '../../field/maps';

/** Fixed fights across the road until random encounters arrive in Milestone 5. */
function roadFight(id: string, x: number, wonFlag: string): EventDef[] {
  return [6, 7].map((y) => ({ id: `${id}-${y}`, on: 'step' as const, x, y, if: { notFlag: wonFlag }, cutscene: id }));
}

/**
 * The first stretch of the Thistle Road, as far as the toll gate. The rest of
 * the road, its encounters and the gate itself arrive with Milestone 5.
 */
export const THISTLE_ROAD: MapDef = {
  id: 'thistle-road',
  name: 'Thistle Road',
  kind: 'road',
  region: 'thistle',
  grid: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTT..,............T........TTT',
    'T...T......T....,......T.....T',
    'T......t......T..........BB..T',
    'T.........,........t.....BB..T',
    'T..p.....p.....p.....p..gD...T',
    '________________________g____T',
    '________________________g____T',
    'T..........,............g..t.T',
    'T....t...T.......T...........T',
    'T..,..T......t......T.t....T.T',
    'T.......,...T..,........,.T..T',
    'TTT.........................TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  exits: [
    { x: 0, y: 6, to: 'thistle-cross', toX: 37, toY: 12, facing: 'left' },
    { x: 0, y: 7, to: 'thistle-cross', toX: 37, toY: 13, facing: 'left' },
  ],
  npcs: [],
  events: [
    { id: 'road-start', on: 'enter', if: { all: [{ inParty: 'odile' }, { notFlag: 'road.seen' }] }, dialogue: 'road-start' },
    { id: 'tollgate', on: 'interact', x: 24, y: 6, dialogue: 'tollgate' },
    { id: 'tollgate-2', on: 'interact', x: 24, y: 7, dialogue: 'tollgate' },
    { id: 'tollbooth', on: 'interact', x: 25, y: 5, dialogue: 'tollgate' },
    ...roadFight('road-goose', 7, 'road.gooseBeaten'),
    ...roadFight('road-hogs', 13, 'road.hogsBeaten'),
    ...roadFight('road-brigand', 19, 'road.brigandBeaten'),
  ],
};
