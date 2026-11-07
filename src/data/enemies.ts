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
  /** Hits the whole party. */
  all?: boolean;
  /** Pushes the target later on the timeline. */
  delay?: number;
  inflict?: { ailment: 'slow' | 'weak' | 'fear'; chance: number };
  stealCoin?: [number, number];
  /** Takes one of the party's items. */
  stealItem?: boolean;
  /** Heals the user by this fraction of the damage dealt. */
  drain?: number;
  /** Calls another enemy into the fight, if there is room. */
  summon?: string;
  /** Every enemy guards until its next turn. */
  guardAllies?: boolean;
  /** Raises the user's ATK. */
  rally?: number;
  /** Only below this fraction of max HP (boss phases). */
  below?: number;
  /** Only at or above this fraction of max HP. */
  above?: number;
  /** Takes a carried letter's skill away for the rest of the fight (Vane). */
  confiscate?: boolean;
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
  /** Chance to strike back when hit by a basic attack or physical skill. */
  counter?: number;
  /** Damage taken in Rain is multiplied by this. */
  rainWeakness?: number;
  /** ATK in Wind is multiplied by this. */
  windAtk?: number;
  /** Runs away after this many of its own turns. */
  fleeAfter?: number;
  inspector?: boolean;
  boss?: boolean;
  /** The letter this enemy is the recipient of; Deliver appears while it is held. */
  recipient?: string;
  /** Reading one of these letters (carry or burst) silences a move for the fight. */
  silencedBy?: { letters: string[]; move: string; text: string };
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

/** Shorthand for the enemies below: hp, atk, def, wil, spd, xp, coin. */
function foe(
  id: string,
  name: string,
  tier: number,
  level: number,
  [hp, atk, def, wil, spd, xp, coin]: [number, number, number, number, number, number, number],
  moves: EnemyMove[],
  extra: Partial<EnemyDef> = {},
): EnemyDef {
  return { id, name, tier, level, hp, atk, def, wil, spd, xp, coin, sprite: id, moves, ...extra };
}

