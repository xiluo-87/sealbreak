/** Puts the player's options into effect on the page and the synth. */
import { audio } from '../audio';
import { settings } from '../game/settings';

export function applySettings(): void {
  document.body.classList.toggle('large-text', settings.largeText);
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
  audio.setVolume(settings.volume, settings.muted);
}
