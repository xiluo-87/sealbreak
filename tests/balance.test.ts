/**
 * The balance bot (CLAUDE.md, balance checks): plays the whole story with
 * natural experience, walking every road tile by tile so the danger gauge
 * and random encounters work as they do in the field. It rests at inns and
 * camps like a careful player, opens no seals and fights with the auto
 * tactics. It reports encounters, levels, fight lengths and a rough play
 * time, and checks them against the targets with some slack.
 */
import { describe, expect, it } from 'vitest';
import type { Action, Battle } from '../src/battle/battle';
import { MAPS } from '../src/data/maps';
import { statsAt } from '../src/data/party';
import { REGIONS } from '../src/data/regions';
import { DIALOGUE } from '../src/data/dialogue';
import { parseMap, solidAt, type ParsedMap } from '../src/field/maps';
import { enterRoad, regionGain, rollEncounter, stepDanger, terrainOf } from '../src/game/encounters';
import { selectEnding } from '../src/game/endings';
import { basicTactics, cutscene, type Director, fight, type Log, newLog, preferring, talk } from '../src/game/headless';
import { Rng } from '../src/game/rng';
import { type GameState, newGame } from '../src/game/state';
import { returnFromDetour, travel, travelOptions } from '../src/game/travel';

type Pt = [number, number];

const director: Director = {
  choose: preferring(['Deliver', 'Refuse', 'With the miners', 'Open the tin', 'Say nothing', 'Sign it', 'Tell Juniper', '“It was still', 'Help', 'Go on']),
  act(b: Battle): Action {
    const d = b.deliverOptions()[0];
    if (d) return { kind: 'deliver', letter: d.letter, target: d.target };
    return basicTactics(b);
  },
};

/** Shortest walk between two tiles; if the target is solid, to the nearest open tile beside it. */
function path(m: ParsedMap, from: Pt, to: Pt): Pt[] {
  const w = m.width;
  const prev = new Map<number, number>();
  const start = from[1] * w + from[0];
  prev.set(start, -1);
  const queue = [start];
  let best = start;
  let bestD = Infinity;
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi] ?? 0;
    const x = cur % w;
    const y = Math.floor(cur / w);
    const d = Math.abs(x - to[0]) + Math.abs(y - to[1]);
    if (d < bestD) {
      bestD = d;
      best = cur;
      if (d === 0) break;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= m.height || solidAt(m, nx, ny)) continue;
      const k = ny * w + nx;
      if (prev.has(k)) continue;
      prev.set(k, cur);
      queue.push(k);
    }
  }
  const out: Pt[] = [];
  for (let k = best; k !== start && k >= 0; k = prev.get(k) ?? -1) out.unshift([k % w, Math.floor(k / w)]);
  return out;
}

interface Stats {
  steps: number;
  random: number;
  events: number;
  defeats: string[];
  randomTurns: number[];
  levelAtVane: number;
  log: Log;
}

function heal(s: GameState, fpShare = 1): void {
  for (const id of s.party) {
    const st = statsAt(id, s.members[id].level);
    s.members[id].hp = st.hp;
    s.members[id].fp = Math.max(s.members[id].fp, Math.round(st.fp * fpShare));
  }
}

