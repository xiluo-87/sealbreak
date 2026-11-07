/**
 * On-screen controls for touch screens. Walking about: a floating joystick
 * on the left, an action button and a run toggle on the right, and a menu
 * button. In menus, dialogue and battle: up and down on the left, OK and
 * Back on the right, so every menu works the same way. They press the same
 * logical actions as the keyboard.
 */
import { currentAdvice, HOME_SCREEN_TIP, isFullscreen, onFullscreenChange, toggleFullscreen } from '../ui/fullscreen';
import type { Action, Keyboard } from './keyboard';

/** What the screen is doing, which decides the controls shown. `choice` is dialogue waiting on a choice. */
export type TouchMode = 'field' | 'talk' | 'choice' | 'battle' | 'menu';

const DEAD_ZONE = 14;
const RADIUS = 42;
/** Holding up or down repeats after this long, then at this interval. */
const REPEAT_DELAY_MS = 400;
const REPEAT_EVERY_MS = 120;
/** Touches on these go to the UI, not the joystick. */
const INTERACTIVE = '.menu, .dialogue, .satchel, .reader, form, button, input, a, .battle-results, .touch-btn, .rotate-hint';

/** The direction for a joystick offset, or null inside the dead zone. */
export function stickDirection(dx: number, dy: number, deadZone = DEAD_ZONE): 'up' | 'down' | 'left' | 'right' | null {
  if (Math.hypot(dx, dy) < deadZone) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
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
      <button type="button" class="touch-btn touch-back" aria-label="Back">Back</button>
      <button type="button" class="touch-btn touch-nav touch-up" aria-label="Up"><i></i></button>
      <button type="button" class="touch-btn touch-nav touch-down" aria-label="Down"><i></i></button>
      <div class="rotate-hint"><div class="phone-icon"></div><p>Turn your phone sideways to play.</p><button type="button" class="rotate-full">Play full screen</button></div>`;
    parent.appendChild(this.el);
    this.base = this.el.querySelector('.stick-base') as HTMLDivElement;
    this.knob = this.el.querySelector('.stick-knob') as HTMLDivElement;
    this.actionBtn = this.el.querySelector('.touch-action') as HTMLButtonElement;
    this.runBtn = this.el.querySelector('.touch-run') as HTMLButtonElement;

    this.hold(this.actionBtn, 'confirm');
    this.hold(this.el.querySelector('.touch-menu') as HTMLButtonElement, 'cancel');
    this.hold(this.el.querySelector('.touch-back') as HTMLButtonElement, 'cancel');
    this.hold(this.el.querySelector('.touch-up') as HTMLButtonElement, 'up', true);
    this.hold(this.el.querySelector('.touch-down') as HTMLButtonElement, 'down', true);
    this.runBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.setRunning(!this.running);
    });
    const advice = currentAdvice();
    for (const b of Array.from(this.el.querySelectorAll<HTMLButtonElement>('.touch-full, .rotate-full'))) {
      if (advice !== 'button') b.remove();
      else b.addEventListener('click', () => void toggleFullscreen());
    }
    // Safari on iPhone can't go full screen from a page; the Home Screen can.
    if (advice === 'home-screen') {
      const tip = document.createElement('p');
      tip.className = 'rotate-tip';
      tip.textContent = HOME_SCREEN_TIP;
      this.el.querySelector('.rotate-hint')?.appendChild(tip);
    }
    this.el.addEventListener('contextmenu', (e) => e.preventDefault());

    if (window.matchMedia?.('(pointer: coarse)').matches) this.enable();
    window.addEventListener('pointerdown', (e) => this.onDown(e), { passive: false });
    window.addEventListener('pointermove', (e) => this.onMove(e), { passive: false });
    window.addEventListener('pointerup', (e) => this.onUp(e));
    window.addEventListener('pointercancel', (e) => this.onUp(e));
    onFullscreenChange(() => document.body.classList.toggle('fullscreen', isFullscreen()));
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
    if (mode !== 'field' && mode !== 'talk' && mode !== 'choice') this.releaseStick();
  }

  /** Presses `action` while the button is held. With `repeat`, a long hold presses it again and again, to run down a list. */
  private hold(btn: HTMLButtonElement, action: Action, repeat = false): void {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const stopRepeat = (): void => {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    };
    const again = (): void => {
      this.input.up(action);
      this.input.down(action);
      timer = setTimeout(again, REPEAT_EVERY_MS);
    };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.setPointerCapture?.(e.pointerId);
      btn.classList.add('down');
      this.input.down(action);
      stopRepeat();
      if (repeat) timer = setTimeout(again, REPEAT_DELAY_MS);
    });
    const release = (): void => {
      stopRepeat();
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
    if (this.mode !== 'field' && this.mode !== 'talk' && this.mode !== 'choice') return;
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
}
