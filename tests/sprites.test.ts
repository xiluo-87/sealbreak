import { describe, expect, it } from 'vitest';
import { buildSet } from '../src/sprites/build';
import { ALL_CHARACTERS } from '../src/sprites/characters';
import { EXPRESSIONS } from '../src/sprites/characters/portraitKit';
import { paletteColours } from '../src/sprites/palette';
import { type Frame, renderFrame, silhouette } from '../src/sprites/pipeline';
import { type SpriteSetDef, SPRITE_SIZES } from '../src/sprites/types';
import { validateRig } from '../src/sprites/validate';

const sets: SpriteSetDef[] = ALL_CHARACTERS.flatMap((c) => c.sets());
const built = new Map(sets.map((s) => [s.id, buildSet(s)]));

// Frame counts from docs/DESIGN.md section 13.1.
const BATTLE_FRAMES: Record<string, number> = {
  idle: 4,
  attack: 5,
  read: 5,
  breakSeal: 6,
  hit: 2,
  guard: 2,
  knockedOut: 3,
  victory: 4,
};

function frames(id: string, anim: string): Frame[] {
  const f = built.get(id)?.anims.get(anim);
  if (!f) throw new Error(`missing ${id} ${anim}`);
  return f;
}

describe('character sprite sets', () => {
  for (const ch of ALL_CHARACTERS) {
    describe(ch.name, () => {
      const mine = sets.filter((s) => s.character === ch.id);

      it('has field sprites in four directions with idle 2 and walk 6', () => {
        for (const view of ['down', 'up', 'left', 'right'] as const) {
          const set = mine.find((s) => s.kind === 'field' && s.view === view);
          expect(set, view).toBeDefined();
          expect(set?.anims.find((a) => a.name === 'idle')?.frames).toHaveLength(2);
          expect(set?.anims.find((a) => a.name === 'walk')?.frames).toHaveLength(6);
        }
      });

      it('has a battle sprite with every animation', () => {
        const set = mine.find((s) => s.kind === 'battle');
        expect(set).toBeDefined();
        for (const [name, n] of Object.entries(BATTLE_FRAMES)) {
          expect(set?.anims.find((a) => a.name === name)?.frames, name).toHaveLength(n);
        }
      });

      it('has a portrait with five expressions, each with blink and mouth frames', () => {
        const set = mine.find((s) => s.kind === 'portrait');
        expect(set).toBeDefined();
        for (const expr of EXPRESSIONS) {
          const a = set?.anims.find((x) => x.name === expr);
          expect(a, expr).toBeDefined();
          const flags = a?.frames.flatMap((f) => f.flags ?? []) ?? [];
          expect(flags).toContain(`e-${expr}-blink`);
          expect(flags).toContain(`m-${expr}-open`);
          expect(flags).toContain(`m-${expr}-half`);
        }
      });
    });
  }
});

describe('sprite rigs', () => {
  for (const set of sets) {
    it(`${set.id}: references resolve`, () => {
      expect(validateRig(set.rig)).toEqual([]);
    });

    it(`${set.id}: frames have the documented size and stay on the palette`, () => {
      const size = SPRITE_SIZES[set.kind];
      const palette = new Set(paletteColours(Object.values(set.rig.materials)));
      for (const list of built.get(set.id)?.anims.values() ?? []) {
        for (const f of list) {
          expect(f.width).toBe(size.width);
          expect(f.height).toBe(size.height);
          for (let i = 0; i < f.rgba.length; i += 4) {
            const a = f.rgba[i + 3];
            expect(a === 0 || a === 255).toBe(true);
            if (a === 255) {
              const c = ((f.rgba[i] ?? 0) << 16) | ((f.rgba[i + 1] ?? 0) << 8) | (f.rgba[i + 2] ?? 0);
              expect(palette.has(c)).toBe(true);
            }
          }
        }
      }
    });
  }

  it('idle and walk frames never touch the frame edge', () => {
    for (const set of sets) {
      for (const anim of ['idle', 'walk']) {
        const list = built.get(set.id)?.anims.get(anim);
        if (!list || set.kind === 'portrait') continue;
        for (const f of list) {
          const { width: w, height: h } = f;
          for (let x = 0; x < w; x++) {
            expect(f.rgba[x * 4 + 3], `${set.id} ${anim} top`).toBe(0);
          }
          for (let y = 0; y < h; y++) {
            expect(f.rgba[(y * w) * 4 + 3], `${set.id} ${anim} left`).toBe(0);
            expect(f.rgba[(y * w + w - 1) * 4 + 3], `${set.id} ${anim} right`).toBe(0);
          }
        }
      }
    }
  });

  it('renders the same pixels every time', () => {
    for (const set of sets.slice(0, 3)) {
      const pose = set.anims[0]?.frames[0] ?? {};
      expect(Array.from(renderFrame(set.rig, pose).rgba)).toEqual(Array.from(renderFrame(set.rig, pose).rgba));
    }
  });

  it('animations actually move', () => {
    for (const set of sets) {
      for (const a of set.anims) {
        const list = built.get(set.id)?.anims.get(a.name) ?? [];
        const distinct = new Set(list.map((f) => Array.from(f.rgba).join(',')));
        expect(distinct.size, `${set.id} ${a.name}`).toBeGreaterThan(1);
      }
    }
  });
});

describe('silhouette test (design 13.4)', () => {
  it('tells every party member apart in solid black at field size', () => {
    const ids = ALL_CHARACTERS.map((c) => c.id);
    for (const view of ['down', 'left', 'up'] as const) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = silhouette(frames(`${ids[i]}-field-${view}`, 'idle')[0]!);
          const b = silhouette(frames(`${ids[j]}-field-${view}`, 'idle')[0]!);
          let inter = 0;
          let uni = 0;
          for (let k = 0; k < a.length; k++) {
            if (a[k] && b[k]) inter++;
            if (a[k] || b[k]) uni++;
          }
          // Bodies overlap a lot at this size; what matters is that the
          // distinctive shapes (cap, satchel, bun, stick) add up to a clear
          // difference: at least 50 pixels and 10% of the combined outline.
          expect(uni - inter, `${ids[i]} vs ${ids[j]} ${view}`).toBeGreaterThanOrEqual(50);
          expect(inter / uni, `${ids[i]} vs ${ids[j]} ${view}`).toBeLessThan(0.9);
        }
      }
    }
  });
});
