/** Debug options read from the URL query string. Pure so it can be tested. */
export interface DebugOptions {
  /** Show the debug overlay at start. */
  overlay: boolean;
  /** Seed for the gameplay RNG. */
  seed: string;
  /** Game speed multiplier. */
  speed: number;
  /** Open the sprite gallery instead of the game. */
  sprites: boolean;
  /** Start straight in this encounter. */
  battle?: string;
  /** Party level for `battle`. */
  level?: number;
}

export const DEFAULT_SEED = 'sealbreak';
export const MIN_SPEED = 0.25;
export const MAX_SPEED = 8;

export function parseDebugOptions(search: string): DebugOptions {
  const params = new URLSearchParams(search);
  const speedRaw = Number(params.get('speed'));
  const speed = Number.isFinite(speedRaw) && speedRaw > 0 ? clamp(speedRaw, MIN_SPEED, MAX_SPEED) : 1;
  const seed = params.get('seed');
  const battle = params.get('battle');
  const levelRaw = Number(params.get('level'));
  return {
    overlay: params.has('debug'),
    seed: seed !== null && seed.length > 0 ? seed.slice(0, 64) : DEFAULT_SEED,
    speed,
    sprites: params.has('sprites'),
    ...(battle ? { battle: battle.slice(0, 40) } : {}),
    ...(Number.isFinite(levelRaw) && levelRaw >= 1 ? { level: Math.min(15, Math.floor(levelRaw)) } : {}),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
