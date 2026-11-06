import type { CharacterSprites } from '../../types';
import { juniperBattleSets } from './battle';
import { juniperFieldSets } from './field';
import { juniperPortraitSets } from './portrait';

export const JUNIPER: CharacterSprites = {
  id: 'juniper',
  name: 'Juniper Quill',
  sets: () => [...juniperFieldSets(), ...juniperBattleSets(), ...juniperPortraitSets()],
};
