/**
 * On-screen controls for touch screens: a floating joystick on the left,
 * an action button and a run toggle on the right, and a menu button. They
 * press the same logical actions as the keyboard.
 */
import type { Action, Keyboard } from './keyboard';

/** What the screen is doing, which decides the controls shown. */
export type TouchMode = 'field' | 'talk' | 'battle' | 'menu';

const DEAD_ZONE = 14;
const RADIUS = 42;
/** Touches on these go to the UI, not the joystick. */
const INTERACTIVE = '.menu, .dialogue, .satchel, .reader, form, button, input, a, .battle-results, .touch-btn, .rotate-hint';

/** The direction for a joystick offset, or null inside the dead zone. */
export function stickDirection(dx: number, dy: number, deadZone = DEAD_ZONE): 'up' | 'down' | 'left' | 'right' | null {
  if (Math.hypot(dx, dy) < deadZone) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

interface OrientationLock {
  lock?: (orientation: string) => Promise<void>;
}

export class TouchControls {
  readonly el: HTMLDivElement;
  private readonly base: HTMLDivElement;
  private readonly knob: HTMLDivElement;
  private readonly actionBtn: HTMLButtonElement;
  private readonly runBtn: HTMLButtonElement;
  private stickId: number | null = null;
  private origin = { x: 0, y: 0 };
  private dir: Action | null = null;
  private running = false;
  private mode: TouchMode | null = null;

  constructor(
    parent: HTMLElement,
    private readonly input: Keyboard,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'touch-controls';
    this.el.innerHTML = `
      <div class="stick-ghost"></div>
      <div class="stick-base"><div class="stick-knob"></div></div>
      <button type="button" class="touch-btn touch-menu" aria-label="Menu"><i></i><i></i><i></i></button>
      <button type="button" class="touch-btn touch-full" aria-label="Full screen">⛶</button>
      <button type="button" class="touch-btn touch-run" aria-label="Run" aria-pressed="false">Run</button>
      <button type="button" class="touch-btn touch-action" aria-label="Action">OK</button>
      <div class="rotate-hint"><div class="phone-icon"></div><p>Turn your phone sideways to play.</p><button type="button" class="rotate-full">Play full screen</button></div>`;
    parent.appendChild(this.el);
    this.base = this.el.querySelector('.stick-base') as HTMLDivElement;
    this.knob = this.el.querySelector('.stick-knob') as HTMLDivElement;
    this.actionBtn = this.el.querySelector('.touch-action') as HTMLButtonElement;
    this.runBtn = this.el.querySelector('.touch-run') as HTMLButtonElement;

    this.hold(this.actionBtn, 'confirm');
    this.hold(this.el.querySelector('.touch-menu') as HTMLButtonElement, 'cancel');
    this.runBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.setRunning(!this.running);
    });
    const canFull = typeof document.documentElement.requestFullscreen === 'function' && document.fullscreenEnabled;
    for (const b of Array.from(this.el.querySelectorAll<HTMLButtonElement>('.touch-full, .rotate-full'))) {
      if (!canFull) b.remove();
      else b.addEventListener('click', () => void this.fullScreen());
    }
    this.el.addEventListener('contextmenu', (e) => e.preventDefault());

    if (window.matchMedia?.('(pointer: coarse)').matches) this.enable();
    window.addEventListener('pointerdown', (e) => this.onDown(e), { passive: false });
    window.addEventListener('pointermove', (e) => this.onMove(e), { passive: false });
    window.addEventListener('pointerup', (e) => this.onUp(e));
    window.addEventListener('pointercancel', (e) => this.onUp(e));
    document.addEventListener('fullscreenchange', () => document.body.classList.toggle('fullscreen', !!document.fullscreenElement));
  }

  /** Shows the controls; called on a coarse pointer or the first touch. */
  enable(): void {
    document.body.classList.add('touch');
  }

  get enabled(): boolean {
    return document.body.classList.contains('touch');
  }

  /** Called every frame with what the screen is doing. */
  setMode(mode: TouchMode): void {
    if (this.running && !this.input.isHeld('run')) this.input.down('run');
    if (mode === this.mode) return;
    this.mode = mode;
    this.el.dataset.mode = mode;
    this.actionBtn.textContent = mode === 'field' ? 'Talk' : 'OK';
    if (mode !== 'field' && mode !== 'talk') this.releaseStick();
  }

  private hold(btn: HTMLButtonElement, action: Action): void {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.setPointerCapture?.(e.pointerId);
      btn.classList.add('down');
      this.input.down(action);
    });
    const release = (): void => {
      btn.classList.remove('down');
      this.input.up(action);
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('lostpointercapture', release);
  }

  private setRunning(on: boolean): void {
    this.running = on;
    this.runBtn.classList.toggle('on', on);
    this.runBtn.setAttribute('aria-pressed', String(on));
    if (on) this.input.down('run');
    else this.input.up('run');
  }

  private onDown(e: PointerEvent): void {
    if (e.pointerType === 'mouse') return;
    if (!this.enabled) this.enable();
    if (this.stickId !== null) return;
    if (this.mode !== 'field' && this.mode !== 'talk') return;
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest(INTERACTIVE)) return;
    if (e.clientX > window.innerWidth * 0.55) return;
    e.preventDefault();
    this.stickId = e.pointerId;
    this.origin = { x: e.clientX, y: e.clientY };
    this.base.style.left = `${e.clientX}px`;
    this.base.style.top = `${e.clientY}px`;
    this.knob.style.transform = 'translate(-50%, -50%)';
    this.el.classList.add('stick-active');
  }

  private onMove(e: PointerEvent): void {
    if (e.pointerId !== this.stickId) return;
    e.preventDefault();
    let dx = e.clientX - this.origin.x;
    let dy = e.clientY - this.origin.y;
    const d = Math.hypot(dx, dy);
    // Past the rim, the base follows the thumb, so turning back is quick.
    if (d > RADIUS) {
      const k = (d - RADIUS) / d;
      this.origin.x += dx * k;
      this.origin.y += dy * k;
      this.base.style.left = `${this.origin.x}px`;
      this.base.style.top = `${this.origin.y}px`;
      dx -= dx * k;
      dy -= dy * k;
    }
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    this.setDir(stickDirection(dx, dy));
  }

  private onUp(e: PointerEvent): void {
    if (e.pointerId === this.stickId) this.releaseStick();
  }

  private releaseStick(): void {
    this.stickId = null;
    this.el.classList.remove('stick-active');
    this.setDir(null);
  }

  private setDir(dir: Action | null): void {
    if (dir === this.dir) return;
    if (this.dir) this.input.up(this.dir);
    this.dir = dir;
    if (dir) this.input.down(dir);
  }

  private async fullScreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
        await (screen.orientation as unknown as OrientationLock).lock?.('landscape');
      }
    } catch {
      // Not every browser allows full screen or an orientation lock; the game works without them.
    }
  }
}
