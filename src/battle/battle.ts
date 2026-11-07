/**
 * The battle engine. Pure and deterministic: no DOM, all randomness from one
 * seeded Rng. The scene asks whose turn it is, picks an action (from the
 * player, the enemy AI or auto-battle), and plays back the returned events.
 */
import { BALANCE } from '../data/balance';
import { ENCOUNTERS, ENEMIES, type EncounterDef, type EnemyMove, getEncounter } from '../data/enemies';
import { LETTER_BY_ID } from '../data/letters';
import { ITEMS } from '../data/items';
import { MEMBERS, statsAt, statsWith } from '../data/party';
import { SKILLS, type SkillDef, type Weight } from '../data/skills';
import { type Weather, WEATHER_MIX } from '../data/weather';
import { Rng } from '../game/rng';
import type { GameState, PartyId } from '../game/state';
import { breakSeal, carriedBy, gearBonus } from '../letters/letters';
import { type LetterMode, letterSkill } from './letterSkills';

export type Side = 'party' | 'enemy';
export type Ailment = 'slow' | 'weak' | 'fear';

export interface Combatant {
  key: string;
  side: Side;
  /** Party id or enemy definition id. */
  id: string;
  name: string;
  level: number;
  maxHp: number;
  hp: number;
  maxFp: number;
  fp: number;
  atk: number;
  def: number;
  spd: number;
  wil: number;
  nextAt: number;
  ailments: Partial<Record<Ailment, number>>;
  atkBuff: { mult: number; turns: number } | null;
  defBuff: { mult: number; turns: number } | null;
  guarding: boolean;
  taunt: number;
  ko: boolean;
  held?: string;
  skills: string[];
  /** Sealed letters this member carries into the fight. */
  letters: string[];
  regen: { amount: number; turns: number } | null;
  dot: { amount: number; turns: number } | null;
  /** Turns left bound by Legal Binding. */
  bound: number;
  /** Turns this combatant has taken. */
  acted?: number;
  /** Ran away rather than being beaten (the Runaway Parcel). */
  fled?: boolean;
}

export type Action =
  | { kind: 'attack'; target: string }
  | { kind: 'skill'; skill: string; target: string }
  | { kind: 'item'; item: string; target: string }
  | { kind: 'guard' }
  | { kind: 'run' }
  | { kind: 'enemy'; move: string; target: string }
  | { kind: 'letter'; letter: string; mode: LetterMode; target: string }
  | { kind: 'deliver'; letter: string; target: string };

export type BattleResult = 'victory' | 'defeat' | 'fled' | 'delivered';

export type BattleEvent =
  | { type: 'act'; actor: string; label: string; anim: 'attack' | 'cast' | 'guard' | 'item' | 'read' | 'breakSeal' }
  | { type: 'damage'; target: string; amount: number }
  | { type: 'heal'; target: string; amount: number }
  | { type: 'fp'; target: string; amount: number }
  | { type: 'status'; target: string; ailment: Ailment }
  | { type: 'delay'; target: string; ticks: number }
  | { type: 'ko'; target: string }
  | { type: 'revive'; target: string }
  | { type: 'message'; text: string }
  | { type: 'skip'; actor: string }
  | { type: 'biscuit'; what: 'headbutt' | 'eat' | 'wander'; target?: string }
  | { type: 'join'; target: string }
  | { type: 'escape'; target: string }
  | { type: 'end'; result: BattleResult };

export interface Results {
  xpEach: number;
  coin: number;
  items: string[];
  levelUps: { id: PartyId; level: number }[];
}

const WEATHER_BLOCKS = 200;

export class Battle {
  readonly rng: Rng;
  readonly combatants: Combatant[] = [];
  readonly encounter: EncounterDef;
  readonly weather: Weather[] = [];
  /** Current time on the timeline, in ticks. */
  time = 0;
  /** Completed turns. */
  turn = 0;
  result: BattleResult | null = null;
  /** The letter handed over if the fight ended in a delivery. */
  delivered: string | null = null;
  /** Items taken by thieving enemies. */
  readonly itemsStolen: string[] = [];
  /** Letters Vane confiscated for the rest of the fight. */
  readonly confiscated: string[] = [];
  /** Enemy moves silenced by a letter read aloud, as `key:move`. */
  private readonly silenced = new Set<string>();
  /** Letters the party still holds, carried or in the sack. */
  private readonly held: Set<string>;
  /** Letters whose seals have never been broken. */
  private readonly unopened: Set<string>;
  private readonly itemsLeft: Record<string, number>;
  readonly biscuit: boolean;
  coinStolen = 0;
  /** Coin gained mid-battle (Pickpocket). */
  coinGained = 0;
  eaten: string[] = [];
  /** Letters whose seals were broken in this fight. */
  readonly broken: string[] = [];
  /** Nobody deals damage before this time (Ceasefire). */
  ceasefireUntil = -1;
  /** A carried Keepsake raises the party's DEF. */
  readonly keepsake: boolean;
  readonly day: number;
  private lastEnemyBuff: { mult: number; turns: number; stat: 'atk' | 'def' } | null = null;

