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
      { id: 'road-goose', steps: [{ say: 'goose-appears' }, { battle: 'road-goose' }] },
      { id: 'road-hogs', steps: [{ say: 'hogs-appear' }, { battle: 'road-hogs' }] },
      { id: 'road-brigand', steps: [{ say: 'brigand-appears' }, { battle: 'road-brigand' }] },
    ] satisfies Cutscene[]
  ).map((c) => [c.id, c]),
);
