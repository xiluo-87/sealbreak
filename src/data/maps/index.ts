import type { MapDef } from '../../field/maps';
import { POST_OFFICE } from './postOffice';
import { THISTLE_CROSS } from './thistleCross';
import { THISTLE_ROAD } from './thistleRoad';
import { BELLWETHER_FEN } from './bellwetherFen';
import { COPPERHILL } from './copperhill';
import { COPPERHILL_ROAD } from './copperhillRoad';
import { FEN_ROAD } from './fenRoad';
import { OLD_MINE } from './oldMine';
import { SALT_ROAD } from './saltRoad';
import { SALT_TOWN } from './saltTown';
import { DEAD_LETTER_OFFICE } from './deadLetterOffice';
import { KINGSEND } from './kingsend';
import { KINGSEND_ROAD } from './kingsendRoad';

export const MAPS: Record<string, MapDef> = Object.fromEntries(
  [THISTLE_CROSS, POST_OFFICE, THISTLE_ROAD, FEN_ROAD, BELLWETHER_FEN, COPPERHILL_ROAD, COPPERHILL, OLD_MINE, SALT_ROAD, SALT_TOWN, KINGSEND_ROAD, KINGSEND, DEAD_LETTER_OFFICE].map((m) => [m.id, m]),
);
