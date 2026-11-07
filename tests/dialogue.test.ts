import { describe, expect, it } from 'vitest';
import { type Dialogue, DialogueRun, playThrough } from '../src/game/dialogue';
import { newGame } from '../src/game/state';

const d: Dialogue = {
  id: 'test',
  entry: [
    { if: { flag: 'met' }, node: 'again' },
    { node: 'hello' },
  ],
  nodes: {
    hello: {
      lines: [{ who: 'odile', text: 'Hello, {name}.' }, { text: 'She waits.' }],
      choices: [
        { text: 'Hi.', next: 'warm', then: [{ set: 'tone', to: 'warm' }] },
        { text: 'Secret.', if: { flag: 'knows' }, next: 'warm' },
        { text: 'Bye.' },
      ],
      then: [{ set: 'met' }],
    },
    warm: { lines: [{ who: 'odile', text: 'Lovely.' }] },
    again: { lines: [{ who: 'odile', text: 'You again.' }] },
  },
};

describe('DialogueRun', () => {
  it('walks lines, fills the name and offers choices on the last line', () => {
    const s = newGame('Ada', 'x');
    const run = new DialogueRun(d, s);
    expect(run.view()?.line.text).toBe('Hello, Ada.');
    expect(run.view()?.choices).toEqual([]);
    run.advance();
    const v = run.view();
    expect(v?.line.text).toBe('She waits.');
    // The hidden choice is filtered out, but indexes still point at the data.
    expect(v?.choices.map((c) => c.text)).toEqual(['Hi.', 'Bye.']);
    expect(v?.choices.map((c) => c.index)).toEqual([0, 2]);
    run.advance();
    expect(run.view()?.line.text).toBe('She waits.');
    run.choose(0);
    expect(s.flags.met).toBe(true);
    expect(s.flags.tone).toBe('warm');
    expect(run.view()?.line.text).toBe('Lovely.');
    run.advance();
    expect(run.done).toBe(true);
  });

  it('picks the entry node from story flags', () => {
    const s = newGame('Ada', 'x');
    s.flags.met = true;
    expect(playThrough(d, s)).toEqual(['You again.']);
  });

  it('ends when a choice has no next node', () => {
    const s = newGame('Ada', 'x');
    expect(playThrough(d, s, [1])).toEqual(['Hello, Ada.', 'She waits.']);
    expect(s.flags.met).toBe(true);
    expect(s.flags.tone).toBeUndefined();
  });

  it('ignores hidden or invalid choices', () => {
    const s = newGame('Ada', 'x');
    const run = new DialogueRun(d, s);
    run.advance();
    run.choose(1);
    run.choose(9);
    expect(run.view()?.line.text).toBe('She waits.');
  });
});
