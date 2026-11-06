import { describe, expect, it } from 'vitest';
import { animLength, frameAt } from '../src/sprites/anim';

describe('frameAt', () => {
  const loop = { durations: [100, 50, 50], loop: true };
  const once = { durations: [100, 50, 50], loop: false };

  it('steps through frames by duration', () => {
    expect(animLength(loop)).toBe(200);
    expect(frameAt(loop, 0)).toBe(0);
    expect(frameAt(loop, 99)).toBe(0);
    expect(frameAt(loop, 100)).toBe(1);
    expect(frameAt(loop, 160)).toBe(2);
  });

  it('wraps looping animations and holds one-shots on the last frame', () => {
    expect(frameAt(loop, 210)).toBe(0);
    expect(frameAt(once, 210)).toBe(2);
    expect(frameAt(once, 99999)).toBe(2);
  });

  it('treats negative time as the start', () => {
    expect(frameAt(loop, -5)).toBe(0);
  });
});
