/**
 * Travel and the seven-day clock (design 4). Pure functions over the game
 * state. The current stop is a story flag, `stop`, and finished detours are
 * flags too, so saves need nothing new.
 */
import { DEADLINE_DAY, DETOURS, type DetourId, type Place, STOP_ORDER, STOPS, type StopId } from '../data/world';
import type { GameState } from './state';

export interface TravelOption {
  kind: 'next' | 'detour';
  to: StopId | DetourId;
  name: string;
  days: number;
  /** Arriving this way would leave Kingsend out of reach by the deadline. */
  late: boolean;
  blurb: string;
}

export function currentStop(state: GameState): StopId {
  const s = state.flags.stop;
  return typeof s === 'string' && s in STOPS ? (s as StopId) : 'thistle';
}

/** Days from a stop to Kingsend by the direct road. */
export function daysToKingsend(stop: StopId): number {
  return Math.max(0, STOP_ORDER.indexOf('kingsend') - STOP_ORDER.indexOf(stop));
}

export function detourDone(state: GameState, id: DetourId): boolean {
  return !!state.flags[`detour.${id}`];
}

export function detourCost(state: GameState, id: DetourId): number {
  const free = DETOURS[id].freeWith;
  return free && state.flags[free] ? 0 : 1;
}

/** The roads out of the current stop. */
export function travelOptions(state: GameState): TravelOption[] {
  const stop = STOPS[currentStop(state)];
  const out: TravelOption[] = [];
  if (stop.next) {
    const next = STOPS[stop.next];
    const arriveDay = state.day + 1;
    out.push({ kind: 'next', to: next.id, name: next.name, days: 1, late: arriveDay + daysToKingsend(next.id) > DEADLINE_DAY, blurb: next.blurb });
  }
  if (stop.detour && !detourDone(state, stop.detour)) {
    const d = DETOURS[stop.detour];
    const cost = detourCost(state, d.id);
    out.push({ kind: 'detour', to: d.id, name: d.name, days: cost, late: state.day + cost + daysToKingsend(stop.id) > DEADLINE_DAY, blurb: d.blurb });
  }
  return out;
}

/** True once the deadline has passed with Kingsend not reached. */
export function pastDeadline(state: GameState): boolean {
  return state.day > DEADLINE_DAY && !state.flags['reached.kingsend'];
}

/** Takes a road: spends the days and says where the party arrives. */
export function travel(state: GameState, option: TravelOption): Place {
  state.day += option.days;
  if (option.kind === 'next') {
    const stop = STOPS[option.to as StopId];
    state.flags.stop = stop.id;
    if (stop.id === 'kingsend') {
      state.flags['reached.kingsend'] = state.day <= DEADLINE_DAY;
      state.flags['spare.days'] = Math.max(0, DEADLINE_DAY - state.day);
    }
    return stop.arrive ?? stop.hub;
  }
  const d = DETOURS[option.to as DetourId];
  state.flags[`detour.${d.id}`] = true;
  state.flags.away = d.id;
  return d.arrive;
}

/** Back from a detour to the stop it left from. */
export function returnFromDetour(state: GameState): Place {
  state.flags = Object.fromEntries(Object.entries(state.flags).filter(([k]) => k !== 'away'));
  return STOPS[currentStop(state)].hub;
}

/** Inspectors waiting outside the Dead Letter Office: one fewer per spare day (design 4). */
export function officeInspectors(state: GameState): number {
  const spare = typeof state.flags['spare.days'] === 'number' ? state.flags['spare.days'] : 0;
  return Math.max(1, 3 - spare);
}
