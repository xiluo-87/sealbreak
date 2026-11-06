import type { CharacterSprites } from '../../types';
import { odileBattleSets } from './battle';
import { odileFieldSets } from './field';
import { odilePortraitSets } from './portrait';

export const ODILE: CharacterSprites = {
  id: 'odile',
  name: 'Odile Marsh',
  sets: () => [...odileFieldSets(), ...odileBattleSets(), ...odilePortraitSets()],
};