const MORE: EnemyDef[] = [
  // Tier 2, the Fen Road.
  foe('leech', 'Leech Clump', 2, 4, [28, 9, 3, 4, 7, 18, 4], [
    { id: 'latch', name: 'Latch On', chance: 3, weight: 'normal', power: 10, drain: 0.5 },
    { id: 'squelch', name: 'Squelch', chance: 1, weight: 'normal', power: 8, inflict: { ailment: 'slow', chance: 0.3 } },
  ]),
  foe('wisp', 'Marsh Wisp', 2, 4, [20, 6, 2, 12, 13, 20, 6], [
    { id: 'glimmer', name: 'Glimmer', chance: 2, weight: 'normal', power: 12, magic: true, inflict: { ailment: 'fear', chance: 0.35 }, anim: 'cast' },
    { id: 'flicker', name: 'Flicker', chance: 1, weight: 'light', delay: 30, anim: 'cast' },
  ], { weakTo: 'love' }),
  foe('reed', 'Reed Bandit', 2, 4, [36, 11, 5, 4, 10, 22, 12], [
    { id: 'pike', name: 'Reed Pike', chance: 3, weight: 'normal', power: 11 },
    { id: 'ambush', name: 'Ambush', chance: 1, weight: 'light', power: 8 },
    { id: 'filch', name: 'Filch', chance: 1, weight: 'light', power: 5, stealCoin: [4, 10] },
  ], { held: 'ink' }),
  foe('hob', 'Hob Tanner', 2, 5, [52, 12, 6, 6, 10, 40, 20], [
    { id: 'pike', name: 'Reed Pike', chance: 3, weight: 'normal', power: 12 },
    { id: 'whistle', name: 'Two Fingers, One Whistle', chance: 1, weight: 'light', summon: 'reed', anim: 'cast' },
  ], { recipient: 'L06' }),
  // Tier 3, the Copperhill Road.
  foe('hound', 'Rust Hound', 3, 7, [40, 14, 6, 4, 14, 26, 8], [
    { id: 'bite', name: 'Bite', chance: 3, weight: 'normal', power: 11, inflict: { ailment: 'weak', chance: 0.35 } },
    { id: 'lunge', name: 'Lunge', chance: 1, weight: 'heavy', power: 15 },
  ]),
  foe('slag', 'Slag Crawler', 3, 7, [60, 13, 12, 5, 5, 28, 10], [
    { id: 'slam', name: 'Slag Slam', chance: 2, weight: 'heavy', power: 14 },
    { id: 'grind', name: 'Grind', chance: 2, weight: 'normal', power: 10, inflict: { ailment: 'slow', chance: 0.3 } },
  ]),
  foe('thug', 'Company Thug', 3, 7, [46, 15, 7, 5, 9, 26, 18], [
    { id: 'cosh', name: 'Cosh', chance: 3, weight: 'normal', power: 12 },
    { id: 'help', name: 'Whistle for Help', chance: 1, weight: 'light', summon: 'thug', anim: 'cast' },
  ], { held: 'loaf' }),
  foe('miner', 'Union Miner', 3, 7, [44, 14, 8, 5, 9, 24, 10], [
    { id: 'handle', name: 'Pick Handle', chance: 3, weight: 'normal', power: 12 },
    { id: 'shout', name: 'Solidarity!', chance: 1, weight: 'light', rally: 1.2, anim: 'cast' },
  ]),
  foe('hask', 'Foreman Hask', 3, 8, [62, 14, 8, 7, 9, 45, 24], [
    { id: 'spanner', name: 'Spanner', chance: 3, weight: 'normal', power: 13 },
    { id: 'shift', name: 'Shift’s Over', chance: 1, weight: 'light', summon: 'thug', anim: 'cast' },
  ], { recipient: 'L10' }),
  // Tier 4, the Salt Road.
  foe('crab', 'Salt Crab', 4, 9, [55, 16, 14, 6, 6, 32, 10], [
    { id: 'pinch', name: 'Pinch', chance: 3, weight: 'normal', power: 13 },
    { id: 'scuttle', name: 'Scuttle', chance: 1, weight: 'light', power: 9 },
  ], { counter: 0.35 }),
  foe('gull', 'Gull Swarm', 4, 9, [34, 14, 4, 6, 17, 30, 6], [
    { id: 'peck', name: 'Peck Storm', chance: 2, weight: 'light', power: 9 },
    { id: 'snatch', name: 'Snatch', chance: 1, weight: 'light', power: 5, stealItem: true },
  ]),
  foe('raider', 'Dune Raider', 4, 9, [60, 18, 9, 7, 11, 34, 24], [
    { id: 'scimitar', name: 'Scimitar', chance: 3, weight: 'normal', power: 13 },
    { id: 'sand', name: 'Sand in the Eyes', chance: 1, weight: 'light', power: 6, inflict: { ailment: 'weak', chance: 0.4 } },
  ], { windAtk: 1.4 }),
  foe('wick', 'Capt. Joss Wick', 4, 10, [84, 19, 10, 8, 11, 60, 40], [
    { id: 'scimitar', name: 'Scimitar', chance: 3, weight: 'normal', power: 14 },
    { id: 'rally', name: 'Raiders, To Me!', chance: 1, weight: 'light', summon: 'raider', anim: 'cast' },
  ], { windAtk: 1.4, recipient: 'L12' }),
  // Tier 5, the Kingsend Road.
  foe('wire', 'Wire Crawler', 5, 11, [70, 20, 12, 10, 13, 40, 18], [
    { id: 'spark', name: 'Spark', chance: 2, weight: 'normal', power: 13, magic: true, anim: 'cast' },
    { id: 'coil', name: 'Coil', chance: 2, weight: 'normal', power: 12, inflict: { ailment: 'slow', chance: 0.35 } },
  ], { rainWeakness: 1.5 }),
  foe('guard', 'Royal Guard', 5, 11, [85, 22, 15, 9, 9, 42, 26], [
    { id: 'halberd', name: 'Halberd', chance: 3, weight: 'normal', power: 13 },
    { id: 'wall', name: 'Shield Wall', chance: 1, weight: 'light', guardAllies: true, anim: 'cast' },
  ]),
  // Anywhere.
  foe('parcel', 'Runaway Parcel', 0, 1, [18, 1, 40, 40, 25, 150, 150], [
    { id: 'wobble', name: 'Wobble', chance: 1, weight: 'light', anim: 'cast' },
  ], { fleeAfter: 3 }),
  // Scripted fights and bosses.
  foe('tollkeeper', 'Toll Keeper Mudge', 1, 3, [42, 8, 5, 4, 8, 30, 20], [
    { id: 'ledger', name: 'Ledger Swat', chance: 2, weight: 'normal', power: 10 },
    { id: 'surcharge', name: 'Surcharge', chance: 1, weight: 'light', power: 4, stealCoin: [5, 10] },
  ]),
  foe('grist', 'Bailiff Grist', 2, 6, [180, 13, 7, 8, 9, 150, 60], [
    { id: 'gavel', name: 'Gavel', chance: 3, weight: 'normal', power: 14 },
    { id: 'fine', name: 'Fined!', chance: 2, weight: 'normal', power: 6, stealCoin: [8, 16], inflict: { ailment: 'weak', chance: 0.5 }, anim: 'cast' },
    { id: 'writ', name: 'Writ of Distraint', chance: 1, weight: 'heavy', power: 8, all: true, anim: 'cast', below: 0.6 },
  ], { boss: true }),
  foe('brass', 'Old Brass', 3, 8, [380, 16, 14, 6, 7, 300, 0], [
    { id: 'piston', name: 'Piston', chance: 3, weight: 'heavy', power: 18 },
    { id: 'bombardment', name: 'Bombardment', chance: 2, weight: 'heavy', power: 12, all: true, anim: 'cast' },
    { id: 'steam', name: 'Steam Vent', chance: 1, weight: 'normal', power: 5, all: true, inflict: { ailment: 'slow', chance: 0.4 }, anim: 'cast' },
  ], {
    boss: true,
    silencedBy: { letters: ['L13'], move: 'bombardment', text: 'Old Brass hears the terms of the armistice read out. One by one, its guns lower.' },
  }),
  foe('sorrel', 'Deputy Inspector Sorrel', 4, 10, [600, 19, 12, 14, 13, 450, 80], [
    { id: 'clipboard', name: 'Clipboard', chance: 3, weight: 'normal', power: 14 },
    { id: 'citation', name: 'Citation', chance: 2, weight: 'normal', power: 9, inflict: { ailment: 'weak', chance: 0.5 }, anim: 'cast' },
    { id: 'procedure', name: 'Procedure', chance: 1, weight: 'light', delay: 40, anim: 'cast' },
    { id: 'book', name: 'By the Book', chance: 1, weight: 'light', rally: 1.25, anim: 'cast', below: 0.5 },
  ], { boss: true, inspector: true }),
  foe('vane', 'Chief Inspector Vane', 5, 12, [1100, 22, 16, 18, 14, 0, 0], [
    { id: 'stamp', name: 'Stamp', chance: 3, weight: 'normal', power: 14, inflict: { ailment: 'weak', chance: 0.4 }, above: 0.6 },
    { id: 'countersign', name: 'Countersign', chance: 2, weight: 'normal', power: 10, inflict: { ailment: 'slow', chance: 0.5 }, anim: 'cast', above: 0.6 },
    { id: 'confiscate', name: 'Confiscate', chance: 2, weight: 'normal', confiscate: true, anim: 'cast', below: 0.6, above: 0.3 },
    { id: 'heat', name: 'The Furnace Heats', chance: 2, weight: 'normal', power: 8, all: true, magic: true, anim: 'cast', below: 0.6, above: 0.3 },
    { id: 'mace', name: 'Seal Mace', chance: 3, weight: 'heavy', power: 18, below: 0.6 },
    { id: 'furnace', name: 'Furnace', chance: 3, weight: 'heavy', power: 15, all: true, below: 0.3 },
    { id: 'final', name: 'Final Stamp', chance: 2, weight: 'normal', power: 11, all: true, inflict: { ailment: 'weak', chance: 0.3 }, below: 0.3 },
  ], { boss: true, inspector: true, recipient: 'L18' }),
];
for (const e of MORE) ENEMIES[e.id] = e;

