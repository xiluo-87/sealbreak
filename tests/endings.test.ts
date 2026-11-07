import { describe, expect, it } from 'vitest';
import { LETTERS } from '../src/data/letters';
import { goatPostAvailable, selectEnding } from '../src/game/endings';
import { endingsFound, recordEnding } from '../src/game/save';
import { type GameState, newGame } from '../src/game/state';

function finale(delivered: number, heat = 0): GameState {
  const s = newGame('Ada', 's');
  s.flags['reached.kingsend'] = true;
  LETTERS.slice(0, delivered).forEach((l) => (s.letters[l.id] = { state: 'delivered', holder: null }));
  s.letters.L18 = { state: 'delivered', holder: null };
  s.flags['final.result'] = 'delivered';
  s.heat = heat;
  return s;
}

describe('choosing the ending', () => {
  it('needs fourteen letters delivered and Heat of six or less for the Last Post', () => {
    expect(selectEnding(finale(14))).toBe('lastpost');
    expect(selectEnding(finale(12))).toBe('furnace');
    expect(selectEnding(finale(14, 7))).toBe('furnace');
  });

  it('closes the Last Post for good once L18 has been opened', () => {
    const s = finale(16);
    s.letters.L18 = { state: 'delivered', holder: null, broken: true };
    expect(selectEnding(s)).toBe('furnace');
  });

  it('checks the Goat Post first, then the deadline', () => {
    const s = finale(16);
    s.flags['biscuit.joined'] = true;
    s.flags['biscuit.trust'] = 5;
    expect(goatPostAvailable(s)).toBe(true);
    s.flags['ending.goat'] = true;
    expect(selectEnding(s)).toBe('goat');
    const late = newGame('Ada', 's');
    expect(selectEnding(late)).toBe('deadline');
  });

  it('opens the book at eight broken seals', () => {
    const s = finale(10);
    s.flags['final.result'] = 'victory';
    LETTERS.slice(10, 18).forEach((l) => (s.letters[l.id] = { state: 'opened', holder: null, broken: true }));
    expect(selectEnding(s)).toBe('openbook');
  });
});

describe('endings found', () => {
  it('records each ending once and survives bad data', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
    expect(endingsFound(storage)).toEqual([]);
    recordEnding(storage, 'lastpost');
    recordEnding(storage, 'lastpost');
    recordEnding(storage, 'furnace');
    expect(endingsFound(storage)).toEqual(['lastpost', 'deadline']);
    store.set('sealbreak.endings.v1', '{not json');
    expect(endingsFound(storage)).toEqual([]);
  });
});
