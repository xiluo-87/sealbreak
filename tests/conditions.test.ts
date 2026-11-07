import { describe, expect, it } from 'vitest';
import { apply, applyAll, check, flagsRead, flagsWritten } from '../src/game/conditions';
import { newGame } from '../src/game/state';

describe('conditions and effects', () => {
  it('checks flags, negation and combinations', () => {
    const s = newGame('Ada', 'seed');
    expect(check({ flag: 'a' }, s)).toBe(false);
    expect(check({ notFlag: 'a' }, s)).toBe(true);
    apply({ set: 'a' }, s);
    apply({ set: 'mood', to: 'eager' }, s);
    expect(check({ flag: 'a' }, s)).toBe(true);
    expect(check({ flag: 'mood', is: 'eager' }, s)).toBe(true);
    expect(check({ flag: 'mood', is: 'worried' }, s)).toBe(false);
    expect(check({ all: [{ flag: 'a' }, { not: { flag: 'b' } }] }, s)).toBe(true);
    expect(check({ any: [{ flag: 'b' }, { flag: 'c' }] }, s)).toBe(false);
    expect(check(undefined, s)).toBe(true);
  });

  it('counts, clears and treats zero as unset', () => {
    const s = newGame('Ada', 'seed');
    applyAll([{ add: 'n', by: 2 }, { add: 'n', by: 3 }], s);
    expect(s.flags.n).toBe(5);
    apply({ add: 'n', by: -5 }, s);
    expect(check({ flag: 'n' }, s)).toBe(false);
    apply({ set: 'x' }, s);
    apply({ clear: 'x' }, s);
    expect(s.flags.x).toBeUndefined();
  });

  it('joins and leaves the party in a fixed order', () => {
    const s = newGame('Ada', 'seed');
    apply({ join: 'juniper' }, s);
    apply({ join: 'odile' }, s);
    apply({ join: 'odile' }, s);
    expect(s.party).toEqual(['rookie', 'odile', 'juniper']);
    expect(check({ inParty: 'odile' }, s)).toBe(true);
    apply({ leave: 'odile' }, s);
    expect(s.party).toEqual(['rookie', 'juniper']);
  });

  it('lists the flags read and written', () => {
    expect(flagsRead({ all: [{ flag: 'a' }, { not: { notFlag: 'b' } }, { any: [{ flag: 'c', is: 2 }] }] })).toEqual(['a', 'b', 'c']);
    expect(flagsWritten({ set: 'a' })).toEqual(['a']);
    expect(flagsWritten({ add: 'n', by: 1 })).toEqual(['n']);
    expect(flagsWritten({ join: 'odile' })).toEqual([]);
  });
});
