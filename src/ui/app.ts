/**
 * Glue between scenes and menus: the title screen, new game and naming,
 * the field, the pause menu and save slots.
 */
import { songFor, sound } from '../audio';
import { saveSettings, settings } from '../game/settings';
import { applySettings } from './options';
import { BattleScene } from '../battle/battleScene';
import { getEncounter } from '../data/enemies';
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
import { DEFAULT_NAME, type GameState, MAX_NAME_LENGTH, newGame, PARTY_IDS, type PartyId } from '../game/state';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../render/scale';
import { paintGround } from '../render/tileArt';
import { ACCESSORIES } from '../data/accessories';
import { FENNS_LETTER, GRANS_LETTER, LETTER_BY_ID } from '../data/letters';
import { equip } from '../letters/letters';
import { ringBell } from '../game/encounters';
import { applyAll } from '../game/conditions';
import { type EndingId, selectEnding } from '../game/endings';
import { endingPages } from '../data/endings';
import { endingsFound, recordEnding } from '../game/save';
import { officeInspectors } from '../game/travel';
import { officeEncounter } from '../data/enemies';
import { EndingScreen } from './ending';
import { returnFromDetour, type TravelOption, travel, travelOptions } from '../game/travel';
import { DEADLINE_DAY, type DetourId, DETOURS, LETTER_PLACES, type Place, type StopId, STOPS } from '../data/world';
import { INNS, innPrice, priceOf, SHOPS, stockOf } from '../data/shops';
import { DIALOGUE } from '../data/dialogue';
import { LetterReader } from './letterReader';
import { ListMenu, type MenuItem } from './menu';
import type { TouchMode } from '../input/touch';
import { Satchel } from './satchel';
import { Toast } from './toast';

/** Where `?region=` starts. More regions arrive with Milestone 6. */
const REGION_STARTS: Record<string, Pick<GameState, 'mapId' | 'x' | 'y' | 'facing'>> = {
  thistle: { mapId: 'thistle-cross', x: 19, y: 9, facing: 'down' },
  'thistle-road': { mapId: 'thistle-road', x: 2, y: 5, facing: 'right' },
  gate: { mapId: 'thistle-road', x: 81, y: 4, facing: 'right' },
  'fen-road': { mapId: 'fen-road', x: 1, y: 14, facing: 'right' },
  fen: { mapId: 'bellwether-fen', x: 1, y: 14, facing: 'right' },
  'copperhill-road': { mapId: 'copperhill-road', x: 1, y: 12, facing: 'right' },
  copperhill: { mapId: 'copperhill', x: 1, y: 10, facing: 'right' },
  'salt-road': { mapId: 'salt-road', x: 1, y: 11, facing: 'right' },
  salt: { mapId: 'salt-town', x: 1, y: 12, facing: 'right' },
  'kingsend-road': { mapId: 'kingsend-road', x: 1, y: 11, facing: 'right' },
  kingsend: { mapId: 'kingsend', x: 1, y: 13, facing: 'right' },
  abbey: { mapId: 'mirrow-abbey', x: 1, y: 12, facing: 'right' },
  oldfront: { mapId: 'old-front', x: 1, y: 12, facing: 'right' },
  gulls: { mapId: 'gulls-rest', x: 1, y: 14, facing: 'right' },
};

