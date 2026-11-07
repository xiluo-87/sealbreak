import { describe, expect, it } from 'vitest';
import { ACCESSORIES } from '../src/data/accessories';
import { ITEMS } from '../src/data/items';
import { GRANS_LETTER, LETTERS, wordCount } from '../src/data/letters';
import { check } from '../src/game/conditions';
import { migrate, normalizeState } from '../src/game/save';
import { newGame } from '../src/game/state';
import { assign, breakSeal, canRead, carriedBy, deliver, deliveryNotice, equip, openedCount, reseal } from '../src/letters/letters';

const KEEP = 'Keep warm.';

describe('the sack', () => {
  it('holds 24 letters: 16 real and 8 forged', () => {
    expect(LETTERS).toHaveLength(24);
    expect(new Set(LETTERS.map((l) => l.id)).size).toBe(24);
    expect(LETTERS.filter((l) => l.hand === 'forged')).toHaveLength(8);
  });

  it('ends every forged letter and Gran’s Letter with exactly "Keep warm."', () => {
    for (const l of [...LETTERS.filter((x) => x.hand === 'forged'), GRANS_LETTER]) {
      expect(l.body.at(-1), l.id).toBe(KEEP);
      // Exactly once, and only at the end.
      expect(l.body.join(' ').split(KEEP).length - 1, l.id).toBe(1);
    }
  });

  it('never lets a real letter use the phrase', () => {
    for (const l of LETTERS.filter((x) => x.hand === 'real')) {
      const all = [l.title, ...l.body, l.signature].join(' ').toLowerCase();
      expect(all.includes('keep warm'), l.id).toBe(false);
    }
  });

  it('keeps letters short: 40 to 120 words', () => {
    for (const l of [...LETTERS, GRANS_LETTER]) {
      const n = wordCount(l);
      expect(n, `${l.id} has ${n} words`).toBeGreaterThanOrEqual(40);
      expect(n, `${l.id} has ${n} words`).toBeLessThanOrEqual(120);
    }
  });

  it('only rewards things that exist', () => {
    for (const l of LETTERS) {
      if (l.reward.accessory) expect(ACCESSORIES[l.reward.accessory], l.id).toBeDefined();
      for (const i of Object.keys(l.reward.items ?? {})) expect(ITEMS[i], l.id).toBeDefined();
    }
  });
});

describe('carrying', () => {
  it('lets each member hold three letters', () => {
    const g = newGame('Ada', 's');
    g.party = ['rookie', 'odile'];
    expect(assign(g, 'L01', 'rookie')).toBe('ok');
    expect(assign(g, 'L02', 'rookie')).toBe('ok');
    expect(assign(g, 'L03', 'rookie')).toBe('ok');
    expect(assign(g, 'L04', 'rookie')).toBe('full');
    expect(assign(g, 'L04', 'odile')).toBe('ok');
    expect(assign(g, 'L05', 'juniper')).toBe('not-in-party');
    expect(carriedBy(g, 'rookie')).toEqual(['L01', 'L02', 'L03']);
    expect(assign(g, 'L01', null)).toBe('ok');
    expect(carriedBy(g, 'rookie')).toEqual(['L02', 'L03']);
  });
});

describe('breaking the seal', () => {
  it('opens the letter once and raises Heat by one', () => {
    const g = newGame('Ada', 's');
    expect(canRead(g, 'L02')).toBe(false);
    expect(breakSeal(g, 'L02')).toBe(true);
    expect(g.letters.L02?.state).toBe('opened');
    expect(g.heat).toBe(1);
    expect(canRead(g, 'L02')).toBe(true);
    expect(breakSeal(g, 'L02')).toBe(false);
    expect(g.heat).toBe(1);
    expect(openedCount(g)).toBe(1);
  });
});

describe('resealing', () => {
  it('needs Juniper and a wax stick, and does not lower Heat', () => {
    const g = newGame('Ada', 's');
    breakSeal(g, 'L01');
    expect(reseal(g, 'L01')).toBe(false);
    g.party.push('juniper');
    expect(reseal(g, 'L01')).toBe(true);
    expect(g.letters.L01?.state).toBe('resealed');
    expect(g.wax).toBe(2);
    expect(g.heat).toBe(1);
    expect(openedCount(g)).toBe(1);
    expect(reseal(g, 'L01')).toBe(false);
    g.wax = 0;
    breakSeal(g, 'L02');
    expect(reseal(g, 'L02')).toBe(false);
  });
});

