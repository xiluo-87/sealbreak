import type { CharacterSprites } from '../types';
import { BISCUIT, BISCUIT_BATTLE } from './biscuit';
import { ENEMY_SPRITES } from './enemies';
import { JUNIPER } from './juniper/index';
import { ODILE } from './odile/index';
import { SACK } from './props';
import { ROOKIE } from './rookie/index';
import { THISTLE_FOLK_SPRITES } from './thistleFolk';

/** The party, shown in full in the gallery and the silhouette test. */
export const PARTY_CHARACTERS: CharacterSprites[] = [ROOKIE, ODILE, JUNIPER];

/** Everyone, for the gallery. */
export const ALL_CHARACTERS: CharacterSprites[] = [...PARTY_CHARACTERS, BISCUIT, BISCUIT_BATTLE, ...ENEMY_SPRITES, ...THISTLE_FOLK_SPRITES, SACK];
