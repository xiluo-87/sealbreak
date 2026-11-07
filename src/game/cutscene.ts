/**
 * Cutscenes are short scripts of steps run by the field scene: dialogue,
 * actors walking and turning, pauses, fades, warps and story effects.
 * Actors are `player` or the id of an NPC on the current map.
 */
import type { Dir } from '../field/dir';
import type { Effect } from './conditions';

export type CutStep =
  | { say: string }
  | { walk: string; path: Dir[] }
  | { face: string; dir: Dir }
  | { wait: number }
  | { then: Effect[] }
  | { fade: 'out' | 'in' }
  | { warp: { map: string; x: number; y: number; facing: Dir } };

export interface Cutscene {
  id: string;
  steps: CutStep[];
}

export function cutsceneDialogues(c: Cutscene): string[] {
  return c.steps.flatMap((s) => ('say' in s ? [s.say] : []));
}

export function cutsceneEffects(c: Cutscene): Effect[] {
  return c.steps.flatMap((s) => ('then' in s ? s.then : []));
}
