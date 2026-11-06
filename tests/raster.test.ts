import { describe, expect, it } from 'vitest';
import { coverage, FULL_COVERAGE, rasterize } from '../src/sprites/raster';
import { capsule, ellipse, path, poly, rect } from '../src/sprites/shapes';

const count = (m: Uint8Array): number => m.reduce((a, b) => a + b, 0);

describe('rasteriser', () => {
  it('fills whole-pixel rectangles exactly', () => {
    const m = rasterize(rect(1, 1, 3, 2), 6, 4);
    expect(count(m)).toBe(6);
    expect(m[1 * 6 + 1]).toBe(1);
    expect(m[0]).toBe(0);
  });

  it('thresholds partial coverage to hard pixels', () => {
    const cov = coverage(rect(0.5, 0, 2, 1), 4, 1);
    expect(Array.from(cov)).toEqual([FULL_COVERAGE / 2, FULL_COVERAGE, FULL_COVERAGE / 2, 0]);
    expect(count(rasterize(rect(0.5, 0, 2, 1), 4, 1, 0.5))).toBe(3);
    expect(count(rasterize(rect(0.5, 0, 2, 1), 4, 1, 0.6))).toBe(1);
  });

  it('unions overlapping contours in one shape', () => {
    const m = rasterize([...rect(0, 0, 3, 3), ...rect(2, 2, 3, 3)], 6, 6);
    expect(count(m)).toBe(9 + 9 - 1);
  });

  it('normalises winding so reversed polygons still fill', () => {
    const cw = rasterize(poly(0, 0, 4, 0, 4, 4, 0, 4), 5, 5);
    const ccw = rasterize(poly(0, 0, 0, 4, 4, 4, 4, 0), 5, 5);
    expect(Array.from(ccw)).toEqual(Array.from(cw));
    expect(count(cw)).toBe(16);
  });

  it('parses absolute and relative paths with curves', () => {
    expect(count(rasterize(path('M 0 0 L 4 0 L 4 4 L 0 4 Z'), 6, 6))).toBe(16);
    expect(count(rasterize(path('M 1 1 l 3 0 l 0 3 l -3 0 z'), 6, 6))).toBe(9);
    const curved = count(rasterize(path('M 0 4 Q 4 -4 8 4 Z'), 10, 6));
    expect(curved).toBeGreaterThan(8);
    expect(curved).toBeLessThan(24);
  });

  it('approximates circle area', () => {
    const area = count(rasterize(ellipse(10, 10, 6, 6), 20, 20));
    expect(Math.abs(area - Math.PI * 36)).toBeLessThan(6);
  });

  it('draws capsules between two points', () => {
    const m = rasterize(capsule(2, 2, 1.5, 12, 2, 1.5), 16, 5);
    for (let x = 2; x <= 12; x++) expect(m[2 * 16 + x]).toBe(1);
    expect(m[2 * 16 + 15]).toBe(0);
  });

  it('clips shapes to the canvas', () => {
    expect(() => rasterize(rect(-5, -5, 20, 20), 4, 4)).not.toThrow();
    expect(count(rasterize(rect(-5, -5, 20, 20), 4, 4))).toBe(16);
  });
});
