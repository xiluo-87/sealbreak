import type { FixedStepClock } from './clock';

export interface LoopCallbacks {
  update(): void;
  render(alpha: number, now: number): void;
}

/** Runs fixed-step updates and one render per animation frame. */
export function startLoop(clock: FixedStepClock, callbacks: LoopCallbacks): () => void {
  let running = true;
  let handle = 0;
  const tick = (now: number): void => {
    if (!running) return;
    const steps = clock.advance(now);
    for (let i = 0; i < steps; i++) callbacks.update();
    callbacks.render(clock.alpha, now);
    handle = requestAnimationFrame(tick);
  };
  handle = requestAnimationFrame(tick);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clock.reset();
  });
  return () => {
    running = false;
    cancelAnimationFrame(handle);
  };
}
