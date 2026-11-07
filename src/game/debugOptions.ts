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
  /** Party level for `battle` and `region`. */
  level?: number;
  /** Start just after the opening, in this region. */
  region?: string;
  /** Starting Inspectorate interest. */
  heat?: number;
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
  const region = params.get('region');
  const levelRaw = Number(params.get('level'));
  const heatRaw = Number(params.get('heat'));
  return {
    overlay: params.has('debug'),
    seed: seed !== null && seed.length > 0 ? seed.slice(0, 64) : DEFAULT_SEED,
    speed,
    sprites: params.has('sprites'),
    ...(battle ? { battle: battle.slice(0, 40) } : {}),
    ...(Number.isFinite(levelRaw) && levelRaw >= 1 ? { level: Math.min(15, Math.floor(levelRaw)) } : {}),
    ...(region ? { region: region.slice(0, 20) } : {}),
    ...(params.has('heat') && Number.isFinite(heatRaw) && heatRaw >= 0 ? { heat: Math.min(20, Math.floor(heatRaw)) } : {}),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
