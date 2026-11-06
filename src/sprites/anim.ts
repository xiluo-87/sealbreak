import type { AnimDef } from './types';

/** Total length of one pass through an animation, in ms. */
export function animLength(anim: Pick<AnimDef, 'durations'>): number {
  return anim.durations.reduce((a, b) => a + b, 0);
}

/**
 * Which frame of an animation is showing `elapsedMs` after it started.
 * Looping animations wrap; one-shot animations hold their last frame.
 */
export function frameAt(anim: Pick<AnimDef, 'durations' | 'loop'>, elapsedMs: number): number {
  const total = animLength(anim);
  if (total <= 0 || anim.durations.length === 0) return 0;
  let t = Math.max(0, elapsedMs);
  if (anim.loop) t %= total;
  else if (t >= total) return anim.durations.length - 1;
  for (let i = 0; i < anim.durations.length; i++) {
    t -= anim.durations[i] ?? 0;
    if (t < 0) return i;
  }
  return anim.durations.length - 1;
}
