/** A keyboard- and pointer-driven list menu, used by the title screen and the pause menu. */
import { sound } from '../audio';
import type { Keyboard } from '../input/keyboard';
import { keepInView } from './scroll';

export interface MenuItem {
  label: string;
  detail?: string;
  disabled?: boolean;
  action: () => void;
}

export class ListMenu {
  readonly el: HTMLDivElement;
  private readonly list: HTMLOListElement;
  private selected = 0;

  constructor(
    parent: HTMLElement,
    title: string,
    private items: MenuItem[],
    private readonly onCancel?: () => void,
    className = 'menu',
    private readonly onHighlight?: (index: number) => void,
  ) {
    this.el = document.createElement('div');
    this.el.className = className;
    this.el.setAttribute('role', 'dialog');
    if (title) {
      const h = document.createElement('h2');
      h.textContent = title;
      this.el.appendChild(h);
    }
    // The list scrolls on its own when it is taller than the screen, so the title stays put.
    this.list = document.createElement('ol');
    this.list.setAttribute('role', 'menu');
    // Rows per column when a menu is laid out in two columns (battle commands on touch screens).
    this.list.style.setProperty('--half', String(Math.max(1, Math.ceil(this.items.length / 2))));
    this.el.appendChild(this.list);
    parent.appendChild(this.el);
    this.build();
    this.selected = Math.max(0, this.items.findIndex((i) => !i.disabled));
    this.render();
    this.onHighlight?.(this.selected);
  }

  /** Highlight an item, for menus rebuilt in place (the options menu). */
  select(index: number): void {
    if (index < 0 || index >= this.items.length || this.items[index]?.disabled) return;
    this.selected = index;
    this.render();
  }

  /** Makes the rows once. Moving the highlight only changes classes, so taps and scrolling are not disturbed. */
  private build(): void {
    this.list.replaceChildren();
    this.items.forEach((item, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      if (item.disabled) {
        li.classList.add('disabled');
        li.setAttribute('aria-disabled', 'true');
      }
      const label = document.createElement('span');
      label.textContent = item.label;
      li.appendChild(label);
      if (item.detail) {
        const d = document.createElement('small');
        d.textContent = item.detail;
        li.appendChild(d);
      }
      li.addEventListener('pointerenter', (e) => {
        // Only a mouse highlights on hover; a finger sliding to scroll should not.
        if (e.pointerType !== 'mouse' || item.disabled || this.selected === i) return;
        this.selected = i;
        this.render(false);
        this.onHighlight?.(i);
      });
      li.addEventListener('click', () => {
        if (item.disabled) return;
        if (this.selected !== i) {
          this.selected = i;
          this.render(false);
          this.onHighlight?.(i);
        }
        sound('select');
        item.action();
      });
      this.list.appendChild(li);
    });
  }

  /** Marks the highlighted row and, unless the pointer moved it, scrolls it into view. */
  private render(scroll = true): void {
    const rows = this.list.children;
    for (let i = 0; i < rows.length; i++) rows[i]?.classList.toggle('selected', i === this.selected);
    if (scroll) keepInView(this.list, rows[this.selected] as HTMLElement | undefined);
  }

  private move(delta: number): void {
    for (let n = 0; n < this.items.length; n++) {
      this.selected = (this.selected + delta + this.items.length) % this.items.length;
      if (!this.items[this.selected]?.disabled) break;
    }
    this.render();
    this.onHighlight?.(this.selected);
    sound('blip');
  }

  update(input: Keyboard): void {
    if (input.wasPressed('up')) this.move(-1);
    if (input.wasPressed('down')) this.move(1);
    if (input.wasPressed('confirm')) {
      const item = this.items[this.selected];
      if (item && !item.disabled) {
        sound('select');
        item.action();
      }
    } else if (input.wasPressed('cancel') && this.onCancel) {
      sound('back');
      this.onCancel();
    }
  }

  destroy(): void {
    this.el.remove();
  }
}