function play(seed: string): Stats {
  const s = newGame('Bot', seed);
  const log = newLog();
  const stats: Stats = { steps: 0, random: 0, events: 0, defeats: [], randomTurns: [], levelAtVane: 0, log };

  const go = (region: string, ...ids: string[]): void => {
    for (const id of ids) {
      if (id.startsWith('cut:')) cutscene(s, id.slice(4), director, log, region);
      else if (id.startsWith('fight:')) {
        const r = fight(s, id.slice(6), director, log, region);
        if (r === 'defeat') {
          stats.defeats.push(id);
          heal(s);
          fight(s, id.slice(6), director, log, region);
        }
      } else talk(s, id, director, log, region);
    }
  };

  /** Walk a road map through each waypoint, rolling for encounters on every step. */
  const walk = (mapId: string, ...points: Pt[]): void => {
    const def = MAPS[mapId];
    if (!def) throw new Error(`no map ${mapId}`);
    const m = parseMap(def);
    const region = def.region;
    if (s.mapId !== mapId) enterRoad(s.road);
    s.mapId = mapId;
    let at = points[0] as Pt;
    for (const target of points.slice(1)) {
      for (const p of path(m, at, target)) {
        at = p;
        stats.steps++;
        if (!REGIONS[region]) continue;
        const rng = Rng.fromState(s.rng);
        const tile = def.grid[p[1]]?.[p[0]] ?? '.';
        const hit = stepDanger(s.road, regionGain(s, region), terrainOf(tile), rng);
        const roll = hit ? rollEncounter(s, region, rng) : null;
        s.rng = rng.getState();
        if (!roll) continue;
        if (roll.kind === 'event') {
          stats.events++;
          if (DIALOGUE[`event-${roll.event}`]) talk(s, `event-${roll.event}`, director, log, region);
          continue;
        }
        stats.random++;
        const before = log.fights.length;
        const r = fight(s, roll.encounter, director, log, region);
        stats.randomTurns.push(log.fights[before]?.turns ?? 0);
        if (r === 'defeat') {
          // A player would reload; the bot just picks itself up.
          stats.defeats.push(roll.encounter);
          heal(s);
        }
      }
    }
  };

  const next = (): void => {
    const o = travelOptions(s).find((x) => x.kind === 'next');
    if (!o) throw new Error('no road on');
    travel(s, o);
    heal(s, s.flags['abbey.blessing'] ? 1 : 0.5);
  };
  const detour = (to: string): void => {
    const o = travelOptions(s).find((x) => x.kind === 'detour' && x.to === to);
    if (!o) throw new Error(`no detour to ${to}`);
    travel(s, o);
  };
  const inn = (): void => heal(s);
  /** A road's recipient turns up by the third encounter; if the walk was too quiet for that, meet them now. */
  const meet = (region: string, id: string): void => {
    if (!s.flags[`${id}.met`]) go(region, `fight:${id}`);
  };

  go('thistle', 'cut:arrival', 'cut:office', 'ned', 'mayor', 'finch', 'road-start');
  walk('thistle-road', [1, 5], [64, 4]);
  go('thistle', 'cut:toll-dispute');
  walk('thistle-road', [64, 4], [83, 4]);
  next();

  go('fen', 'fen-road-start');
  walk('fen-road', [1, 14], [85, 21]);
  meet('fen', 'hob');
  go('fen', 'cut:fen-arrive', 'lockup-window', 'grist', 'bea', 'sal', 'elsie');
  inn();
  detour('abbey');
  go('abbey', 'abbey-arrive');
  walk('mirrow-abbey', [1, 12], [52, 11], [60, 9], [59, 18]);
  go('abbey', 'anselm', 'librarian', 'archive', 'crypt-door');
  walk('mirrow-abbey', [59, 18], [1, 12]);
  returnFromDetour(s);
  next();

  go('copperhill', 'cop-road-start');
  walk('copperhill-road', [1, 12], [85, 9]);
  meet('copperhill', 'hask');
  inn();
  go('copperhill', 'cut:cop-arrive', 'brannigan', 'brannigan', 'dunnock', 'tarn');
  inn();
  go('copperhill', 'cut:brass');
  detour('oldfront');
  go('oldfront', 'front-arrive');
  walk('old-front', [1, 12], [57, 9], [56, 14], [1, 12]);
  go('oldfront', 'moss', 'squad-marker');
  returnFromDetour(s);
  go('copperhill', 'cut:memorial-fenn');
  next();

  go('salt', 'salt-road-start');
  walk('salt-road', [1, 12], [85, 7]);
  meet('salt', 'wick');
  go('salt', 'salt-arrive', 'quay', 'brin');
  inn();
  go('salt', 'cut:ambush', 'mara', 'camp');
  detour('gulls');
  go('gulls', 'gulls-arrive');
  walk('gulls-rest', [1, 14], [47, 11]);
  go('gulls', 'stairs');
  walk('gulls-rest', [47, 11], [55, 9], [52, 10]);
  go('gulls', 'ines', 'barnaby');
  walk('gulls-rest', [52, 10], [1, 14]);
  returnFromDetour(s);
  next();

  go('kingsend', 'kingsend-road-start');
  walk('kingsend-road', [1, 12], [85, 6]);
  go('kingsend', 'kingsend-arrive', 'pmg', 'palace');
  inn();
  go('kingsend', 'cut:outside');
  stats.levelAtVane = s.members.rookie.level;
  heal(s);
  cutscene(s, 'final', director, log, 'kingsend');
  expect(selectEnding(s)).toBeDefined();
  return stats;
}

/** A rough play time, in minutes: walking with some wandering, reading, fighting and menus. */
function minutes(st: Stats): number {
  const walking = (st.steps * 1.8) / 5;
  const reading = st.log.lines.length * 3;
  const fighting = st.log.fights.reduce((a, f) => a + f.turns * 3.2, 0);
  const menus = 12 * 60;
  return (walking + reading + fighting + menus) / 60;
}

describe('the balance bot', () => {
  const runs = ['balance-1', 'balance-2', 'balance-3'].map((seed) => ({ seed, st: play(seed) }));

  it('reports what it found', () => {
    for (const { seed, st } of runs) {
      const turns = st.randomTurns;
      const avg = turns.reduce((a, b) => a + b, 0) / Math.max(1, turns.length);
      console.log(
        `${seed}: ${st.random} random fights (${st.events} events), ${st.steps} road steps, level ${st.levelAtVane} at Vane, ` +
          `${avg.toFixed(1)} turns per random fight, about ${Math.round(minutes(st))} minutes, defeats: ${st.defeats.join(', ') || 'none'}`,
      );
    }
    expect(runs.length).toBe(3);
  });

  it('meets about 18 random encounters', () => {
    for (const { st } of runs) {
      expect(st.random).toBeGreaterThanOrEqual(12);
      expect(st.random).toBeLessThanOrEqual(26);
    }
  });

  it('reaches about level 12 by the final boss', () => {
    for (const { st } of runs) {
      expect(st.levelAtVane).toBeGreaterThanOrEqual(10);
      expect(st.levelAtVane).toBeLessThanOrEqual(14);
    }
  });

  it('keeps random fights short and the whole story near 90 minutes', () => {
    for (const { st } of runs) {
      const avg = st.randomTurns.reduce((a, b) => a + b, 0) / Math.max(1, st.randomTurns.length);
      // 1–2 minutes at roughly 3 seconds a turn.
      expect(avg).toBeGreaterThanOrEqual(12);
      expect(avg).toBeLessThanOrEqual(45);
      expect(minutes(st)).toBeGreaterThan(60);
      expect(minutes(st)).toBeLessThan(130);
    }
  });

  it('can beat the bosses without opening a seal, though not always first time', () => {
    for (const { st } of runs) {
      const bossLosses = st.defeats.filter((d) => d.startsWith('fight:'));
      expect(bossLosses.length).toBeLessThanOrEqual(3);
    }
  });
});
