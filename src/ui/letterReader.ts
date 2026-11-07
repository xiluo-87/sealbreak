/**
 * The letter reader: a sheet of paper with the envelope's wax, stamp and
 * postmark, in a hand that suits the author.
 */
import { sound } from '../audio';
import { touchMode } from '../input/hints';
import type { LetterDef } from '../data/letters';
import type { Keyboard } from '../input/keyboard';

type Readable = Pick<LetterDef, 'title' | 'from' | 'to' | 'style' | 'postmark' | 'body' | 'signature' | 'hand'>;

function esc(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** A small looped flourish, drawn as an SVG path. */
const CURL = '<svg class="curl" viewBox="0 0 60 14" aria-hidden="true"><path d="M2 9 C 12 2, 20 2, 22 7 S 30 13, 34 7 S 44 2, 58 6" /></svg>';

export class LetterReader {
  readonly el: HTMLDivElement;
  private onClose: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'reader-backdrop';
    this.el.hidden = true;
    this.el.addEventListener('click', () => this.close());
    parent.appendChild(this.el);
  }

  get open(): boolean {
    return !this.el.hidden;
  }

  show(l: Readable, seal: 'intact' | 'broken' | 'resealed', onClose?: () => void, intro?: string): void {
    this.onClose = onClose ?? null;
    const paras = l.body.map((p) => `<p>${esc(p)}</p>`).join('');
    this.el.innerHTML = `
      <article class="reader paper hand-${l.style}" aria-label="${esc(l.title)}">
        ${intro ? `<div class="reader-intro">${esc(intro)}</div>` : ''}
        <header class="envelope">
          <div class="addr"><span>From</span> ${esc(l.from)}<br><span>To</span> ${esc(l.to)}</div>
          <div class="postmark"><span>${esc(l.postmark)}</span></div>
          <div class="stamp"><i></i></div>
          <div class="wax wax-${seal}"></div>
        </header>
        <div class="body">${paras}<p class="sig">${esc(l.signature)}</p>${l.hand === 'forged' ? CURL : ''}</div>
        <footer class="reader-hint">${touchMode() ? 'Tap to close' : 'Enter to close'}</footer>
      </article>`;
    this.el.hidden = false;
    sound('paper');
  }

  /** Up and down scroll a long letter; confirm or cancel puts it away. */
  update(input: Keyboard): void {
    if (this.el.hidden) return;
    if (input.wasPressed('confirm') || input.wasPressed('cancel')) {
      this.close();
      return;
    }
    const paper = this.el.querySelector<HTMLElement>('.reader');
    const dir = input.wasPressed('up') ? -1 : input.wasPressed('down') ? 1 : 0;
    if (paper && dir !== 0) paper.scrollTop += dir * Math.max(24, paper.clientHeight * 0.4);
  }

  close(): void {
    if (this.el.hidden) return;
    this.el.hidden = true;
    const cb = this.onClose;
    this.onClose = null;
    cb?.();
  }
}
