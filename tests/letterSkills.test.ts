import { describe, expect, it } from 'vitest';
import { Battle } from '../src/battle/battle';
import { letterSkill } from '../src/battle/letterSkills';
import { LETTERS } from '../src/data/letters';
import { type GameState, newGame } from '../src/game/state';
import { assign } from '../src/letters/letters';

function game(): GameState {
  const g = newGame('Ada', 'seed');
  g.party = ['rookie', 'odile'];
  return g;
}

/** Makes the given member act next. */
function turnOf(b: Battle, key: string): void {
  for (const c of b.combatants) c.nextAt = c.key === key ? 0 : 1000;
  b.startTurn();
}

describe('letter skills from the tone table', () => {
  it('gives every letter a carry and a burst skill', () => {
    for (const l of LETTERS) {
      const carry = letterSkill(l.id, 'carry');
      const burst = letterSkill(l.id, 'burst');
      expect(carry.name).toBe(l.carry);
      expect(burst.name).toBe(l.burst);
      expect(burst.fp).toBe(0);
      expect(burst.weight).toBe('normal');
    }
  });

  it('uses the design’s numbers', () => {
    expect(letterSkill('L01', 'carry')).toMatchObject({ fp: 4, heal: { base: 25, wilScale: 1.5 } });
    expect(letterSkill('L01', 'burst')).toMatchObject({ target: 'allAllies', heal: { base: 60, wilScale: 2 } });
    expect(letterSkill('L02', 'carry')).toMatchObject({ fp: 3, power: 12, restoreFp: 3 });
    expect(letterSkill('L02', 'burst')).toMatchObject({ power: 70, coin: 60 });
    expect(letterSkill('L03', 'carry')).toMatchObject({ fp: 4, delay: 40 });
    expect(letterSkill('L03', 'burst')).toMatchObject({ target: 'allEnemies', delay: 80 });
    expect(letterSkill('L12', 'burst')).toMatchObject({ power: 100 });
  });

  it('adds 25% for a member’s affinity tones', () => {
    // Odile's affinities are Love and Apology.
    expect(letterSkill('L01', 'carry', 'odile').heal?.base).toBeCloseTo(25 * 1.25);
    expect(letterSkill('L01', 'carry', 'rookie').heal?.base).toBe(25);
    // The Rookie's are Joy and News.
    expect(letterSkill('L05', 'carry', 'rookie').atkBuff?.mult).toBeCloseTo(1 + 0.15 * 1.25);
  });

  it('applies the special notes', () => {
    expect(letterSkill('L07', 'burst')).toMatchObject({ reviveFull: true, target: 'anyAlly' });
    expect(letterSkill('L16', 'burst')).toMatchObject({ target: 'allEnemies', power: 70 });
    expect(letterSkill('L18', 'carry').passive).toBe(true);
    expect(letterSkill('L20', 'burst', undefined, 3).power).toBe(85);
    expect(letterSkill('L20', 'burst', undefined, 5).power).toBe(115);
  });
});