  constructor(
    private readonly game: GameState,
    encounterId: string,
    seed: string | number,
  ) {
    const enc = getEncounter(encounterId);
    if (!enc) throw new Error(`unknown encounter ${encounterId}`);
    this.encounter = enc;
    this.rng = new Rng(seed);
    this.held = new Set(Object.entries(game.letters).filter(([, p]) => p.state !== 'delivered').map(([id]) => id));
    this.unopened = new Set(Object.entries(game.letters).filter(([, p]) => !p.broken && p.state !== 'opened' && p.state !== 'resealed').map(([id]) => id));
    this.itemsLeft = { ...game.items };
    const members: PartyId[] = [...game.party];
    for (const g of enc.guests ?? []) if (!members.includes(g)) members.push(g);
    for (const id of members) this.combatants.push(this.memberCombatant(id));
    // Supper at an inn with the eel pie recipe sets everyone up for the next fight.
    if (game.flags['meal.buff']) for (const c of this.combatants) c.atkBuff = { mult: 1.1, turns: 999 };
    enc.enemies.forEach((eid, i) => this.combatants.push(this.enemyCombatant(eid, `e${i}`)));
    this.nameEnemies();
    this.biscuit = !!game.flags['biscuit.joined'];
    this.day = game.day;
    this.keepsake = this.combatants.some((c) => c.letters.includes('L18'));
    // Opening positions: everyone a little way along, faster combatants sooner.
    for (const c of this.combatants) c.nextAt = (BALANCE.timelineBase / c.spd) * this.rng.range(0.25, 0.75);
    const mix = WEATHER_MIX[enc.region] ?? { clear: 1, rain: 1, wind: 1 };
    const total = mix.clear + mix.rain + mix.wind;
    for (let i = 0; i < WEATHER_BLOCKS; i++) {
      const r = this.rng.next() * total;
      this.weather.push(r < mix.clear ? 'clear' : r < mix.clear + mix.rain ? 'rain' : 'wind');
    }
  }

  private memberCombatant(id: PartyId): Combatant {
    const m = this.game.members[id];
    const s = statsWith(id, m.level, gearBonus(this.game, id));
    return {
      key: id,
      side: 'party',
      id,
      name: MEMBERS[id].name.replace('{name}', this.game.rookieName),
      level: m.level,
      maxHp: s.hp,
      hp: Math.max(0, Math.min(s.hp, m.hp)),
      maxFp: s.fp,
      fp: Math.max(0, Math.min(s.fp, m.fp)),
      atk: s.atk,
      def: s.def,
      spd: s.spd,
      wil: s.wil,
      nextAt: 0,
      ailments: {},
      atkBuff: null,
      defBuff: null,
      guarding: false,
      taunt: 0,
      ko: m.hp <= 0,
      skills: [...MEMBERS[id].skills],
      letters: carriedBy(this.game, id).filter((l) => this.game.letters[l]?.state === 'sealed'),
      regen: null,
      dot: null,
      bound: 0,
    };
  }

  private enemyCombatant(eid: string, key: string): Combatant {
    const e = ENEMIES[eid];
    if (!e) throw new Error(`unknown enemy ${eid}`);
    return {
      key,
      side: 'enemy',
      id: eid,
      name: e.name,
      level: e.level,
      maxHp: e.hp,
      hp: e.hp,
      maxFp: 0,
      fp: 0,
      atk: e.atk,
      def: e.def,
      spd: e.spd,
      wil: e.wil,
      nextAt: 0,
      ailments: {},
      atkBuff: null,
      defBuff: null,
      guarding: false,
      taunt: 0,
      ko: false,
      ...(e.held ? { held: e.held } : {}),
      skills: [],
      letters: [],
      regen: null,
      dot: null,
      bound: 0,
    };
  }

  /** Letters A, B, C for enemies that share a name. */
  private nameEnemies(): void {
    const enemies = this.combatants.filter((c) => c.side === 'enemy');
    const counts = new Map<string, number>();
    for (const c of enemies) {
      const base = ENEMIES[c.id]?.name ?? c.id;
      const total = enemies.filter((x) => ENEMIES[x.id]?.name === base).length;
      const n = (counts.get(base) ?? 0) + 1;
      counts.set(base, n);
      c.name = total > 1 ? `${base} ${String.fromCharCode(64 + n)}` : base;
    }
  }

  get(key: string): Combatant {
    const c = this.combatants.find((x) => x.key === key);
    if (!c) throw new Error(`no combatant ${key}`);
    return c;
  }

  alive(side: Side): Combatant[] {
    return this.combatants.filter((c) => c.side === side && !c.ko);
  }

  /** Weather at a time on the timeline. */
  weatherAt(time: number): Weather {
    const i = Math.max(0, Math.floor(time / BALANCE.weatherTicks));
    return this.weather[Math.min(i, this.weather.length - 1)] ?? 'clear';
  }

  /** Current weather and the next two. */
  forecast(): Weather[] {
    const i = Math.floor(this.time / BALANCE.weatherTicks);
    return [0, 1, 2].map((k) => this.weatherAt((i + k) * BALANCE.weatherTicks));
  }

