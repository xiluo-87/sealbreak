/** Accessories: one slot per character (design section 9). */
import type { Stats } from './party';

export interface AccessoryDef {
  id: string;
  name: string;
  description: string;
  bonus: Partial<Stats>;
}

export const ACCESSORIES: Record<string, AccessoryDef> = {
  quilt: { id: 'quilt', name: 'Patchwork Quilt', description: 'Made for someone who never came home. +10 HP.', bonus: { hp: 10 } },
  ring: { id: 'ring', name: 'Old Wedding Ring', description: 'Worn thin on one side. +2 WIL.', bonus: { wil: 2 } },
  medal: { id: 'medal', name: 'Dunnock’s Medal', description: 'For conduct under fire. +2 DEF.', bonus: { def: 2 } },
  lens: { id: 'lens', name: 'Lighthouse Lens', description: 'It throws light further than it should. +2 SPD, +2 WIL.', bonus: { spd: 2, wil: 2 } },
};
