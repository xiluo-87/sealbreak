import type { MapDef } from '../../field/maps';
import { POST_OFFICE } from './postOffice';
import { THISTLE_CROSS } from './thistleCross';
import { THISTLE_ROAD } from './thistleRoad';

export const MAPS: Record<string, MapDef> = Object.fromEntries(
  [THISTLE_CROSS, POST_OFFICE, THISTLE_ROAD].map((m) => [m.id, m]),
);
