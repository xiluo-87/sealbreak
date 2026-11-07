import { describe, expect, it } from 'vitest';
import { type Action, Battle } from '../src/battle/battle';
import { BALANCE } from '../src/data/balance';
import { DIALOGUE } from '../src/data/dialogue';
import { ENCOUNTERS, ENEMIES, getEncounter, officeEncounter } from '../src/data/enemies';
import { REGIONS } from '../src/data/regions';
import { battleFor, bellOf, enterRoad, groupsFor, inspectorChance, regionGain, ringBell, rollEncounter, stepDanger, terrainOf } from '../src/game/encounters';
import { Rng } from '../src/game/rng';
import { migrate, normalizeState } from '../src/game/save';
import { freshRoad, type GameState, newGame, STATE_VERSION } from '../src/game/state';
import { ALL_CHARACTERS } from '../src/sprites/characters';

function game(): GameState {
  const g = newGame('Ada', 'seed');
  g.party = ['rookie', 'odile'];
  return g;
}

function play(b: Battle, policy: (b: Battle) => Action, limit = 400): void {
  for (let n = 0; n < limit && !b.result; n++) {
    b.startTurn();
    if (b.result) break;
    const c = b.current();
    b.act(c.side === 'enemy' ? b.enemyAction(c) : policy(b));
  }
}

const attackFirst = (b: Battle): Action => ({ kind: 'attack', target: b.alive('enemy')[0]?.key ?? '' });
const guard = (): Action => ({ kind: 'guard' });

describe('the danger gauge', () => {
  it('reads terrain from the map tile', () => {
    expect(terrainOf('=')).toBe('paved');
    expect(terrainOf('_')).toBe('road');
    expect(terrainOf('b')).toBe('road');
    expect(terrainOf('.')).toBe('off');
  });

  it('rises per step by region and terrain, and never fires below the threshold', () => {
    const road = freshRoad();
    const rng = new Rng(1);
    for (let i = 0; i < 10; i++) expect(stepDanger(road, 1.5, 'road', rng)).toBe(false);
    expect(road.gauge).toBeCloseTo(15);
    stepDanger(road, 1.5, 'off', rng);
    expect(road.gauge).toBeCloseTo(15 + 1.5 * 1.4);
    stepDanger(road, 1.5, 'paved', rng);
    expect(road.gauge).toBeCloseTo(15 + 1.5 * 1.4 + 1.5 * 0.7);
  });

  it('resets after an encounter and holds off for 15 steps', () => {
    const road = freshRoad();
    road.gauge = 139;
    expect(stepDanger(road, 1.5, 'road', new Rng(2))).toBe(true);
    expect(road.gauge).toBe(0);
    expect(road.count).toBe(1);
    road.gauge = 200;
    for (let i = 0; i < BALANCE.encounters.cooldown; i++) expect(stepDanger(road, 1.5, 'road', new Rng(3))).toBe(false);
  });

  it('gives about three or four encounters on a 140-step crossing', () => {
    const rng = new Rng('crossing');
    let total = 0;
    const runs = 200;
    for (let r = 0; r < runs; r++) {
      const road = freshRoad();
      for (let i = 0; i < 140; i++) if (stepDanger(road, 1.5, 'road', rng)) total++;
    }
    const avg = total / runs;
    expect(avg).toBeGreaterThan(2.8);
    expect(avg).toBeLessThan(4.5);
  });

  it('is quieter on the first road and with the low encounter rate', () => {
    const g = game();
    expect(regionGain(g, 'thistle')).toBeCloseTo(1.2);
    expect(regionGain(g, 'fen')).toBeCloseTo(1.5);
    expect(regionGain(g, 'fen', true)).toBeCloseTo(1.5 * BALANCE.encounters.lowRate);
    g.flags['fen.punt'] = true;
    expect(regionGain(g, 'fen')).toBeCloseTo(1.5 * 0.75);
  });

  it('stops for a Repel Bell, and shows on the roadside bell', () => {
    const road = freshRoad();
    expect(bellOf(road)).toBe('still');
    road.gauge = 30;
    expect(bellOf(road)).toBe('swinging');
    road.gauge = 50;
    expect(bellOf(road)).toBe('ringing');
    ringBell(road);
    expect(bellOf(road)).toBe('muffled');
    for (let i = 0; i < BALANCE.encounters.repelSteps; i++) expect(stepDanger(road, 1.5, 'road', new Rng(i))).toBe(false);
    expect(road.gauge).toBe(50);
    expect(road.repel).toBe(0);
    enterRoad(road);
    expect(road.gauge).toBe(0);
  });
});

