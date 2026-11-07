import { describe, expect, it } from 'vitest';
import { DEADLINE_DAY } from '../src/data/world';
import { currentStop, daysToKingsend, officeInspectors, pastDeadline, returnFromDetour, travel, travelOptions } from '../src/game/travel';
import { newGame } from '../src/game/state';

describe('travel and the seven-day clock', () => {
  it('starts at Thistle Cross on day 1 and reaches Kingsend on day 5 by the direct road', () => {
    const g = newGame('Ada', 's');
    expect(currentStop(g)).toBe('thistle');
    expect(daysToKingsend('thistle')).toBe(4);
    for (const stop of ['fen', 'copperhill', 'salt', 'kingsend']) {
      const next = travelOptions(g).find((o) => o.kind === 'next');
      expect(next?.to).toBe(stop);
      travel(g, next!);
    }
    expect(g.day).toBe(5);
    expect(g.flags['reached.kingsend']).toBe(true);
    expect(g.flags['spare.days']).toBe(2);
    expect(officeInspectors(g)).toBe(1);
  });

  it('offers each detour once, at a day’s cost', () => {
    const g = newGame('Ada', 's');
    g.flags.stop = 'fen';
    g.day = 2;
    const opts = travelOptions(g);
    expect(opts.map((o) => o.to)).toEqual(['copperhill', 'abbey']);
    const place = travel(g, opts[1]!);
    expect(place.map).toBe('mirrow-abbey');
    expect(g.day).toBe(3);
    const back = returnFromDetour(g);
    expect(back.map).toBe('bellwether-fen');
    expect(g.flags.away).toBeUndefined();
    expect(travelOptions(g).map((o) => o.to)).toEqual(['copperhill']);
  });

  it('has time for two detours but warns before a third', () => {
    const g = newGame('Ada', 's');
    g.flags.stop = 'salt';
    g.day = 6;
    const gulls = travelOptions(g).find((o) => o.to === 'gulls');
    expect(gulls?.late).toBe(true);
    g.day = 5;
    expect(travelOptions(g).find((o) => o.to === 'gulls')?.late).toBe(false);
  });

  it('makes Gull’s Rest free with Brin’s boat', () => {
    const g = newGame('Ada', 's');
    g.flags.stop = 'salt';
    g.day = 6;
    g.flags.boat = true;
    const gulls = travelOptions(g).find((o) => o.to === 'gulls');
    expect(gulls?.days).toBe(0);
    expect(gulls?.late).toBe(false);
  });

  it('runs out of time after the seventh day', () => {
    const g = newGame('Ada', 's');
    g.flags.stop = 'salt';
    g.day = DEADLINE_DAY;
    const next = travelOptions(g).find((o) => o.kind === 'next');
    expect(next?.late).toBe(true);
    travel(g, next!);
    expect(g.flags['reached.kingsend']).toBe(false);
    expect(pastDeadline(g)).toBe(true);
  });

  it('puts three Inspectors outside the office on day 7', () => {
    const g = newGame('Ada', 's');
    g.flags.stop = 'salt';
    g.day = 6;
    travel(g, travelOptions(g).find((o) => o.kind === 'next')!);
    expect(officeInspectors(g)).toBe(3);
  });
});

describe('places on the road', () => {
  it('puts every stop and detour on a walkable tile', async () => {
    const { MAPS } = await import('../src/data/maps');
    const { parseMap, solidAt } = await import('../src/field/maps');
    const { STOPS, DETOURS } = await import('../src/data/world');
    const places = [...Object.values(STOPS).flatMap((s) => [s.hub, ...(s.arrive ? [s.arrive] : [])]), ...Object.values(DETOURS).map((d) => d.arrive)];
    for (const p of places) {
      const m = MAPS[p.map];
      expect(m, p.map).toBeDefined();
      if (m) expect(solidAt(parseMap(m), p.x, p.y), `${p.map} ${p.x},${p.y}`).toBe(false);
    }
  });
});