  /** How far a combatant moves along the timeline after acting. */
  delayFor(c: Combatant, weight: Weight, at = this.time): number {
    let d = (BALANCE.timelineBase / c.spd) * BALANCE.weights[weight];
    if (c.ailments.slow) d *= BALANCE.ailments.slowDelay;
    if (weight === 'light' && this.weatherAt(at) === 'wind') d *= BALANCE.weather.windLightDelay;
    return d;
  }

  /** Whose turn it is: the living combatant with the earliest time. */
  current(): Combatant {
    const living = this.combatants.filter((c) => !c.ko);
    living.sort((a, b) => a.nextAt - b.nextAt || b.spd - a.spd || (a.side === b.side ? 0 : a.side === 'party' ? -1 : 1) || this.combatants.indexOf(a) - this.combatants.indexOf(b));
    const c = living[0];
    if (!c) throw new Error('nobody left to act');
    return c;
  }

  /**
   * The next `n` turns, as combatant keys, with Biscuit slotted in after every
   * third turn. If `preview` is given, the current actor is assumed to take an
   * action of that weight first.
   */
  timeline(n: number = BALANCE.timelineShown, preview?: Weight): string[] {
    const sim = this.combatants.filter((c) => !c.ko).map((c) => ({ c, t: c.nextAt }));
    const out: string[] = [];
    let turn = this.turn;
    let first = true;
    while (out.length < n && sim.length > 0) {
      sim.sort((a, b) => a.t - b.t || b.c.spd - a.c.spd || (a.c.side === b.c.side ? 0 : a.c.side === 'party' ? -1 : 1) || this.combatants.indexOf(a.c) - this.combatants.indexOf(b.c));
      const next = sim[0];
      if (!next) break;
      if (first && preview) {
        // The current actor has not acted yet; show where it would land.
        next.t += this.delayFor(next.c, preview, next.t);
        first = false;
        out.push(next.c.key);
        turn++;
        if (this.biscuit && turn % BALANCE.biscuitEvery === 0) out.push('biscuit');
        continue;
      }
      first = false;
      out.push(next.c.key);
      next.t += this.delayFor(next.c, 'normal', next.t);
      turn++;
      if (this.biscuit && turn % BALANCE.biscuitEvery === 0 && out.length < n) out.push('biscuit');
    }
    return out.slice(0, n);
  }

  /** Called when a turn begins. Handles fear (which may skip the turn) and clears guarding. */
  startTurn(): BattleEvent[] {
    const c = this.current();
    this.time = Math.max(this.time, c.nextAt);
    c.guarding = false;
    const events: BattleEvent[] = [];
    if (c.regen) {
      const amt = Math.min(c.maxHp - c.hp, Math.round(c.regen.amount));
      if (amt > 0) {
        c.hp += amt;
        events.push({ type: 'heal', target: c.key, amount: amt });
      }
      if (--c.regen.turns <= 0) c.regen = null;
    }
    if (c.dot) {
      const amt = Math.max(1, Math.round(c.dot.amount));
      if (--c.dot.turns <= 0) c.dot = null;
      this.hurt(c, amt, events);
      const end = this.checkEnd();
      if (c.ko || end.length > 0) {
        if (c.ko) this.turn++;
        return [...events, ...end];
      }
    }
    if (c.bound > 0) {
      c.bound--;
      events.push({ type: 'skip', actor: c.key }, { type: 'message', text: `${c.name} is bound by the fine print.` });
      events.push(...this.endTurn(c, 'normal'));
      return events;
    }
    if (c.ailments.fear && this.rng.chance(BALANCE.ailments.fearSkipChance)) {
      events.push({ type: 'skip', actor: c.key }, { type: 'message', text: `${c.name} is too frightened to act.` });
      events.push(...this.endTurn(c, 'normal'));
      return events;
    }
    return events;
  }

  /** Skills the combatant could use right now (FP permitting). */
  usableSkills(c: Combatant): SkillDef[] {
    return c.skills.map((id) => SKILLS[id]).filter((s): s is SkillDef => !!s && s.fp <= c.fp);
  }

  /** Letter skills a member can use this turn: carry skills they can afford, or seals to break. */
  letterOptions(c: Combatant, mode: LetterMode): { letter: string; skill: SkillDef; usable: boolean }[] {
    return c.letters.map((letter) => {
      const skill = letterSkill(letter, mode, c.id as PartyId, this.day);
      const usable = !skill.passive && (mode === 'burst' || skill.fp <= c.fp);
      return { letter, skill, usable };
    });
  }

  runChance(): number {
    if (!this.encounter.escapable) return 0;
    const party = this.alive('party');
    const enemies = this.alive('enemy');
    const avg = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    const pLevel = avg(party.map((c) => c.level));
    const eLevel = avg(enemies.map((c) => c.level));
    const r = BALANCE.run;
    const penalty = enemies.some((c) => ENEMIES[c.id]?.inspector) ? r.inspectorPenalty : 0;
    if (pLevel >= eLevel + r.levelGapForCertain) return 1 - penalty;
    const chance = r.base + r.perSpd * (avg(party.map((c) => c.spd)) - avg(enemies.map((c) => c.spd)));
    return Math.max(0, Math.min(r.max, Math.max(r.min, chance)) - penalty);
  }