describe('what an encounter turns out to be', () => {
  it('turns into an Inspector patrol more often with Heat', () => {
    expect(inspectorChance(0)).toBeCloseTo(0.05);
    expect(inspectorChance(5)).toBeCloseTo(0.25);
    expect(inspectorChance(30)).toBe(0.5);
    const g = game();
    let inspectors = 0;
    let seniors = 0;
    for (let i = 0; i < 400; i++) {
      g.heat = 8;
      const id = battleFor(g, 'fen', new Rng(i));
      if (id.includes('inspector-fen')) inspectors++;
      if (id.includes('senior-fen')) seniors++;
    }
    expect(inspectors).toBeGreaterThan(80);
    expect(seniors).toBe(inspectors);
    g.heat = 0;
    for (let i = 0; i < 200; i++) expect(battleFor(g, 'fen', new Rng(i))).not.toContain('senior');
  });

  it('guarantees a held recipient by the third encounter on their road', () => {
    const g = game();
    g.road.count = 3;
    expect(rollEncounter(g, 'fen', new Rng(1))).toEqual({ kind: 'battle', encounter: 'hob' });
    g.letters.L06 = { state: 'delivered', holder: null };
    expect(rollEncounter(g, 'fen', new Rng(1))).not.toEqual({ kind: 'battle', encounter: 'hob' });
  });

  it('does not repeat road events until the pool has run out', () => {
    const g = game();
    const seen: string[] = [];
    const rng = new Rng('events');
    const pool = REGIONS.thistle?.events ?? [];
    while (seen.length < pool.length * 2) {
      const r = rollEncounter(g, 'thistle', rng);
      if (r.kind === 'event') seen.push(r.event);
    }
    const first = seen.slice(0, pool.length);
    expect(new Set(first).size).toBe(first.length);
  });

  it('takes bandits and raiders off the road once their letters are delivered', () => {
    const g = game();
    expect(groupsFor(g, 'fen').some((x) => x.enemies.includes('reed'))).toBe(true);
    g.flags['hob.gone'] = true;
    expect(groupsFor(g, 'fen').some((x) => x.enemies.includes('reed'))).toBe(false);
  });

  it('names random fights so they survive saving', () => {
    expect(getEncounter('rand:fen:leech+wisp')?.enemies).toEqual(['leech', 'wisp']);
    expect(getEncounter('rand:fen:bogus')).toBeUndefined();
    expect(getEncounter('nonsense')).toBeUndefined();
    expect(getEncounter('office:2:1')?.enemies).toEqual(['inspector-kingsend', 'senior-kingsend', 'inspector-kingsend']);
    expect(officeEncounter(0, false).enemies).toHaveLength(1);
  });

  it('scales Inspectors from the region’s toughest regular enemy', () => {
    const base = ENEMIES.reed;
    const insp = ENEMIES['inspector-fen'];
    expect(insp?.hp).toBe(Math.round((base?.hp ?? 0) * 1.2));
    expect(insp?.xp).toBe(Math.round((base?.xp ?? 0) * 1.5));
    expect(ENEMIES['senior-fen']?.coin).toBe(Math.round((base?.coin ?? 0) * 2));
  });
});

describe('content for encounters', () => {
  const sets = new Set(ALL_CHARACTERS.flatMap((c) => c.sets().map((s) => s.id)));

  it('has a dialogue for every road event', () => {
    for (const r of Object.values(REGIONS)) for (const e of r.events) expect(DIALOGUE[`event-${e}`], e).toBeDefined();
  });

  it('has at least twelve road events', () => {
    expect(new Set(Object.values(REGIONS).flatMap((r) => r.events)).size).toBeGreaterThanOrEqual(12);
  });

  it('gives every enemy a battle sprite, and every fight real enemies', () => {
    for (const e of Object.values(ENEMIES)) expect(sets.has(`${e.sprite}-battle`), e.id).toBe(true);
    for (const r of Object.values(REGIONS)) for (const grp of r.groups) for (const e of grp.enemies) expect(ENEMIES[e], `${r.id}:${e}`).toBeDefined();
    for (const enc of Object.values(ENCOUNTERS)) for (const e of enc.enemies) expect(ENEMIES[e], `${enc.id}:${e}`).toBeDefined();
    for (const r of Object.values(REGIONS)) if (r.recipient) expect(ENCOUNTERS[r.recipient.encounter]).toBeDefined();
  });
});

