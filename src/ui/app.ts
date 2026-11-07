/**
 * Glue between scenes and menus: the title screen, new game and naming,
 * the field, the pause menu and save slots.
 */
import { BattleScene } from '../battle/battleScene';
import { ENCOUNTERS } from '../data/enemies';
import { ITEMS } from '../data/items';
import { MAPS } from '../data/maps';
import { MEMBERS } from '../data/party';
import { statsAt } from '../data/party';
import { xpForLevel } from '../data/balance';
import { THISTLE_CROSS } from '../data/maps/thistleCross';
import { FieldScene } from '../field/fieldScene';
import { parseMap } from '../field/maps';
import { TILE } from '../field/movement';
import { browserStorage, latestSlot, readSaves, SLOT_IDS, type SlotId, type StorageLike, writeSlot } from '../game/save';
import type { Scene, SceneContext } from '../game/scene';
import { DEFAULT_NAME, type GameState, MAX_NAME_LENGTH, newGame, PARTY_IDS } from '../game/state';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../render/scale';
import { paintGround } from '../render/tileArt';
import { ACCESSORIES } from '../data/accessories';
import { LETTER_BY_ID } from '../data/letters';
import { equip } from '../letters/letters';
import { LetterReader } from './letterReader';
import { ListMenu, type MenuItem } from './menu';
import type { TouchMode } from '../input/touch';
import { Satchel } from './satchel';
import { Toast } from './toast';

