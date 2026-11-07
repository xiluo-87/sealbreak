/**
 * The letter rules (design 5.1): carrying, breaking the seal, resealing and
 * delivering. Pure functions over GameState.
 */
import { ACCESSORIES } from '../data/accessories';
import { BALANCE, levelForXp } from '../data/balance';
import { ITEMS } from '../data/items';
import { LETTER_BY_ID, type LetterDef, SLOTS_PER_MEMBER } from '../data/letters';
import { MEMBERS, statsAt } from '../data/party';
import type { GameState, LetterState, PartyId } from '../game/state';

export function letter(id: string): LetterDef {
  const l = LETTER_BY_ID[id];
  if (!l) throw new Error(`unknown letter ${id}`);
  return l;
}

export function stateOf(game: GameState, id: string): LetterState {
  return game.letters[id]?.state ?? 'sealed';
}

/** The sack is in hand once the opening scene has found it. */
export function sackFound(game: GameState): boolean {
  return !!game.flags['intro.sackFell'];
}

export function carriedBy(game: GameState, member: PartyId): string[] {
  return Object.entries(game.letters)
    .filter(([, p]) => p.holder === member)
    .map(([id]) => id);
}

/** A letter's skills only work while it is sealed. */
export function hasSkill(game: GameState, id: string): boolean {
  return stateOf(game, id) === 'sealed';
}

export type AssignResult = 'ok' | 'full' | 'delivered' | 'not-in-party';

/** Gives a letter to a party member, or puts it back in the sack with `null`. */
export function assign(game: GameState, id: string, member: PartyId | null): AssignResult {
  const p = game.letters[id];
  if (!p) throw new Error(`unknown letter ${id}`);
  if (p.state === 'delivered') return 'delivered';
  if (member === null) {
    p.holder = null;
    return 'ok';
  }
  if (!game.party.includes(member)) return 'not-in-party';
  if (p.holder !== member && carriedBy(game, member).length >= SLOTS_PER_MEMBER) return 'full';
  p.holder = member;
  return 'ok';
}

/**
 * Breaks a seal, in battle or at camp. The text is revealed, the skill is
 * lost, and the Inspectorate's interest goes up by one.
 */
export function breakSeal(game: GameState, id: string): boolean {
  const p = game.letters[id];
  if (!p || p.state !== 'sealed') return false;
  p.state = 'opened';
  p.broken = true;
  game.heat += 1;
  return true;
}

export function canReseal(game: GameState, id: string): boolean {
  return stateOf(game, id) === 'opened' && game.wax > 0 && game.party.includes('juniper');
}

/** Juniper reseals an opened letter with a wax stick. The skill stays lost; Heat stays where it is. */
export function reseal(game: GameState, id: string): boolean {
  if (!canReseal(game, id)) return false;
  const p = game.letters[id];
  if (!p) return false;
  p.state = 'resealed';
  game.wax -= 1;
  return true;
}

/** Text can be read once a letter has been opened, or after delivery. */
export function canRead(game: GameState, id: string): boolean {
  const s = stateOf(game, id);
  return s === 'opened' || s === 'resealed' || s === 'delivered';
}

export interface DeliveryResult {
  coin: number;
  items: Record<string, number>;
  accessory: string | null;
  xpEach: number;
  levelUps: { id: PartyId; level: number }[];
  /** True when the seal was broken and the coin or items were halved. */
  halved: boolean;
  note: string;
}

/**
 * Hands a letter over. The skill goes with it; the party gets the reward
 * (halved if the seal is visibly broken) and 30 XP each.
 */
export function deliver(game: GameState, id: string): DeliveryResult | null {
  const p = game.letters[id];
  if (!p || p.state === 'delivered') return null;
  const l = letter(id);
  const halved = p.state === 'opened';
  const k = halved ? 0.5 : 1;
  p.state = 'delivered';
  p.holder = null;
  const coin = Math.floor((l.reward.coin ?? 0) * k);
  game.coin += coin;
  const items: Record<string, number> = {};
  for (const [item, n] of Object.entries(l.reward.items ?? {})) {
    const got = Math.max(halved ? 0 : 1, Math.floor(n * k));
    if (got > 0) {
      items[item] = got;
      game.items[item] = Math.min(99, (game.items[item] ?? 0) + got);
    }
  }
  const accessory = l.reward.accessory && ACCESSORIES[l.reward.accessory] && !game.accessories.owned.includes(l.reward.accessory) ? l.reward.accessory : null;
  if (accessory) game.accessories.owned.push(accessory);
  for (const f of l.reward.flags ?? []) game.flags[f] = true;
  const levelUps: { id: PartyId; level: number }[] = [];
  for (const member of game.party) {
    const m = game.members[member];
    m.xp += BALANCE.deliveryXp;
    let level = m.level;
    level = Math.max(level, levelForXp(m.xp));
    if (level > m.level) {
      const before = statsAt(member, m.level);
      const after = statsAt(member, level);
      m.level = level;
      m.hp += after.hp - before.hp;
      m.fp += after.fp - before.fp;
      levelUps.push({ id: member, level });
    }
  }
  const partial = halved && ((l.reward.coin ?? 0) > 0 || Object.keys(l.reward.items ?? {}).length > 0);
  return { coin, items, accessory, xpEach: BALANCE.deliveryXp, levelUps, halved: partial, note: (partial && l.reward.openedNote) || l.reward.note };
}

function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** The lines shown after a delivery: the reward note, what was received, XP and level-ups. */
export function deliveryNotice(id: string, r: DeliveryResult, rookieName: string): string[] {
  const lines = [`Delivered “${letter(id).title}”.`, r.note];
  const got = [
    ...(r.coin > 0 ? [`${r.coin} coin`] : []),
    ...Object.entries(r.items).map(([item, n]) => `${n} × ${ITEMS[item]?.name ?? item}`),
    ...(r.accessory ? [ACCESSORIES[r.accessory]?.name ?? r.accessory] : []),
  ];
  if (got.length > 0) lines.push(`Received ${joinList(got)}.`);
  if (r.halved) lines.push('With the seal broken, you got only half what you might have.');
  lines.push(`Everyone gains ${r.xpEach} XP.`);
  for (const up of r.levelUps) lines.push(`${MEMBERS[up.id].name.replace('{name}', rookieName)} reached level ${up.level}!`);
  return lines;
}

/** Accessory bonus for a member. */
export function gearBonus(game: GameState, member: PartyId): Partial<Record<'hp' | 'fp' | 'atk' | 'def' | 'spd' | 'wil', number>> {
  const a = game.accessories.equipped[member];
  return (a && ACCESSORIES[a]?.bonus) || {};
}

/** Puts an accessory on a member (taking it off anyone else), or clears their slot with null. */
export function equip(game: GameState, member: PartyId, accessory: string | null): void {
  const entries = Object.entries(game.accessories.equipped).filter(([k, v]) => v !== accessory && k !== member);
  if (accessory && game.accessories.owned.includes(accessory)) entries.push([member, accessory]);
  game.accessories.equipped = Object.fromEntries(entries);
}

export function deliveredCount(game: GameState): number {
  return Object.values(game.letters).filter((p) => p.state === 'delivered').length;
}

/** Letters whose seals have been broken at any point (for the Open Book ending). */
export function openedCount(game: GameState): number {
  return Object.values(game.letters).filter((p) => p.broken).length;
}