/** Each region's toughest regular enemy, which Inspectors scale from (design 7.4). */
export const INSPECTOR_BASE: Record<string, string> = {
  thistle: 'brigand',
  fen: 'reed',
  copperhill: 'slag',
  salt: 'raider',
  kingsend: 'guard',
};

function scaled(base: EnemyDef, id: string, name: string, m: [number, number, number, number, number, number, number], moves: EnemyMove[]): EnemyDef {
  const [hp, atk, def, wil, spd, xp, coin] = m;
  return {
    id,
    name,
    tier: base.tier,
    level: base.level + 1,
    hp: Math.round(base.hp * hp),
    atk: Math.round(base.atk * atk),
    def: Math.round(base.def * def),
    wil: Math.round(base.wil * wil),
    spd: Math.round(base.spd * spd),
    xp: Math.round(base.xp * xp),
    coin: Math.round(base.coin * coin),
    sprite: id.startsWith('senior') ? 'senior' : 'inspector',
    moves,
    inspector: true,
  };
}

for (const [region, baseId] of Object.entries(INSPECTOR_BASE)) {
  const base = ENEMIES[baseId];
  if (!base) continue;
  ENEMIES[`inspector-${region}`] = scaled(base, `inspector-${region}`, 'Inspector', [1.2, 1.1, 1.1, 1.1, 1.0, 1.5, 1], [
    { id: 'stamp', name: 'Rubber Stamp', chance: 3, weight: 'normal', power: 11 },
    { id: 'notice', name: 'Formal Notice', chance: 1, weight: 'normal', power: 7, inflict: { ailment: 'slow', chance: 0.4 }, anim: 'cast' },
  ]);
  ENEMIES[`senior-${region}`] = scaled(base, `senior-${region}`, 'Senior Inspector', [1.8, 1.3, 1.2, 1.3, 1.1, 2.5, 2], [
    { id: 'stamp', name: 'Heavy Stamp', chance: 3, weight: 'normal', power: 13 },
    { id: 'audit', name: 'Audit', chance: 1, weight: 'normal', power: 8, inflict: { ailment: 'weak', chance: 0.45 }, anim: 'cast' },
    { id: 'notice', name: 'Formal Notice', chance: 1, weight: 'normal', power: 7, inflict: { ailment: 'slow', chance: 0.4 }, anim: 'cast' },
  ]);
}

