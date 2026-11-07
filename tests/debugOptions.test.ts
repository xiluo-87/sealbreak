import { describe, expect, it } from 'vitest';
import { DEFAULT_SEED, MAX_SPEED, parseDebugOptions } from '../src/game/debugOptions';

describe('parseDebugOptions', () => {
  it('has sensible defaults', () => {
    expect(parseDebugOptions('')).toEqual({ overlay: false, seed: DEFAULT_SEED, speed: 1, sprites: false });
  });

  it('reads flags and values', () => {
    const o = parseDebugOptions('?debug&seed=abc&speed=2&sprites');
    expect(o).toEqual({ overlay: true, seed: 'abc', speed: 2, sprites: true });
  });

  it('reads region, level and heat', () => {
    expect(parseDebugOptions('?region=thistle&level=4&heat=6')).toMatchObject({ region: 'thistle', level: 4, heat: 6 });
    expect(parseDebugOptions('?heat=-2').heat).toBeUndefined();
    expect(parseDebugOptions('?level=99').level).toBe(15);
  });

  it('clamps or ignores bad speeds', () => {
    expect(parseDebugOptions('?speed=999').speed).toBe(MAX_SPEED);
    expect(parseDebugOptions('?speed=-1').speed).toBe(1);
    expect(parseDebugOptions('?speed=fast').speed).toBe(1);
  });
});
