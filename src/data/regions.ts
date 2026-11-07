/**
 * Regions: the road and its random encounters (design 7.1-7.3), shop prices,
 * and the road events that can happen there.
 */

export interface EnemyGroup {
  enemies: string[];
  weight: number;
}

export interface RegionDef {
  id: string;
  name: string;
  /** Danger added per step on this region's roads. */
  gain: number;
  groups: EnemyGroup[];
  /** Road events that can happen here, in no particular order. */
  events: string[];
  /** A recipient met only on this road, and the fight they turn up in. */
  recipient?: { letter: string; encounter: string; met: string };
  /** A delivered letter that makes this road quieter (design 5.4). */
  quieter?: { flag: string; mult: number };
  /** Price of a Repel Bell in this region's shops. */
  repelPrice: number;
  /** Where Inspectors take their stats from. */
  inspectors: string;
}

const g = (weight: number, ...enemies: string[]): EnemyGroup => ({ enemies, weight });

export const REGIONS: Record<string, RegionDef> = {
  thistle: {
    id: 'thistle',
    name: 'Thistle Road',
    gain: 1.2,
    groups: [g(3, 'hog'), g(3, 'hog', 'hog'), g(2, 'goose'), g(2, 'goose', 'goose'), g(2, 'brigand'), g(2, 'brigand', 'goose'), g(2, 'hog', 'goose')],
    events: ['traveller', 'goat-admirer', 'oak', 'child-courier'],
    repelPrice: 25,
    inspectors: 'thistle',
  },
  fen: {
    id: 'fen',
    name: 'Fen Road',
    gain: 1.5,
    groups: [g(3, 'leech'), g(2, 'leech', 'wisp'), g(2, 'wisp', 'wisp'), g(3, 'reed', 'reed'), g(1, 'reed', 'reed', 'reed'), g(2, 'leech', 'reed')],
    events: ['wedding', 'lost-dog', 'shortcut', 'early-letter'],
    recipient: { letter: 'L06', encounter: 'hob', met: 'hob.met' },
    quieter: { flag: 'fen.punt', mult: 0.75 },
    repelPrice: 35,
    inspectors: 'fen',
  },
  abbey: {
    id: 'abbey',
    name: 'Abbey Path',
    gain: 1.5,
    groups: [g(3, 'leech'), g(2, 'wisp', 'wisp'), g(2, 'reed', 'reed')],
    events: ['storm', 'peddler'],
    quieter: { flag: 'fen.punt', mult: 0.75 },
    repelPrice: 35,
    inspectors: 'fen',
  },
  copperhill: {
    id: 'copperhill',
    name: 'Copperhill Road',
    gain: 1.5,
    groups: [g(3, 'hound'), g(2, 'hound', 'hound'), g(2, 'slag'), g(2, 'thug'), g(2, 'thug', 'hound'), g(1, 'slag', 'hound')],
    events: ['wire-lunch', 'toll', 'storm', 'peddler'],
    recipient: { letter: 'L10', encounter: 'hask', met: 'hask.met' },
    repelPrice: 45,
    inspectors: 'copperhill',
  },
  oldfront: {
    id: 'oldfront',
    name: 'The Old Front',
    gain: 1.5,
    groups: [g(3, 'hound', 'hound'), g(2, 'slag'), g(2, 'hound', 'slag')],
    events: ['oak', 'traveller'],
    repelPrice: 45,
    inspectors: 'copperhill',
  },
  salt: {
    id: 'salt',
    name: 'Salt Road',
    gain: 1.5,
    groups: [g(3, 'crab'), g(2, 'crab', 'gull'), g(2, 'gull', 'gull'), g(2, 'raider'), g(2, 'raider', 'gull'), g(1, 'raider', 'crab')],
    events: ['lost-dog', 'early-letter', 'shortcut', 'goat-admirer'],
    recipient: { letter: 'L12', encounter: 'wick', met: 'wick.met' },
    quieter: { flag: 'charts.salt', mult: 0.75 },
    repelPrice: 55,
    inspectors: 'salt',
  },
  gulls: {
    id: 'gulls',
    name: 'Cliff Path',
    gain: 1.5,
    groups: [g(3, 'gull', 'gull'), g(2, 'crab'), g(2, 'crab', 'gull')],
    events: ['storm', 'child-courier'],
    repelPrice: 55,
    inspectors: 'salt',
  },
  kingsend: {
    id: 'kingsend',
    name: 'Kingsend Road',
    gain: 1.5,
    groups: [g(3, 'wire'), g(2, 'wire', 'wire'), g(2, 'guard'), g(2, 'guard', 'wire'), g(1, 'guard', 'guard')],
    events: ['wire-lunch', 'peddler', 'toll', 'wedding'],
    quieter: { flag: 'charts.salt', mult: 0.75 },
    repelPrice: 65,
    inspectors: 'kingsend',
  },
};
