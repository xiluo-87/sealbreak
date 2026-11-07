/** A keyboard- and pointer-driven list menu, used by the title screen and the pause menu. */
import { sound } from '../audio';
import type { Keyboard } from '../input/keyboard';

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
    this.list = document.createElement('ol');
    this.list.setAttribute('role', 'menu');
    this.el.appendChild(this.list);
    parent.appendChild(this.el);
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

  private render(): void {
    this.list.replaceChildren();
    this.items.forEach((item, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      li.className = `${i === this.selected ? 'selected' : ''} ${item.disabled ? 'disabled' : ''}`.trim();
      const label = document.createElement('span');
      label.textContent = item.label;
      li.appendChild(label);
      if (item.detail) {
        const d = document.createElement('small');
        d.textContent = item.detail;
        li.appendChild(d);
      }
      li.addEventListener('pointerenter', () => {
        if (!item.disabled && this.selected !== i) {
          this.selected = i;
          this.render();
          this.onHighlight?.(i);
        }
      });
      li.addEventListener('click', () => {
        if (!item.disabled) {
          sound('select');
          item.action();
        }
      });
      this.list.appendChild(li);
    });
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
