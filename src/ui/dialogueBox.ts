/**
 * The dialogue box: HTML over the canvas so text stays sharp. Shows a name
 * plate, a portrait (talking while text types out) and choices.
 */
import { sound } from '../audio';
import type { DialogueView } from '../game/dialogue';
import { ALL_CHARACTERS } from '../sprites/characters';
import type { Expression } from '../sprites/characters/portraitKit';
import { drawFrame, getSheet, type SpriteSheet } from '../sprites/sheet';

export interface SpeakerInfo {
  name: string;
  portrait?: string;
}

const CHARS_PER_SECOND = 42;

function portraitSheet(id: string): SpriteSheet | null {
  for (const c of ALL_CHARACTERS) {
    const set = c.sets().find((s) => s.id === id);
    if (set) return getSheet(set);
  }
  return null;
}

export class DialogueBox {
  readonly el: HTMLDivElement;
  private readonly nameEl: HTMLDivElement;
  private readonly textEl: HTMLParagraphElement;
  private readonly choicesEl: HTMLOListElement;
  private readonly moreEl: HTMLDivElement;
  private readonly portraitEl: HTMLCanvasElement;
  private full = '';
  private shown = 0;
  private typingMs = 0;
  private choices: { text: string; index: number }[] = [];
  private selected = 0;
  private sheet: SpriteSheet | null = null;
  private expr: Expression = 'neutral';
  private clock = 0;
  private lastFrame = -1;
  /** Set when the player clicks or taps; read by `takeClick`. */
  private clicked: number | null = null;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'dialogue';
    this.el.hidden = true;
    this.portraitEl = document.createElement('canvas');
    this.portraitEl.className = 'dialogue-portrait pix';
    this.portraitEl.width = 96;
    this.portraitEl.height = 96;
    const box = document.createElement('div');
    box.className = 'dialogue-box';
    this.nameEl = document.createElement('div');
    this.nameEl.className = 'dialogue-name';
    this.textEl = document.createElement('p');
    this.textEl.className = 'dialogue-text';
    this.textEl.setAttribute('aria-live', 'polite');
    this.choicesEl = document.createElement('ol');
    this.choicesEl.className = 'dialogue-choices';
    this.moreEl = document.createElement('div');
    this.moreEl.className = 'dialogue-more';
    this.moreEl.textContent = '▼';
    box.append(this.nameEl, this.textEl, this.choicesEl, this.moreEl);
    this.el.append(this.portraitEl, box);
    parent.appendChild(this.el);
    this.el.addEventListener('pointerdown', (e) => {
      const li = (e.target as HTMLElement).closest('li');
      this.clicked = li ? Number(li.dataset.i) : -1;
      e.preventDefault();
    });
  }

  get open(): boolean {
    return !this.el.hidden;
  }

  get typing(): boolean {
    return this.shown < this.full.length;
  }

  show(view: DialogueView, speaker: SpeakerInfo | null): void {
    this.el.hidden = false;
    this.full = view.line.text;
    this.shown = 0;
    this.typingMs = 0;
    this.choices = view.choices;
    this.selected = 0;
    this.nameEl.textContent = speaker?.name ?? '';
    this.nameEl.hidden = !speaker;
    this.el.classList.toggle('narration', !speaker);
    this.sheet = speaker?.portrait ? portraitSheet(speaker.portrait) : null;
    this.portraitEl.hidden = !this.sheet;
    this.el.classList.toggle('has-portrait', !!this.sheet);
    this.expr = view.line.expr ?? 'neutral';
    this.lastFrame = -1;
    this.textEl.textContent = '';
    this.renderChoices();
  }

  hide(): void {
    this.el.hidden = true;
    this.full = '';
    this.choices = [];
  }

  /** Finishes the line if it is still typing. Returns true if it did. */
  skip(): boolean {
    if (!this.typing) return false;
    this.shown = this.full.length;
    this.textEl.textContent = this.full;
    this.renderChoices();
    return true;
  }

  hasChoices(): boolean {
    return !this.typing && this.choices.length > 0;
  }

  move(delta: number): void {
    if (!this.hasChoices()) return;
    this.selected = (this.selected + delta + this.choices.length) % this.choices.length;
    this.renderChoices();
    sound('blip');
  }

  /** The data index of the highlighted choice. */
  selectedChoice(): number {
    return this.choices[this.selected]?.index ?? 0;
  }

  /** A pending click: -1 for the box, a choice's data index, or null. */
  takeClick(): number | null {
    const c = this.clicked;
    this.clicked = null;
    if (c !== null && c >= 0) {
      const pos = this.choices.findIndex((x) => x.index === c);
      if (pos >= 0) this.selected = pos;
    }
    return c;
  }

  update(dtMs: number): void {
    if (this.el.hidden) return;
    this.clock += dtMs;
    if (this.typing) {
      this.typingMs += dtMs;
      const n = Math.min(this.full.length, Math.floor((this.typingMs / 1000) * CHARS_PER_SECOND));
      if (n !== this.shown) {
        this.shown = n;
        this.textEl.textContent = this.full.slice(0, n);
        if (!this.typing) this.renderChoices();
      }
    }
    this.moreEl.hidden = this.typing || this.choices.length > 0;
    this.drawPortrait();
  }

  private drawPortrait(): void {
    if (!this.sheet) return;
    // Frames per expression: base, blink, mouth half open, mouth open.
    let frame = 0;
    if (this.typing) frame = [2, 3, 2, 0][Math.floor(this.clock / 90) % 4] ?? 0;
    else if (this.clock % 3200 < 120) frame = 1;
    if (frame === this.lastFrame) return;
    this.lastFrame = frame;
    const g = this.portraitEl.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, 96, 96);
    g.imageSmoothingEnabled = false;
    drawFrame(g, this.sheet, this.expr, frame, 0, 0);
  }

  private renderChoices(): void {
    this.choicesEl.replaceChildren();
    if (this.typing) return;
    this.choices.forEach((c, i) => {
      const li = document.createElement('li');
      li.textContent = c.text;
      li.dataset.i = String(c.index);
      if (i === this.selected) li.className = 'selected';
      this.choicesEl.appendChild(li);
    });
  }
}