/** Story so far for each debug start: party, day, stop and flags. */
const REGION_STORY: Record<string, { party: PartyId[]; day: number; stop?: string; flags: string[] }> = {
  thistle: { party: ['rookie', 'odile'], day: 1, flags: [] },
  'thistle-road': { party: ['rookie', 'odile'], day: 1, flags: [] },
  gate: { party: ['rookie', 'odile', 'fenn'], day: 1, flags: ['toll.won', 'road.seen'] },
  'fen-road': { party: ['rookie', 'odile', 'fenn'], day: 2, stop: 'fen', flags: ['toll.won', 'road.seen'] },
  fen: { party: ['rookie', 'odile', 'fenn'], day: 2, stop: 'fen', flags: ['toll.won', 'road.seen', 'fen.roadSeen'] },
  'copperhill-road': { party: ['rookie', 'odile', 'fenn', 'juniper'], day: 3, stop: 'copperhill', flags: ['toll.won', 'road.seen', 'fen.roadSeen', 'fen.arrived', 'grist.beaten', 'juniper.met', 'juniper.joined'] },
  copperhill: { party: ['rookie', 'odile', 'fenn', 'juniper'], day: 3, stop: 'copperhill', flags: ['toll.won', 'road.seen', 'fen.roadSeen', 'fen.arrived', 'grist.beaten', 'juniper.met', 'juniper.joined', 'cop.roadSeen'] },
  'salt-road': { party: ['rookie', 'odile', 'fenn', 'juniper'], day: 4, stop: 'salt', flags: ['toll.won', 'road.seen', 'fen.roadSeen', 'fen.arrived', 'grist.beaten', 'juniper.met', 'juniper.joined', 'cop.roadSeen', 'cop.arrived', 'brass.beaten', 'fenn.past'] },
  salt: { party: ['rookie', 'odile', 'fenn', 'juniper'], day: 4, stop: 'salt', flags: ['toll.won', 'road.seen', 'fen.roadSeen', 'fen.arrived', 'grist.beaten', 'juniper.met', 'juniper.joined', 'cop.roadSeen', 'cop.arrived', 'brass.beaten', 'fenn.past', 'salt.roadSeen'] },
  abbey: { party: ['rookie', 'odile', 'fenn', 'juniper'], day: 3, stop: 'fen', flags: ['toll.won', 'road.seen', 'fen.roadSeen', 'fen.arrived', 'grist.beaten', 'juniper.met', 'juniper.joined', 'detour.abbey', 'away'] },
  oldfront: { party: ['rookie', 'odile', 'fenn', 'juniper'], day: 4, stop: 'copperhill', flags: ['toll.won', 'road.seen', 'fen.roadSeen', 'fen.arrived', 'grist.beaten', 'juniper.met', 'juniper.joined', 'cop.roadSeen', 'cop.arrived', 'brass.beaten', 'fenn.past', 'detour.oldfront', 'away'] },
  gulls: { party: ['rookie', 'odile', 'fenn', 'juniper'], day: 5, stop: 'salt', flags: ['toll.won', 'road.seen', 'fen.roadSeen', 'fen.arrived', 'grist.beaten', 'juniper.met', 'juniper.joined', 'cop.roadSeen', 'cop.arrived', 'brass.beaten', 'fenn.past', 'salt.roadSeen', 'salt.arrived', 'harbour.ambush', 'sorrel.beaten', 'reveal.done', 'detour.gulls', 'away'] },
  'kingsend-road': { party: ['rookie', 'odile', 'fenn', 'juniper'], day: 5, stop: 'kingsend', flags: [...['toll.won', 'road.seen', 'fen.roadSeen', 'fen.arrived', 'grist.beaten', 'juniper.met', 'juniper.joined', 'cop.roadSeen', 'cop.arrived', 'brass.beaten', 'fenn.past', 'salt.roadSeen'], 'salt.arrived', 'harbour.ambush', 'sorrel.beaten', 'reveal.done', 'reached.kingsend'] },
  kingsend: { party: ['rookie', 'odile', 'fenn', 'juniper'], day: 5, stop: 'kingsend', flags: [...['toll.won', 'road.seen', 'fen.roadSeen', 'fen.arrived', 'grist.beaten', 'juniper.met', 'juniper.joined', 'cop.roadSeen', 'cop.arrived', 'brass.beaten', 'fenn.past', 'salt.roadSeen'], 'salt.arrived', 'harbour.ambush', 'sorrel.beaten', 'reveal.done', 'reached.kingsend', 'kingsend.roadSeen'] },
};