/** Where `?region=` starts. More regions arrive with Milestone 6. */
const REGION_STARTS: Record<string, Pick<GameState, 'mapId' | 'x' | 'y' | 'facing'>> = {
  thistle: { mapId: 'thistle-cross', x: 19, y: 9, facing: 'down' },
  'thistle-road': { mapId: 'thistle-road', x: 2, y: 6, facing: 'right' },
};

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
  private readonly reader: LetterReader;
  private satchel: Satchel | null = null;

  constructor(
    private readonly ui: HTMLElement,
    private readonly seed: string,
    debug: { battle?: string; level?: number; region?: string; heat?: number } = {},
  ) {
    this.storage = browserStorage();
    this.toast = new Toast(ui);
    this.reader = new LetterReader(ui);
    this.scene = new TitleScene();
    if (debug.battle && ENCOUNTERS[debug.battle]) this.debugBattle(debug.battle, debug.level ?? 1, debug.heat ?? 0);
    else if (debug.region && REGION_STARTS[debug.region]) this.startField(this.debugState(debug.region, debug.level ?? 1, debug.heat ?? 0));
    else this.showTitle();
  }

  /** A game just past the opening, in a region, at a level and Heat (for testing and balance). */
  private debugState(region: string, level: number, heat: number): GameState {
    const s = newGame(DEFAULT_NAME, this.seed);
    Object.assign(s.flags, { 'intro.arrived': true, 'intro.sackFell': true, 'intro.sackTaken': true, 'intro.ratsBeaten': true, 'intro.lockingUp': true, 'intro.done': true, 'biscuit.joined': true, 'hint.satchel': true });
    s.party = ['rookie', 'odile'];
    s.letters.L02 = { state: 'sealed', holder: 'rookie' };
    for (const id of PARTY_IDS) {
      const st = statsAt(id, level);
      s.members[id] = { level, xp: xpForLevel(level), hp: st.hp, fp: st.fp };
    }
    s.heat = heat;
    const start = REGION_STARTS[region];
    if (start) Object.assign(s, start);
    return s;
  }

  /** `?battle=<id>&level=<n>`: straight into a fight on the Thistle Road, for testing and balance. */
  private debugBattle(encounter: string, level: number, heat: number): void {
    const s = this.debugState('thistle-road', level, heat);
    s.flags['road.seen'] = true;
    s.x = 4;
    this.startField(s);
    this.startBattle(encounter, () => undefined);
  }

  /** Called every fixed step. Menus take input before the scene does. */
  update(ctx: SceneContext): void {
    this.toast.update(ctx.stepMs);
    if (this.satchel) {
      this.satchel.update(ctx.input);
      return;
    }
    if (this.reader.open) {
      if (ctx.input.wasPressed('confirm') || ctx.input.wasPressed('cancel')) this.reader.close();
      return;
    }
    if (this.form) {
      if (ctx.input.wasPressed('cancel')) this.showTitle();
      return;
    }
    if (this.menu) {
      this.menu.update(ctx.input);
      if (this.field && this.scene === this.field) return;
    }
    this.scene.update(ctx);
  }

  private clearUi(): void {
    this.satchel?.destroy();
    this.satchel = null;
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
      battle: (id, done) => this.startBattle(id, done),
      notify: (text) => this.toast.show(text, 3200),
    });
    this.field = field;
    this.scene = field;
  }

  private startBattle(encounter: string, done: (result: 'victory' | 'fled') => void): void {
    const field = this.field;
    if (!field) return;
    const enc = ENCOUNTERS[encounter];
    const battle = new BattleScene(field.state, encounter, this.ui, {
      onEnd: (result) => {
        battle.destroy();
        if (result === 'defeat') {
          this.showGameOver();
          return;
        }
        if (result === 'victory' && enc?.wonFlag) field.state.flags[enc.wonFlag] = true;
        this.scene = field;
        // Letters whose seals broke in the fight can be read now.
        const opened = battle.battle.broken.map((id) => LETTER_BY_ID[id]).filter((l) => !!l);
        const next = (): void => {
          const l = opened.shift();
          if (!l) {
            done(result);
            return;
          }
          this.reader.show(l, 'broken', next, 'The seal broke in the fight. The letter reads:');
        };
        next();
      },
    });
    this.scene = battle;
  }

  private showGameOver(): void {
    this.clearUi();
    this.field?.destroy();
    this.field = null;
    this.scene = new TitleScene();
    const latest = latestSlot(this.storage);
    const s = latest ? readSaves(this.storage).slots[latest]?.state : undefined;
    const items: MenuItem[] = [];
    if (s) items.push({ label: 'Try again', detail: slotDetail(s), action: () => this.startField(s) });
    items.push({ label: 'Title screen', action: () => this.showTitle() });
    this.menu = new ListMenu(this.ui, 'The party has fallen', items, undefined, 'menu gameover-menu');
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
        { label: 'Satchel', detail: 'Letters and Gran’s Letter', action: () => this.showSatchel(field.state) },
        { label: 'Party', detail: this.partySummary(field.state), action: () => this.showParty(field.state) },
        { label: 'Save game', action: () => this.showSave(field.state) },
        { label: 'Load game', action: () => this.showLoad(() => this.showPause()) },
        { label: 'Title screen', action: () => this.showTitle() },
      ],
      close,
    );
  }

  private partySummary(state: GameState): string {
    return state.party
      .map((id) => {
        const m = state.members[id];
        const st = statsAt(id, m.level);
        return `${MEMBERS[id].name.replace('{name}', state.rookieName)} Lv ${m.level} ${m.hp}/${st.hp}`;
      })
      .join(' · ') + ` · ${state.coin} coin`;
  }

  private showSatchel(state: GameState): void {
    this.clearUi();
    this.satchel = new Satchel(this.ui, state, this.reader, () => this.showPause(), (t) => this.toast.show(t));
  }

  private showParty(state: GameState): void {
    this.clearUi();
    this.menu = new ListMenu(
      this.ui,
      this.partySummary(state),
      [
        { label: 'Use an item', action: () => this.showItems(state) },
        { label: 'Accessories', detail: state.accessories.owned.length === 0 ? 'None yet' : `${state.accessories.owned.length} owned`, disabled: state.accessories.owned.length === 0, action: () => this.showGear(state) },
      ],
      () => this.showPause(),
    );
  }

  private memberName(state: GameState, id: (typeof PARTY_IDS)[number]): string {
    return MEMBERS[id].name.replace('{name}', state.rookieName);
  }

  private showGear(state: GameState): void {
    this.clearUi();
    const items: MenuItem[] = state.party.map((id) => {
      const a = state.accessories.equipped[id];
      return { label: this.memberName(state, id), detail: a ? (ACCESSORIES[a]?.name ?? a) : 'Nothing worn', action: () => this.showGearFor(state, id) };
    });
    this.menu = new ListMenu(this.ui, 'Accessories', items, () => this.showParty(state));
  }

  private showGearFor(state: GameState, id: (typeof PARTY_IDS)[number]): void {
    this.clearUi();
    const items: MenuItem[] = state.accessories.owned.map((a) => {
      const wearer = Object.entries(state.accessories.equipped).find(([, v]) => v === a)?.[0] as (typeof PARTY_IDS)[number] | undefined;
      return {
        label: ACCESSORIES[a]?.name ?? a,
        detail: `${ACCESSORIES[a]?.description ?? ''}${wearer && wearer !== id ? ` Worn by ${this.memberName(state, wearer)}.` : ''}`,
        action: () => {
          equip(state, id, a);
          this.showGear(state);
        },
      };
    });
    items.push({
      label: 'Take it off',
      action: () => {
        equip(state, id, null);
        this.showGear(state);
      },
    });
    this.menu = new ListMenu(this.ui, `${this.memberName(state, id)} wears…`, items, () => this.showGear(state));
  }

  /** Use healing items outside battle. */
  private showItems(state: GameState): void {
    this.clearUi();
    const usable = Object.entries(state.items).filter(([id, n]) => n > 0 && ITEMS[id]?.battle);
    const items: MenuItem[] = usable.map(([id, n]) => ({
      label: `${ITEMS[id]?.name ?? id} ×${n}`,
      detail: ITEMS[id]?.description ?? '',
      action: () => this.showItemTarget(state, id),
    }));
    if (items.length === 0) items.push({ label: 'Nothing to use', disabled: true, action: () => undefined });
    this.menu = new ListMenu(this.ui, this.partySummary(state), items, () => this.showParty(state));
  }

  private showItemTarget(state: GameState, itemId: string): void {
    this.clearUi();
    const it = ITEMS[itemId];
    const items: MenuItem[] = state.party.map((id) => {
      const m = state.members[id];
      const st = statsAt(id, m.level);
      const can = it?.revive ? m.hp === 0 : m.hp > 0 && ((it?.heal ?? 0) > 0 ? m.hp < st.hp : (it?.restoreFp ?? 0) > 0 && m.fp < st.fp);
      return {
        label: MEMBERS[id].name.replace('{name}', state.rookieName),
        detail: `${m.hp}/${st.hp} HP · ${m.fp}/${st.fp} FP`,
        disabled: !can,
        action: () => {
          if (it?.revive) m.hp = Math.max(1, Math.round(st.hp / 4));
          if (it?.heal) m.hp = Math.min(st.hp, m.hp + it.heal);
          if (it?.restoreFp) m.fp = Math.min(st.fp, m.fp + it.restoreFp);
          const left = (state.items[itemId] ?? 0) - 1;
          state.items = Object.fromEntries(Object.entries({ ...state.items, [itemId]: left }).filter(([, v]) => v > 0));
          this.toast.show(`Used ${it?.name ?? itemId}`);
          this.showItems(state);
        },
      };
    });
    this.menu = new ListMenu(this.ui, `Use ${it?.name ?? itemId} on…`, items, () => this.showItems(state));
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

  /** What the screen is doing, for the touch controls. */
  touchMode(): TouchMode {
    if (this.satchel || this.reader.open || this.menu || this.form || this.titleEl) return 'menu';
    if (this.scene instanceof BattleScene) return 'battle';
    if (this.field && this.scene === this.field) return this.field.busy ? 'talk' : 'field';
    return 'menu';
  }

  debugInfo(): Record<string, string | number> {
    return this.scene.debugInfo?.() ?? {};
  }
}
