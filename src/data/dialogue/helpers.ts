import type { Effect } from '../../game/conditions';
import type { Choice, Dialogue, Line } from '../../game/dialogue';
import type { Expression } from '../../sprites/characters/portraitKit';

/** A spoken line. */
export function say(who: string, text: string, expr?: Expression): Line {
  return expr ? { who, text, expr } : { who, text };
}

/** Narration, with no speaker. */
export function narrate(text: string): Line {
  return { text };
}

/** A dialogue with one node. */
export function simple(id: string, lines: Line[], then?: Effect[]): Dialogue {
  return { id, entry: [{ node: 'main' }], nodes: { main: then ? { lines, then } : { lines } } };
}

/** Different lines before and after a story flag is set. */
export function beforeAfter(id: string, flag: string, before: Line[], after: Line[]): Dialogue {
  return {
    id,
    entry: [
      { if: { flag }, node: 'after' },
      { node: 'before' },
    ],
    nodes: { before: { lines: before }, after: { lines: after } },
  };
}

/**
 * The choices offered to a recipient: deliver (with a different reaction
 * for a sealed, opened or resealed letter) or keep it for now.
 */
export function deliveryChoices(letter: string, title: string, nodes: { sealed: string; opened: string; resealed?: string }): Choice[] {
  const text = `Deliver “${title}”`;
  return [
    { text, if: { letter, is: 'sealed' }, next: nodes.sealed, then: [{ deliver: letter }] },
    { text, if: { letter, is: 'resealed' }, next: nodes.resealed ?? nodes.sealed, then: [{ deliver: letter }] },
    { text, if: { letter, is: 'opened' }, next: nodes.opened, then: [{ deliver: letter }] },
    { text: 'Not yet' },
  ];
}
