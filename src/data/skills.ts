/**
 * Innate skills (design 6.4). Letter skills arrive with Milestone 4 and use
 * the same shape. Power is the damage formula's power; heal is a flat amount
 * plus WIL x scale.
 */
export type Weight = 'light' | 'normal' | 'heavy';
export type TargetKind = 'enemy' | 'ally' | 'anyAlly' | 'self' | 'allEnemies' | 'allAllies';

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  fp: number;
  weight: Weight;
  target: TargetKind;
  /** Damage: power with ATK vs DEF, or WIL vs WIL when `magic`. */
  power?: number;
  magic?: boolean;
  heal?: { base: number; wilScale: number };
  restoreFp?: number;
  inflict?: { ailment: 'slow' | 'weak' | 'fear'; chance: number };
  /** Moves the target later on the timeline by this many ticks. */
  delay?: number;
  /** Swaps the next two turns of the timeline (Sorting). */
  sort?: boolean;
  /** Draws enemy attention onto the user for a few turns. */
  taunt?: boolean;
  /** Steals a little coin (Pickpocket). */
  steal?: boolean;
  /** Copies the target's last buff onto the user (False Signature). */
  copyBuff?: boolean;
  threat?: boolean;
  /** Letter effects (design 5.3). */
  atkBuff?: { mult: number; turns: number };
  defBuff?: { mult: number; turns: number };
  defDown?: { mult: number; turns: number };
  cleanse?: boolean;
  regen?: { amount: number; turns: number };
  dot?: { amount: number; turns: number };
  toFront?: boolean;
  allNext?: boolean;
  reviveFull?: boolean;
  coin?: number;
  partyFp?: number;
  skipTurns?: number;
  ceasefire?: boolean;
  /** Damage as a fraction of the target's max HP. */
  maxHpFraction?: number;
  /** Not usable: works just by being carried. */
  passive?: boolean;
}

export const SKILLS: Record<string, SkillDef> = {
  express: { id: 'express', name: 'Express', description: 'A quick swing. You act again sooner.', fp: 2, weight: 'light', target: 'enemy', power: 8 },
  'second-wind': { id: 'second-wind', name: 'Second Wind', description: 'Catch your breath and recover some FP.', fp: 0, weight: 'normal', target: 'self', restoreFp: 8 },
  bandage: { id: 'bandage', name: 'Bandage', description: 'Patch up one ally.', fp: 3, weight: 'normal', target: 'ally', heal: { base: 14, wilScale: 1 } },
  sorting: { id: 'sorting', name: 'Sorting', description: 'Swap the next two turns on the timeline.', fp: 4, weight: 'light', target: 'self', sort: true },
  taunt: { id: 'taunt', name: 'Taunt', description: 'Draw the enemy’s attention for a while.', fp: 3, weight: 'light', target: 'self', taunt: true },
  'shield-bash': { id: 'shield-bash', name: 'Shield Bash', description: 'A blow with the toll-gate sign. May slow the target.', fp: 4, weight: 'heavy', target: 'enemy', power: 14, inflict: { ailment: 'slow', chance: 0.5 } },
  pickpocket: { id: 'pickpocket', name: 'Pickpocket', description: 'Lift a little coin off an enemy.', fp: 2, weight: 'light', target: 'enemy', power: 5, steal: true },
  'false-signature': { id: 'false-signature', name: 'False Signature', description: 'Copy an enemy’s last buff onto yourself.', fp: 4, weight: 'normal', target: 'enemy', copyBuff: true },
};