  private atkOf(c: Combatant): number {
    let a = c.atk * (c.atkBuff?.mult ?? 1);
    if (c.ailments.weak) a *= BALANCE.ailments.weakAtk;
    return a;
  }

  private defOf(c: Combatant): number {
    return c.def * (c.defBuff?.mult ?? 1) * (this.keepsake && c.side === 'party' ? 1.1 : 1);
  }

  /** The damage formula from the design, with weather and guarding. */
  damage(attacker: Combatant, target: Combatant, power: number, magic = false): number {
    const a = magic ? attacker.wil : this.atkOf(attacker);
    const d = magic ? target.wil : this.defOf(target);
    const weather = this.weatherAt(this.time);
    let mult = weather === 'clear' ? BALANCE.weather.clearAttack : 1;
    if (weather === 'wind' && !magic) mult *= ENEMIES[attacker.id]?.windAtk ?? 1;
    if (weather === 'rain' && target.side === 'enemy') mult *= ENEMIES[target.id]?.rainWeakness ?? 1;
    if (target.guarding) mult *= this.weatherAt(this.time) === 'rain' ? BALANCE.guardFactor / BALANCE.weather.rainSupport : BALANCE.guardFactor;
    const spread = this.rng.range(BALANCE.damageSpread[0], BALANCE.damageSpread[1]);
    return Math.max(1, Math.round(((power * a) / (d + 10)) * mult * spread));
  }

  private hurt(target: Combatant, amount: number, events: BattleEvent[]): void {
    if (this.time < this.ceasefireUntil) {
      events.push({ type: 'message', text: 'The ceasefire holds. Nobody can bring themselves to strike.' });
      return;
    }
    target.hp = Math.max(0, target.hp - amount);
    events.push({ type: 'damage', target: target.key, amount });
    if (target.hp === 0 && !target.ko) {
      target.ko = true;
      target.guarding = false;
      target.ailments = {};
      events.push({ type: 'ko', target: target.key });
    }
  }

  private healAmount(base: number): number {
    return Math.round(base * (this.weatherAt(this.time) === 'rain' ? BALANCE.weather.rainSupport : 1));
  }

  private inflict(target: Combatant, ailment: Ailment, chance: number, events: BattleEvent[]): void {
    if (target.ko || !this.rng.chance(chance)) return;
    target.ailments[ailment] = BALANCE.ailments.turns;
    events.push({ type: 'status', target: target.key, ailment });
  }

  /** Resolves an action for the current actor and moves on to the next turn. */
  act(action: Action): BattleEvent[] {
    const c = this.current();
    const events: BattleEvent[] = [];
    let weight: Weight = 'normal';
    switch (action.kind) {
      case 'attack': {
        const t = this.get(action.target);
        events.push({ type: 'act', actor: c.key, label: 'Attack', anim: 'attack' });
        this.hurt(t, this.damage(c, t, BALANCE.basicAttackPower), events);
        this.counter(c, t, events);
        break;
      }
      case 'skill': {
        const s = SKILLS[action.skill];
        if (!s) throw new Error(`unknown skill ${action.skill}`);
        weight = s.weight;
        c.fp = Math.max(0, c.fp - s.fp);
        events.push({ type: 'act', actor: c.key, label: s.name, anim: s.power ? 'attack' : 'cast' });
        this.useSkill(c, s, action.target, events);
        if (s.power && !s.magic && s.target === 'enemy') this.counter(c, this.get(action.target), events);
        break;
      }
      case 'letter': {
        const member = c.id as PartyId;
        const s = letterSkill(action.letter, action.mode, member, this.day);
        if (action.mode === 'carry') c.fp = Math.max(0, c.fp - s.fp);
        else {
          this.broken.push(action.letter);
          c.letters = c.letters.filter((l) => l !== action.letter);
          events.push({ type: 'message', text: 'The seal breaks.' });
        }
        events.push({ type: 'act', actor: c.key, label: s.name, anim: action.mode === 'burst' ? 'breakSeal' : 'read' });
        this.useSkill(c, s, action.target, events);
        this.letterSideEffects(c, action.letter, events);
        break;
      }
      case 'deliver': {
        const title = LETTER_BY_ID[action.letter]?.title ?? action.letter;
        const t = this.get(action.target);
        events.push({ type: 'act', actor: c.key, label: 'Deliver', anim: 'read' });
        events.push({ type: 'message', text: `${c.name} holds out “${title}” to ${t.name}.` });
        this.result = 'delivered';
        this.delivered = action.letter;
        events.push({ type: 'end', result: 'delivered' });
        return events;
      }
      case 'item': {
        const it = ITEMS[action.item];
        const t = this.get(action.target);
        events.push({ type: 'act', actor: c.key, label: it?.name ?? action.item, anim: 'item' });
        if (it?.revive && t.ko) {
          t.ko = false;
          t.hp = Math.max(1, Math.round(t.maxHp / 4));
          events.push({ type: 'revive', target: t.key }, { type: 'heal', target: t.key, amount: t.hp });
        } else if (it?.heal && !t.ko) {
          const amt = Math.min(t.maxHp - t.hp, this.healAmount(it.heal));
          t.hp += amt;
          events.push({ type: 'heal', target: t.key, amount: amt });
        }
        if (it?.restoreFp && !t.ko) {
          const amt = Math.min(t.maxFp - t.fp, it.restoreFp);
          t.fp += amt;
          events.push({ type: 'fp', target: t.key, amount: amt });
        }
        break;
      }
      case 'guard':
        weight = 'light';
        c.guarding = true;
        events.push({ type: 'act', actor: c.key, label: 'Guard', anim: 'guard' });
        break;
      case 'run': {
        events.push({ type: 'act', actor: c.key, label: 'Run', anim: 'guard' });
        if (this.rng.chance(this.runChance())) {
          this.result = 'fled';
          events.push({ type: 'message', text: 'You got away.' }, { type: 'end', result: 'fled' });
          return events;
        }
        events.push({ type: 'message', text: 'No escape!' });
        break;
      }
      case 'enemy': {
        const e = ENEMIES[c.id];
        const move = e?.moves.find((m) => m.id === action.move);
        if (!move) throw new Error(`${c.id} has no move ${action.move}`);
        weight = move.weight;
        this.enemyMove(c, move, this.get(action.target), events);
        break;
      }
    }
    events.push(...this.endTurn(c, weight));
    return events;
  }

