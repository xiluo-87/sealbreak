import { describe, expect, it } from 'vitest';
import { hex, rgbOf, toHex, toOklab } from '../src/sprites/color';
import { ik } from '../src/sprites/characters/kit';
import { manual, ramp } from '../src/sprites/palette';
import { cleanup, nearest, renderFrame, snapToPalette } from '../src/sprites/pipeline';
import { resolveBones, type Rig } from '../src/sprites/rig';
import { rect } from '../src/sprites/shapes';

const box = manual('box', ['#e0e0e0', '#a0a0a0', '#606060', '#303030'], '#101010');
const red = manual('red', ['#ff8080', '#e04040', '#a02020', '#601010'], '#300808');

function rig(partial: Partial<Rig> = {}): Rig {
  return {
    id: 'test',
    width: 12,
    height: 12,
    materials: { box, red },
    bones: [{ name: 'root', x: 0, y: 0 }],
    parts: [{ name: 'a', bone: 'root', z: 0, material: 'box', shape: rect(2, 2, 8, 8) }],
    details: [],
    ...partial,
  };
}

function px(frame: { rgba: Uint8ClampedArray; width: number }, x: number, y: number): string {
  const i = (y * frame.width + x) * 4;
  if (frame.rgba[i + 3] === 0) return 'clear';
  return toHex(((frame.rgba[i] ?? 0) << 16) | ((frame.rgba[i + 1] ?? 0) << 8) | (frame.rgba[i + 2] ?? 0));
}

describe('colour', () => {
  it('round-trips hex', () => {
    expect(toHex(hex('#56739a'))).toBe('#56739a');
    expect(rgbOf(hex('#010203'))).toEqual([1, 2, 3]);
  });

  it('builds ramps that get steadily darker', () => {
    const m = ramp('coat', '#56739a');
    const L = [...m.tones, m.outline].map((c) => toOklab(c).L);
    for (let i = 1; i < L.length; i++) expect(L[i]).toBeLessThan(L[i - 1] ?? 0);
  });

  it('snaps to the nearest palette colour and makes alpha binary', () => {
    const palette = [hex('#000000'), hex('#ffffff'), hex('#ff0000')];
    expect(nearest(hex('#f01010'), palette)).toBe(hex('#ff0000'));
    const rgba = new Uint8ClampedArray([250, 240, 245, 200, 10, 10, 10, 40]);
    snapToPalette(rgba, palette);
    expect(Array.from(rgba)).toEqual([255, 255, 255, 255, 0, 0, 0, 0]);
  });
});

describe('cleanup', () => {
  it('removes single-pixel islands and fills pinholes', () => {
    const w = 5;
    const owner = new Int16Array(25).fill(-1);
    owner[0] = 0; // island
    for (let y = 1; y < 4; y++) for (let x = 1; x < 4; x++) owner[y * w + x] = 1;
    owner[2 * w + 2] = -1; // pinhole
    cleanup(owner, w, 5, [false, false]);
    expect(owner[0]).toBe(-1);
    expect(owner[2 * w + 2]).toBe(1);
  });

  it('keeps thin parts intact', () => {
    const owner = new Int16Array(9).fill(-1);
    owner[4] = 0;
    cleanup(owner, 3, 3, [true]);
    expect(owner[4]).toBe(0);
  });
});

