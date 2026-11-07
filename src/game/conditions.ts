/**
 * Conditions read story flags and party state; effects change them. Both are
 * plain data so dialogue, maps and cutscenes can be checked in tests.
 */
import { xpForLevel } from '../data/balance';
import { statsAt } from '../data/party';
import { assign, deliver, type DeliveryResult } from '../letters/letters';
import { type FlagValue, type GameState, type LetterState, PARTY_IDS, type PartyId } from './state';

export type Condition =
  | { flag: string; is?: FlagValue }
  | { notFlag: string }
  | { not: Condition }
  | { all: Condition[] }
  | { any: Condition[] }
  | { inParty: PartyId }
  | { letter: string; is: LetterState | 'undelivered' }
  /** The letter's seal has been broken at some point, even if it was resealed. */
  | { everOpened: string }
  | { coinAtLeast: number }
  | { hasItem: string }
  | { flagAtLeast: string; n: number }
  | { heatAtLeast: number }
  | { dayAtLeast: number };

export type Effect =
  | { set: string; to?: FlagValue }
  | { clear: string }
  | { add: string; by: number }
  | { join: PartyId }
  | { leave: PartyId }
  | { deliver: string }
  | { give: string; to: PartyId }
  | { coin: number }
  | { item: string; n: number }
  /** Restores this fraction of everyone's max HP (and FP, if given). */
  | { heal: number; fp?: number }
  | { heat: number }
  /** Starts a battle once the conversation ends (`random` picks one for the road), then `after` if it is won. */
  | { fight: string; after?: string }
  /** Brings a member up to the party's level without joining (before a guest fight). */
  | { ready: PartyId }
  /** Opens a shop or an inn once the conversation ends. */
  | { open: 'shop' | 'inn' | 'travel'; id: string };

/** Things that happened while applying effects, for the interface to report. */
export interface Outbox {
  deliveries: (DeliveryResult & { letter: string })[];
  fights: { id: string; after?: string }[];
  opens: { open: 'shop' | 'inn' | 'travel'; id: string }[];
}

export function emptyOutbox(): Outbox {
  return { deliveries: [], fights: [], opens: [] };
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
  if ('everOpened' in c) {
    const p = s.letters[c.everOpened];
    return !!p && (p.broken === true || p.state === 'opened' || p.state === 'resealed');
  }
  if ('coinAtLeast' in c) return s.coin >= c.coinAtLeast;
  if ('hasItem' in c) return (s.items[c.hasItem] ?? 0) > 0;
  if ('flagAtLeast' in c) {
    const v = s.flags[c.flagAtLeast];
    return typeof v === 'number' && v >= c.n;
  }
  if ('heatAtLeast' in c) return s.heat >= c.heatAtLeast;
  if ('dayAtLeast' in c) return s.day >= c.dayAtLeast;
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
  if ('coin' in e) {
    s.coin = Math.max(0, s.coin + e.coin);
    return;
  }
  if ('item' in e) {
    const n = Math.max(0, Math.min(99, (s.items[e.item] ?? 0) + e.n));
    s.items = Object.fromEntries(Object.entries({ ...s.items, [e.item]: n }).filter(([, v]) => v > 0));
    return;
  }
  if ('heal' in e) {
    for (const id of s.party) {
      const m = s.members[id];
      const st = statsAt(id, m.level);
      m.hp = Math.min(st.hp, m.hp + Math.round(st.hp * e.heal));
      if (e.fp) m.fp = Math.min(st.fp, m.fp + Math.round(st.fp * e.fp));
    }
    return;
  }
  if ('heat' in e) {
    s.heat = Math.max(0, s.heat + e.heat);
    return;
  }
  if ('fight' in e) {
    out?.fights.push(e.after ? { id: e.fight, after: e.after } : { id: e.fight });
    return;
  }
  if ('ready' in e) {
    catchUp(s, e.ready);
    return;
  }
  if ('open' in e) {
    out?.opens.push({ open: e.open, id: e.id });
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
      catchUp(s, e.join);
    }
  } else s.party = s.party.filter((p) => p !== e.leave);
}

export function applyAll(effects: readonly Effect[] | undefined, s: GameState, out?: Outbox): void {
  for (const e of effects ?? []) apply(e, s, out);
}

/**
 * A newcomer joins at the Rookie's level, less one, so nobody has to grind
 * to bring them up to speed.
 */
export function catchUp(s: GameState, id: PartyId): void {
  const m = s.members[id];
  const target = Math.max(1, (s.members.rookie?.level ?? 1) - 1);
  if (m.level >= target) return;
  const st = statsAt(id, target);
  m.level = target;
  m.xp = Math.max(m.xp, xpForLevel(target));
  m.hp = st.hp;
  m.fp = st.fp;
}

/** Every flag a condition reads, for validation. */
export function flagsRead(c: Condition | undefined): string[] {
  if (!c) return [];
  if ('flag' in c) return [c.flag];
  if ('notFlag' in c) return [c.notFlag];
  if ('not' in c) return flagsRead(c.not);
  if ('all' in c) return c.all.flatMap(flagsRead);
  if ('any' in c) return c.any.flatMap(flagsRead);
  if ('flagAtLeast' in c) return [c.flagAtLeast];
  return [];
}

/** Every flag an effect writes, for validation. */
export function flagsWritten(e: Effect): string[] {
  if ('set' in e) return [e.set];
  if ('add' in e) return [e.add];
  return [];
}
