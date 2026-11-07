/**
 * Which ending the story reaches (design 12), checked in order when the
 * final fight resolves. Pure, so the headless playthrough can test it.
 */
import { LETTERS } from '../data/letters';
import { deliveredCount, openedCount } from '../letters/letters';
import type { GameState } from './state';

export type EndingId = 'goat' | 'deadline' | 'lastpost' | 'openbook' | 'furnace';

export const ENDING_NAMES: Record<EndingId, string> = {
  goat: 'Goat Post',
  deadline: 'Dead Letter',
  lastpost: 'Last Post',
  openbook: 'Open Book',
  furnace: 'Dead Letter',
};

export const LAST_POST_DELIVERED = 14;
export const LAST_POST_MAX_HEAT = 6;
export const OPEN_BOOK_OPENED = 8;
export const GOAT_TRUST = 5;

/** Biscuit's trust, from apples and kindnesses along the way. */
export function biscuitTrust(state: GameState): number {
  const t = state.flags['biscuit.trust'];
  return typeof t === 'number' ? t : 0;
}

/** True when the Decree of Closure could go to Biscuit. */
export function goatPostAvailable(state: GameState): boolean {
  return biscuitTrust(state) >= GOAT_TRUST && !!state.flags['biscuit.joined'];
}

export function selectEnding(state: GameState): EndingId {
  if (state.flags['ending.goat'] && goatPostAvailable(state)) return 'goat';
  if (!state.flags['reached.kingsend']) return 'deadline';
  const l18 = state.letters.L18;
  const deliveredUnopened = l18?.state === 'delivered' && !l18.broken && state.flags['final.result'] === 'delivered';
  if (deliveredUnopened && deliveredCount(state) >= LAST_POST_DELIVERED && state.heat <= LAST_POST_MAX_HEAT) return 'lastpost';
  if (openedCount(state) >= OPEN_BOOK_OPENED) return 'openbook';
  return 'furnace';
}

/** Letters still undelivered at the end, for the furnace and the deadline endings. */
export function undelivered(state: GameState): string[] {
  return LETTERS.filter((l) => state.letters[l.id]?.state !== 'delivered').map((l) => l.id);
}
