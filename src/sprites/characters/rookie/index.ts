import type { CharacterSprites } from '../../types';
import { rookieBattleSets } from './battle';
import { rookieFieldSets } from './field';
import { rookiePortraitSets } from './portrait';

export const ROOKIE: CharacterSprites = {
  id: 'rookie',
  name: 'The Rookie',
  sets: () => [...rookieFieldSets(), ...rookieBattleSets(), ...rookiePortraitSets()],
};
