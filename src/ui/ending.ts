/** The ending: pages of narration and epilogues, a letter if there is one, then the credits. */
import type { EndingPage } from '../data/endings';
import { touchMode } from '../input/hints';
import type { Keyboard } from '../input/keyboard';
import type { LetterReader } from './letterReader';

function esc(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export class EndingScreen {
  readonly el: HTMLDivElement;
  private i = 0;
  private waitingOnLetter = false;

  constructor(
    parent: HTMLElement,
    private readonly pages: EndingPage[],
    private readonly reader: LetterReader,
    private readonly onDone: () => void,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'ending';
    this.el.addEventListener('click', () => this.next());
    parent.appendChild(this.el);
    this.render();
  }

  private render(): void {
    const p = this.pages[this.i];
    if (!p) return;
    const table = p.tracking
      ? `<table class="tracking"><thead><tr><th>Where</th><th>Status</th><th>When</th></tr></thead><tbody>${p.tracking.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      : '';
    this.el.innerHTML = `<div class="ending-page">${p.title ? `<h2>${esc(p.title)}</h2>` : ''}${p.lines.map((l) => `<p>${esc(l)}</p>`).join('')}${table}<footer>${touchMode() ? 'Tap to continue' : 'Enter to continue'}</footer></div>`;
  }

  next(): void {
    if (this.waitingOnLetter) return;
    const p = this.pages[this.i];
    if (p?.letter && !this.reader.open) {
      this.waitingOnLetter = true;
      this.reader.show(p.letter, 'intact', () => {
        this.waitingOnLetter = false;
        this.advance();
      });
      return;
    }
    this.advance();
  }

  private advance(): void {
    this.i++;
    if (this.i >= this.pages.length) {
      this.onDone();
      return;
    }
    this.render();
  }

  update(input: Keyboard): void {
    if (this.reader.open) {
      this.reader.update(input);
      return;
    }
    if (input.wasPressed('confirm')) this.next();
  }

  destroy(): void {
    this.el.remove();
  }
}
