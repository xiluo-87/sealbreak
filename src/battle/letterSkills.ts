/**
 * Letter skills: the tone table (design 5.3) with each letter's special
 * variant, and the +25% bonus for a member's affinity tones.
 */
import { LETTER_BY_ID } from '../data/letters';
import { MEMBERS, type Tone } from '../data/party';
import type { SkillDef } from '../data/skills';
import type { PartyId } from '../game/state';

export type LetterMode = 'carry' | 'burst';

type Template = Omit<SkillDef, 'id' | 'name'>;

const BATTLE_LONG = 999;

const CARRY: Record<Tone, Template> = {
  love: { description: 'Heal one ally.', fp: 4, weight: 'normal', target: 'ally', heal: { base: 25, wilScale: 1.5 } },
  joy: { description: 'Raise the party’s ATK for three turns.', fp: 6, weight: 'normal', target: 'allAllies', atkBuff: { mult: 1.15, turns: 3 } },
  grief: { description: 'A heavy blow of feeling that slows the target.', fp: 5, weight: 'normal', target: 'enemy', power: 12, magic: true, inflict: { ailment: 'slow', chance: 1 } },
  anger: { description: 'Strike one enemy hard.', fp: 6, weight: 'normal', target: 'enemy', power: 24, magic: true },
  debt: { description: 'Strike one enemy and recover a little FP.', fp: 3, weight: 'normal', target: 'enemy', power: 12, magic: true, restoreFp: 3 },
  apology: { description: 'Clear one ally’s ailments and heal them a little each turn.', fp: 5, weight: 'normal', target: 'ally', cleanse: true, regen: { amount: 5, turns: 3 } },
  threat: { description: 'Push one enemy back on the timeline.', fp: 4, weight: 'normal', target: 'enemy', delay: 40, threat: true },
  news: { description: 'Move one ally to the front of the timeline.', fp: 5, weight: 'normal', target: 'ally', toFront: true },
};

const BURST: Record<Tone, Template> = {
  love: { description: 'Heal the whole party.', fp: 0, weight: 'normal', target: 'allAllies', heal: { base: 60, wilScale: 2 } },
  joy: { description: 'Raise the party’s ATK and DEF for the rest of the battle.', fp: 0, weight: 'normal', target: 'allAllies', atkBuff: { mult: 1.3, turns: BATTLE_LONG }, defBuff: { mult: 1.3, turns: BATTLE_LONG } },
  grief: { description: 'Strike every enemy and slow them.', fp: 0, weight: 'normal', target: 'allEnemies', power: 60, magic: true, inflict: { ailment: 'slow', chance: 1 } },
  anger: { description: 'A crushing blow to one enemy.', fp: 0, weight: 'normal', target: 'enemy', power: 100, magic: true },
  debt: { description: 'A heavy blow to one enemy, and 60 coin.', fp: 0, weight: 'normal', target: 'enemy', power: 70, magic: true, coin: 60 },
  apology: { description: 'Clear the party’s ailments and heal them each turn for a while.', fp: 0, weight: 'normal', target: 'allAllies', cleanse: true, regen: { amount: 10, turns: 5 } },
  threat: { description: 'Push every enemy far back on the timeline.', fp: 0, weight: 'normal', target: 'allEnemies', delay: 80, threat: true },
  news: { description: 'Every ally acts next, fastest first.', fp: 0, weight: 'normal', target: 'allAllies', allNext: true },
};

/** Letters whose skills differ from their tone's usual effect. */
const SPECIAL: Record<string, Partial<Record<LetterMode, Partial<Template>>>> = {
  L07: { burst: { description: 'Bring one fallen ally back at full health.', target: 'anyAlly', reviveFull: true, heal: undefined } },
  L08: { carry: { description: 'Strike one enemy, recover a little FP and lower its DEF.', defDown: { mult: 0.75, turns: 3 } } },
  L13: {
    carry: { description: 'Move one ally to the front and lower an enemy’s DEF.', target: 'enemy', toFront: false, defDown: { mult: 0.75, turns: 3 } },
    burst: { description: 'Bind one enemy so it loses three turns. Bosses are not bound.', target: 'enemy', allNext: false, skipTurns: 3 },
  },
  L14: { burst: { description: 'Nobody deals damage until the weather next changes.', target: 'self', cleanse: false, regen: undefined, ceasefire: true } },
  L15: { burst: { description: 'Strike every enemy, slow them, and restore 12 FP to the party.', partyFp: 12 } },
  L16: { burst: { description: 'Strike every enemy.', target: 'allEnemies', power: 70 } },
  L17: { carry: { description: 'The whole party heals a little each turn.', atkBuff: undefined, regen: { amount: 5, turns: 3 } } },
  L18: {
    carry: { description: 'While carried, raises the party’s DEF by 10%.', passive: true, power: undefined, inflict: undefined, target: 'self' },
    burst: { description: 'One enemy loses most of its health.', target: 'enemy', power: undefined, inflict: undefined, maxHpFraction: 0.6 },
  },
  L19: { carry: { description: 'A small heal for the whole party.', atkBuff: undefined, heal: { base: 12, wilScale: 0.6 } } },
  L20: {
    carry: { description: 'Hurts one enemy a little every turn for a while.', power: undefined, restoreFp: undefined, dot: { amount: 7, turns: 4 } },
    burst: { description: 'A blow that grows heavier with every day of the journey.', power: 40, coin: undefined },
  },
  L21: { carry: { description: 'Raise the party’s DEF for three turns.', target: 'allAllies', power: undefined, magic: undefined, inflict: undefined, defBuff: { mult: 1.2, turns: 3 } } },
};

export function hasAffinity(member: PartyId, tone: Tone): boolean {
  return MEMBERS[member].affinity.includes(tone);
}

/** Scales an effect for affinity: +25% to amounts and to how much a buff changes things. */
function boost(t: Template): Template {
  const k = 1.25;
  return {
    ...t,
    ...(t.power ? { power: t.power * k } : {}),
    ...(t.heal ? { heal: { base: t.heal.base * k, wilScale: t.heal.wilScale * k } } : {}),
    ...(t.delay ? { delay: t.delay * k } : {}),
    ...(t.regen ? { regen: { ...t.regen, amount: t.regen.amount * k } } : {}),
    ...(t.dot ? { dot: { ...t.dot, amount: t.dot.amount * k } } : {}),
    ...(t.atkBuff ? { atkBuff: { ...t.atkBuff, mult: 1 + (t.atkBuff.mult - 1) * k } } : {}),
    ...(t.defBuff ? { defBuff: { ...t.defBuff, mult: 1 + (t.defBuff.mult - 1) * k } } : {}),
    ...(t.maxHpFraction ? { maxHpFraction: Math.min(0.75, t.maxHpFraction * k) } : {}),
  };
}

/** The skill a letter gives in a mode, for a member (affinity applied) on a given day. */
export function letterSkill(letterId: string, mode: LetterMode, member?: PartyId, day = 1): SkillDef {
  const l = LETTER_BY_ID[letterId];
  if (!l) throw new Error(`unknown letter ${letterId}`);
  let t: Template = { ...(mode === 'carry' ? CARRY : BURST)[l.tone], ...(SPECIAL[letterId]?.[mode] ?? {}) };
  if (letterId === 'L20' && mode === 'burst') t = { ...t, power: 40 + 15 * day };
  if (member && hasAffinity(member, l.tone)) t = boost(t);
  return { ...t, id: `${letterId}:${mode}`, name: mode === 'carry' ? l.carry : l.burst };
}
