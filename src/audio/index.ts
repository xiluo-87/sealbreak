/**
 * The one synth the game shares. Interface code calls `sound`; the main
 * loop asks the app which tune fits and passes it to `audio.music`.
 * Simulation code never makes sounds.
 */
import { Synth, type Sfx } from './synth';

export type { Sfx } from './synth';
export { songFor } from './songs';

export const audio = new Synth();

export function sound(name: Sfx): void {
  audio.sound(name);
}

/** Start the audio context on the first key press, click or touch. */
export function unlockOnGesture(target: Window): void {
  const go = (): void => audio.unlock();
  for (const ev of ['pointerdown', 'keydown', 'touchend']) target.addEventListener(ev, go, { passive: true });
}
