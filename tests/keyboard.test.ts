import { describe, expect, it } from 'vitest';
import { actionForCode } from '../src/input/keyboard';

describe('keyboard mapping', () => {
  it('maps the documented keys', () => {
    expect(actionForCode('KeyW')).toBe('up');
    expect(actionForCode('ArrowLeft')).toBe('left');
    expect(actionForCode('Enter')).toBe('confirm');
    expect(actionForCode('Space')).toBe('confirm');
    expect(actionForCode('KeyZ')).toBe('confirm');
    expect(actionForCode('Escape')).toBe('cancel');
    expect(actionForCode('KeyX')).toBe('cancel');
    expect(actionForCode('ShiftLeft')).toBe('run');
    expect(actionForCode('KeyQ')).toBeUndefined();
  });
});
