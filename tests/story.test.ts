/**
 * A headless playthrough of the whole story with scripted choices, reaching
 * every ending (CLAUDE.md, definition of done). It walks the same dialogue,
 * cutscenes and fights as the game, from the opening to the decree.
 */
import { describe, expect, it } from 'vitest';
import type { Action, Battle } from '../src/battle/battle';
import { statsAt } from '../src/data/party';
import { applyAll } from '../src/game/conditions';
import { type EndingId, selectEnding } from '../src/game/endings';
import { basicTactics, cutscene, type Director, fight, type Log, newLog, preferring, talk } from '../src/game/headless';
import { type GameState, newGame, PARTY_IDS } from '../src/game/state';
import { returnFromDetour, travel, travelOptions } from '../src/game/travel';
import { breakSeal } from '../src/letters/letters';
import { endingPages } from '../src/data/endings';

interface Plan {
  /** Hand Vane her letter mid-fight when it's offered. */
  deliverL18: boolean;
  /** Break this many seals at camp before the final act. */
  openSeals: number;
  /** Feed Biscuit enough apples for the secret ending, and give her the decree. */
  goat: boolean;
  /** Dawdle so Kingsend is out of reach. */
  late: boolean;
  truth: boolean;
  /** Take every detour (Gull's Rest by Brin's boat). */
  detours?: boolean;
}

function director(plan: Plan): Director {
  const prefs = [
    'Deliver',
    'Refuse',
    'With the miners',
    'Open the tin',
    plan.truth ? 'Tell them' : 'Say nothing',
    plan.goat ? 'Let Biscuit' : 'Sign it',
    'Tell Juniper',
    '“It was still',
    'Help',
    'Go on',
  ];
  return {
    choose: preferring(prefs),
    act(b: Battle): Action {
      if (plan.deliverL18) {
        const d = b.deliverOptions().find((o) => o.letter === 'L18');
        if (d) return { kind: 'deliver', letter: d.letter, target: d.target };
      }
      // Recipients met on the road always get their letter.
      const other = b.deliverOptions().find((o) => o.letter !== 'L18');
      if (other) return { kind: 'deliver', letter: other.letter, target: other.target };
      return basicTactics(b);
    },
  };
}

function strong(s: GameState, level: number): void {
  for (const id of PARTY_IDS) {
    const st = statsAt(id, level);
    s.members[id] = { level, xp: 12 * level + 3 * level * level, hp: st.hp, fp: st.fp };
  }
}

function rest(s: GameState): void {
  applyAll([{ heal: 1, fp: 1 }], s);
  for (const id of s.party) {
    const st = statsAt(id, s.members[id].level);
    s.members[id].hp = st.hp;
    s.members[id].fp = st.fp;
  }
}

function detour(s: GameState, to: string): void {
  const o = travelOptions(s).find((x) => x.kind === 'detour' && x.to === to);
  if (!o) throw new Error(`no detour to ${to}`);
  travel(s, o);
}

function next(s: GameState): void {
  const o = travelOptions(s).find((x) => x.kind === 'next');
  if (!o) throw new Error('no road on');
  travel(s, o);
}

