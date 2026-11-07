import type { Dialogue } from '../../game/dialogue';
import { THISTLE_CROSS_DIALOGUE } from './thistleCross';

export const DIALOGUE: Record<string, Dialogue> = Object.fromEntries(THISTLE_CROSS_DIALOGUE.map((d) => [d.id, d]));
