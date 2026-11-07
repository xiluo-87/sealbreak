import { describe, expect, it } from 'vitest';
import { latestSlot, loadSlot, migrate, normalizeState, readSaves, SAVE_KEY, type StorageLike, writeSlot } from '../src/game/save';
import { newGame, STATE_VERSION } from '../src/game/state';

function memory(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const map = new Map(Object.entries(initial));
  return {
    get data() {
      return Object.fromEntries(map);
    },
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

describe('saves', () => {
  it('round-trips a game state through a slot', () => {
    const store = memory();
    const s = newGame('Ada', 'seed');
    s.flags['intro.done'] = true;
    s.party.push('odile');
    expect(writeSlot(store, '1', s, 1000)).toBe(true);
    expect(loadSlot(store, '1')).toEqual(s);
    expect(Object.keys(store.data)).toEqual([SAVE_KEY]);
  });

  it('keeps other slots when writing one', () => {
    const store = memory();
    writeSlot(store, '1', newGame('A', 'a'), 1);
    writeSlot(store, 'auto', newGame('B', 'b'), 5);
    expect(loadSlot(store, '1')?.rookieName).toBe('A');
    expect(latestSlot(store)).toBe('auto');
  });

  it('survives missing, corrupt and unavailable storage', () => {
    expect(readSaves(null).slots).toEqual({});
    expect(readSaves(memory()).slots).toEqual({});
    expect(readSaves(memory({ [SAVE_KEY]: '{not json' })).slots).toEqual({});
    expect(readSaves(memory({ [SAVE_KEY]: '[1,2,3]' })).slots).toEqual({});
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('full');
      },
      removeItem: () => undefined,
    };
    expect(readSaves(throwing).slots).toEqual({});
    expect(writeSlot(throwing, '1', newGame('A', 'a'), 1)).toBe(false);
  });

  it('drops a corrupt slot but keeps the good ones', () => {
    const good = newGame('Good', 'g');
    const store = memory({
      [SAVE_KEY]: JSON.stringify({ version: 1, slots: { '1': { savedAt: 1, state: good }, '2': { savedAt: 2, state: 'nonsense' }, '3': { state: { mapId: 7 } } } }),
    });
    const file = readSaves(store);
    expect(file.slots['1']?.state.rookieName).toBe('Good');
    expect(file.slots['2']).toBeUndefined();
    expect(file.slots['3']).toBeUndefined();
  });

  it('fills in missing fields and cleans bad values', () => {
    const s = normalizeState({ version: 1, mapId: 'thistle-cross', flags: { ok: true, bad: { x: 1 }, n: Number.NaN }, party: ['odile', 'nobody'], facing: 'sideways', day: -3 });
    expect(s).not.toBeNull();
    expect(s?.flags).toEqual({ ok: true });
    expect(s?.party).toEqual(['rookie', 'odile']);
    expect(s?.facing).toBe('down');
    expect(s?.day).toBe(1);
    expect(s?.rookieName.length).toBeGreaterThan(0);
  });

  it('runs migrations in order and refuses saves from the future', () => {
    const migrations = {
      0: (old: Record<string, unknown>) => ({ ...old, mapId: old.map }),
    };
    const upgraded = migrate({ map: 'thistle-cross' }, migrations, 1);
    expect(upgraded).toMatchObject({ version: 1, mapId: 'thistle-cross' });
    expect(migrate({ version: 99, mapId: 'x' })).toBeNull();
    expect(migrate({ mapId: 'x' }, {}, 1)).toBeNull();
    expect(migrate({ version: STATE_VERSION, mapId: 'x' })).toMatchObject({ mapId: 'x' });
  });
});
