import { hex } from './color';
import type { Rig } from './rig';

/** Static checks on a rig: every referenced bone, part, material and colour exists. */
export function validateRig(rig: Rig): string[] {
  const errors: string[] = [];
  const bones = new Set(rig.bones.map((b) => b.name));
  const parts = new Set<string>();
  for (const b of rig.bones) {
    if (b.parent !== undefined && !bones.has(b.parent)) errors.push(`bone ${b.name}: unknown parent ${b.parent}`);
  }
  for (const p of rig.parts) parts.add(p.name);
  for (const p of rig.parts) {
    if (!bones.has(p.bone)) errors.push(`part ${p.name}: unknown bone ${p.bone}`);
    if (!rig.materials[p.material]) errors.push(`part ${p.name}: unknown material ${p.material}`);
    for (const c of p.clipTo ?? []) if (!parts.has(c)) errors.push(`part ${p.name}: clips to unknown part ${c}`);
  }
  rig.details.forEach((d, i) => {
    const label = d.name ?? `#${i}`;
    if (!bones.has(d.bone)) errors.push(`detail ${label}: unknown bone ${d.bone}`);
    for (const c of d.clip ?? []) if (!parts.has(c)) errors.push(`detail ${label}: clips to unknown part ${c}`);
    const used = new Set(d.grid.join('').replace(/[. ]/g, ''));
    for (const ch of used) {
      const ref = d.key[ch];
      if (ref === undefined) {
        errors.push(`detail ${label}: no colour for "${ch}"`);
        continue;
      }
      if (ref.startsWith('#')) {
        try {
          hex(ref);
        } catch {
          errors.push(`detail ${label}: bad colour ${ref}`);
        }
        continue;
      }
      const [mat, tone] = ref.split(':');
      if (!rig.materials[mat ?? '']) errors.push(`detail ${label}: unknown material in ${ref}`);
      if (tone !== undefined && tone !== 'o' && !/^[0-3]$/.test(tone)) errors.push(`detail ${label}: bad tone in ${ref}`);
    }
  });
  return errors;
}
