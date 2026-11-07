/** Field sprites by id, for maps and the field scene. */
import { BISCUIT } from './characters/biscuit';
import { FENN } from './characters/fenn';
import { JUNIPER } from './characters/juniper/index';
import { ODILE } from './characters/odile/index';
import { SACK } from './characters/props';
import { ROOKIE } from './characters/rookie/index';
import { THISTLE_FOLK_SPRITES } from './characters/thistleFolk';
import type { CharacterSprites, Facing, SpriteSetDef } from './types';

export const FIELD_CHARACTERS: CharacterSprites[] = [ROOKIE, ODILE, FENN, JUNIPER, BISCUIT, SACK, ...THISTLE_FOLK_SPRITES];

const byId = new Map(FIELD_CHARACTERS.map((c) => [c.id, c]));

export function hasFieldSprite(id: string): boolean {
  return byId.has(id);
}

/** The four field sprite sets of a character. Only the field sets are built. */
export function fieldSets(id: string): Record<Facing, SpriteSetDef> {
  const c = byId.get(id);
  if (!c) throw new Error(`unknown field sprite ${id}`);
  const sets = c.sets().filter((s) => s.kind === 'field');
  const pick = (view: Facing): SpriteSetDef => {
    const s = sets.find((x) => x.view === view);
    if (!s) throw new Error(`${id} has no field sprite facing ${view}`);
    return s;
  };
  return { down: pick('down'), up: pick('up'), left: pick('left'), right: pick('right') };
}
