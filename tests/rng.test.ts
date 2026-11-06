import { describe, expect, it } from 'vitest';
import { hashSeed, Rng } from '../src/game/rng';

describe('Rng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = new Rng('road');
    const b = new Rng('road');
    for (let i = 0; i < 100; i++) expect(a.nextUint32()).toBe(b.nextUint32());
  });

  it('gives different sequences for different seeds', () => {
    const a = new Rng('road');
    const b = new Rng('roae');
    const sa = Array.from({ length: 8 }, () => a.nextUint32());
    const sb = Array.from({ length: 8 }, () => b.nextUint32());
    expect(sa).not.toEqual(sb);
  });

  it('keeps next() in [0, 1) and int() inside its bounds', () => {
    const r = new Rng(42);
    for (let i = 0; i < 2000; i++) {
      const f = r.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = r.int(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(7);
    }
  });

  it('is roughly uniform', () => {
    const r = new Rng(7);
    const buckets = new Array<number>(10).fill(0);
    const n = 20000;
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(r.next() * 10);
      buckets[idx] = (buckets[idx] ?? 0) + 1;
    }
    for (const b of buckets) expect(Math.abs(b - n / 10)).toBeLessThan(n / 10 * 0.08);
  });

  it('can save and restore its state mid-sequence', () => {
    const r = new Rng('save');
    for (let i = 0; i < 10; i++) r.next();
    const copy = Rng.fromState(r.getState());
    for (let i = 0; i < 20; i++) expect(copy.nextUint32()).toBe(r.nextUint32());
  });

  it('hashes seeds stably', () => {
    expect(hashSeed('sealbreak')).toBe(hashSeed('sealbreak'));
    expect(hashSeed(1)).toBe(hashSeed('1'));
  });

  it('refuses to pick from an empty list', () => {
    expect(() => new Rng(1).pick([])).toThrow();
  });
});
