/**
 * Cutscenes are short scripts of steps run by the field scene: dialogue,
 * actors walking and turning, pauses, fades, warps and story effects.
 * Actors are `player` or the id of an NPC on the current map.
 */
import type { Dir } from '../field/dir';
import type { Condition, Effect } from './conditions';

export type CutStep =
  | { say: string }
  | { walk: string; path: Dir[] }
  | { face: string; dir: Dir }
  | { wait: number }
  | { then: Effect[] }
  | { fade: 'out' | 'in' }
  | { warp: { map: string; x: number; y: number; facing: Dir } }
  | { battle: string }
  /** Shows a letter in the reader (by id, including key letters such as FENN), with an optional line above it. */
  | { read: string; intro?: string }
  /** The story is over: show the ending it has reached. */
  | { ending: true };

/** Any step can be made to run only when a condition holds. */
export type CutsceneStep = CutStep & { if?: Condition };

export interface Cutscene {
  id: string;
  steps: CutsceneStep[];
}

export function cutsceneDialogues(c: Cutscene): string[] {
  return c.steps.flatMap((s) => ('say' in s ? [s.say] : []));
}

export function cutsceneBattles(c: Cutscene): string[] {
  return c.steps.flatMap((s) => ('battle' in s ? [s.battle] : []));
}

export function cutsceneEffects(c: Cutscene): Effect[] {
  return c.steps.flatMap((s) => ('then' in s ? s.then : []));
}
