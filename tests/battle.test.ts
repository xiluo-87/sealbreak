import { describe, expect, it } from 'vitest';
import { type Action, Battle } from '../src/battle/battle';
import { BALANCE, levelForXp, xpForLevel } from '../src/data/balance';
import { statsAt } from '../src/data/party';
import { migrate, normalizeState } from '../src/game/save';
import { type GameState, newGame, STATE_VERSION } from '../src/game/state';

function game(party: ('rookie' | 'odile')[] = ['rookie', 'odile'], biscuit = false): GameState {
  const g = newGame('Ada', 'seed');
  g.party = [...party];
  if (biscuit) g.flags['biscuit.joined'] = true;
  return g;
}

/** Plays a battle to the end with a simple policy, returning the event count. */
function playOut(b: Battle, policy: (b: Battle) => Action): number {
  let n = 0;
  while (!b.result && n < 500) {
    b.startTurn();
    if (b.result) break;
    const c = b.current();
    b.act(c.side === 'enemy' ? b.enemyAction(c) : policy(b));
    n++;
  }
  return n;
}

describe('timeline', () => {
  it('moves an actor forward by 100 / SPD x weight', () => {
    for (const [action, weight] of [
      [{ kind: 'guard' }, 'light'],
      [{ kind: 'attack', target: 'e0' }, 'normal'],
    ] as const) {
      const b = new Battle(game(['rookie']), 'road-hogs', 1);
      const c = b.get('rookie');
      c.nextAt = 0;
      b.startTurn();
      const expected = b.time + b.delayFor(c, weight);
      b.act(action);
      expect(c.nextAt).toBeCloseTo(expected);
      expect(b.delayFor(c, 'heavy') / b.delayFor(c, 'normal')).toBeCloseTo(1.4);
    }
  });

  it('gives faster combatants more turns', () => {
    const b = new Battle(game(['rookie']), 'road-goose', 3);
    const order = b.timeline(40);
    const goose = order.filter((k) => k === 'e0').length;
    const rookie = order.filter((k) => k === 'rookie').length;
    // Goose SPD 14 against the Rookie's 10.
    expect(goose).toBeGreaterThan(rookie);
  });

  it('shows eight upcoming turns and previews where an action lands', () => {
    const b = new Battle(game(), 'road-hogs', 5);
    expect(b.timeline()).toHaveLength(BALANCE.timelineShown);
    const first = b.timeline(1)[0];
    const heavy = b.timeline(8, 'heavy');
    const light = b.timeline(8, 'light');
    expect(heavy[0]).toBe(first);
    // A heavy action pushes the actor's next turn later than a light one.
    const nextIndex = (xs: string[]): number => xs.indexOf(first ?? '', 1);
    expect(nextIndex(heavy) === -1 || nextIndex(heavy) >= nextIndex(light)).toBe(true);
  });

  it('slows the timeline by half for Slow, and shortens light actions in Wind', () => {
    const b = new Battle(game(['rookie']), 'road-goose', 9);
    const c = b.get('rookie');
    const at = b.weather.indexOf('clear') * BALANCE.weatherTicks;
    const normal = b.delayFor(c, 'normal', at);
    c.ailments.slow = 2;
    expect(b.delayFor(c, 'normal', at)).toBeCloseTo(normal * 1.5);
    delete c.ailments.slow;
    const windAt = b.weather.indexOf('wind') * BALANCE.weatherTicks;
    expect(b.delayFor(c, 'light', windAt)).toBeCloseTo((100 / c.spd) * 0.8 * 0.75);
  });

  it('slots Biscuit in after every third turn', () => {
    const b = new Battle(game(['rookie'], true), 'road-hogs', 2);
    const t = b.timeline(8);
    expect(t[3]).toBe('biscuit');
    expect(t[7]).toBe('biscuit');
    expect(new Battle(game(['rookie']), 'road-hogs', 2).timeline(8)).not.toContain('biscuit');
  });
});

describe('forecast', () => {
  it('changes every 100 ticks and is the same for the same seed', () => {
    const a = new Battle(game(), 'road-hogs', 'w');
    const b = new Battle(game(), 'road-hogs', 'w');
    expect(a.weather.slice(0, 20)).toEqual(b.weather.slice(0, 20));
    expect(a.weatherAt(0)).toBe(a.weather[0]);
    expect(a.weatherAt(99)).toBe(a.weather[0]);
    expect(a.weatherAt(100)).toBe(a.weather[1]);
    expect(a.forecast()).toHaveLength(3);
    expect(new Set(a.weather).size).toBeGreaterThan(1);
  });
});

