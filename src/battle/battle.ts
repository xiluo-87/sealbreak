/**
 * The battle engine. Pure and deterministic: no DOM, all randomness from one
 * seeded Rng. The scene asks whose turn it is, picks an action (from the
 * player, the enemy AI or auto-battle), and plays back the returned events.
 */
import { BALANCE } from '../data/balance';
import { ENCOUNTERS, ENEMIES, type EncounterDef, type EnemyMove } from '../data/enemies';
import { ITEMS } from '../data/items';
import { MEMBERS, statsAt } from '../data/party';
import { SKILLS, type SkillDef, type Weight } from '../data/skills';
import { type Weather, WEATHER_MIX } from '../data/weather';
import { Rng } from '../game/rng';
import type { GameState, PartyId } from '../game/state';

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
}

export type Action =
  | { kind: 'attack'; target: string }
  | { kind: 'skill'; skill: string; target: string }
  | { kind: 'item'; item: string; target: string }
  | { kind: 'guard' }
  | { kind: 'run' }
  | { kind: 'enemy'; move: string; target: string };

export type BattleEvent =
  | { type: 'act'; actor: string; label: string; anim: 'attack' | 'cast' | 'guard' | 'item' }
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
  | { type: 'end'; result: 'victory' | 'defeat' | 'fled' };

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
  result: 'victory' | 'defeat' | 'fled' | null = null;
  readonly biscuit: boolean;
  coinStolen = 0;
  /** Coin gained mid-battle (Pickpocket). */
  coinGained = 0;
  eaten: string[] = [];
  private lastEnemyBuff: { mult: number; turns: number; stat: 'atk' | 'def' } | null = null;

  constructor(game: GameState, encounterId: string, seed: string | number) {
    const enc = ENCOUNTERS[encounterId];
    if (!enc) throw new Error(`unknown encounter ${encounterId}`);
    this.encounter = enc;
    this.rng = new Rng(seed);
    const members: PartyId[] = [...game.party];
    for (const g of enc.guests ?? []) if (!members.includes(g)) members.push(g);
    for (const id of members) {
      const m = game.members[id];
      const s = statsAt(id, m.level);
      this.combatants.push({
        key: id,
        side: 'party',
        id,
        name: MEMBERS[id].name.replace('{name}', game.rookieName),
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
      });
    }
    const counts = new Map<string, number>();
    enc.enemies.forEach((eid, i) => {
      const e = ENEMIES[eid];
      if (!e) throw new Error(`unknown enemy ${eid}`);
      const n = (counts.get(eid) ?? 0) + 1;
      counts.set(eid, n);
      const total = enc.enemies.filter((x) => x === eid).length;
      this.combatants.push({
        key: `e${i}`,
        side: 'enemy',
        id: eid,
        name: total > 1 ? `${e.name} ${String.fromCharCode(64 + n)}` : e.name,
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
      });
    });
    this.biscuit = !!game.flags['biscuit.joined'];
    // Opening positions: everyone a little way along, faster combatants sooner.
    for (const c of this.combatants) c.nextAt = (BALANCE.timelineBase / c.spd) * this.rng.range(0.25, 0.75);
    const mix = WEATHER_MIX[enc.region] ?? { clear: 1, rain: 1, wind: 1 };
    const total = mix.clear + mix.rain + mix.wind;
    for (let i = 0; i < WEATHER_BLOCKS; i++) {
      const r = this.rng.next() * total;
      this.weather.push(r < mix.clear ? 'clear' : r < mix.clear + mix.rain ? 'rain' : 'wind');
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
    if (c.ailments.fear && this.rng.chance(BALANCE.ailments.fearSkipChance)) {
      const events: BattleEvent[] = [{ type: 'skip', actor: c.key }, { type: 'message', text: `${c.name} is too frightened to act.` }];
      events.push(...this.endTurn(c, 'normal'));
      return events;
    }
    return [];
  }

  /** Skills the combatant could use right now (FP permitting). */
  usableSkills(c: Combatant): SkillDef[] {
    return c.skills.map((id) => SKILLS[id]).filter((s): s is SkillDef => !!s && s.fp <= c.fp);
  }

  runChance(): number {
    if (!this.encounter.escapable) return 0;
    const party = this.alive('party');
    const enemies = this.alive('enemy');
    const avg = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    const pLevel = avg(party.map((c) => c.level));
    const eLevel = avg(enemies.map((c) => c.level));
    if (pLevel >= eLevel + BALANCE.run.levelGapForCertain) return 1;
    const r = BALANCE.run;
    const chance = r.base + r.perSpd * (avg(party.map((c) => c.spd)) - avg(enemies.map((c) => c.spd)));
    return Math.min(r.max, Math.max(r.min, chance));
  }

  private atkOf(c: Combatant): number {
    let a = c.atk * (c.atkBuff?.mult ?? 1);
    if (c.ailments.weak) a *= BALANCE.ailments.weakAtk;
    return a;
  }

  private defOf(c: Combatant): number {
    return c.def * (c.defBuff?.mult ?? 1);
  }

  /** The damage formula from the design, with weather and guarding. */
  damage(attacker: Combatant, target: Combatant, power: number, magic = false): number {
    const a = magic ? attacker.wil : this.atkOf(attacker);
    const d = magic ? target.wil : this.defOf(target);
    let mult = this.weatherAt(this.time) === 'clear' ? BALANCE.weather.clearAttack : 1;
    if (target.guarding) mult *= this.weatherAt(this.time) === 'rain' ? BALANCE.guardFactor / BALANCE.weather.rainSupport : BALANCE.guardFactor;
    const spread = this.rng.range(BALANCE.damageSpread[0], BALANCE.damageSpread[1]);
    return Math.max(1, Math.round(((power * a) / (d + 10)) * mult * spread));
  }

  private hurt(target: Combatant, amount: number, events: BattleEvent[]): void {
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
        break;
      }
      case 'skill': {
        const s = SKILLS[action.skill];
        if (!s) throw new Error(`unknown skill ${action.skill}`);
        weight = s.weight;
        c.fp = Math.max(0, c.fp - s.fp);
        events.push({ type: 'act', actor: c.key, label: s.name, anim: s.power ? 'attack' : 'cast' });
        this.useSkill(c, s, action.target, events);
        break;
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

  private useSkill(c: Combatant, s: SkillDef, targetKey: string, events: BattleEvent[]): void {
    const t = this.get(targetKey);
    if (s.power) {
      this.hurt(t, this.damage(c, t, s.power, s.magic), events);
      if (s.inflict) this.inflict(t, s.inflict.ailment, s.inflict.chance, events);
      if (s.steal && t.side === 'enemy') {
        const coin = 2 + this.rng.int(0, 4);
        this.coinGained += coin;
        events.push({ type: 'message', text: `${c.name} lifts ${coin} coin.` });
      }
    }
    if (s.heal && !t.ko) {
      const amt = Math.min(t.maxHp - t.hp, this.healAmount(s.heal.base + c.wil * s.heal.wilScale));
      t.hp += amt;
      events.push({ type: 'heal', target: t.key, amount: amt });
    }
    if (s.restoreFp) {
      const amt = Math.min(c.maxFp - c.fp, s.restoreFp);
      c.fp += amt;
      events.push({ type: 'fp', target: c.key, amount: amt });
    }
    if (s.delay) {
      const ticks = s.delay * (s.threat && this.weatherAt(this.time) === 'wind' ? BALANCE.weather.windThreat : 1);
      t.nextAt += ticks;
      events.push({ type: 'delay', target: t.key, ticks });
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

  private enemyMove(c: Combatant, move: EnemyMove, t: Combatant, events: BattleEvent[]): void {
    events.push({ type: 'act', actor: c.key, label: move.name, anim: move.anim ?? 'attack' });
    if (move.power) this.hurt(t, this.damage(c, t, move.power, move.magic), events);
    if (move.inflict) this.inflict(t, move.inflict.ailment, move.inflict.chance, events);
    if (move.delay && !t.ko) {
      const ticks = move.delay * (this.weatherAt(this.time) === 'wind' ? BALANCE.weather.windThreat : 1);
      t.nextAt += ticks;
      events.push({ type: 'delay', target: t.key, ticks });
    }
    if (move.stealCoin) {
      const coin = this.rng.int(move.stealCoin[0], move.stealCoin[1]);
      this.coinStolen += coin;
      events.push({ type: 'message', text: `${c.name} pockets ${coin} coin!` });
    }
  }

  /** Ages ailments and buffs, moves the actor along the timeline, and checks for the end. */
  private endTurn(c: Combatant, weight: Weight): BattleEvent[] {
    const events: BattleEvent[] = [];
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
    events.push(...this.checkEnd());
    if (!this.result && this.biscuit && this.turn % BALANCE.biscuitEvery === 0) events.push(...this.biscuitTurn());
    return events;
  }

  private checkEnd(): BattleEvent[] {
    if (this.result) return [];
    if (this.alive('enemy').length === 0) {
      this.result = 'victory';
      return [{ type: 'end', result: 'victory' }];
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
    const moves = e?.moves ?? [];
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
      const enemies = this.combatants.filter((c) => c.side === 'enemy');
      const xp = enemies.reduce((a, e) => a + (ENEMIES[e.id]?.xp ?? 0), 0);
      results.xpEach = Math.ceil(xp / Math.max(1, party.length));
      results.coin = enemies.reduce((a, e) => a + (ENEMIES[e.id]?.coin ?? 0), 0) + this.coinStolen + this.coinGained;
      results.items = enemies.flatMap((e) => (e.held ? [e.held] : []));
    } else {
      results.coin = this.coinGained - this.coinStolen;
    }
    game.coin = Math.max(0, game.coin + results.coin);
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
    if (this.eaten.length > 0) game.flags['biscuit.chewed'] = ((game.flags['biscuit.chewed'] as number | undefined) ?? 0) + this.eaten.length;
    return results;
  }
}

export function encounterIds(): string[] {
  return Object.keys(ENCOUNTERS);
}