export interface EncounterDef {
  id: string;
  enemies: string[];
  region: string;
  escapable: boolean;
  /** Party members who fight here before they have joined. */
  guests?: ('odile' | 'fenn' | 'juniper')[];
  /** A member who joins partway through: after this many turns, with a line. */
  join?: { member: 'fenn' | 'juniper'; turn: number; text: string };
  /** Flag set when the fight is won. */
  wonFlag?: string;
  /** Battle backdrop; defaults to the region's road. */
  backdrop?: string;
}

function fight(id: string, enemies: string[], region: string, extra: Partial<EncounterDef> = {}): EncounterDef {
  return { id, enemies, region, escapable: false, ...extra };
}

export const ENCOUNTERS: Record<string, EncounterDef> = {
  'sorting-rats': { id: 'sorting-rats', enemies: ['rat', 'rat'], region: 'thistle', escapable: false, guests: ['odile'], wonFlag: 'intro.ratsBeaten', backdrop: 'office' },
  'road-goose': { id: 'road-goose', enemies: ['goose'], region: 'thistle', escapable: true },
  'road-hogs': { id: 'road-hogs', enemies: ['hog', 'hog'], region: 'thistle', escapable: true },
  'road-brigand': { id: 'road-brigand', enemies: ['brigand', 'goose'], region: 'thistle', escapable: true },
  'toll-dispute': fight('toll-dispute', ['brigand', 'tollkeeper', 'brigand'], 'thistle', {
    wonFlag: 'toll.won',
    join: { member: 'fenn', turn: 4, text: 'The gate guard puts down his ledger, picks up the toll sign, and walks over to your side.' },
  }),
  hob: fight('hob', ['reed', 'hob', 'reed'], 'fen', { escapable: true, wonFlag: 'hob.fought' }),
  grist: fight('grist', ['grist'], 'fen', { wonFlag: 'grist.beaten', backdrop: 'fen-town' }),
  crypt: fight('crypt', ['wisp', 'wisp', 'wisp'], 'abbey', { wonFlag: 'crypt.won', backdrop: 'crypt' }),
  'union-thugs': fight('union-thugs', ['thug', 'thug', 'thug'], 'copperhill', { wonFlag: 'union.brawl', backdrop: 'hall' }),
  'union-miners': fight('union-miners', ['miner', 'miner', 'miner'], 'copperhill', { wonFlag: 'union.brawl', backdrop: 'hall' }),
  hask: fight('hask', ['thug', 'hask', 'thug'], 'copperhill', { escapable: true, wonFlag: 'hask.fought' }),
  brass: fight('brass', ['brass'], 'copperhill', { wonFlag: 'brass.beaten', backdrop: 'mine' }),
  trench: fight('trench', ['hound', 'slag', 'hound'], 'oldfront', { wonFlag: 'trench.won' }),
  'harbour-ambush': fight('harbour-ambush', ['inspector-salt', 'inspector-salt', 'inspector-salt'], 'salt', { wonFlag: 'harbour.ambush', backdrop: 'harbour' }),
  stairs: fight('stairs', ['gull', 'crab', 'gull'], 'gulls', { wonFlag: 'stairs.won' }),
  wick: fight('wick', ['raider', 'wick', 'raider'], 'salt', { escapable: true, wonFlag: 'wick.fought' }),
  sorrel: fight('sorrel', ['sorrel'], 'salt', { wonFlag: 'sorrel.beaten', backdrop: 'harbour' }),
  vane: fight('vane', ['vane'], 'kingsend', { backdrop: 'furnace' }),
  'vane-seniors': fight('vane-seniors', ['senior-kingsend', 'vane', 'senior-kingsend'], 'kingsend', { backdrop: 'furnace' }),
};

