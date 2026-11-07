/** A short message at the top of the screen, such as "Saved." */
export class Toast {
  private readonly el: HTMLDivElement;
  private timer = 0;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'toast';
    this.el.hidden = true;
    this.el.setAttribute('role', 'status');
    parent.appendChild(this.el);
  }

  show(text: string, ms = 1600): void {
    this.el.textContent = text;
    this.el.hidden = false;
    this.timer = ms;
  }

  update(dtMs: number): void {
    if (this.timer <= 0) return;
    this.timer -= dtMs;
    if (this.timer <= 0) this.el.hidden = true;
  }
}