/** With Moss's map, the road menu shows how many letters are waiting at each place. */
function mossNote(state: GameState, place: StopId | DetourId): string {
  if (!state.flags['moss.map']) return '';
  const n = (LETTER_PLACES[place] ?? []).filter((id) => state.letters[id]?.state !== 'delivered').length;
  return n === 0 ? ' · Moss’s map: nobody left to deliver to' : ` · Moss’s map: ${n} letter${n === 1 ? '' : 's'} to deliver`;
}

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
  private ending: EndingScreen | null = null;

  constructor(
    private readonly ui: HTMLElement,
    private readonly seed: string,
    debug: { battle?: string; level?: number; region?: string; heat?: number } = {},
  ) {
    this.storage = browserStorage();
    this.toast = new Toast(ui);
    this.reader = new LetterReader(ui);
    this.scene = new TitleScene();
    if (debug.battle && getEncounter(debug.battle)) this.debugBattle(debug.battle, debug.level ?? 1, debug.heat ?? 0);
    else if (debug.region && REGION_STARTS[debug.region]) this.startField(this.debugState(debug.region, debug.level ?? 1, debug.heat ?? 0));
    else this.showTitle();
  }

  /** A game just past the opening, in a region, at a level and Heat (for testing and balance). */
  private debugState(region: string, level: number, heat: number): GameState {
    const s = newGame(DEFAULT_NAME, this.seed);
    Object.assign(s.flags, { 'intro.arrived': true, 'intro.sackFell': true, 'intro.sackTaken': true, 'intro.ratsBeaten': true, 'intro.lockingUp': true, 'intro.done': true, 'biscuit.joined': true, 'hint.satchel': true });
    const story = REGION_STORY[region] ?? REGION_STORY.thistle;
    s.party = [...(story?.party ?? ['rookie', 'odile'])];
    s.day = story?.day ?? 1;
    if (story?.stop) s.flags.stop = story.stop;
    for (const f of story?.flags ?? []) s.flags[f] = true;
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
    this.field?.fight(encounter);
  }

  /** Called every fixed step. Menus take input before the scene does. */
  update(ctx: SceneContext): void {
    this.toast.update(ctx.stepMs);
    if (this.ending) {
      this.ending.update(ctx.input);
      return;
    }
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
    const found = endingsFound(this.storage);
    if (found.length > 0) {
      const e = document.createElement('small');
      e.className = 'endings-found';
      e.textContent = `Endings found: ${found.length} of 4`;
      this.titleEl.append(e);
    }
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
    items.push({ label: 'Options', action: () => this.showOptions(() => this.showTitle()) });
    items.push({ label: 'Credits', action: () => this.showCredits(() => this.showTitle()) });
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
        if (writeSlot(this.storage, 'auto', s, Date.now())) {
          this.toast.show('Saved');
          sound('save');
        }
      },
      openMenu: () => this.showPause(),
      battle: (id, done) => this.startBattle(id, done),
      notify: (text) => this.toast.show(text, 3200),
      open: (kind, id, done) => {
        if (kind === 'shop') this.showShop(state, id, done);
        else if (kind === 'inn') this.showInn(state, id, done);
        else this.showTravel(state, done);
      },
      ending: () => {
        const id = selectEnding(state);
        this.showEnding(state, id);
      },
      read: (id, intro, done) => {
        const l = id === 'FENN' ? FENNS_LETTER : id === 'GRAN' ? GRANS_LETTER : LETTER_BY_ID[id];
        if (l) this.reader.show(l, 'broken', done, intro);
        else done();
      },
      travel: (kind) => {
        if (kind === 'leave') this.showTravel(state, () => this.clearUi());
        else this.arrive(state, returnFromDetour(state), false);
      },
    });
    this.field = field;
    this.scene = field;
  }

  private startBattle(requested: string, done: (result: 'victory' | 'fled' | 'delivered', delivered: string | null) => void): void {
    const field = this.field;
    if (!field) return;
    // Outside the office: one Inspector per day short of the deadline. Vane brings Seniors at high Heat.
    const encounter =
      requested === 'office' ? officeEncounter(officeInspectors(field.state), field.state.heat >= 6).id : requested === 'vane' && field.state.heat >= 8 ? 'vane-seniors' : requested;
    const enc = getEncounter(encounter);
    const battle = new BattleScene(field.state, encounter, this.ui, {
      onEnd: (result) => {
        battle.destroy();
        if (result === 'defeat') {
          this.showGameOver();
          return;
        }
        if (result === 'victory' && enc?.wonFlag) field.state.flags[enc.wonFlag] = true;
        if (encounter === 'vane' || encounter === 'vane-seniors') {
          field.state.flags['final.result'] = result;
          field.state.flags['final.done'] = true;
        }
        if (field.state.flags['meal.buff']) field.state.flags = Object.fromEntries(Object.entries(field.state.flags).filter(([k]) => k !== 'meal.buff'));
        this.scene = field;
        // Letters whose seals broke in the fight can be read now.
        const opened = battle.battle.broken.map((id) => LETTER_BY_ID[id]).filter((l) => !!l);
        const next = (): void => {
          const l = opened.shift();
          if (!l) {
            done(result, battle.battle.delivered);
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

  // -------------------------------------------------------------------------
  // The journey: road choices, camp, shops and inns.

  private showTravel(state: GameState, back: () => void): void {
    this.clearUi();
    // Roads to places not built yet stay closed.
    const opts = travelOptions(state).filter((o) => !!MAPS[o.kind === 'next' ? (STOPS[o.to as StopId].arrive?.map ?? '') : DETOURS[o.to as DetourId].arrive.map]);
    const items: MenuItem[] = opts.map((o) => ({
      label: `${o.kind === 'detour' ? 'Detour: ' : ''}${o.name}`,
      detail: `${o.days === 0 ? 'No days' : o.days === 1 ? '1 day' : `${o.days} days`} · ${o.blurb}${mossNote(state, o.to as StopId | DetourId)}${o.late ? ' · Kingsend would be out of reach by the seventh day' : ''}`,
      action: () => (o.late ? this.confirmLate(state, o, back) : this.showCamp(state, o)),
    }));
    items.push({ label: 'Not yet', action: () => back() });
    this.menu = new ListMenu(this.ui, `The road · Day ${state.day} of ${DEADLINE_DAY}`, items, () => back(), 'menu travel-menu');
  }

  private confirmLate(state: GameState, o: TravelOption, back: () => void): void {
    this.clearUi();
    this.menu = new ListMenu(
      this.ui,
      'If you go this way, the Post will close before you reach Kingsend. Everything left in the sack goes to the furnace.',
      [
        { label: 'Go anyway', action: () => this.showCamp(state, o) },
        { label: 'Think again', action: () => this.showTravel(state, back) },
      ],
      () => this.showTravel(state, back),
    );
  }

  /** The night before setting out: talk, sort the satchel, then sleep. */
  private showCamp(state: GameState, o: TravelOption): void {
    this.clearUi();
    const talked = state.flags[`camp.talked.${state.day}`] === true;
    this.menu = new ListMenu(
      this.ui,
      `Camp · Night of day ${state.day}`,
      [
        { label: 'Talk by the fire', disabled: talked || !DIALOGUE.camp, action: () => this.campTalk(state, o) },
        { label: 'Satchel', detail: 'Read, sort and reseal letters', action: () => this.campSatchel(state, o) },
        { label: o.days === 0 ? `Set off for ${o.name}` : `Sleep, then set off for ${o.name}`, action: () => this.setOff(state, o) },
      ],
      undefined,
      'menu camp-menu',
    );
  }

  private campTalk(state: GameState, o: TravelOption): void {
    this.clearUi();
    state.flags[`camp.talked.${state.day}`] = true;
    this.field?.talk('camp', () => this.showCamp(state, o));
  }

  private campSatchel(state: GameState, o: TravelOption): void {
    this.clearUi();
    this.satchel = new Satchel(this.ui, state, this.reader, () => this.showCamp(state, o), (t) => this.toast.show(t));
  }

  private setOff(state: GameState, o: TravelOption): void {
    this.clearUi();
    // A night's rest: full health, and half FP (all of it with the abbey's blessing).
    const fp = state.flags['abbey.blessing'] ? 1 : 0.5;
    if (o.days > 0) applyAll([{ heal: 1, fp }], state);
    const place = travel(state, o);
    if (state.day > DEADLINE_DAY || (o.to === 'kingsend' && !state.flags['reached.kingsend'])) {
      this.showEnding(state, selectEnding(state));
      return;
    }
    this.arrive(state, place, o.days > 0);
  }

  /** Moves the party to a place and starts the field there. */
  private arrive(state: GameState, place: Place, newDay: boolean): void {
    Object.assign(state, { mapId: place.map, x: place.x, y: place.y, facing: place.facing });
    this.startField(state);
    if (newDay) {
      if (writeSlot(this.storage, 'auto', state, Date.now())) this.toast.show(`Day ${state.day} · Saved`, 2400);
    }
  }

  private showShop(state: GameState, id: string, done: () => void): void {
    const shop = SHOPS[id];
    if (!shop) {
      done();
      return;
    }
    this.clearUi();
    const items: MenuItem[] = stockOf(shop, state.flags).map((item) => {
      const price = priceOf(shop, item, state.flags);
      return {
        label: `${ITEMS[item]?.name ?? item} · ${price} coin`,
        detail: `${ITEMS[item]?.description ?? ''} You have ${state.items[item] ?? 0}.`,
        disabled: state.coin < price,
        action: () => {
          state.coin -= price;
          sound('coin');
          state.items[item] = Math.min(99, (state.items[item] ?? 0) + 1);
          this.toast.show(`Bought a ${ITEMS[item]?.name.toLowerCase() ?? item}`);
          this.showShop(state, id, done);
        },
      };
    });
    items.push({ label: 'Leave', action: () => done() });
    this.menu = new ListMenu(this.ui, `${shop.name} · ${state.coin} coin`, items, () => done(), 'menu shop-menu');
  }

  private showInn(state: GameState, id: string, done: () => void): void {
    const inn = INNS[id];
    if (!inn) {
      done();
      return;
    }
    this.clearUi();
    const price = innPrice(inn, state.flags);
    const meal = inn.mealWith && state.flags[inn.mealWith];
    this.menu = new ListMenu(
      this.ui,
      `${inn.name} · ${state.coin} coin`,
      [
        {
          label: price === 0 ? 'Take a room (free)' : `Take a room · ${price} coin`,
          detail: meal ? 'Rest fully, and eel pie for supper: ATK up in the next fight' : 'Rest and recover fully',
          disabled: state.coin < price,
          action: () => {
            state.coin -= price;
            sound('heal');
            applyAll([{ heal: 1, fp: 1 }], state);
            for (const m of state.party) {
              const st = statsAt(m, state.members[m].level);
              state.members[m].hp = st.hp;
            }
            if (meal) state.flags['meal.buff'] = true;
            this.toast.show(meal ? 'You sleep well, after a great deal of pie.' : 'You sleep well.', 2600);
            done();
          },
        },
        { label: 'Not now', action: () => done() },
      ],
      () => done(),
    );
  }

  /** The story is over: record which ending was reached and play it out. */
  private showEnding(state: GameState, id: EndingId): void {
    this.clearUi();
    this.field?.destroy();
    this.field = null;
    this.scene = new TitleScene();
    recordEnding(this.storage, id);
    this.ending = new EndingScreen(this.ui, endingPages(state, id), this.reader, () => {
      this.ending?.destroy();
      this.ending = null;
      this.showCredits(() => this.showTitle());
    });
  }

  /** Text speed, motion, text size, encounter rate and sound (design 15). They apply at once and are kept. */
  private showOptions(back: () => void, at = 0): void {
    this.clearUi();
    const s = settings;
    const change = (index: number, fn: () => void) => (): void => {
      fn();
      saveSettings(this.storage);
      applySettings();
      this.showOptions(back, index);
    };
    const onOff = (v: boolean): string => (v ? 'On' : 'Off');
    const speeds = ['slow', 'normal', 'fast'] as const;
    const items: MenuItem[] = [
      { label: `Text speed: ${s.textSpeed}`, detail: 'How fast dialogue types out', action: change(0, () => (s.textSpeed = speeds[(speeds.indexOf(s.textSpeed) + 1) % 3] ?? 'normal')) },
      { label: `Reduced motion: ${onOff(s.reducedMotion)}`, detail: 'Less shaking, swinging and lunging', action: change(1, () => (s.reducedMotion = !s.reducedMotion)) },
      { label: `Larger text: ${onOff(s.largeText)}`, detail: 'Bigger menus, dialogue and letters', action: change(2, () => (s.largeText = !s.largeText)) },
      { label: `Encounters: ${s.lowEncounters ? 'low' : 'normal'}`, detail: 'How often trouble finds you on the road', action: change(3, () => (s.lowEncounters = !s.lowEncounters)) },
      { label: `Sound: ${onOff(!s.muted)}`, detail: 'Music and effects', action: change(4, () => (s.muted = !s.muted)) },
      {
        label: `Volume: ${Math.round(s.volume * 100)}%`,
        detail: 'Steps of 20%',
        disabled: s.muted,
        action: change(5, () => (s.volume = [0.2, 0.4, 0.6, 0.8, 1].find((v) => v > s.volume + 0.01) ?? 0.2)),
      },
      { label: 'Back', action: back },
    ];
    this.menu = new ListMenu(this.ui, 'Options', items, back, 'menu options-menu');
    this.menu.select(at);
  }

  private showCredits(back: () => void): void {
    this.clearUi();
    const found = endingsFound(this.storage).length;
    this.menu = new ListMenu(
      this.ui,
      'Sealbreak',
      [
        { label: 'Story, code, art and music', detail: 'Every sprite, tile, tune and sound is drawn or played by code. There are no image or audio files.', action: back },
        { label: 'Built with', detail: 'TypeScript, Vite, Canvas 2D and Web Audio', action: back },
        { label: `Endings found: ${found} of 4`, detail: 'Each one depends on how you carried the post', action: back },
        { label: 'Thank you for carrying the post', action: back },
      ],
      back,
      'menu credits-menu',
    );
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
        { label: 'Options', action: () => this.showOptions(() => this.showPause()) },
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
    const usable = Object.entries(state.items).filter(([id, n]) => n > 0 && ITEMS[id]);
    const items: MenuItem[] = usable.map(([id, n]) => ({
      label: `${ITEMS[id]?.name ?? id} ×${n}`,
      detail: ITEMS[id]?.description ?? '',
      action: () => {
        if (id === 'repel-bell') this.ringRepelBell(state);
        else if (id === 'apple') this.feedBiscuit(state);
        else this.showItemTarget(state, id);
      },
    }));
    if (items.length === 0) items.push({ label: 'Nothing to use', disabled: true, action: () => undefined });
    this.menu = new ListMenu(this.ui, this.partySummary(state), items, () => this.showParty(state));
  }

  private useUp(state: GameState, itemId: string): void {
    const left = (state.items[itemId] ?? 0) - 1;
    state.items = Object.fromEntries(Object.entries({ ...state.items, [itemId]: left }).filter(([, v]) => v > 0));
  }

  private ringRepelBell(state: GameState): void {
    if (MAPS[state.mapId]?.kind !== 'road') {
      this.toast.show('Nothing out here to scare off.');
      return;
    }
    ringBell(state.road);
    sound('bell');
    this.useUp(state, 'repel-bell');
    this.toast.show('You ring the bell. The road goes quiet.', 2600);
    this.showItems(state);
  }

  private feedBiscuit(state: GameState): void {
    if (!state.flags['biscuit.joined']) {
      this.toast.show('You save the apple for later.');
      return;
    }
    this.useUp(state, 'apple');
    sound('bleat');
    applyAll([{ add: 'biscuit.trust', by: 1 }], state);
    this.toast.show('Biscuit eats the apple, core and all, and looks at you differently.', 3000);
    this.showItems(state);
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
  /** Which tune fits what is on screen. */
  musicCue(): { song: string | null; intensity: number } {
    if (this.ending) return { song: 'ending', intensity: 0 };
    if (this.scene instanceof BattleScene) return this.scene.music();
    if (this.field && this.scene === this.field) {
      const def = this.field.map.def;
      return { song: songFor(def.region, def.theme), intensity: 0 };
    }
    return { song: 'thistle', intensity: 0 };
  }

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
