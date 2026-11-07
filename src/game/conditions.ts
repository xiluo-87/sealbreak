/**
 * Conditions read story flags and party state; effects change them. Both are
 * plain data so dialogue, maps and cutscenes can be checked in tests.
 */
import { assign, deliver, type DeliveryResult } from '../letters/letters';
import { type FlagValue, type GameState, type LetterState, PARTY_IDS, type PartyId } from './state';

export type Condition =
  | { flag: string; is?: FlagValue }
  | { notFlag: string }
  | { not: Condition }
  | { all: Condition[] }
  | { any: Condition[] }
  | { inParty: PartyId }
  | { letter: string; is: LetterState | 'undelivered' };

export type Effect =
  | { set: string; to?: FlagValue }
  | { clear: string }
  | { add: string; by: number }
  | { join: PartyId }
  | { leave: PartyId }
  | { deliver: string }
  | { give: string; to: PartyId };

/** Things that happened while applying effects, for the interface to report. */
export interface Outbox {
  deliveries: (DeliveryResult & { letter: string })[];
}

export function check(c: Condition | undefined, s: GameState): boolean {
  if (!c) return true;
  if ('flag' in c) {
    const v = s.flags[c.flag];
    return c.is === undefined ? v !== undefined && v !== false && v !== 0 && v !== '' : v === c.is;
  }
  if ('notFlag' in c) {
    const v = s.flags[c.notFlag];
    return v === undefined || v === false || v === 0 || v === '';
  }
  if ('not' in c) return !check(c.not, s);
  if ('all' in c) return c.all.every((x) => check(x, s));
  if ('any' in c) return c.any.some((x) => check(x, s));
  if ('letter' in c) {
    const st = s.letters[c.letter]?.state ?? 'sealed';
    return c.is === 'undelivered' ? st !== 'delivered' : st === c.is;
  }
  return s.party.includes(c.inParty);
}

export function apply(e: Effect, s: GameState, out?: Outbox): void {
  if ('deliver' in e) {
    const r = deliver(s, e.deliver);
    if (r && out) out.deliveries.push({ ...r, letter: e.deliver });
    return;
  }
  if ('give' in e) {
    assign(s, e.give, e.to);
    return;
  }
  if ('set' in e) s.flags[e.set] = e.to ?? true;
  else if ('clear' in e) s.flags = Object.fromEntries(Object.entries(s.flags).filter(([k]) => k !== e.clear));
  else if ('add' in e) {
    const v = s.flags[e.add];
    s.flags[e.add] = (typeof v === 'number' ? v : 0) + e.by;
  } else if ('join' in e) {
    if (!s.party.includes(e.join)) {
      s.party.push(e.join);
      s.party.sort((a, b) => PARTY_IDS.indexOf(a) - PARTY_IDS.indexOf(b));
    }
  } else s.party = s.party.filter((p) => p !== e.leave);
}

export function applyAll(effects: readonly Effect[] | undefined, s: GameState, out?: Outbox): void {
  for (const e of effects ?? []) apply(e, s, out);
}

/** Every flag a condition reads, for validation. */
export function flagsRead(c: Condition | undefined): string[] {
  if (!c) return [];
  if ('flag' in c) return [c.flag];
  if ('notFlag' in c) return [c.notFlag];
  if ('not' in c) return flagsRead(c.not);
  if ('all' in c) return c.all.flatMap(flagsRead);
  if ('any' in c) return c.any.flatMap(flagsRead);
  return [];
}

/** Every flag an effect writes, for validation. */
export function flagsWritten(e: Effect): string[] {
  if ('set' in e) return [e.set];
  if ('add' in e) return [e.add];
  return [];
}