describe('damage', () => {
  it('follows power x ATK / (DEF + 10) with weather and spread', () => {
    const b = new Battle(game(['rookie']), 'road-hogs', 4);
    const r = b.get('rookie');
    const hog = b.get('e0');
    const base = (10 * r.atk) / (hog.def + 10);
    for (let i = 0; i < 50; i++) {
      b.time = (i % 20) * BALANCE.weatherTicks;
      const w = b.weatherAt(b.time);
      const d = b.damage(r, hog, 10);
      const mult = w === 'clear' ? 1.25 : 1;
      expect(d).toBeGreaterThanOrEqual(Math.max(1, Math.round(base * mult * 0.9) - 1));
      expect(d).toBeLessThanOrEqual(Math.round(base * mult * 1.1) + 1);
    }
  });

  it('never deals less than 1', () => {
    const b = new Battle(game(['rookie']), 'road-hogs', 4);
    const hog = b.get('e0');
    hog.def = 999;
    expect(b.damage(b.get('rookie'), hog, 1)).toBe(1);
  });

  it('halves damage against a guard and cuts ATK with Weak', () => {
    const b = new Battle(game(['rookie']), 'road-hogs', 4);
    b.time = b.weather.indexOf('wind') * BALANCE.weatherTicks;
    const r = b.get('rookie');
    const hog = b.get('e0');
    const avg = (f: () => number): number => {
      let s = 0;
      for (let i = 0; i < 400; i++) s += f();
      return s / 400;
    };
    const open = avg(() => b.damage(hog, r, 40));
    r.guarding = true;
    const guarded = avg(() => b.damage(hog, r, 40));
    r.guarding = false;
    hog.ailments.weak = 2;
    const weak = avg(() => b.damage(hog, r, 40));
    expect(guarded / open).toBeCloseTo(0.5, 1);
    expect(weak / open).toBeCloseTo(0.75, 1);
  });
});

describe('ailments', () => {
  it('Fear can cost a turn', () => {
    let skipped = 0;
    for (let s = 0; s < 40; s++) {
      const b = new Battle(game(['rookie']), 'road-goose', s);
      const c = b.current();
      c.ailments.fear = 3;
      const ev = b.startTurn();
      if (ev.some((e) => e.type === 'skip')) skipped++;
    }
    expect(skipped).toBeGreaterThan(8);
    expect(skipped).toBeLessThan(32);
  });

  it('wear off after a few of the afflicted combatant’s turns', () => {
    const b = new Battle(game(['rookie']), 'road-goose', 1);
    const c = b.current();
    c.ailments.weak = 2;
    b.startTurn();
    b.act(c.side === 'enemy' ? b.enemyAction(c) : { kind: 'guard' });
    expect(c.ailments.weak).toBe(1);
  });
});

describe('running', () => {
  it('uses 50% + 10% per point of average SPD, clamped to 30-95%', () => {
    const b = new Battle(game(['rookie']), 'road-goose', 1);
    // Rookie SPD 10 against goose SPD 14.
    expect(b.runChance()).toBeCloseTo(0.3);
    const h = new Battle(game(['rookie']), 'road-hogs', 1);
    // SPD 10 against 8.
    expect(h.runChance()).toBeCloseTo(0.7);
  });

  it('always works two levels above the enemies, and never in scripted fights', () => {
    const g = game(['rookie']);
    g.members.rookie.level = 4;
    expect(new Battle(g, 'road-goose', 1).runChance()).toBe(1);
    expect(new Battle(game(), 'sorting-rats', 1).runChance()).toBe(0);
  });
});

describe('auto-battle and AI', () => {
  it('heals an ally under 40% when it can, otherwise attacks the weakest enemy', () => {
    const b = new Battle(game(), 'road-hogs', 1);
    const odile = b.get('odile');
    const rookie = b.get('rookie');
    rookie.hp = Math.floor(rookie.maxHp * 0.3);
    expect(b.autoAction(odile)).toEqual({ kind: 'skill', skill: 'bandage', target: 'rookie' });
    rookie.hp = rookie.maxHp;
    b.get('e1').hp = 3;
    expect(b.autoAction(odile)).toEqual({ kind: 'attack', target: 'e1' });
  });

  it('aims enemy attacks at a taunting ally', () => {
    const b = new Battle(game(), 'road-hogs', 1);
    b.get('odile').taunt = 2;
    for (let i = 0; i < 10; i++) expect(b.enemyAction(b.get('e0'))).toMatchObject({ target: 'odile' });
  });
});

