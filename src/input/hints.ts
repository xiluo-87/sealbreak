/** Control hints that read correctly on a keyboard or a touch screen. */

export function touchMode(): boolean {
  return typeof document !== 'undefined' && document.body.classList.contains('touch');
}

export type HintKind = 'confirm' | 'cancel' | 'satchel' | 'auto-off';

const KEYS: Record<HintKind, string> = {
  confirm: 'Press Enter',
  cancel: 'Esc to go back',
  satchel: 'Press Esc and open the satchel',
  'auto-off': 'Esc or X to take over',
};

const TOUCH: Record<HintKind, string> = {
  confirm: 'Tap',
  cancel: 'Menu button to go back',
  satchel: 'Tap the menu button and open the satchel',
  'auto-off': 'Tap the menu button to take over',
};

export function hint(kind: HintKind): string {
  return (touchMode() ? TOUCH : KEYS)[kind];
}
