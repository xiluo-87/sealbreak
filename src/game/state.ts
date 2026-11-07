/**
 * The whole game state that gets saved. Plain data only, so it can be
 * serialised and checked in tests.
 */
import type { Dir } from '../field/dir';
import { START_COIN, START_ITEMS } from '../data/items';
import { LETTERS, START_WAX } from '../data/letters';
import { statsAt } from '../data/party';
import { Rng, type RngState } from './rng';

export type FlagValue = boolean | number | string;
export type PartyId = 'rookie' | 'odile' | 'fenn' | 'juniper';
export const PARTY_IDS: readonly PartyId[] = ['rookie', 'odile', 'fenn', 'juniper'];

export const STATE_VERSION = 3;

export type LetterState = 'sealed' | 'opened' | 'resealed' | 'delivered';

export interface LetterProgress {
  state: LetterState;
  /** Who carries it, or null for the sack. */
  holder: PartyId | null;
  /** True once its seal has been broken, even if it was later resealed or delivered. */
  broken?: boolean;
}

/** A party member's progress. Max HP and FP come from the level. */
export interface MemberState {
  level: number;
  xp: number;
  hp: number;
  fp: number;
}

export interface GameState {
  version: number;
  rookieName: string;
  mapId: string;
  x: number;
  y: number;
  facing: Dir;
  flags: Record<string, FlagValue>;
  party: PartyId[];
  /** Day of the seven-day clock, starting at 1. */
  day: number;
  steps: number;
  playMs: number;
  rng: RngState;
  members: Record<PartyId, MemberState>;
  coin: number;
  items: Record<string, number>;
  letters: Record<string, LetterProgress>;
  /** Inspectorate interest: +1 for every broken seal. */
  heat: number;
  /** Sealing-wax sticks left for resealing. */
  wax: number;
  accessories: { owned: string[]; equipped: Partial<Record<PartyId, string>> };
}

export function freshLetters(): Record<string, LetterProgress> {
  return Object.fromEntries(LETTERS.map((l) => [l.id, { state: 'sealed' as LetterState, holder: null }]));
}

export function freshExtras(): Pick<GameState, 'letters' | 'heat' | 'wax' | 'accessories'> {
  return { letters: freshLetters(), heat: 0, wax: START_WAX, accessories: { owned: [], equipped: {} } };
}

export function freshMember(id: PartyId, level = 1): MemberState {
  const s = statsAt(id, level);
  return { level, xp: 0, hp: s.hp, fp: s.fp };
}

export function freshMembers(): Record<PartyId, MemberState> {
  return { rookie: freshMember('rookie'), odile: freshMember('odile'), fenn: freshMember('fenn'), juniper: freshMember('juniper') };
}

export const START = { mapId: 'thistle-cross', x: 18, y: 13, facing: 'up' as Dir };
export const DEFAULT_NAME = 'Wren';
export const MAX_NAME_LENGTH = 12;

/** Trims and tidies a player-entered name, falling back to the default. */
export function cleanName(raw: string): string {
  const printable = [...raw].filter((ch) => ch.charCodeAt(0) >= 32 && !'<>{}'.includes(ch)).join('');
  const name = printable.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
  return name.length > 0 ? name : DEFAULT_NAME;
}

export function newGame(name: string, seed: string): GameState {
  return {
    version: STATE_VERSION,
    rookieName: cleanName(name),
    mapId: START.mapId,
    x: START.x,
    y: START.y,
    facing: START.facing,
    flags: {},
    party: ['rookie'],
    day: 1,
    steps: 0,
    playMs: 0,
    rng: new Rng(seed).getState(),
    members: freshMembers(),
    coin: START_COIN,
    items: { ...START_ITEMS },
    ...freshExtras(),
  };
}

export function cloneState(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState;
}
