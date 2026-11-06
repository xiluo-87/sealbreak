/** Sharp HTML text over the canvas showing timing and debug state. */
export class DebugOverlay {
  readonly el: HTMLPreElement;
  private frames = 0;
  private fpsTime = 0;
  private fps = 0;

  constructor(parent: HTMLElement, visible: boolean) {
    this.el = document.createElement('pre');
    this.el.className = 'debug-overlay';
    this.el.hidden = !visible;
    parent.appendChild(this.el);
  }

  get visible(): boolean {
    return !this.el.hidden;
  }

  toggle(): void {
    this.el.hidden = !this.el.hidden;
  }

  /** Call once per rendered frame with the timestamp in ms. */
  frame(now: number, lines: Record<string, string | number>): void {
    this.frames++;
    if (now - this.fpsTime >= 500) {
      this.fps = (this.frames * 1000) / Math.max(1, now - this.fpsTime);
      this.frames = 0;
      this.fpsTime = now;
    }
    if (this.el.hidden) return;
    const rows = [`fps    ${this.fps.toFixed(0)}`];
    for (const [k, v] of Object.entries(lines)) rows.push(`${k.padEnd(6)} ${v}`);
    this.el.textContent = rows.join('\n');
  }
}