  /** The combatants a skill affects. */
  private targetsFor(c: Combatant, s: SkillDef, targetKey: string): Combatant[] {
    const foes = this.combatants.filter((x) => x.side !== c.side && !x.ko);
    const friends = this.combatants.filter((x) => x.side === c.side && !x.ko);
    switch (s.target) {
      case 'allEnemies':
        return foes;
      case 'allAllies':
        return friends;
      case 'self':
        return [c];
      case 'anyAlly':
        return [this.get(targetKey)];
      default: {
        const t = this.get(targetKey);
        return t.ko ? [] : [t];
      }
    }
  }

  private useSkill(c: Combatant, s: SkillDef, targetKey: string, events: BattleEvent[]): void {
    const targets = this.targetsFor(c, s, targetKey);
    for (const t of targets) {
      if (s.power) {
        this.hurt(t, this.damage(c, t, s.power, s.magic), events);
        if (s.inflict) this.inflict(t, s.inflict.ailment, s.inflict.chance, events);
        if (s.steal && t.side === 'enemy') {
          const coin = 2 + this.rng.int(0, 4);
          this.coinGained += coin;
          events.push({ type: 'message', text: `${c.name} lifts ${coin} coin.` });
        }
      }
      if (s.maxHpFraction && !t.ko) this.hurt(t, Math.max(1, Math.round(t.maxHp * s.maxHpFraction)), events);
      if (s.reviveFull) {
        if (t.ko) {
          t.ko = false;
          t.hp = t.maxHp;
          events.push({ type: 'revive', target: t.key }, { type: 'heal', target: t.key, amount: t.hp });
        } else {
          const amt = t.maxHp - t.hp;
          t.hp = t.maxHp;
          events.push({ type: 'heal', target: t.key, amount: amt });
        }
      }
      if (s.heal && !t.ko) {
        const amt = Math.min(t.maxHp - t.hp, this.healAmount(s.heal.base + c.wil * s.heal.wilScale));
        t.hp += amt;
        events.push({ type: 'heal', target: t.key, amount: amt });
      }
      if (s.cleanse && !t.ko && Object.keys(t.ailments).length > 0) {
        t.ailments = {};
        events.push({ type: 'message', text: `${t.name} feels clear-headed.` });
      }
      if (s.regen && !t.ko) t.regen = { amount: this.healAmount(s.regen.amount), turns: s.regen.turns };
      if (s.dot && !t.ko) {
        t.dot = { amount: s.dot.amount, turns: s.dot.turns };
        events.push({ type: 'message', text: `${t.name} is in arrears.` });
      }
      if (s.atkBuff && !t.ko) t.atkBuff = { mult: this.buffMult(s.atkBuff.mult), turns: s.atkBuff.turns };
      if (s.defBuff && !t.ko) t.defBuff = { mult: this.buffMult(s.defBuff.mult), turns: s.defBuff.turns };
      if (s.defDown && !t.ko) {
        t.defBuff = { ...s.defDown };
        events.push({ type: 'message', text: `${t.name}’s guard drops.` });
      }
      if (s.delay && !t.ko) {
        const ticks = s.delay * (s.threat && this.weatherAt(this.time) === 'wind' ? BALANCE.weather.windThreat : 1);
        t.nextAt += ticks;
        events.push({ type: 'delay', target: t.key, ticks: Math.round(ticks) });
      }
      if (s.toFront && !t.ko && t !== c) {
        t.nextAt = this.time + 0.001;
        events.push({ type: 'message', text: `${t.name} is up next.` });
      }
      if (s.skipTurns && !t.ko) {
        if ((ENEMIES[t.id]?.tier ?? 1) >= 6) events.push({ type: 'message', text: `${t.name} is not bound by it.` });
        else t.bound = s.skipTurns;
      }
    }
    if (s.allNext) {
      const allies = targets.filter((t) => t !== c).sort((a, b) => b.spd - a.spd);
      allies.forEach((t, i) => {
        t.nextAt = this.time + 0.001 * (i + 1);
      });
      events.push({ type: 'message', text: 'Everyone moves at once.' });
    }
    if (s.ceasefire) {
      this.ceasefireUntil = (Math.floor(this.time / BALANCE.weatherTicks) + 1) * BALANCE.weatherTicks;
      events.push({ type: 'message', text: 'A ceasefire. Nobody will strike until the weather turns.' });
    }
    if (s.coin) {
      this.coinGained += s.coin;
      events.push({ type: 'message', text: `${s.coin} coin changes hands.` });
    }
    if (s.partyFp) {
      for (const a of this.alive(c.side)) {
        const amt = Math.min(a.maxFp - a.fp, s.partyFp);
        a.fp += amt;
        if (amt > 0) events.push({ type: 'fp', target: a.key, amount: amt });
      }
    }
    if (s.restoreFp) {
      const amt = Math.min(c.maxFp - c.fp, s.restoreFp);
      c.fp += amt;
      events.push({ type: 'fp', target: c.key, amount: amt });
    }
    if (s.taunt) {
      c.taunt = 3;
      events.push({ type: 'message', text: `${c.name} draws the enemy’s eye.` });
    }
    if (s.copyBuff) {
      if (this.lastEnemyBuff) {
        const b = { mult: this.lastEnemyBuff.mult, turns: this.lastEnemyBuff.turns };
        if (this.lastEnemyBuff.stat === 'atk') c.atkBuff = b;
        else c.defBuff = b;
        events.push({ type: 'message', text: `${c.name} signs for it.` });
      } else events.push({ type: 'message', text: 'Nothing worth copying.' });
    }
    if (s.sort) {
      // Swap the next two turns after this one.
      const order = this.combatants.filter((x) => !x.ko && x !== c).sort((a, b) => a.nextAt - b.nextAt);
      const a = order[0];
      const b = order[1];
      if (a && b) {
        const t2 = a.nextAt;
        a.nextAt = b.nextAt + 0.001;
        b.nextAt = t2;
        events.push({ type: 'message', text: `${c.name} re-sorts the queue.` });
      }
    }
  }

