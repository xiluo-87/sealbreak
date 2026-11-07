/** Fenn Harrow: field sprites from the townsfolk kit, battle sprite from the humanoid kit. */
import type { CharacterSprites } from '../types';
import { FENN_BATTLE } from './people';
import { type PortraitSpec, portraitSets } from './portraitGen';
import { type FolkSpec, folkSprites } from './townsfolk';

export const FENN_FOLK: FolkSpec = {
  id: 'fenn',
  name: 'Fenn Harrow',
  build: 'tall',
  skin: '#d4a07c',
  hair: '#9a948a',
  hairStyle: 'short',
  top: '#5f6440',
  topStyle: 'long',
  bottom: '#4a4636',
  shoes: '#3a2e26',
  accent: '#b8463a',
  extras: ['stubble', 'scar', 'sign', 'patches'],
};

export const FENN_PORTRAIT: PortraitSpec = {
  id: 'fenn',
  skin: ['#e8b896', '#cc9670', '#a8724e', '#7c5034'],
  hair: '#9a948a',
  eye: '#6a7a5a',
  lips: ['#c88a78', '#a8685e', '#864e48', '#5e3632'],
  coat: '#5f6440',
  under: '#8a7c62',
  accent: '#b8463a',
  hairStyle: 'cropped',
  jaw: 'square',
  extras: ['stubble', 'scar', 'patches', 'wrinkles'],
};

const field = folkSprites(FENN_FOLK);

export const FENN: CharacterSprites = {
  id: 'fenn',
  name: 'Fenn Harrow',
  sets: () => [...field.sets(), ...(FENN_BATTLE?.sets() ?? []), ...portraitSets(FENN_PORTRAIT)],
};
