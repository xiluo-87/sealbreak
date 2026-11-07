import type { Dialogue } from '../../game/dialogue';
import { ROAD_DIALOGUE } from './road';
import { THISTLE_CROSS_DIALOGUE } from './thistleCross';

const ALL: Dialogue[] = [...THISTLE_CROSS_DIALOGUE, ...ROAD_DIALOGUE];

export const DIALOGUE: Record<string, Dialogue> = Object.fromEntries(ALL.map((d) => [d.id, d]));
