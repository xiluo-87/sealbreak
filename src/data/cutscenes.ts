import type { Cutscene } from '../game/cutscene';

export const CUTSCENES: Record<string, Cutscene> = Object.fromEntries(
  (
    [
      { id: 'arrival', steps: [{ wait: 400 }, { say: 'arrival' }, { then: [{ set: 'intro.arrived' }] }] },
      {
        id: 'office',
        steps: [
          { walk: 'player', path: ['up', 'up', 'up', 'up', 'up'] },
          { say: 'office-1' },
          { wait: 350 },
          { say: 'office-rats' },
          { battle: 'sorting-rats' },
          { say: 'office-after-rats' },
          { face: 'odile', dir: 'right' },
          { walk: 'odile', path: ['right', 'right', 'right', 'right'] },
          { say: 'office-2' },
          { then: [{ set: 'intro.sackTaken' }] },
          { walk: 'odile', path: ['down', 'down', 'left', 'left', 'left'] },
          { face: 'odile', dir: 'left' },
          { face: 'player', dir: 'right' },
          { say: 'office-3' },
          { walk: 'biscuit', path: ['left', 'left', 'up', 'up'] },
          { wait: 300 },
          { fade: 'out' },
          { then: [{ set: 'intro.lockingUp' }] },
          { warp: { map: 'thistle-cross', x: 19, y: 9, facing: 'up' } },
          { fade: 'in' },
          { wait: 300 },
          { say: 'office-4' },
        ],
      },
      {
        id: 'toll-dispute',
        steps: [
          { face: 'player', dir: 'right' },
          { walk: 'mudge', path: ['left', 'left'] },
          { face: 'mudge', dir: 'left' },
          { say: 'toll-1' },
          { battle: 'toll-dispute' },
          { say: 'toll-2' },
          { fade: 'out' },
          { warp: { map: 'thistle-road', x: 74, y: 4, facing: 'right' } },
          { fade: 'in' },
        ],
      },
      { id: 'fen-arrive', steps: [{ wait: 300 }, { say: 'fen-arrive-1' }] },
      { id: 'cop-arrive', steps: [{ wait: 300 }, { say: 'cop-arrive-1' }] },
      { id: 'brass', steps: [{ say: 'brass-1' }, { battle: 'brass' }, { say: 'brass-2' }] },
      { id: 'memorial-fenn', steps: [{ say: 'memorial-fenn' }, { read: 'FENN' }, { say: 'memorial-fenn-2' }] },
      {
        id: 'ambush',
        steps: [
          { say: 'ambush-1' },
          { battle: 'harbour-ambush' },
          { say: 'sorrel-1' },
          { say: 'reveal-1' },
          { read: 'GRAN', intro: 'You open the tin.', if: { flag: 'reveal.tin' } },
          { say: 'reveal-2' },
          { battle: 'sorrel' },
          { say: 'sorrel-after' },
        ],
      },
      { id: 'outside', steps: [{ say: 'outside-1' }, { battle: 'office' }, { say: 'outside-2' }] },
      {
        id: 'final',
        steps: [
          { say: 'vane-1' },
          { battle: 'vane' },
          { say: 'vane-reads', if: { flag: 'final.result', is: 'delivered' } },
          { say: 'vane-falls', if: { not: { flag: 'final.result', is: 'delivered' } } },
          { say: 'decree' },
          { ending: true },
        ],
      },
    ] satisfies Cutscene[]
  ).map((c) => [c.id, c]),
);