function play(plan: Plan): { state: GameState; ending: EndingId; log: Log } {
  const s = newGame('Ada', 'story');
  strong(s, 14);
  const d = director(plan);
  const log = newLog();
  const go = (region: string, ...ids: string[]): void => {
    for (const id of ids) {
      rest(s);
      if (id.startsWith('cut:')) cutscene(s, id.slice(4), d, log, region);
      else if (id.startsWith('fight:')) fight(s, id.slice(6), d, log, region);
      else talk(s, id, d, log, region);
    }
  };

  // Thistle Cross and the road.
  go('thistle', 'cut:arrival', 'cut:office', 'ned', 'mayor', 'finch', 'road-start', 'cut:toll-dispute');
  if (plan.goat) for (let i = 0; i < 5; i++) applyAll([{ add: 'biscuit.trust', by: 1 }], s);
  next(s);
  // Bellwether Fen.
  go('fen', 'fen-road-start', 'fight:hob', 'cut:fen-arrive', 'lockup-window', 'grist', 'bea', 'sal', 'elsie');
  if (plan.detours) {
    detour(s, 'abbey');
    go('abbey', 'abbey-arrive', 'anselm', 'librarian', 'archive', 'crypt-door');
    returnFromDetour(s);
  }
  next(s);
  // Copperhill.
  go('copperhill', 'cop-road-start', 'fight:hask', 'cut:cop-arrive', 'brannigan', 'brannigan', 'dunnock', 'tarn', 'cut:brass');
  if (plan.detours) {
    detour(s, 'oldfront');
    go('oldfront', 'front-arrive', 'moss', 'squad-marker');
    returnFromDetour(s);
  }
  go('copperhill', 'cut:memorial-fenn');
  // Some players open letters along the way.
  const toOpen = ['L19', 'L20', 'L21', 'L22', 'L23', 'L24', 'L16', 'L17', 'L14'].slice(0, plan.openSeals);
  for (const id of toOpen) if (s.letters[id]?.state !== 'delivered') breakSeal(s, id);
  if (plan.late) s.day = 6;
  next(s);
  // The Salt Road.
  go('salt', 'salt-road-start', 'fight:wick', 'salt-arrive', 'quay', 'brin', 'cut:ambush', 'mara', 'camp');
  if (plan.detours) {
    detour(s, 'gulls');
    go('gulls', 'gulls-arrive', 'stairs', 'ines', 'barnaby');
    returnFromDetour(s);
  }
  if (plan.late) s.day = 7;
  next(s);
  if (!s.flags['reached.kingsend']) return { state: s, ending: selectEnding(s), log };
  // Kingsend.
  go('kingsend', 'kingsend-road-start', 'kingsend-arrive', 'pmg', 'palace', 'cut:outside');
  rest(s);
  const ended = cutscene(s, 'final', d, log, 'kingsend');
  expect(ended).toBe(true);
  return { state: s, ending: selectEnding(s), log };
}

const base: Plan = { deliverL18: true, openSeals: 0, goat: false, late: false, truth: false };

describe('a headless playthrough', () => {
  it('reaches the Last Post by delivering everything, unopened, and handing Vane her letter', () => {
    const { state, ending, log } = play(base);
    expect(ending).toBe('lastpost');
    expect(state.party).toEqual(['rookie', 'odile', 'fenn', 'juniper']);
    expect(state.flags['reveal.done']).toBe(true);
    expect(state.flags['fenn.letterRead']).toBe(true);
    expect(state.letters.L18?.state).toBe('delivered');
    expect(log.fights.find((f) => f.id === 'vane')?.result).toBe('delivered');
    const pages = endingPages(state, ending);
    expect(pages[0]?.title).toBe('Last Post');
    expect(pages.some((p) => p.letter?.signature === 'Odile')).toBe(true);
  });

  it('reaches the Goat Post when Biscuit trusts the party and gets the decree', () => {
    const { ending, state } = play({ ...base, goat: true });
    expect(ending).toBe('goat');
    expect(endingPages(state, ending).some((p) => !!p.tracking)).toBe(true);
  });

  it('reaches the Open Book after eight or more seals are broken', () => {
    const { ending, state, log } = play({ ...base, openSeals: 9, deliverL18: false });
    expect(state.heat).toBeGreaterThanOrEqual(8);
    expect(log.fights.some((f) => f.id === 'vane-seniors')).toBe(true);
    expect(ending).toBe('openbook');
  });

  it('reaches the Dead Letter when Kingsend is out of reach by the seventh day', () => {
    const { ending, state } = play({ ...base, late: true });
    expect(state.flags['reached.kingsend']).toBe(false);
    expect(ending).toBe('deadline');
    expect(endingPages(state, ending)[0]?.title).toBe('Dead Letter');
  });

  it('ends at the furnace when Vane is simply beaten', () => {
    const { ending, log } = play({ ...base, deliverL18: false });
    expect(log.fights.find((f) => f.id === 'vane')?.result).toBe('victory');
    expect(ending).toBe('furnace');
  });

  it('takes every detour, Gull’s Rest by Brin’s boat, delivers all 24 and still makes Kingsend by day 7', () => {
    const { state, ending } = play({ ...base, detours: true });
    expect(state.day).toBe(7);
    expect(Object.values(state.letters).every((l) => l.state === 'delivered')).toBe(true);
    expect(state.flags['fenn.squad']).toBe(true);
    expect(state.flags['moss.map']).toBe(true);
    expect(state.flags['archive.access']).toBe(true);
    expect(ending).toBe('lastpost');
    const text = endingPages(state, ending).flatMap((p) => p.lines).join(' ');
    expect(text).toContain('answers for himself');
  });

  it('remembers telling the truth, and the epilogue says so', () => {
    const { state, ending } = play({ ...base, truth: true });
    expect(state.flags['truth.L14']).toBe('truth');
    const text = endingPages(state, ending).flatMap((p) => p.lines).join(' ');
    expect(text).toContain('kind lie');
  });
});
