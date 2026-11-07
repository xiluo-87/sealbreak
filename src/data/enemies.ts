/** Enemies (design 7.4) and the tutorial rats. */
import type { Weight } from './skills';
import type { Tone } from './party';

export interface EnemyMove {
  id: string;
  name: string;
  /** Relative chance the AI picks this move. */
  chance: number;
  weight: Weight;
  power?: number;
  magic?: boolean;
  /** Pushes the target later on the timeline. */
  delay?: number;
  inflict?: { ailment: 'slow' | 'weak' | 'fear'; chance: number };
  stealCoin?: [number, number];
  /** Animation to play: attack or cast. */
  anim?: 'attack' | 'cast';
}

export interface EnemyDef {
  id: string;
  name: string;
  tier: number;
  hp: number;
  atk: number;
  def: number;
  wil: number;
  spd: number;
  xp: number;
  coin: number;
  /** Used for the run chance; roughly the party level this enemy expects. */
  level: number;
  sprite: string;
  moves: EnemyMove[];
  held?: string;
  weakTo?: Tone;
}

export const ENEMIES: Record<string, EnemyDef> = {
  rat: {
    id: 'rat',
    name: 'Sorting Room Rat',
    tier: 0,
    hp: 12,
    atk: 5,
    def: 2,
    wil: 1,
    spd: 11,
    xp: 6,
    coin: 1,
    level: 1,
    sprite: 'rat',
    moves: [{ id: 'nibble', name: 'Nibble', chance: 1, weight: 'light', power: 8 }],
  },
  hog: {
    id: 'hog',
    name: 'Bramble Hog',
    tier: 1,
    hp: 20,
    atk: 7,
    def: 3,
    wil: 2,
    spd: 8,
    xp: 10,
    coin: 4,
    level: 2,
    sprite: 'hog',
    moves: [
      { id: 'gore', name: 'Gore', chance: 3, weight: 'normal', power: 10 },
      { id: 'charge', name: 'Charge', chance: 2, weight: 'heavy', power: 16 },
    ],
    held: 'apple',
  },
  goose: {
    id: 'goose',
    name: 'Angry Goose',
    tier: 1,
    hp: 14,
    atk: 8,
    def: 2,
    wil: 2,
    spd: 14,
    xp: 10,
    coin: 2,
    level: 2,
    sprite: 'goose',
    moves: [
      { id: 'peck', name: 'Peck', chance: 2, weight: 'light', power: 9 },
      { id: 'honk', name: 'Honk', chance: 1, weight: 'light', delay: 30, anim: 'cast' },
    ],
  },
  brigand: {
    id: 'brigand',
    name: 'Road Brigand',
    tier: 1,
    hp: 26,
    atk: 8,
    def: 4,
    wil: 3,
    spd: 9,
    xp: 14,
    coin: 8,
    level: 2,
    sprite: 'brigand',
    moves: [
      { id: 'cudgel', name: 'Cudgel', chance: 2, weight: 'normal', power: 11 },
      { id: 'filch', name: 'Filch', chance: 1, weight: 'light', power: 6, stealCoin: [3, 8] },
    ],
    held: 'loaf',
  },
};

export interface EncounterDef {
  id: string;
  enemies: string[];
  region: string;
  escapable: boolean;
  /** Party members who fight here before they have joined. */
  guests?: ('odile' | 'fenn' | 'juniper')[];
  /** Flag set when the fight is won. */
  wonFlag?: string;
}

export const ENCOUNTERS: Record<string, EncounterDef> = {
  'sorting-rats': { id: 'sorting-rats', enemies: ['rat', 'rat'], region: 'thistle', escapable: false, guests: ['odile'], wonFlag: 'intro.ratsBeaten' },
  'road-goose': { id: 'road-goose', enemies: ['goose'], region: 'thistle', escapable: true, wonFlag: 'road.gooseBeaten' },
  'road-hogs': { id: 'road-hogs', enemies: ['hog', 'hog'], region: 'thistle', escapable: true, wonFlag: 'road.hogsBeaten' },
  'road-brigand': { id: 'road-brigand', enemies: ['brigand', 'goose'], region: 'thistle', escapable: true, wonFlag: 'road.brigandBeaten' },
};
