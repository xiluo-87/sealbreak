import type { MapDef } from '../../field/maps';

/**
 * The Thistle Road, from the edge of Thistle Cross to the toll gate: about
 * 120 steps of road with random encounters, a stream, fields near town and
 * the Wire's new poles marching alongside.
 */
export const THISTLE_ROAD: MapDef = {
  id: 'thistle-road',
  name: 'Thistle Road',
  kind: 'road',
  region: 'thistle',
  grid: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTT.tTTTTT.TTT.,...TTTTTTT,.T..TT.TTTT~~.TT.T.T..TTT,TTTTT..TT.T.TTBBB.TTTT...TTTT,T',
    'TT.,...t.................T........T...~~.,.TT...TT.,.T......,....,,BBB.,....,......T',
    'T...p.....p.....p,....p..............t~~.............,.........p,........p....p,...T',
    'T.......,..,.........,................~~......,,.t.t......,.____________g___________',
    '____________________________..........~~..T..T...T...,.T..,.____________g___________',
    '____________________________.......tT.~~...t.T......,..,.T..__......,.,.....,......T',
    'T........,,,...,..........__.......T..~~.T.t.TT.............__.,.....,..........,,.T',
    'T,......,.....,..,........__....t.....~~........,....T......__...,..,.......TT...,.T',
    'T..ffffff.fffff...T,......__..........~~....T.,.............__......,.t.t.........TT',
    'TT.f.,..,..,..f.TT....T...__...,......~~.T.....,...,,.....,.__..........T.......T..T',
    'T..f,..,..,..,f..........,__,,........~~T.....T...,___________......T......T...TTTTT',
    'TT.f..,..,..,.f..T........__..........~~...TT......___________,,..........,.......TT',
    'TT.f.,..,..,..f..T.,......__....,....,~~...T.......__,,...,................T.......T',
    'TT.ffffffffffff...,...T...__..........~~.,...T..T.,__..........,........,,.t..T.t.TT',
    'T.T...,............T......__,......T..~~...,.......__,............T.......TT.....,TT',
    'TTTT.,.......,...,.....T..__.......T..~~.T..,......__..T...T......,.T.............TT',
    'TTT.......................__.,.,T,..,T~~...T.....,.__..,.,T......,,....T.........TTT',
    'TT......t..T...T..........__...,.t....~~..t.T......__................,.............T',
    'T....,.,.......,..T......,__..........~~.......,...__..............T.....,.........T',
    'T....,..T..T.............,__.p....p...~~..,.p....p.__,...........T...,..TT...,,...TT',
    'T...................,.T.,.__...,......~~,..,.......__.,...........................TT',
    'TT...T.T................,.____________bb_____________,..............T.T,....T......T',
    'T,...TT.,.t.,T....T....t..____________bb_____________.....TT..t.....T....,........TT',
    'TT.T.................T.....,..........~~.............,..................T..,......TT',
    'TT............T..tT.....,..,..........~~,.....,....,,......,..,...,.T..T.....,.,..TT',
    'T.....,.T..,...........,.T...........,~~T...T..,T.......,....tt.........T...T.....TT',
    'TT.........T...,.......T......T...,..T~~.T....,..T,...,.,........................TTT',
    'T.T.TTTTTTTTTT....TTT..TT..T.T.TT..,TT~~TTTT,T...TT.TT..TT..TTT.T..T.T..TT.T..T..TTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  exits: [
    { x: 0, y: 5, to: 'thistle-cross', toX: 37, toY: 12, facing: 'left' },
    { x: 0, y: 6, to: 'thistle-cross', toX: 37, toY: 13, facing: 'left' },
    { x: 83, y: 4, to: 'thistle-road', toX: 82, toY: 4, facing: 'right', if: { flag: 'travel.thistle' }, blocked: 'road-ahead' },
    { x: 83, y: 5, to: 'thistle-road', toX: 82, toY: 5, facing: 'right', if: { flag: 'travel.thistle' }, blocked: 'road-ahead' },
  ],
  npcs: [
    { id: 'fenn', sprite: 'fenn', x: 70, y: 3, facing: 'down', dialogue: 'fenn-gate', if: { notFlag: 'toll.won' } },
    { id: 'mudge', sprite: 'mudge', x: 70, y: 6, facing: 'left', dialogue: 'mudge-gate', if: { notFlag: 'toll.won' } },
  ],
  events: [
    { id: 'road-start', on: 'enter', if: { all: [{ inParty: 'odile' }, { notFlag: 'road.seen' }] }, dialogue: 'road-start' },
    { id: 'toll-a', on: 'step', x: 65, y: 4, if: { notFlag: 'toll.won' }, cutscene: 'toll-dispute' },
    { id: 'toll-b', on: 'step', x: 65, y: 5, if: { notFlag: 'toll.won' }, cutscene: 'toll-dispute' },
    { id: 'gate-a', on: 'interact', x: 72, y: 4, dialogue: 'tollgate' },
    { id: 'gate-b', on: 'interact', x: 72, y: 5, dialogue: 'tollgate' },
    { id: 'booth', on: 'interact', x: 68, y: 2, dialogue: 'tollbooth' },
  ],
};