describe('new battle mechanics', () => {
  it('makes running from Inspectors harder', () => {
    const g = game();
    const plain = new Battle(g, 'rand:fen:reed', 1);
    const insp = new Battle(g, 'rand:fen:inspector-fen', 1);
    expect(insp.runChance()).toBeCloseTo(Math.max(0, plain.runChance() - BALANCE.run.inspectorPenalty), 1);
  });

  it('offers Deliver to a recipient in the fight, which ends it peacefully', () => {
    const g = game();
    const b = new Battle(g, 'hob', 7);
    const opts = b.deliverOptions();
    expect(opts).toHaveLength(1);
    expect(opts[0]?.letter).toBe('L06');
    while (b.current().side !== 'party') {
      b.startTurn();
      b.act(b.enemyAction(b.current()));
    }
    b.startTurn();
    const events = b.act({ kind: 'deliver', letter: 'L06', target: opts[0]?.target ?? '' });
    expect(b.result).toBe('delivered');
    expect(events.some((e) => e.type === 'end' && e.result === 'delivered')).toBe(true);
    g.letters.L06 = { state: 'delivered', holder: null };
    expect(new Battle(g, 'hob', 7).deliverOptions()).toHaveLength(0);
  });

  it('only lets Vane take her letter below half health, and only if it was never opened', () => {
    const g = game();
    const b = new Battle(g, 'vane', 1);
    expect(b.deliverOptions()).toHaveLength(0);
    const vane = b.alive('enemy')[0];
    if (vane) vane.hp = Math.floor(vane.maxHp * 0.4);
    expect(b.deliverOptions().map((o) => o.letter)).toEqual(['L18']);
    g.letters.L18 = { state: 'resealed', holder: null, broken: true };
    const c = new Battle(g, 'vane', 1);
    const v2 = c.alive('enemy')[0];
    if (v2) v2.hp = 10;
    expect(c.deliverOptions()).toHaveLength(0);
  });

  it('brings Fenn in partway through the toll gate dispute', () => {
    const g = game();
    const b = new Battle(g, 'toll-dispute', 3);
    expect(b.combatants.some((c) => c.key === 'fenn')).toBe(false);
    let joined = false;
    for (let n = 0; n < 40 && !b.result && !joined; n++) {
      b.startTurn();
      if (b.result) break;
      const c = b.current();
      const ev = b.act(c.side === 'enemy' ? b.enemyAction(c) : guard());
      joined = ev.some((e) => e.type === 'join' && e.target === 'fenn');
    }
    expect(joined).toBe(true);
    expect(b.turn).toBeGreaterThanOrEqual(4);
  });

  it('lets the Runaway Parcel get away', () => {
    const g = game();
    const b = new Battle(g, 'rand:thistle:parcel', 5);
    play(b, guard);
    expect(b.result).toBe('fled');
    const r = b.applyResults(g);
    expect(r.xpEach).toBe(0);
  });

  it('silences Old Brass’s guns when the armistice is read', () => {
    const g = game();
    g.letters.L13 = { state: 'sealed', holder: 'rookie' };
    const b = new Battle(g, 'brass', 2);
    while (b.current().key !== 'rookie') {
      b.startTurn();
      const c = b.current();
      if (c.key === 'rookie') break;
      b.act(c.side === 'enemy' ? b.enemyAction(c) : guard());
    }
    b.startTurn();
    const brass = b.alive('enemy')[0];
    const ev = b.act({ kind: 'letter', letter: 'L13', mode: 'carry', target: brass?.key ?? '' });
    expect(ev.some((e) => e.type === 'message' && e.text.includes('armistice'))).toBe(true);
    if (brass) {
      for (let i = 0; i < 40; i++) {
        const a = b.enemyAction(brass);
        expect(a.kind === 'enemy' && a.move).not.toBe('bombardment');
      }
    }
  });

  it('lets thugs whistle for help while there is room', () => {
    const g = game();
    const b = new Battle(g, 'rand:copperhill:thug', 11);
    let joined = 0;
    for (let n = 0; n < 200 && !b.result; n++) {
      b.startTurn();
      if (b.result) break;
      const c = b.current();
      const ev = b.act(c.side === 'enemy' ? b.enemyAction(c) : guard());
      joined += ev.filter((e) => e.type === 'join').length;
    }
    expect(joined).toBeGreaterThan(0);
    expect(b.combatants.filter((c) => c.side === 'enemy').length).toBeLessThanOrEqual(4 + 1);
  });

  it('beats ordinary road fights with basic attacks', () => {
    const g = game();
    for (const id of ['rand:thistle:hog+goose', 'rand:thistle:brigand']) {
      const b = new Battle(g, id, 4);
      play(b, attackFirst);
      expect(b.result, id).toBe('victory');
    }
  });
});

describe('save version 4', () => {
  it('adds the road state to older saves', () => {
    const s = normalizeState(migrate({ version: 3, mapId: 'thistle-road', flags: {} }));
    expect(s?.version).toBe(STATE_VERSION);
    expect(s?.road).toEqual(freshRoad());
  });

  it('cleans bad road data', () => {
    const s = normalizeState({ version: STATE_VERSION, mapId: 'thistle-road', road: { gauge: -4, cooldown: 'x', repel: 3.6, count: 2, seen: ['oak', 4, 'oak'] } });
    expect(s?.road).toEqual({ gauge: 0, cooldown: 0, repel: 4, count: 2, seen: ['oak'] });
  });
});
