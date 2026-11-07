import { describe, expect, it } from 'vitest';
import { cameraFor } from '../src/field/camera';
import { parseMap, solidAt, type MapDef } from '../src/field/maps';
import { advance, feet, mover, TILE, tryStep, WALK_MS_PER_TILE } from '../src/field/movement';

describe('tile movement', () => {
  it('steps one tile in the walking time and reports leftover time', () => {
    const m = mover(2, 2);
    expect(tryStep(m, 'right', () => false)).toBe(true);
    expect(m.tx).toBe(3);
    expect(advance(m, WALK_MS_PER_TILE / 2, WALK_MS_PER_TILE)).toBe(-1);
    expect(feet(m).x).toBe(Math.round(2.5 * TILE + TILE / 2));
    expect(advance(m, WALK_MS_PER_TILE / 2 + 30, WALK_MS_PER_TILE)).toBeCloseTo(30);
    expect(m.moving).toBe(false);
    expect(feet(m).x).toBe(3 * TILE + TILE / 2);
  });

  it('turns but does not move into a blocked tile', () => {
    const m = mover(2, 2, 'down');
    expect(tryStep(m, 'up', (x, y) => x === 2 && y === 1)).toBe(false);
    expect(m.facing).toBe('up');
    expect(m.ty).toBe(2);
  });

  it('cannot start a new step mid-step', () => {
    const m = mover(0, 0);
    tryStep(m, 'right', () => false);
    expect(tryStep(m, 'down', () => false)).toBe(false);
    expect(m.facing).toBe('right');
  });
});

describe('camera', () => {
  it('centres on the focus and clamps to the map', () => {
    expect(cameraFor(500, 400, 1280, 960, 640, 360)).toEqual({ x: 180, y: 220 });
    expect(cameraFor(10, 10, 1280, 960, 640, 360)).toEqual({ x: 0, y: 0 });
    expect(cameraFor(1270, 950, 1280, 960, 640, 360)).toEqual({ x: 640, y: 600 });
  });

  it('centres maps smaller than the screen', () => {
    expect(cameraFor(100, 100, 512, 352, 640, 360)).toEqual({ x: -64, y: -4 });
  });
});

describe('map parsing', () => {
  const def: MapDef = {
    id: 't',
    name: 'Test',
    kind: 'town',
    region: 'test',
    grid: ['.....', '.KKK.', '.KDK.', '..._.'],
    exits: [],
    npcs: [],
    events: [],
  };

  it('finds buildings and their doors', () => {
    const m = parseMap(def);
    expect(m.buildings).toHaveLength(1);
    expect(m.buildings[0]).toMatchObject({ x: 1, y: 1, w: 3, h: 2, door: { x: 2, y: 2 } });
    expect(solidAt(m, 1, 1)).toBe(true);
    expect(solidAt(m, 2, 2)).toBe(false);
    expect(solidAt(m, 0, 0)).toBe(false);
    expect(solidAt(m, -1, 0)).toBe(true);
  });

  it('rejects ragged rows and unknown tiles', () => {
    expect(() => parseMap({ ...def, grid: ['...', '..'] })).toThrow(/wide/);
    expect(() => parseMap({ ...def, grid: ['.?.'] })).toThrow(/unknown/);
  });
});