describe('a whole fight', () => {
  it('is deterministic for the same seed and choices', () => {
    const run = (): string => {
      const b = new Battle(game(['rookie', 'odile'], true), 'road-brigand', 'same');
      playOut(b, (x) => x.autoAction(x.current()));
      return JSON.stringify(b.combatants.map((c) => [c.key, c.hp])) + b.result;
    };
    expect(run()).toBe(run());
  });

  it('ends in victory with XP shared out, coin, levels and fallen allies back at 1 HP', () => {
    const g = game();
    const b = new Battle(g, 'road-hogs', 7);
    b.get('odile').hp = 1;
    playOut(b, (x) => x.autoAction(x.current()));
    expect(b.result).toBe('victory');
    const before = g.coin;
    const r = b.applyResults(g);
    expect(r.xpEach).toBe(Math.ceil(20 / 2));
    expect(g.coin).toBeGreaterThanOrEqual(before + 8);
    for (const id of ['rookie', 'odile'] as const) {
      expect(g.members[id].xp).toBe(r.xpEach);
      expect(g.members[id].hp).toBeGreaterThanOrEqual(1);
    }
  });

  it('ends in defeat when the whole party falls', () => {
    const g = game(['rookie']);
    g.members.rookie.hp = 1;
    const b = new Battle(g, 'road-brigand', 1);
    playOut(b, () => ({ kind: 'guard' }));
    expect(b.result).toBe('defeat');
  });

  it('lets guests fight before they join', () => {
    const b = new Battle(game(['rookie']), 'sorting-rats', 1);
    expect(b.combatants.map((c) => c.key)).toEqual(['rookie', 'odile', 'e0', 'e1']);
  });
});

describe('levels', () => {
  it('needs 12n + 3n^2 XP in total for level n', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(36);
    expect(xpForLevel(12)).toBe(576);
    expect(levelForXp(35)).toBe(1);
    expect(levelForXp(36)).toBe(2);
    expect(levelForXp(100000)).toBe(BALANCE.levelCap);
  });

  it('grows stats toward each member’s role', () => {
    expect(statsAt('rookie', 1)).toEqual({ hp: 60, fp: 20, atk: 9, def: 6, spd: 10, wil: 8 });
    expect(statsAt('odile', 12).wil).toBeGreaterThan(statsAt('rookie', 12).wil);
  });

  it('levels up after enough wins', () => {
    const g = game(['rookie']);
    g.members.rookie.xp = 30;
    const b = new Battle(g, 'road-hogs', 7);
    playOut(b, (x) => x.autoAction(x.current()));
    const r = b.applyResults(g);
    expect(b.result).toBe('victory');
    expect(r.levelUps).toEqual([{ id: 'rookie', level: 2 }]);
    expect(g.members.rookie.level).toBe(2);
  });
});

describe('save migrations', () => {
  it('adds party progress, coin and items to version 1 saves', () => {
    const v1 = { version: 1, mapId: 'thistle-cross', x: 3, y: 4, facing: 'up', flags: { 'intro.done': true }, party: ['rookie', 'odile'], rookieName: 'Ada' };
    const s = normalizeState(migrate(v1));
    expect(s?.version).toBe(STATE_VERSION);
    expect(s?.letters.L01?.state).toBe('sealed');
    expect(s?.members.odile.level).toBe(1);
    expect(s?.members.odile.hp).toBe(statsAt('odile', 1).hp);
    expect(s?.items['repel-bell']).toBe(1);
    expect(s?.coin).toBeGreaterThan(0);
    expect(s?.flags['intro.done']).toBe(true);
  });

  it('clamps bad member values', () => {
    const s = normalizeState({ version: 2, mapId: 'x', members: { rookie: { level: 99, hp: -5, fp: 9999, xp: 0 } }, items: { loaf: 3, bogus: 2, pie: -1 } });
    expect(s?.members.rookie.level).toBe(BALANCE.levelCap);
    expect(s?.members.rookie.hp).toBe(0);
    expect(s?.members.rookie.fp).toBe(statsAt('rookie', BALANCE.levelCap).fp);
    expect(s?.items).toEqual({ loaf: 3 });
  });
});