  /** Rain makes buffs stronger. */
  private buffMult(mult: number): number {
    return this.weatherAt(this.time) === 'rain' ? 1 + (mult - 1) * BALANCE.weather.rainSupport : mult;
  }

  private enemyMove(c: Combatant, move: EnemyMove, t: Combatant, events: BattleEvent[]): void {
    events.push({ type: 'act', actor: c.key, label: move.name, anim: move.anim ?? 'attack' });
    const targets = move.all ? this.alive('party') : [t];
    for (const target of targets) {
      if (move.power) {
        const before = target.hp;
        this.hurt(target, this.damage(c, target, move.power, move.magic), events);
        if (move.drain && !c.ko) {
          const amt = Math.min(c.maxHp - c.hp, Math.round((before - target.hp) * move.drain));
          if (amt > 0) {
            c.hp += amt;
            events.push({ type: 'heal', target: c.key, amount: amt });
          }
        }
      }
      if (move.inflict) this.inflict(target, move.inflict.ailment, move.inflict.chance, events);
      if (move.delay && !target.ko) {
        const ticks = move.delay * (this.weatherAt(this.time) === 'wind' ? BALANCE.weather.windThreat : 1);
        target.nextAt += ticks;
        events.push({ type: 'delay', target: target.key, ticks });
      }
    }
    if (move.stealCoin) {
      const coin = this.rng.int(move.stealCoin[0], move.stealCoin[1]);
      this.coinStolen += coin;
      events.push({ type: 'message', text: `${c.name} pockets ${coin} coin!` });
    }
    if (move.stealItem) {
      const have = Object.entries(this.itemsLeft).filter(([, n]) => n > 0).map(([id]) => id);
      if (have.length > 0) {
        const item = this.rng.pick(have);
        this.itemsLeft[item] = (this.itemsLeft[item] ?? 1) - 1;
        this.itemsStolen.push(item);
        events.push({ type: 'message', text: `${c.name} makes off with a ${ITEMS[item]?.name.toLowerCase() ?? item}!` });
      }
    }
    if (move.summon) {
      const key = `e${this.combatants.length}`;
      const n = this.enemyCombatant(move.summon, key);
      n.nextAt = this.time + this.delayFor(n, 'normal') * 0.5;
      this.combatants.push(n);
      this.nameEnemies();
      events.push({ type: 'join', target: key }, { type: 'message', text: `${n.name} answers the call.` });
    }
    if (move.guardAllies) {
      for (const a of this.alive('enemy')) a.guarding = true;
      events.push({ type: 'message', text: 'They close ranks behind their shields.' });
    }
    if (move.rally) {
      c.atkBuff = { mult: move.rally, turns: 3 };
      events.push({ type: 'message', text: `${c.name} looks more determined.` });
    }
    if (move.confiscate) {
      const holders = this.alive('party').filter((p) => p.letters.length > 0);
      if (holders.length > 0) {
        const p = this.rng.pick(holders);
        const letter = this.rng.pick(p.letters);
        p.letters = p.letters.filter((l) => l !== letter);
        this.confiscated.push(letter);
        events.push({ type: 'message', text: `${c.name} confiscates “${LETTER_BY_ID[letter]?.title ?? letter}”. Its skill is lost for this fight.` });
      } else events.push({ type: 'message', text: `${c.name} finds nothing left to confiscate.` });
    }
  }

