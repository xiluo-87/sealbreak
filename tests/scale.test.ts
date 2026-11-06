import { describe, expect, it } from 'vitest';
import { computeScale } from '../src/render/scale';

describe('computeScale', () => {
  it('uses the largest whole scale that fits', () => {
    expect(computeScale(1920, 1080, 1)).toEqual({ scale: 3, cssWidth: 1920, cssHeight: 1080 });
    expect(computeScale(1919, 1080, 1).scale).toBe(2);
    expect(computeScale(1280, 1000, 1).scale).toBe(2);
  });

  it('scales in device pixels on high-density screens', () => {
    // A phone in landscape: 844x390 CSS px at 3x density.
    const r = computeScale(844, 390, 3);
    expect(r.scale).toBe(3);
    expect(r.cssWidth).toBeCloseTo(640);
    expect(r.cssHeight).toBeCloseTo(360);
  });

  it('never goes below 1x', () => {
    expect(computeScale(100, 100, 1).scale).toBe(1);
  });

  it('survives a bad device pixel ratio', () => {
    expect(computeScale(1280, 720, 0).scale).toBe(2);
    expect(computeScale(1280, 720, Number.NaN).scale).toBe(2);
  });
});
