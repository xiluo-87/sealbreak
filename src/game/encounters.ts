/**
 * Random encounters (design 7.1-7.3): the danger gauge, Repel Bells, and
 * what an encounter turns out to be. Pure functions over the game state.
 */
import { BALANCE } from '../data/balance';
import { type EnemyGroup, REGIONS } from '../data/regions';
import type { Rng } from './rng';
import type { GameState, RoadState } from './state';

export type Terrain = keyof typeof BALANCE.encounters.terrain;
export type Bell = 'still' | 'swinging' | 'ringing' | 'muffled';

export type EncounterRoll = { kind: 'battle'; encounter: string } | { kind: 'event'; event: string };

const E = BALANCE.encounters;

/** Terrain under a map tile: paved cobbles, a dirt road or bridge, or off the road. */
export function terrainOf(tile: string): Terrain {
  if (tile === '=') return 'paved';
  if (tile === '_' || tile === 'b') return 'road';
  return 'off';
}

/** Resets the gauge on arriving on a road. */
export function enterRoad(road: RoadState): void {
  road.gauge = 0;
  road.cooldown = 0;
  road.count = 0;
}

/** Danger added per step in a region, after anything that quietens its road. */
export function regionGain(state: GameState, regionId: string, lowRate = false): number {
  const r = REGIONS[regionId];
  if (!r) return 0;
  const quiet = r.quieter && state.flags[r.quieter.flag] ? r.quieter.mult : 1;
  return r.gain * quiet * (lowRate ? E.lowRate : 1);
}

/** One step on a road. Returns true if an encounter happens now. */
export function stepDanger(road: RoadState, gain: number, terrain: Terrain, rng: Rng): boolean {
  if (road.repel > 0) {
    // The bell keeps things away: no danger builds and nothing turns up.
    road.repel--;
    if (road.cooldown > 0) road.cooldown--;
    return false;
  }
  road.gauge += gain * E.terrain[terrain];
  if (road.cooldown > 0) {
    road.cooldown--;
    return false;
  }
  const over = road.gauge - E.threshold;
  if (over > 0 && rng.chance(over / 100)) {
    road.gauge = 0;
    road.cooldown = E.cooldown;
    road.count++;
    return true;
  }
  return false;
}

/** Rings a Repel Bell. */
export function ringBell(road: RoadState): void {
  road.repel = E.repelSteps;
}

/** The roadside bell icon: still, swinging, ringing, or muffled by a Repel Bell. */
export function bellOf(road: RoadState): Bell {
  if (road.repel > 0) return 'muffled';
  if (road.gauge > E.threshold) return 'ringing';
  if (road.gauge > E.threshold * 0.6) return 'swinging';
  return 'still';
}

/** Chance that a battle is an Inspector patrol. */
export function inspectorChance(heat: number): number {
  return Math.min(E.inspectorBase + E.inspectorPerHeat * Math.max(0, heat), E.inspectorMax);
}

/** True while a letter is still to be delivered, wherever it is. */
function holds(state: GameState, letter: string): boolean {
  return (state.letters[letter]?.state ?? 'sealed') !== 'delivered';
}

/** Groups after delivered letters have changed the road. */
export function groupsFor(state: GameState, regionId: string): EnemyGroup[] {
  const r = REGIONS[regionId];
  if (!r) return [];
  return r.groups
    .filter((grp) => !(state.flags['hob.gone'] && grp.enemies.includes('reed')))
    .filter((grp) => !(state.flags['raiders.gone'] && grp.enemies.includes('raider')))
    .map((grp) => (state.flags['wire.friendly'] && grp.enemies.includes('wire') ? { ...grp, weight: grp.weight * 0.4 } : grp));
}

export function randomId(regionId: string, enemies: string[]): string {
  return `rand:${regionId}:${enemies.join('+')}`;
}

function pickGroup(groups: EnemyGroup[], rng: Rng): EnemyGroup | undefined {
  const total = groups.reduce((a, x) => a + x.weight, 0);
  let r = rng.next() * total;
  for (const grp of groups) {
    r -= grp.weight;
    if (r < 0) return grp;
  }
  return groups[groups.length - 1];
}

/** A battle for this region: the rare parcel, an Inspector patrol, or a regular group. */
export function battleFor(state: GameState, regionId: string, rng: Rng): string {
  const r = REGIONS[regionId];
  if (!r) throw new Error(`unknown region ${regionId}`);
  if (rng.chance(E.parcel)) return randomId(regionId, ['parcel']);
  if (rng.chance(inspectorChance(state.heat))) {
    const insp = `inspector-${r.inspectors}`;
    const team = state.heat >= E.seniorHeat ? [insp, `senior-${r.inspectors}`] : state.heat >= E.pairHeat ? [insp, insp] : [insp];
    return randomId(regionId, team);
  }
  const grp = pickGroup(groupsFor(state, regionId), rng);
  return randomId(regionId, grp?.enemies ?? ['hog']);
}

/**
 * What an encounter turns out to be: a held recipient's fight, a road event
 * (30%), or a battle (70%). Road events don't repeat until the region's pool
 * has run out. Call after `stepDanger` has counted the encounter.
 */
export function rollEncounter(state: GameState, regionId: string, rng: Rng): EncounterRoll {
  const r = REGIONS[regionId];
  if (!r) throw new Error(`unknown region ${regionId}`);
  const rec = r.recipient;
  const recipientDue = !!rec && holds(state, rec.letter) && !state.flags[rec.met];
  if (rec && recipientDue && state.road.count >= E.recipientBy) return { kind: 'battle', encounter: rec.encounter };
  if (r.events.length > 0 && !rng.chance(E.battleShare)) {
    let pool = r.events.filter((e) => !state.road.seen.includes(e));
    if (pool.length === 0) {
      state.road.seen = state.road.seen.filter((e) => !r.events.includes(e));
      pool = [...r.events];
    }
    const event = rng.pick(pool);
    state.road.seen.push(event);
    return { kind: 'event', event };
  }
  if (rec && recipientDue && rng.chance(E.recipientChance)) return { kind: 'battle', encounter: rec.encounter };
  return { kind: 'battle', encounter: battleFor(state, regionId, rng) };
}
