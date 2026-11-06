import { describe, expect, it } from 'vitest';
import { FixedStepClock } from '../src/game/clock';

describe('FixedStepClock', () => {
  it('records the first timestamp without stepping', () => {
    const c = new FixedStepClock({ stepMs: 10 });
    expect(c.advance(1000)).toBe(0);
  });

  it('runs whole steps and carries the remainder', () => {
    const c = new FixedStepClock({ stepMs: 10 });
    c.advance(0);
    expect(c.advance(25)).toBe(2);
    expect(c.alpha).toBeCloseTo(0.5);
    expect(c.advance(30)).toBe(1);
    expect(c.steps).toBe(3);
  });

  it('clamps long frames to avoid a catch-up spiral', () => {
    const c = new FixedStepClock({ stepMs: 10, maxFrameMs: 100 });
    c.advance(0);
    expect(c.advance(5000)).toBe(10);
  });

  it('applies the game speed multiplier', () => {
    const c = new FixedStepClock({ stepMs: 10, speed: 2 });
    c.advance(0);
    expect(c.advance(50)).toBe(10);
  });

  it('ignores time going backwards', () => {
    const c = new FixedStepClock({ stepMs: 10 });
    c.advance(100);
    expect(c.advance(50)).toBe(0);
  });

  it('starts fresh after reset', () => {
    const c = new FixedStepClock({ stepMs: 10 });
    c.advance(0);
    c.advance(15);
    c.reset();
    expect(c.advance(10000)).toBe(0);
    expect(c.alpha).toBe(0);
  });
});
