import type { Keyboard } from '../input/keyboard';
import type { Rng } from './rng';

/** Everything a scene can read while updating. */
export interface SceneContext {
  input: Keyboard;
  /** The single seeded RNG for gameplay randomness. */
  rng: Rng;
  /** Fixed step length in ms. */
  stepMs: number;
}

export interface Scene {
  /** Advance one fixed step. */
  update(ctx: SceneContext): void;
  /** Draw the current state at logical resolution. `alpha` is the leftover step fraction. */
  render(g: CanvasRenderingContext2D, alpha: number): void;
  /** Extra lines for the debug overlay. */
  debugInfo?(): Record<string, string | number>;
}