  /** Enemies that strike back when hit (Salt Crabs). */
  private counter(attacker: Combatant, target: Combatant, events: BattleEvent[]): void {
    if (target.side !== 'enemy' || target.ko || attacker.ko) return;
    const chance = ENEMIES[target.id]?.counter ?? 0;
    if (chance <= 0 || !this.rng.chance(chance)) return;
    events.push({ type: 'message', text: `${target.name} strikes back!` });
    this.hurt(attacker, this.damage(target, attacker, 8), events);
  }

  /** Reading a letter can silence a move, and some enemies are weak to a tone. */
  private letterSideEffects(c: Combatant, letter: string, events: BattleEvent[]): void {
    const tone = LETTER_BY_ID[letter]?.tone;
    for (const e of this.alive('enemy')) {
      const def = ENEMIES[e.id];
      const sil = def?.silencedBy;
      if (sil && sil.letters.includes(letter) && !this.silenced.has(`${e.key}:${sil.move}`)) {
        this.silenced.add(`${e.key}:${sil.move}`);
        events.push({ type: 'message', text: sil.text });
      }
      if (def?.weakTo && def.weakTo === tone && !e.ko) {
        events.push({ type: 'message', text: `${e.name} wavers at the words.` });
        this.hurt(e, this.damage(c, e, 16, true), events);
      }
    }
  }

  /** Recipients in the fight the party could hand a letter to now. */
  deliverOptions(): { letter: string; target: string }[] {
    const out: { letter: string; target: string }[] = [];
    for (const e of this.alive('enemy')) {
      const letter = ENEMIES[e.id]?.recipient;
      if (!letter || !this.held.has(letter)) continue;
      // Vane only listens once she is losing, and only to a letter never opened.
      if (letter === 'L18' && (e.hp / e.maxHp >= 0.5 || !this.unopened.has('L18') || this.broken.includes('L18'))) continue;
      out.push({ letter, target: e.key });
    }
    return out;
  }

  /** True if a move has been silenced for this enemy. */
  isSilenced(c: Combatant, move: string): boolean {
    return this.silenced.has(`${c.key}:${move}`);
  }

  /** Ages ailments and buffs, moves the actor along the timeline, and checks for the end. */
  private endTurn(c: Combatant, weight: Weight): BattleEvent[] {
    const events: BattleEvent[] = [];
    c.acted = (c.acted ?? 0) + 1;
    const flee = c.side === 'enemy' ? ENEMIES[c.id]?.fleeAfter : undefined;
    if (flee && c.acted >= flee && !c.ko) {
      c.ko = true;
      c.fled = true;
      events.push({ type: 'escape', target: c.key }, { type: 'message', text: `${c.name} gets away!` });
    }
    if (!c.ko) {
      c.nextAt = Math.max(c.nextAt, this.time) + this.delayFor(c, weight);
      const aged: Partial<Record<Ailment, number>> = {};
      for (const [k, turns] of Object.entries(c.ailments) as [Ailment, number][]) {
        if (turns > 1) aged[k] = turns - 1;
      }
      c.ailments = aged;
      for (const b of ['atkBuff', 'defBuff'] as const) {
        const buff = c[b];
        if (buff && --buff.turns <= 0) c[b] = null;
      }
      if (c.taunt > 0) c.taunt--;
    }
    this.turn++;
    const join = this.encounter.join;
    if (join && this.turn >= join.turn && !this.combatants.some((x) => x.key === join.member)) {
      const m = this.memberCombatant(join.member);
      m.nextAt = this.time + 0.01;
      this.combatants.push(m);
      events.push({ type: 'join', target: m.key }, { type: 'message', text: join.text });
    }
    events.push(...this.checkEnd());
    if (!this.result && this.biscuit && this.turn % BALANCE.biscuitEvery === 0) events.push(...this.biscuitTurn());
    return events;
  }

  private checkEnd(): BattleEvent[] {
    if (this.result) return [];
    if (this.alive('enemy').length === 0) {
      const beaten = this.combatants.some((c) => c.side === 'enemy' && !c.fled);
      this.result = beaten ? 'victory' : 'fled';
      return [{ type: 'end', result: this.result }];
    }
    if (this.alive('party').length === 0) {
      this.result = 'defeat';
      return [{ type: 'end', result: 'defeat' }];
    }
    return [];
  }