/** Outside the Dead Letter Office: one Inspector per day short of the deadline, at least one. */
export function officeEncounter(inspectors: number, senior: boolean): EncounterDef {
  const n = Math.max(1, Math.min(3, inspectors));
  const enemies = Array.from({ length: n }, () => 'inspector-kingsend');
  if (senior) enemies.splice(1, 0, 'senior-kingsend');
  return { id: `office:${n}:${senior ? 1 : 0}`, enemies, region: 'kingsend', escapable: false, wonFlag: 'office.won' };
}

/**
 * Looks up an encounter by id. Random encounters are named
 * `rand:<region>:<enemy>+<enemy>...`, so they need no table entry and
 * survive saving.
 */
export function getEncounter(id: string): EncounterDef | undefined {
  const fixed = ENCOUNTERS[id];
  if (fixed) return fixed;
  const parts = id.split(':');
  if (parts[0] === 'rand' && parts.length === 3) {
    const enemies = (parts[2] ?? '').split('+').filter((e) => !!ENEMIES[e]);
    if (enemies.length === 0) return undefined;
    return { id, enemies, region: parts[1] ?? 'thistle', escapable: true };
  }
  if (parts[0] === 'office' && parts.length === 3) return officeEncounter(Number(parts[1]), parts[2] === '1');
  return undefined;
}
