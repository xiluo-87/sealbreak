/**
 * Glue between scenes and menus: the title screen, new game and naming,
 * the field, the pause menu and save slots.
 */
import { MAPS } from '../data/maps';
import { THISTLE_CROSS } from '../data/maps/thistleCross';
import { FieldScene } from '../field/fieldScene';
import { parseMap } from '../field/maps';
import { TILE } from '../field/movement';
import { browserStorage, latestSlot, readSaves, SLOT_IDS, type SlotId, type StorageLike, writeSlot } from '../game/save';
import type { Scene, SceneContext } from '../game/scene';
import { DEFAULT_NAME, type GameState, MAX_NAME_LENGTH, newGame } from '../game/state';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../render/scale';
import { paintGround } from '../render/tileArt';
import { ListMenu, type MenuItem } from './menu';
import { Toast } from './toast';

function playTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

function slotLabel(id: SlotId): string {
  return id === 'auto' ? 'Autosave' : `Slot ${id}`;
}

export function slotDetail(state: GameState | undefined): string {
  if (!state) return 'Empty';
  const place = MAPS[state.mapId]?.name ?? state.mapId;
  return `${state.rookieName} · ${place} · Day ${state.day} · ${playTime(state.playMs)}`;
}

/** The title screen: a slow pan over Thistle Cross behind the menu. */
class TitleScene implements Scene {
  private ground: HTMLCanvasElement | null = null;
  private t = 0;

  update(ctx: SceneContext): void {
    this.t += ctx.stepMs;
  }

  render(g: CanvasRenderingContext2D): void {
    if (!this.ground) this.ground = paintGround(parseMap(THISTLE_CROSS));
    const w = this.ground.width - LOGICAL_WIDTH;
    const x = Math.round((Math.sin(this.t / 16000) * 0.5 + 0.5) * w);
    g.drawImage(this.ground, -x, -Math.round(1.5 * TILE));
    g.fillStyle = 'rgba(20, 16, 30, 0.62)';
    g.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }
}

export class App {
  scene: Scene;
  private menu: ListMenu | null = null;
  private form: HTMLFormElement | null = null;
  private titleEl: HTMLDivElement | null = null;
  private readonly toast: Toast;
  private readonly storage: StorageLike | null;
  private field: FieldScene | null = null;

  constructor(
    private readonly ui: HTMLElement,
    private readonly seed: string,
  ) {
    this.storage = browserStorage();
    this.toast = new Toast(ui);
    this.scene = new TitleScene();
    this.showTitle();
  }

  /** Called every fixed step. Menus take input before the scene does. */
  update(ctx: SceneContext): void {
    this.toast.update(ctx.stepMs);
    if (this.form) {
      if (ctx.input.wasPressed('cancel')) this.showTitle();
      return;
    }
    if (this.menu) {
      this.menu.update(ctx.input);
      if (this.field) return;
    }
    this.scene.update(ctx);
  }

  private clearUi(): void {
    this.menu?.destroy();
    this.menu = null;
    this.form?.remove();
    this.form = null;
    this.titleEl?.remove();
    this.titleEl = null;
  }

  showTitle(): void {
    this.clearUi();
    this.field?.destroy();
    this.field = null;
    if (!(this.scene instanceof TitleScene)) this.scene = new TitleScene();
    this.titleEl = document.createElement('div');
    this.titleEl.className = 'title';
    const h = document.createElement('h1');
    h.textContent = 'Sealbreak';
    const p = document.createElement('p');
    p.textContent = 'The Royal Post closes in seven days.';
    this.titleEl.append(h, p);
    this.ui.appendChild(this.titleEl);
    const latest = latestSlot(this.storage);
    const saves = readSaves(this.storage);
    const items: MenuItem[] = [];
    if (latest) {
      const s = saves.slots[latest]?.state;
      items.push({ label: 'Continue', detail: slotDetail(s), action: () => s && this.startField(s) });
    }
    items.push({ label: 'New game', action: () => this.showNaming() });
    items.push({ label: 'Load game', disabled: !latest, action: () => this.showLoad(() => this.showTitle()) });
    this.menu = new ListMenu(this.ui, '', items, undefined, 'menu title-menu');
  }

  private showNaming(): void {
    this.clearUi();
    const form = document.createElement('form');
    form.className = 'menu naming';
    form.innerHTML = `<h2>Name the Rookie</h2>
      <input name="name" maxlength="${MAX_NAME_LENGTH}" autocomplete="off" spellcheck="false" aria-label="Name">
      <div class="naming-buttons"><button type="submit">Start</button> <button type="button" data-back>Back</button></div>`;
    const input = form.querySelector('input');
    if (input) input.value = DEFAULT_NAME;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.startField(newGame(input?.value ?? '', this.seed));
    });
    form.querySelector('[data-back]')?.addEventListener('click', () => this.showTitle());
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.showTitle();
    });
    this.ui.appendChild(form);
    this.form = form;
    input?.focus();
    input?.select();
  }

  private startField(state: GameState): void {
    this.clearUi();
    this.field?.destroy();
    const field = new FieldScene(state, this.ui, {
      autosave: (s) => {
        if (writeSlot(this.storage, 'auto', s, Date.now())) this.toast.show('Saved');
      },
      openMenu: () => this.showPause(),
    });
    this.field = field;
    this.scene = field;
  }

  private showPause(): void {
    const field = this.field;
    if (!field) return;
    this.clearUi();
    const close = (): void => this.clearUi();
    this.menu = new ListMenu(
      this.ui,
      'Paused',
      [
        { label: 'Resume', action: close },
        { label: 'Save game', action: () => this.showSave(field.state) },
        { label: 'Load game', action: () => this.showLoad(() => this.showPause()) },
        { label: 'Title screen', action: () => this.showTitle() },
      ],
      close,
    );
  }

  private showSave(state: GameState): void {
    this.clearUi();
    const saves = readSaves(this.storage);
    const items: MenuItem[] = (['1', '2', '3'] as const).map((id) => ({
      label: slotLabel(id),
      detail: slotDetail(saves.slots[id]?.state),
      action: () => {
        const ok = writeSlot(this.storage, id, state, Date.now());
        this.toast.show(ok ? `Saved to ${slotLabel(id).toLowerCase()}` : 'Could not save here');
        this.showPause();
      },
    }));
    this.menu = new ListMenu(this.ui, 'Save', items, () => this.showPause());
    if (!this.storage) this.toast.show('Saving is not available in this browser', 2400);
  }

  private showLoad(back: () => void): void {
    this.clearUi();
    const saves = readSaves(this.storage);
    const items: MenuItem[] = SLOT_IDS.map((id) => {
      const s = saves.slots[id]?.state;
      return { label: slotLabel(id), detail: slotDetail(s), disabled: !s, action: () => s && this.startField(s) };
    });
    this.menu = new ListMenu(this.ui, 'Load', items, back);
  }

  debugInfo(): Record<string, string | number> {
    return this.scene.debugInfo?.() ?? {};
  }
}
