/** People of Bellwether Fen and Copperhill, from the shared townsfolk parts. */
import { type FolkSpec, folkSprites } from './townsfolk';

export const JOURNEY_FOLK: FolkSpec[] = [
  // Bellwether Fen.
  { id: 'bea', name: 'Bea Rusk', build: 'stout', skin: '#d8a080', hair: '#8a6a4a', hairStyle: 'tied', top: '#5a6a5a', topStyle: 'jacket', bottom: '#4a4a3a', shoes: '#3a3226', apron: '#7a6a4a', extras: ['toolbelt'] },
  { id: 'sal', name: 'Sal Pottle', build: 'stout', skin: '#f0c0a0', hair: '#c8784a', hairStyle: 'bun', top: '#8a4a3a', topStyle: 'dress', bottom: '#6a3a2e', skirt: true, shoes: '#3a2a20', apron: '#efe6d2' },
  { id: 'elsie', name: 'Elsie Corran', build: 'slim', skin: '#f0cab0', hair: '#c8c4bc', hairStyle: 'bun', top: '#5a6a8a', topStyle: 'dress', bottom: '#4a5874', skirt: true, shoes: '#2e2a30', extras: ['shawl'], accent: '#8a5a6a' },
  { id: 'grist', name: 'Bailiff Grist', build: 'stout', skin: '#e8b49a', hair: '#5a4a40', hairStyle: 'short', top: '#2a2630', topStyle: 'long', bottom: '#2a2630', shoes: '#1a181e', hat: { style: 'tophat', colour: '#1e1c22' }, accent: '#8a2a2a', extras: ['moustache', 'chain', 'ledger'] },
  { id: 'constable', name: 'Constable', build: 'average', skin: '#e0b090', hair: '#4a3a2a', hairStyle: 'short', top: '#2e3a5a', topStyle: 'jacket', bottom: '#2a2e3a', shoes: '#1e1e24', hat: { style: 'flatcap', colour: '#2a3048' }, extras: ['badge'] },
  { id: 'trader', name: 'Eel trader', build: 'average', skin: '#c8906a', hair: '#3a2e24', hairStyle: 'short', top: '#6a7448', topStyle: 'shirt', bottom: '#4a4636', shoes: '#3a3226', apron: '#a8a08a', hat: { style: 'kerchief', colour: '#5a6438' } },
  { id: 'eelman', name: 'Old eelman', build: 'slim', skin: '#d0a080', hair: '#b8b4ae', hairStyle: 'bald', top: '#4a5a4a', topStyle: 'jacket', bottom: '#3e3e34', shoes: '#2e2a22', extras: ['beard', 'stoop'] },
  { id: 'fenkid', name: 'Fen child', build: 'child', skin: '#e0b090', hair: '#6a4a2a', hairStyle: 'curly', top: '#8a6a3a', topStyle: 'shirt', bottom: '#4a4a3a', shoes: '#3a3226' },
  // Copperhill.
  { id: 'brannigan', name: 'Brannigan', build: 'stout', skin: '#d09878', hair: '#7a3a2a', hairStyle: 'short', top: '#6a5a4a', topStyle: 'shirt', bottom: '#3e3a36', shoes: '#2e2620', extras: ['beard', 'sash'], accent: '#b8463a' },
  { id: 'storekeep', name: 'Storekeeper', build: 'slim', skin: '#e8c0a0', hair: '#3a3230', hairStyle: 'short', top: '#4a4a52', topStyle: 'jacket', bottom: '#3a3a40', shoes: '#262428', apron: '#d8d0c0', extras: ['glasses'] },
  { id: 'landlord', name: 'Landlord', build: 'stout', skin: '#e0a888', hair: '#8a6a4a', hairStyle: 'bald', top: '#7a5a3a', topStyle: 'shirt', bottom: '#4a3e34', shoes: '#2e2620', apron: '#e8e0cc', extras: ['moustache'] },
  { id: 'tarn', name: 'Widow Tarn', build: 'slim', skin: '#e8c0a8', hair: '#d8d4cc', hairStyle: 'bun', top: '#2e2a30', topStyle: 'dress', bottom: '#2a262c', skirt: true, shoes: '#1e1c20', extras: ['shawl', 'stoop'], accent: '#4a4a5a' },
  { id: 'dunnock', name: 'Old Man Dunnock', build: 'stout', skin: '#c88a68', hair: '#c8c4bc', hairStyle: 'bald', top: '#5a4a3a', topStyle: 'shirt', bottom: '#3a3430', shoes: '#2a2420', apron: '#3a2e26', extras: ['beard'] },
  { id: 'ashworth', name: 'Mr Ashworth', build: 'slim', skin: '#f0d0b8', hair: '#3a3a3a', hairStyle: 'short', top: '#2a2a32', topStyle: 'long', bottom: '#2a2a32', shoes: '#141418', hat: { style: 'flatcap', colour: '#1a1a20' }, extras: ['glasses', 'ledger'] },
  { id: 'miner1', name: 'Miner', build: 'average', skin: '#b88060', hair: '#2e2620', hairStyle: 'short', top: '#5a5048', topStyle: 'shirt', bottom: '#3e3a36', shoes: '#2e2620', hat: { style: 'flatcap', colour: '#3a3430' }, extras: ['stubble'] },
  { id: 'miner2', name: 'Miner', build: 'stout', skin: '#d0a080', hair: '#5a4030', hairStyle: 'short', top: '#6a5a4a', topStyle: 'jacket', bottom: '#3e3a36', shoes: '#2e2620', hat: { style: 'flatcap', colour: '#4a4038' }, extras: ['moustache'] },
];

export const JOURNEY_FOLK_SPRITES = JOURNEY_FOLK.map(folkSprites);