describe('delivering', () => {
  it('gives the full reward and 30 XP each for a sealed letter', () => {
    const g = newGame('Ada', 's');
    g.party = ['rookie', 'odile'];
    const loaves = g.items.loaf ?? 0;
    assign(g, 'L02', 'rookie');
    const r = deliver(g, 'L02');
    expect(r?.halved).toBe(false);
    expect(g.items.loaf).toBe(loaves + 3);
    expect(g.members.rookie.xp).toBe(30);
    expect(g.members.odile.xp).toBe(30);
    expect(g.flags['ned.laughed']).toBe(true);
    expect(g.letters.L02).toMatchObject({ state: 'delivered', holder: null });
    expect(deliver(g, 'L02')).toBeNull();
    expect(assign(g, 'L02', 'rookie')).toBe('delivered');
  });

  it('halves the reward for an opened letter but not a resealed one', () => {
    const a = newGame('Ada', 's');
    breakSeal(a, 'L13');
    const coin = a.coin;
    expect(deliver(a, 'L13')?.halved).toBe(true);
    expect(a.coin).toBe(coin + 100);
    const b = newGame('Ada', 's');
    b.party.push('juniper');
    breakSeal(b, 'L13');
    reseal(b, 'L13');
    const coinB = b.coin;
    expect(deliver(b, 'L13')?.halved).toBe(false);
    expect(b.coin).toBe(coinB + 200);
  });

  it('only calls a reward halved when there was coin or an item to halve', () => {
    const g = newGame('Ada', 's');
    breakSeal(g, 'L03');
    expect(deliver(g, 'L03')?.halved).toBe(false);
  });

  it('says what was actually received, and never promises the full amount for an opened letter', () => {
    const a = newGame('Ada', 's');
    a.party = ['rookie', 'odile'];
    a.members.rookie.xp = 10;
    const full = deliver(a, 'L02');
    expect(full && deliveryNotice('L02', full, 'Ada')).toEqual([
      'Delivered “Final Demand”.',
      'Ned laughs until he cries, and presses three loaves on you.',
      'Received 3 × Loaf.',
      'Everyone gains 30 XP.',
      'Ada reached level 2!',
    ]);
    const b = newGame('Ada', 's');
    breakSeal(b, 'L02');
    const half = deliver(b, 'L02');
    const lines = half ? deliveryNotice('L02', half, 'Ada') : [];
    expect(lines).toContain('Received 1 × Loaf.');
    expect(lines).toContain('With the seal broken, you got only half what you might have.');
    expect(lines.join(' ')).not.toContain('three loaves');
  });

  it('gives an opened note to every letter whose note names an amount it would halve', () => {
    for (const l of LETTERS) {
      const halvable = (l.reward.coin ?? 0) > 0 || Object.keys(l.reward.items ?? {}).length > 0;
      if (/\d|three|two|four|five/i.test(l.reward.note) && halvable) expect(l.reward.openedNote, l.id).toBeTruthy();
    }
  });

  it('hands over accessories, which can be equipped by one member at a time', () => {
    const g = newGame('Ada', 's');
    g.party = ['rookie', 'odile'];
    deliver(g, 'L01');
    expect(g.accessories.owned).toEqual(['quilt']);
    equip(g, 'rookie', 'quilt');
    expect(g.accessories.equipped).toEqual({ rookie: 'quilt' });
    equip(g, 'odile', 'quilt');
    expect(g.accessories.equipped).toEqual({ odile: 'quilt' });
    equip(g, 'odile', null);
    expect(g.accessories.equipped).toEqual({});
  });

  it('can be read in conditions', () => {
    const g = newGame('Ada', 's');
    expect(check({ letter: 'L03', is: 'sealed' }, g)).toBe(true);
    expect(check({ letter: 'L03', is: 'undelivered' }, g)).toBe(true);
    breakSeal(g, 'L03');
    expect(check({ letter: 'L03', is: 'opened' }, g)).toBe(true);
    deliver(g, 'L03');
    expect(check({ letter: 'L03', is: 'delivered' }, g)).toBe(true);
    expect(check({ letter: 'L03', is: 'undelivered' }, g)).toBe(false);
  });
});

describe('save version 3', () => {
  it('adds the sack, Heat and wax to version 2 saves', () => {
    const s = normalizeState(migrate({ version: 2, mapId: 'thistle-cross', members: {}, coin: 5, items: {} }));
    expect(Object.keys(s?.letters ?? {})).toHaveLength(24);
    expect(s?.heat).toBe(0);
    expect(s?.wax).toBe(3);
    expect(s?.accessories).toEqual({ owned: [], equipped: {} });
  });

  it('cleans up impossible letter data', () => {
    const s = normalizeState({
      version: 3,
      mapId: 'x',
      letters: { L01: { state: 'delivered', holder: 'rookie' }, L02: { state: 'eaten', holder: 'odile' }, L03: { state: 'opened', holder: 'nobody' } },
      accessories: { owned: ['quilt', 'crown'], equipped: { rookie: 'quilt', odile: 'quilt' } },
    });
    expect(s?.letters.L01).toEqual({ state: 'delivered', holder: null });
    expect(s?.letters.L02).toEqual({ state: 'sealed', holder: 'odile' });
    expect(s?.letters.L03).toEqual({ state: 'opened', holder: null, broken: true });
    expect(s?.accessories).toEqual({ owned: ['quilt'], equipped: { rookie: 'quilt' } });
  });
});
