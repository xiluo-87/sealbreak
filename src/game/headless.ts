/**
 * A headless story runner: plays dialogues, fights and cutscenes the way the
 * field scene does, with choices and battle tactics from a director. Used by
 * the playthrough tests and the balance bot.
 */
import { type Action, Battle, type BattleResult } from '../battle/battle';
import { CUTSCENES } from '../data/cutscenes';
import { DIALOGUE } from '../data/dialogue';
import { getEncounter, officeEncounter } from '../data/enemies';
import { REGIONS } from '../data/regions';
import { applyAll, check } from './conditions';
import { DialogueRun } from './dialogue';
import { battleFor } from './encounters';
import { Rng } from './rng';
import type { GameState } from './state';
import { officeInspectors } from './travel';

export interface Director {
  /** Picks among visible choices by their text; return an index into `choices`. */
  choose(choices: { text: string; index: number }[], dialogue: string): number;
  /** Picks the party's action in a fight. */
  act(b: Battle): Action;
}

export interface Log {
  lines: string[];
  fights: { id: string; result: BattleResult; turns: number }[];
}

export function newLog(): Log {
  return { lines: [], fights: [] };
}

/** Prefers the first choice that contains any of the given phrases, in order; otherwise the first. */
export function preferring(prefs: string[]): Director['choose'] {
  return (choices) => {
    for (const p of prefs) {
      const i = choices.findIndex((c) => c.text.includes(p));
      if (i >= 0) return i;
    }
    return 0;
  };
}

/** A sensible fight: heal anyone low, otherwise hit the weakest enemy. */
export function basicTactics(b: Battle): Action {
  return b.autoAction(b.current());
}

/** Resolves the fights whose make-up depends on the story so far, as the app does. */
export function resolveFight(state: GameState, id: string, region: string): string {
  if (id === 'office') return officeEncounter(officeInspectors(state), state.heat >= 6).id;
  if (id === 'vane' && state.heat >= 8) return 'vane-seniors';
  if (id === 'random') {
    const rng = Rng.fromState(state.rng);
    const out = REGIONS[region] ? battleFor(state, region, rng) : 'road-hogs';
    state.rng = rng.getState();
    return out;
  }
  return id;
}

/** Plays a fight to the end and applies its results. */
export function fight(state: GameState, requested: string, director: Director, log: Log, region = 'thistle'): BattleResult {
  const id = resolveFight(state, requested, region);
  const enc = getEncounter(id);
  if (!enc) throw new Error(`unknown fight ${id}`);
  const rng = Rng.fromState(state.rng);
  const b = new Battle(state, id, rng.nextUint32());
  state.rng = rng.getState();
  let turns = 0;
  while (!b.result && turns < 2000) {
    b.startTurn();
    if (b.result) break;
    const c = b.current();
    b.act(c.side === 'enemy' ? b.enemyAction(c) : director.act(b));
    turns++;
  }
  const result = b.result ?? 'defeat';
  b.applyResults(state);
  if (result === 'victory' && enc.wonFlag) state.flags[enc.wonFlag] = true;
  if (id === 'vane' || id === 'vane-seniors') {
    state.flags['final.result'] = result;
    state.flags['final.done'] = true;
  }
  log.fights.push({ id, result, turns });
  if (result === 'delivered' && b.delivered && DIALOGUE[`recipient-${b.delivered}`]) talk(state, `recipient-${b.delivered}`, director, log, region);
  return result;
}

/** Runs a dialogue to the end, then any fights it started, as the field does. */
export function talk(state: GameState, id: string, director: Director, log: Log, region = 'thistle'): void {
  const d = DIALOGUE[id];
  if (!d) throw new Error(`unknown dialogue ${id}`);
  const run = new DialogueRun(d, state);
  let guard = 0;
  while (!run.done && guard++ < 2000) {
    const v = run.view();
    if (!v) break;
    log.lines.push(v.line.text);
    if (v.choices.length > 0) run.choose(v.choices[director.choose(v.choices, id)]?.index ?? v.choices[0]?.index ?? 0);
    else run.advance();
  }
  for (const f of run.out.fights) {
    const result = fight(state, f.id, director, log, region);
    if (result === 'defeat') throw new Error(`the party lost ${f.id} in ${id}`);
    if (result === 'victory' && f.after) talk(state, f.after, director, log, region);
  }
}

/** Runs a cutscene's steps. Returns true if it reached an ending. */
export function cutscene(state: GameState, id: string, director: Director, log: Log, region = 'thistle'): boolean {
  const c = CUTSCENES[id];
  if (!c) throw new Error(`unknown cutscene ${id}`);
  for (const step of c.steps) {
    if (step.if && !check(step.if, state)) continue;
    if ('say' in step) talk(state, step.say, director, log, region);
    else if ('battle' in step) {
      const r = fight(state, step.battle, director, log, region);
      if (r === 'defeat') throw new Error(`the party lost ${step.battle} in ${id}`);
    } else if ('then' in step) applyAll(step.then, state);
    else if ('warp' in step) Object.assign(state, { mapId: step.warp.map, x: step.warp.x, y: step.warp.y, facing: step.warp.facing });
    else if ('ending' in step) return true;
  }
  return false;
}
