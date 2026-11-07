/** Battle and progression numbers from docs/DESIGN.md, in one place for tuning. */
export const BALANCE = {
  /** Timeline delay after acting: 100 / SPD x weight. */
  timelineBase: 100,
  weights: { light: 0.8, normal: 1.0, heavy: 1.4 } as const,
  /** Turns shown in the timeline strip. */
  timelineShown: 8,
  /** Weather changes every this many ticks. */
  weatherTicks: 100,
  weather: {
    clearAttack: 1.25,
    rainSupport: 1.25,
    windLightDelay: 0.75,
    windThreat: 1.5,
  },
  basicAttackPower: 10,
  /** Hits from enemies of tier 2 and up are multiplied by this (design 6.3). */
  enemyDamage: 1.25,
  damageSpread: [0.9, 1.1] as const,
  guardFactor: 0.5,
  ailments: {
    slowDelay: 1.5,
    weakAtk: 0.75,
    fearSkipChance: 0.5,
    turns: 3,
  },
  run: { base: 0.5, perSpd: 0.1, min: 0.3, max: 0.95, levelGapForCertain: 2, inspectorPenalty: 0.3 },
  /** Biscuit acts after every Nth turn on the timeline. */
  biscuitEvery: 3,
  biscuit: { headbutt: 0.5, eat: 0.25, power: 8, atk: 9 },
  autoHealBelow: 0.4,
  levelCap: 15,
  /** Delivery XP to each party member (used from Milestone 4). */
  deliveryXp: 30,
  /** Random encounters (design 7.1-7.3). */
  encounters: {
    threshold: 40,
    cooldown: 15,
    repelSteps: 40,
    terrain: { paved: 0.7, road: 1, off: 1.4 },
    battleShare: 0.7,
    parcel: 0.03,
    inspectorBase: 0.05,
    inspectorPerHeat: 0.04,
    inspectorMax: 0.5,
    /** Two Inspectors from this Heat, and a Senior Inspector from `seniorHeat`. */
    pairHeat: 3,
    seniorHeat: 6,
    recipientChance: 0.25,
    /** A held recipient's encounter is certain by this encounter on their road. */
    recipientBy: 3,
    /** Gauge gain with the "low" encounter-rate option. */
    lowRate: 0.6,
  },
} as const;

/** Total XP needed to be at a level: 8n^2 + 12n, with level 1 at zero. */
export function xpForLevel(level: number): number {
  return level <= 1 ? 0 : 8 * level * level + 12 * level;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (level < BALANCE.levelCap && xp >= xpForLevel(level + 1)) level++;
  return level;
}
