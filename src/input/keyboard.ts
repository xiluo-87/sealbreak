/** Keyboard state. Logical actions are mapped from physical keys. */
export type Action = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'run' | 'debug';

const KEY_MAP: Record<string, Action> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Enter: 'confirm',
  Space: 'confirm',
  KeyZ: 'confirm',
  Escape: 'cancel',
  KeyX: 'cancel',
  ShiftLeft: 'run',
  ShiftRight: 'run',
  Backquote: 'debug',
  F3: 'debug',
};

export function actionForCode(code: string): Action | undefined {
  return KEY_MAP[code];
}

export class Keyboard {
  private held = new Set<Action>();
  private pressed = new Set<Action>();
  /** Most recently pressed direction, so newer keys win when several are held. */
  private directionOrder: Action[] = [];

  attach(target: Window): void {
    target.addEventListener('keydown', (e) => {
      const action = actionForCode(e.code);
      if (!action) return;
      e.preventDefault();
      if (!this.held.has(action)) this.pressed.add(action);
      this.held.add(action);
      if (isDirection(action)) {
        this.directionOrder = this.directionOrder.filter((a) => a !== action);
        this.directionOrder.push(action);
      }
    });
    target.addEventListener('keyup', (e) => {
      const action = actionForCode(e.code);
      if (!action) return;
      this.held.delete(action);
      this.directionOrder = this.directionOrder.filter((a) => a !== action);
    });
    target.addEventListener('blur', () => {
      this.held.clear();
      this.directionOrder = [];
    });
  }

  isHeld(action: Action): boolean {
    return this.held.has(action);
  }

  /** True once per key press; cleared by `endStep`. */
  wasPressed(action: Action): boolean {
    return this.pressed.has(action);
  }

  /** The newest held direction, if any. */
  direction(): 'up' | 'down' | 'left' | 'right' | null {
    const last = this.directionOrder[this.directionOrder.length - 1];
    return last && isDirection(last) ? last : null;
  }

  endStep(): void {
    this.pressed.clear();
  }
}

function isDirection(a: Action): a is 'up' | 'down' | 'left' | 'right' {
  return a === 'up' || a === 'down' || a === 'left' || a === 'right';
}
