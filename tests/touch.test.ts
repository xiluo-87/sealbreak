import { describe, expect, it } from 'vitest';
import { Keyboard } from '../src/input/keyboard';
import { stickDirection } from '../src/input/touch';

describe('touch joystick', () => {
  it('ignores small movements inside the dead zone', () => {
    expect(stickDirection(5, 5)).toBeNull();
    expect(stickDirection(0, 0)).toBeNull();
  });

  it('picks the dominant axis', () => {
    expect(stickDirection(30, 4)).toBe('right');
    expect(stickDirection(-30, 10)).toBe('left');
    expect(stickDirection(8, 30)).toBe('down');
    expect(stickDirection(-8, -30)).toBe('up');
  });
});

describe('virtual presses', () => {
  it('press and release actions like keys do', () => {
    const k = new Keyboard();
    k.down('confirm');
    expect(k.wasPressed('confirm')).toBe(true);
    expect(k.isHeld('confirm')).toBe(true);
    k.endStep();
    k.down('confirm');
    expect(k.wasPressed('confirm')).toBe(false);
    k.up('confirm');
    expect(k.isHeld('confirm')).toBe(false);
  });

  it('track the newest direction', () => {
    const k = new Keyboard();
    k.down('left');
    k.down('up');
    expect(k.direction()).toBe('up');
    k.up('up');
    expect(k.direction()).toBe('left');
  });
});