describe('renderFrame', () => {
  it('lights the upper left, shades the lower right and outlines selectively', () => {
    const f = renderFrame(rig());
    expect(px(f, 2, 2)).toBe(toHex(box.tones[0]));
    expect(px(f, 5, 5)).toBe(toHex(box.tones[1]));
    expect(px(f, 9, 9)).toBe(toHex(box.tones[2]));
    // Lit side of the outline uses the deep tone, the shadow side the outline colour.
    expect(px(f, 5, 1)).toBe(toHex(box.tones[3]));
    expect(px(f, 1, 5)).toBe(toHex(box.tones[3]));
    expect(px(f, 10, 5)).toBe(toHex(box.outline));
    expect(px(f, 5, 10)).toBe(toHex(box.outline));
    expect(px(f, 0, 0)).toBe('clear');
  });

  it('casts shadows and separation lines from parts in front', () => {
    const f = renderFrame(
      rig({
        width: 16,
        height: 16,
        parts: [
          { name: 'back', bone: 'root', z: 0, material: 'box', shape: rect(2, 2, 12, 12) },
          { name: 'front', bone: 'root', z: 1, material: 'red', shape: rect(4, 4, 4, 2), cast: 2 },
        ],
      }),
    );
    // Directly below the front part: separation line (deep) then cast shadow.
    expect(px(f, 5, 6)).toBe(toHex(box.tones[3]));
    expect(px(f, 5, 7)).toBe(toHex(box.tones[2]));
    expect(px(f, 5, 9)).toBe(toHex(box.tones[1]));
  });

  it('draws details clipped to parts and flips them when mirrored', () => {
    const details = [{ bone: 'root', x: 3, y: 3, grid: ['ab'], key: { a: 'red:0', b: 'red:3' }, clip: ['a'] }];
    const f = renderFrame(rig({ details }));
    expect(px(f, 3, 3)).toBe(toHex(red.tones[0]));
    expect(px(f, 4, 3)).toBe(toHex(red.tones[3]));
    const m = renderFrame(rig({ details, mirror: true }));
    // x 3..4 maps to 8..7 and the grid reverses.
    expect(px(m, 8, 3)).toBe(toHex(red.tones[0]));
    expect(px(m, 7, 3)).toBe(toHex(red.tones[3]));
    const clipped = renderFrame(rig({ details: [{ ...details[0]!, x: 0, y: 0 }] }));
    expect(px(clipped, 0, 0)).toBe('clear');
  });

  it('keeps the light upper-left when mirrored', () => {
    const m = renderFrame(rig({ mirror: true }));
    expect(px(m, 2, 2)).toBe(toHex(box.tones[0]));
    expect(px(m, 9, 9)).toBe(toHex(box.tones[2]));
  });

  it('shows parts only when their flags match', () => {
    const r = rig({ parts: [{ name: 'a', bone: 'root', z: 0, material: 'box', shape: rect(2, 2, 8, 8), when: 'on' }] });
    expect(px(renderFrame(r), 5, 5)).toBe('clear');
    expect(px(renderFrame(r, { flags: ['on'] }), 5, 5)).not.toBe('clear');
  });

  it('is deterministic', () => {
    const a = renderFrame(rig(), { bones: { root: { rot: 13, x: 0.3 } } });
    const b = renderFrame(rig(), { bones: { root: { rot: 13, x: 0.3 } } });
    expect(Array.from(a.rgba)).toEqual(Array.from(b.rgba));
  });

  it('rejects unknown materials, bones and colour keys', () => {
    expect(() => renderFrame(rig({ parts: [{ name: 'a', bone: 'root', z: 0, material: 'nope', shape: rect(1, 1, 2, 2) }] }))).toThrow(/material/);
    expect(() => renderFrame(rig({ parts: [{ name: 'a', bone: 'ghost', z: 0, material: 'box', shape: rect(1, 1, 2, 2) }] }))).toThrow(/bone/);
    expect(() => renderFrame(rig({ details: [{ bone: 'root', x: 0, y: 0, grid: ['z'], key: {} }] }))).toThrow(/colour/);
  });
});

describe('rig', () => {
  it('composes bone transforms down the hierarchy', () => {
    const bones = resolveBones(
      rig({
        bones: [
          { name: 'root', x: 10, y: 10 },
          { name: 'arm', parent: 'root', x: 5, y: 0 },
        ],
      }),
      { bones: { root: { rot: 90 } } },
    );
    const m = bones.get('arm')!;
    expect(m[4]).toBeCloseTo(10);
    expect(m[5]).toBeCloseTo(15);
  });

  it('solves two-bone IK with the requested bend', () => {
    const { joint, end } = ik([0, 0], [0, 10], 6, 6, 1);
    expect(Math.hypot(joint[0], joint[1])).toBeCloseTo(6);
    expect(Math.hypot(end[0] - joint[0], end[1] - joint[1])).toBeCloseTo(6);
    expect(joint[0]).toBeLessThan(0);
    expect(ik([0, 0], [0, 10], 6, 6, -1).joint[0]).toBeGreaterThan(0);
    // Out of reach: the limb straightens toward the target.
    const far = ik([0, 0], [0, 50], 6, 6, 1);
    expect(far.end[1]).toBeCloseTo(12, 1);
  });
});
