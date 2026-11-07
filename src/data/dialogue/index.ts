import type { Dialogue } from '../../game/dialogue';
import { CAMP_DIALOGUE } from './camp';
import { COPPERHILL_DIALOGUE } from './copperhill';
import { FEN_DIALOGUE } from './fen';
import { ROAD_DIALOGUE } from './road';
import { SALT_DIALOGUE } from './salt';
import { THISTLE_CROSS_DIALOGUE } from './thistleCross';

const ALL: Dialogue[] = [...THISTLE_CROSS_DIALOGUE, ...ROAD_DIALOGUE, ...FEN_DIALOGUE, ...COPPERHILL_DIALOGUE, ...SALT_DIALOGUE, ...CAMP_DIALOGUE];

export const DIALOGUE: Record<string, Dialogue> = Object.fromEntries(ALL.map((d) => [d.id, d]));
