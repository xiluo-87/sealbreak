import { describe, expect, it } from 'vitest';
import { computeScale } from '../src/render/scale';

describe('computeScale', () => {
  it('uses the largest whole scale that fits', () => {
    expect(computeScale(1920, 1080, 1)).toEqual({ scale: 3, integer: true, cssWidth: 1920, cssHeight: 1080 });
    expect(computeScale(2000, 1000, 1)).toMatchObject({ scale: 2, integer: true });
    expect(computeScale(1280, 1000, 1)).toMatchObject({ scale: 2, integer: true });
  });

  it('scales in device pixels on high-density screens', () => {
    // A phone in landscape: 844x390 CSS px at 3x density.
    const r = computeScale(844, 390, 3);
    expect(r.scale).toBe(3);
    expect(r.cssWidth).toBeCloseTo(640);
    expect(r.cssHeight).toBeCloseTo(360);
  });

  it('scales to fit when whole numbers would leave much of the screen empty', () => {
    // The same phone with the browser's bars showing: 2x would fill only 70%.
    const r = computeScale(844, 340, 3);
    expect(r.integer).toBe(false);
    expect(r.cssHeight).toBeCloseTo(340);
    expect(r.cssWidth).toBeCloseTo((340 * 640) / 360);
    // A small window at 1x density.
    expect(computeScale(500, 300, 1)).toMatchObject({ integer: false, cssWidth: 500, cssHeight: 281.25 });
  });

  it('keeps whole numbers when they fill most of the space', () => {
    expect(computeScale(1400, 760, 1)).toMatchObject({ scale: 2, integer: true });
  });

  it('survives a bad device pixel ratio or a zero-sized window', () => {
    expect(computeScale(1280, 720, 0).scale).toBe(2);
    expect(computeScale(1280, 720, Number.NaN).scale).toBe(2);
    expect(computeScale(0, 0, 1).cssWidth).toBeGreaterThan(0);
  });
});
