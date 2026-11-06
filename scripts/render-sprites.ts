/**
 * Renders sprite contact sheets to PNG for checking art outside the browser.
 *
 *   npx tsx scripts/render-sprites.ts [--scale 4] [--out dir] [--only rookie-field] [--anim walk]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSet } from '../src/sprites/build';
import { ALL_CHARACTERS } from '../src/sprites/characters';
import { encodePng } from './png';

const args = process.argv.slice(2);
const opt = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? fallback) : fallback;
};
const scale = Number(opt('scale', '4'));
const out = opt('out', 'sprite-renders');
const only = opt('only', '');
const animFilter = opt('anim', '');
const silhouettes = args.includes('--silhouette');
mkdirSync(out, { recursive: true });

const BGS = [
  [0xe9, 0xe4, 0xd6],
  [0x23, 0x21, 0x2d],
] as const;

for (const ch of ALL_CHARACTERS) {
  for (const def of ch.sets()) {
    if (only && !def.id.includes(only)) continue;
    const built = buildSet(def);
    const anims = def.anims.filter((a) => !animFilter || a.name === animFilter);
    const fw = def.rig.width;
    const fh = def.rig.height;
    const maxFrames = Math.max(...anims.map((a) => a.frames.length));
    const gap = 2;
    const W = (maxFrames * (fw + gap) + gap) * scale * BGS.length;
    const H = anims.length * (fh + gap) * scale + gap * scale;
    const img = new Uint8ClampedArray(W * H * 4);
    const half = W / BGS.length;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const bg = BGS[Math.floor(x / half)] ?? BGS[0];
        const i = (y * W + x) * 4;
        img[i] = bg[0];
        img[i + 1] = bg[1];
        img[i + 2] = bg[2];
        img[i + 3] = 255;
      }
    }
    anims.forEach((a, row) => {
      const frames = built.anims.get(a.name) ?? [];
      frames.forEach((f, col) => {
        for (let b = 0; b < BGS.length; b++) {
          const ox = b * half + (gap + col * (fw + gap)) * scale;
          const oy = (gap + row * (fh + gap)) * scale;
          for (let y = 0; y < fh; y++) {
            for (let x = 0; x < fw; x++) {
              const si = (y * fw + x) * 4;
              if ((f.rgba[si + 3] ?? 0) === 0) continue;
              const sil = silhouettes && b === 0;
              for (let yy = 0; yy < scale; yy++) {
                for (let xx = 0; xx < scale; xx++) {
                  const di = ((oy + y * scale + yy) * W + ox + x * scale + xx) * 4;
                  img[di] = sil ? 0 : (f.rgba[si] ?? 0);
                  img[di + 1] = sil ? 0 : (f.rgba[si + 1] ?? 0);
                  img[di + 2] = sil ? 0 : (f.rgba[si + 2] ?? 0);
                }
              }
            }
          }
        }
      });
    });
    const file = join(out, `${def.id}${animFilter ? `-${animFilter}` : ''}.png`);
    writeFileSync(file, encodePng(W, H, img));
    console.log(`${file}  ${anims.map((a) => `${a.name}:${a.frames.length}`).join(' ')}`);
  }
}