describe('letters in battle', () => {
  it('lets the carrier use a carry skill for FP and keeps the letter', () => {
    const g = game();
    assign(g, 'L02', 'rookie');
    const b = new Battle(g, 'road-hogs', 1);
    const r = b.get('rookie');
    expect(r.letters).toEqual(['L02']);
    turnOf(b, 'rookie');
    const fp = r.fp;
    const hp = b.get('e0').hp;
    b.act({ kind: 'letter', letter: 'L02', mode: 'carry', target: 'e0' });
    expect(b.get('e0').hp).toBeLessThan(hp);
    // Costs 3 FP, gives 3 back.
    expect(r.fp).toBe(fp);
    expect(r.letters).toEqual(['L02']);
    expect(b.broken).toEqual([]);
  });

  it('breaks the seal for a burst, costs no FP, and opens the letter afterwards', () => {
    const g = game();
    assign(g, 'L12', 'rookie');
    const b = new Battle(g, 'road-brigand', 1);
    turnOf(b, 'rookie');
    const fp = b.get('rookie').fp;
    const ev = b.act({ kind: 'letter', letter: 'L12', mode: 'burst', target: 'e0' });
    expect(ev.some((e) => e.type === 'act' && e.anim === 'breakSeal')).toBe(true);
    expect(b.get('rookie').fp).toBe(fp);
    expect(b.get('rookie').letters).toEqual([]);
    expect(b.broken).toEqual(['L12']);
    b.result = 'victory';
    b.applyResults(g);
    expect(g.letters.L12?.state).toBe('opened');
    expect(g.heat).toBe(1);
  });

  it('does not offer opened letters', () => {
    const g = game();
    assign(g, 'L02', 'rookie');
    g.letters.L02!.state = 'opened';
    expect(new Battle(g, 'road-hogs', 1).get('rookie').letters).toEqual([]);
  });

  it('heals the whole party with a Love burst', () => {
    const g = game();
    assign(g, 'L01', 'odile');
    const b = new Battle(g, 'road-hogs', 1);
    b.get('rookie').hp = 5;
    b.get('odile').hp = 5;
    turnOf(b, 'odile');
    b.act({ kind: 'letter', letter: 'L01', mode: 'burst', target: 'odile' });
    expect(b.get('rookie').hp).toBeGreaterThan(50);
    expect(b.get('odile').hp).toBeGreaterThan(40);
  });

  it('delays every enemy with a Threat burst and slows them all with a Grief burst', () => {
    const g = game();
    assign(g, 'L03', 'rookie');
    assign(g, 'L09', 'odile');
    const b = new Battle(g, 'road-hogs', 1);
    turnOf(b, 'rookie');
    const before = [b.get('e0').nextAt, b.get('e1').nextAt];
    b.act({ kind: 'letter', letter: 'L03', mode: 'burst', target: 'e0' });
    expect(b.get('e0').nextAt).toBeGreaterThanOrEqual((before[0] ?? 0) + 80);
    expect(b.get('e1').nextAt).toBeGreaterThanOrEqual((before[1] ?? 0) + 80);
    turnOf(b, 'odile');
    b.act({ kind: 'letter', letter: 'L09', mode: 'burst', target: 'e0' });
    for (const e of ['e0', 'e1']) if (!b.get(e).ko) expect(b.get(e).ailments.slow).toBeGreaterThan(0);
  });

  it('moves an ally to the front with News', () => {
    const g = game();
    assign(g, 'L10', 'rookie');
    const b = new Battle(g, 'road-hogs', 1);
    turnOf(b, 'rookie');
    b.get('odile').nextAt = 500;
    b.act({ kind: 'letter', letter: 'L10', mode: 'carry', target: 'odile' });
    b.startTurn();
    expect(b.current().key).toBe('odile');
  });

  it('cleanses and regenerates with Apology', () => {
    const g = game();
    assign(g, 'L04', 'odile');
    const b = new Battle(g, 'road-hogs', 1);
    const r = b.get('rookie');
    r.ailments.weak = 3;
    r.hp = 20;
    turnOf(b, 'odile');
    b.act({ kind: 'letter', letter: 'L04', mode: 'carry', target: 'rookie' });
    expect(r.ailments).toEqual({});
    turnOf(b, 'rookie');
    expect(r.hp).toBeGreaterThan(20);
  });

  it('raises the party’s DEF while Keepsake is carried', () => {
    const plain = new Battle(game(), 'road-hogs', 1);
    const g = game();
    assign(g, 'L18', 'rookie');
    const kept = new Battle(g, 'road-hogs', 1);
    expect(kept.keepsake).toBe(true);
    expect(plain.keepsake).toBe(false);
    const avg = (b: Battle): number => {
      let s = 0;
      for (let i = 0; i < 300; i++) s += b.damage(b.get('e0'), b.get('odile'), 40);
      return s / 300;
    };
    expect(avg(kept)).toBeLessThan(avg(plain));
  });

  it('stops all damage during a ceasefire', () => {
    const g = game();
    g.party.push('juniper');
    assign(g, 'L14', 'odile');
    const b = new Battle(g, 'road-hogs', 1);
    turnOf(b, 'odile');
    b.act({ kind: 'letter', letter: 'L14', mode: 'burst', target: 'odile' });
    expect(b.ceasefireUntil).toBeGreaterThan(b.time);
    const hp = b.get('e0').hp;
    turnOf(b, 'rookie');
    b.act({ kind: 'attack', target: 'e0' });
    expect(b.get('e0').hp).toBe(hp);
  });
});