  /** Biscuit has no HP and cannot be targeted, but joins in now and then. */
  private biscuitTurn(): BattleEvent[] {
    const events: BattleEvent[] = [];
    const r = this.rng.next();
    const targets = this.alive('enemy');
    const holder = targets.find((t) => t.held);
    if (r < BALANCE.biscuit.headbutt && targets.length > 0) {
      const t = this.rng.pick(targets);
      const a = BALANCE.biscuit.atk;
      const mult = this.weatherAt(this.time) === 'clear' ? BALANCE.weather.clearAttack : 1;
      const dmg = Math.max(1, Math.round(((BALANCE.biscuit.power * a) / (this.defOf(t) + 10)) * mult * this.rng.range(0.9, 1.1)));
      events.push({ type: 'biscuit', what: 'headbutt', target: t.key }, { type: 'message', text: `Biscuit headbutts ${t.name}.` });
      this.hurt(t, dmg, events);
      events.push(...this.checkEnd());
    } else if (r < BALANCE.biscuit.headbutt + BALANCE.biscuit.eat && holder?.held) {
      const item = holder.held;
      delete holder.held;
      this.eaten.push(item);
      events.push({ type: 'biscuit', what: 'eat', target: holder.key }, { type: 'message', text: `Biscuit eats ${holder.name}’s ${ITEMS[item]?.name.toLowerCase() ?? item}.` });
    } else {
      events.push({ type: 'biscuit', what: 'wander' }, { type: 'message', text: 'Biscuit wanders off to look at something.' });
    }
    return events;
  }

  // -------------------------------------------------------------------------
  // Choosing actions for the AI and auto-battle.

  /** The enemy AI: a weighted pick of moves, aimed at whoever is taunting or at random. */
  enemyAction(c: Combatant): Action {
    const e = ENEMIES[c.id];
    const frac = c.hp / c.maxHp;
    const room = this.alive('enemy').length < 4;
    const anyLetters = this.alive('party').some((p) => p.letters.length > 0);
    const all = e?.moves ?? [];
    const allowed = all.filter(
      (m) =>
        (m.below === undefined || frac < m.below) &&
        (m.above === undefined || frac >= m.above) &&
        !this.isSilenced(c, m.id) &&
        (!m.summon || room) &&
        (!m.confiscate || anyLetters),
    );
    const moves = allowed.length > 0 ? allowed : all.filter((m) => !this.isSilenced(c, m.id)).slice(0, 1);
    const total = moves.reduce((a, m) => a + m.chance, 0);
    let r = this.rng.next() * total;
    let move = moves[0];
    for (const m of moves) {
      r -= m.chance;
      if (r < 0) {
        move = m;
        break;
      }
    }
    const party = this.alive('party');
    const taunting = party.find((p) => p.taunt > 0);
    const target = taunting ?? this.rng.pick(party);
    return { kind: 'enemy', move: move?.id ?? 'attack', target: target.key };
  }

  /** Auto-battle: heal anyone under 40% if this member can, otherwise attack the weakest enemy. */
  autoAction(c: Combatant): Action {
    const heal = this.usableSkills(c).find((s) => s.heal && s.target === 'ally');
    const hurt = this.alive('party')
      .filter((p) => p.hp / p.maxHp < BALANCE.autoHealBelow)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (heal && hurt) return { kind: 'skill', skill: heal.id, target: hurt.key };
    const target = [...this.alive('enemy')].sort((a, b) => a.hp - b.hp)[0];
    return { kind: 'attack', target: target?.key ?? '' };
  }

  // -------------------------------------------------------------------------
  // Results.

  /** Applies the outcome to the game state: HP, FP, XP, levels, coin and items. */
  applyResults(game: GameState): Results {
    const results: Results = { xpEach: 0, coin: 0, items: [], levelUps: [] };
    const party = this.combatants.filter((c) => c.side === 'party');
    if (this.result === 'victory') {
      const enemies = this.combatants.filter((c) => c.side === 'enemy' && !c.fled);
      const xp = enemies.reduce((a, e) => a + (ENEMIES[e.id]?.xp ?? 0), 0);
      results.xpEach = Math.ceil(xp / Math.max(1, party.length));
      results.coin = enemies.reduce((a, e) => a + (ENEMIES[e.id]?.coin ?? 0), 0) + this.coinStolen + this.coinGained;
      results.items = enemies.flatMap((e) => (e.held ? [e.held] : []));
    } else {
      results.coin = this.coinGained - this.coinStolen;
    }
    game.coin = Math.max(0, game.coin + results.coin);
    for (const it of this.itemsStolen) game.items[it] = Math.max(0, (game.items[it] ?? 0) - 1);
    for (const it of results.items) game.items[it] = Math.min(99, (game.items[it] ?? 0) + 1);
    for (const c of party) {
      const id = c.id as PartyId;
      const m = game.members[id];
      m.hp = this.result === 'victory' && c.ko ? 1 : c.hp;
      m.fp = c.fp;
      if (this.result !== 'victory') continue;
      m.xp += results.xpEach;
      let level = m.level;
      while (level < BALANCE.levelCap && m.xp >= 12 * (level + 1) + 3 * (level + 1) * (level + 1)) level++;
      if (level > m.level) {
        const before = statsAt(id, m.level);
        const after = statsAt(id, level);
        m.level = level;
        m.hp = Math.min(after.hp, m.hp + (after.hp - before.hp));
        m.fp = Math.min(after.fp, m.fp + (after.fp - before.fp));
        results.levelUps.push({ id, level });
      }
    }
    for (const id of this.broken) breakSeal(game, id);
    if (this.eaten.length > 0) game.flags['biscuit.chewed'] = ((game.flags['biscuit.chewed'] as number | undefined) ?? 0) + this.eaten.length;
    return results;
  }
}

export function encounterIds(): string[] {
  return Object.keys(ENCOUNTERS);
}
