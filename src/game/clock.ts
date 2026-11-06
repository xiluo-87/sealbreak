/**
 * Fixed-timestep clock. Pure logic so it can be tested without a browser.
 *
 * The simulation always advances in steps of `stepMs`. Real elapsed time is
 * scaled by `speed` (debug game speed) and clamped so that a long pause, such
 * as a background tab, does not cause a spiral of catch-up updates.
 */
export interface ClockOptions {
  stepMs?: number;
  maxFrameMs?: number;
  speed?: number;
}

export class FixedStepClock {
  readonly stepMs: number;
  readonly maxFrameMs: number;
  speed: number;
  private accumulator = 0;
  private last: number | null = null;
  /** Total simulation steps taken. */
  steps = 0;

  constructor(options: ClockOptions = {}) {
    this.stepMs = options.stepMs ?? 1000 / 60;
    this.maxFrameMs = options.maxFrameMs ?? 250;
    this.speed = options.speed ?? 1;
  }

  /**
   * Feed the current timestamp (ms). Returns how many fixed steps to run now.
   * The first call only records the time.
   */
  advance(now: number): number {
    if (this.last === null) {
      this.last = now;
      return 0;
    }
    const frame = Math.min(Math.max(now - this.last, 0), this.maxFrameMs);
    this.last = now;
    this.accumulator += frame * this.speed;
    const count = Math.floor(this.accumulator / this.stepMs);
    this.accumulator -= count * this.stepMs;
    this.steps += count;
    return count;
  }

  /** Fraction of a step left over, for render interpolation (0..1). */
  get alpha(): number {
    return this.accumulator / this.stepMs;
  }

  reset(): void {
    this.accumulator = 0;
    this.last = null;
  }
}
