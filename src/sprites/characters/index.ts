import type { CharacterSprites } from '../types';
import { BISCUIT, BISCUIT_BATTLE } from './biscuit';
import { CREATURE_SPRITES } from './creatures';
import { ENEMY_SPRITES } from './enemies';
import { FENN } from './fenn';
import { PEOPLE_SPRITES, PORTRAIT_SPRITES } from './people';
import { JUNIPER } from './juniper/index';
import { ODILE } from './odile/index';
import { SACK } from './props';
import { ROOKIE } from './rookie/index';
import { JOURNEY_FOLK_SPRITES } from './journeyFolk';
import { THISTLE_FOLK_SPRITES } from './thistleFolk';

/** The party, shown in full in the gallery and the silhouette test. */
export const PARTY_CHARACTERS: CharacterSprites[] = [ROOKIE, ODILE, FENN, JUNIPER];

/** Everyone, for the gallery. */
export const ALL_CHARACTERS: CharacterSprites[] = [...PARTY_CHARACTERS, BISCUIT, BISCUIT_BATTLE, ...ENEMY_SPRITES, ...CREATURE_SPRITES, ...PEOPLE_SPRITES.slice(1), ...PORTRAIT_SPRITES, ...THISTLE_FOLK_SPRITES, ...JOURNEY_FOLK_SPRITES, SACK];
