/**
 * The satchel: who carries which letter, what's left in the sack, reading,
 * breaking a seal at camp, resealing, and the Inspectorate's interest.
 */
import { letterSkill } from '../battle/letterSkills';
import { FENNS_LETTER, GRANS_LETTER, LETTERS, type LetterDef } from '../data/letters';
import { MEMBERS } from '../data/party';
import type { GameState, PartyId } from '../game/state';
import { hint, touchMode } from '../input/hints';
import type { Keyboard } from '../input/keyboard';
import { assign, breakSeal, canRead, canReseal, carriedBy, reseal, sackFound, stateOf } from '../letters/letters';
import type { LetterReader } from './letterReader';
import { ListMenu, type MenuItem } from './menu';

const STATE_LABEL: Record<string, string> = { sealed: 'sealed', opened: 'opened', resealed: 'resealed', delivered: 'delivered' };

function esc(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function heatLabel(heat: number): string {
  if (heat <= 0) return 'None to speak of';
  if (heat <= 3) return 'Mild';
  if (heat <= 5) return 'Watchful';
  if (heat <= 7) return 'Keen';
  return 'Intense';
}

export class Satchel {
  readonly el: HTMLDivElement;
  private readonly listEl: HTMLOListElement;
  private readonly detailEl: HTMLDivElement;
  private readonly heatEl: HTMLDivElement;
  private selected = 0;
  private menu: ListMenu | null = null;

  constructor(
    parent: HTMLElement,
    private readonly game: GameState,
    private readonly reader: LetterReader,
    private readonly onClose: () => void,
    private readonly toast: (text: string) => void,
  ) {
    this.el = document.createElement('div');
    this.el.className = 'satchel';
    this.el.innerHTML = `<header><h2>Satchel</h2><div class="heat"></div></header><div class="satchel-cols"><ol class="letter-list"></ol><div class="letter-detail"></div></div><footer>${touchMode() ? 'Tap a letter for actions' : 'Enter for actions'} · ${hint('cancel')}</footer>`;
    this.listEl = this.el.querySelector('.letter-list') as HTMLOListElement;
    this.detailEl = this.el.querySelector('.letter-detail') as HTMLDivElement;
    this.heatEl = this.el.querySelector('.heat') as HTMLDivElement;
    parent.appendChild(this.el);
    this.render();
  }

  /** Gran's Letter first (and Fenn's, once he joins), then letters carried, then the sack, then delivered. */
  private rows(): (LetterDef | typeof GRANS_LETTER)[] {
    const keys: (typeof GRANS_LETTER)[] = [GRANS_LETTER, ...(this.game.party.includes('fenn') ? [FENNS_LETTER] : [])];
    if (!sackFound(this.game)) return keys;
    const rank = (l: LetterDef): number => {
      const p = this.game.letters[l.id];
      if (p?.state === 'delivered') return 3;
      return p?.holder ? 1 : 2;
    };
    return [...keys, ...[...LETTERS].sort((a, b) => rank(a) - rank(b))];
  }

  private holderName(id: PartyId | null): string {
    if (!id) return 'In the sack';
    return MEMBERS[id].name.replace('{name}', this.game.rookieName);
  }

  render(): void {
    const segs = Array.from({ length: 10 }, (_, i) => `<i class="${i < this.game.heat ? 'on' : ''}"></i>`).join('');
    this.heatEl.innerHTML = `<span>Inspectorate interest</span><span class="gauge">${segs}</span><small>${heatLabel(this.game.heat)}</small>${
      this.game.party.includes('juniper') ? `<small class="wax-count">Wax sticks: ${this.game.wax}</small>` : ''
    }`;
    const rows = this.rows();
    this.selected = Math.min(this.selected, rows.length - 1);
    this.listEl.innerHTML = rows
      .map((l, i) => {
        if (l.id === 'GRAN') return `<li data-i="${i}" class="${i === this.selected ? 'selected' : ''}"><b>${esc(l.title)}</b><small>Kept in your tin</small></li>`;
        if (l.id === 'FENN') return `<li data-i="${i}" class="${i === this.selected ? 'selected' : ''}"><b>${esc(l.title)}</b><small>${this.game.flags['fenn.letterRead'] ? 'Opened at last' : 'In Fenn’s coat, unopened'}</small></li>`;
        const def = l as LetterDef;
        const p = this.game.letters[def.id];
        return `<li data-i="${i}" class="${i === this.selected ? 'selected' : ''} st-${p?.state ?? 'sealed'}"><b>${esc(def.title)}</b><small>${esc(this.holderName(p?.holder ?? null))} · ${STATE_LABEL[p?.state ?? 'sealed']}</small><span class="tone tone-${def.tone}">${def.tone}</span></li>`;
      })
      .join('');
    for (const li of Array.from(this.listEl.querySelectorAll('li'))) {
      li.addEventListener('click', () => {
        this.selected = Number(li.dataset.i);
        this.render();
        this.openActions();
      });
    }
    this.listEl.querySelector('li.selected')?.scrollIntoView({ block: 'nearest' });
    this.renderDetail(rows[this.selected]);
  }

  private renderDetail(l: LetterDef | typeof GRANS_LETTER | undefined): void {
    if (!l) return;
    if (l.id === 'GRAN') {
      this.detailEl.innerHTML = `<h3>${esc(l.title)}</h3><p class="addr">From ${esc(l.from)} to ${esc(l.to)}</p><p>The one letter your gran kept. You have read it more times than you can count.</p>`;
      return;
    }
    if (l.id === 'FENN') {
      const read = !!this.game.flags['fenn.letterRead'];
      this.detailEl.innerHTML = `<h3>${esc(l.title)}</h3><p class="addr">To ${esc(l.to)}</p><p>${read ? 'Fenn read it at the memorial in Copperhill. He lets you read it too.' : 'Addressed to Fenn in a hand that isn’t his. He says it’ll keep.'}</p>`;
      return;
    }
    const def = l as LetterDef;
    const p = this.game.letters[def.id];
    const state = p?.state ?? 'sealed';
    const holder = p?.holder ?? undefined;
    const carry = letterSkill(def.id, 'carry', holder);
    const burst = letterSkill(def.id, 'burst', holder);
    const skills =
      state === 'sealed'
        ? `<p><b>${esc(carry.name)}</b>${carry.passive ? ' (while carried)' : ` · ${carry.fp} FP`}<br>${esc(carry.description)}</p><p><b>Break the seal: ${esc(burst.name)}</b><br>${esc(burst.description)}</p>`
        : state === 'delivered'
          ? '<p>Delivered.</p>'
          : '<p>Its seal has been broken. The skill has gone out of it.</p>';
    this.detailEl.innerHTML = `<h3>${esc(def.title)}</h3><p class="addr">From ${esc(def.from)}<br>To ${esc(def.to)}</p><p><span class="tone tone-${def.tone}">${def.tone}</span> · ${STATE_LABEL[state]}</p>${skills}`;
  }

  private current(): LetterDef | typeof GRANS_LETTER | undefined {
    return this.rows()[this.selected];
  }

  private closeMenu(): void {
    this.menu?.destroy();
    this.menu = null;
  }

  private read(l: LetterDef | typeof GRANS_LETTER): void {
    const state = l.id === 'GRAN' ? 'opened' : stateOf(this.game, l.id);
    this.reader.show(l, state === 'resealed' ? 'resealed' : 'broken');
  }

  private openActions(): void {
    const l = this.current();
    if (!l) return;
    this.closeMenu();
    if (l.id === 'GRAN') {
      this.read(l);
      return;
    }
    if (l.id === 'FENN') {
      if (this.game.flags['fenn.letterRead']) this.reader.show(l, 'broken');
      else this.toast('Fenn shakes his head. Not yet.');
      return;
    }
    const def = l as LetterDef;
    const p = this.game.letters[def.id];
    const state = p?.state ?? 'sealed';
    const items: MenuItem[] = [];
    if (state !== 'delivered') {
      for (const m of this.game.party) {
        if (p?.holder === m) continue;
        const n = carriedBy(this.game, m).length;
        items.push({
          label: `Give to ${this.holderName(m)}`,
          detail: `${n}/3 carried`,
          disabled: n >= 3,
          action: () => {
            assign(this.game, def.id, m);
            this.closeMenu();
            this.render();
          },
        });
      }
      if (p?.holder) {
        items.push({
          label: 'Put back in the sack',
          action: () => {
            assign(this.game, def.id, null);
            this.closeMenu();
            this.render();
          },
        });
      }
    }
    if (canRead(this.game, def.id)) {
      items.push({
        label: 'Read',
        action: () => {
          this.closeMenu();
          this.read(def);
        },
      });
    }
    if (state === 'sealed') items.push({ label: 'Break the seal and read', detail: 'Its skill will be lost', action: () => this.confirmBreak(def) });
    if (canReseal(this.game, def.id)) {
      items.push({
        label: 'Reseal it',
        detail: `Juniper uses a wax stick (${this.game.wax} left)`,
        action: () => {
          reseal(this.game, def.id);
          this.closeMenu();
          this.toast('Juniper reseals it. You’d never know.');
          this.render();
        },
      });
    }
    if (items.length === 0) items.push({ label: 'Nothing to do with it now', disabled: true, action: () => undefined });
    this.menu = new ListMenu(this.el, def.title, items, () => this.closeMenu(), 'menu satchel-menu');
  }

  private confirmBreak(def: LetterDef): void {
    this.closeMenu();
    this.menu = new ListMenu(
      this.el,
      `Break the seal on “${def.title}”?`,
      [
        {
          label: 'Break it',
          detail: 'The Inspectorate will take more interest in you',
          action: () => {
            breakSeal(this.game, def.id);
            this.closeMenu();
            this.render();
            this.reader.show(def, 'broken');
          },
        },
        { label: 'Leave it sealed', action: () => this.closeMenu() },
      ],
      () => this.closeMenu(),
      'menu satchel-menu',
    );
  }

  update(input: Keyboard): void {
    if (this.reader.open) {
      if (input.wasPressed('confirm') || input.wasPressed('cancel')) this.reader.close();
      return;
    }
    if (this.menu) {
      this.menu.update(input);
      return;
    }
    const n = this.rows().length;
    if (input.wasPressed('up')) {
      this.selected = (this.selected - 1 + n) % n;
      this.render();
    } else if (input.wasPressed('down')) {
      this.selected = (this.selected + 1) % n;
      this.render();
    } else if (input.wasPressed('confirm')) this.openActions();
    else if (input.wasPressed('cancel')) this.onClose();
  }

  destroy(): void {
    this.closeMenu();
    this.el.remove();
  }
}
