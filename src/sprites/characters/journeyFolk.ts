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
  // The Salt Road.
  { id: 'quay', name: 'Harbourmaster Quay', build: 'stout', skin: '#c89070', hair: '#e8e4dc', hairStyle: 'short', top: '#2e4a6a', topStyle: 'long', bottom: '#2a3448', shoes: '#1e1e24', hat: { style: 'flatcap', colour: '#2a3a5a' }, extras: ['beard', 'badge'] },
  { id: 'mara', name: 'Mara Vell-Quay', build: 'slim', skin: '#d8a888', hair: '#4a3a3a', hairStyle: 'long', top: '#3a8a8a', topStyle: 'dress', bottom: '#2e6a6a', skirt: true, shoes: '#3a2e26', extras: ['shawl'], accent: '#c8b088' },
  { id: 'brin', name: 'Brin Pike', build: 'average', skin: '#c08868', hair: '#b85a34', hairStyle: 'tied', top: '#d8c8a0', topStyle: 'shirt', bottom: '#4a4a5a', shoes: '#3a2e26', extras: ['toolbelt'] },
  { id: 'salttrader', name: 'Market trader', build: 'stout', skin: '#b07a58', hair: '#2a2420', hairStyle: 'short', top: '#c8b088', topStyle: 'shirt', bottom: '#7a6448', shoes: '#5a4434', hat: { style: 'kerchief', colour: '#2e7a7a' }, apron: '#e8dcc0' },
  { id: 'saltinn', name: 'Innkeeper', build: 'average', skin: '#c89878', hair: '#5a4a3a', hairStyle: 'bun', top: '#8a5a3a', topStyle: 'dress', bottom: '#6a4430', skirt: true, shoes: '#3a2a20', apron: '#efe6d2' },
  { id: 'fishwife', name: 'Fishwife', build: 'stout', skin: '#d0a080', hair: '#8a8478', hairStyle: 'bun', top: '#4a6a7a', topStyle: 'dress', bottom: '#3a5464', skirt: true, shoes: '#2e2a26', apron: '#c8c0a8', extras: ['shawl'] },
  { id: 'oldsoldier', name: 'Old soldier', build: 'slim', skin: '#b88868', hair: '#d8d4cc', hairStyle: 'short', top: '#7a6a48', topStyle: 'jacket', bottom: '#5a5040', shoes: '#3a3226', extras: ['moustache', 'stoop', 'badge'] },
  // The Inspectorate.
  { id: 'inspector', name: 'Inspector', build: 'average', skin: '#e4b498', hair: '#3a3230', hairStyle: 'short', top: '#26242c', topStyle: 'long', bottom: '#26242c', shoes: '#141418', hat: { style: 'flatcap', colour: '#26242c' }, extras: ['badge'] },
  { id: 'sorrel', name: 'Deputy Inspector Sorrel', build: 'slim', skin: '#f0c4a8', hair: '#a4502e', hairStyle: 'curly', top: '#24222a', topStyle: 'jacket', bottom: '#24222a', shoes: '#121216', hat: { style: 'flatcap', colour: '#24222a' }, accent: '#a4502e', extras: ['badge', 'clipboard'] },
  { id: 'vane', name: 'Chief Inspector Vane', build: 'slim', skin: '#f0d2c0', hair: '#e8dcb8', hairStyle: 'bun', top: '#18161c', topStyle: 'long', bottom: '#18161c', shoes: '#0c0c10', accent: '#d8c070', extras: ['badge', 'chain'] },
  // Kingsend.
  { id: 'pmg', name: 'Postmaster General', build: 'stout', skin: '#f0c8b0', hair: '#c8c4bc', hairStyle: 'bald', top: '#3d4a6a', topStyle: 'long', bottom: '#2f3a52', shoes: '#1e1e24', accent: '#d3a648', extras: ['sash', 'chain', 'moustache'] },
  { id: 'royalguard', name: 'Royal Guard', build: 'average', skin: '#e0b090', hair: '#4a3a2a', hairStyle: 'short', top: '#2e4a8a', topStyle: 'jacket', bottom: '#e8dcc0', shoes: '#1e1e24', hat: { style: 'flatcap', colour: '#1e2440' }, accent: '#b83a3a', extras: ['sash', 'badge'] },
  { id: 'arcadist', name: 'Shopkeeper', build: 'slim', skin: '#e8c0a0', hair: '#6a4a3a', hairStyle: 'tied', top: '#6a3a5a', topStyle: 'dress', bottom: '#4a2a40', skirt: true, shoes: '#2a2026', apron: '#e8e0cc' },
  { id: 'kinn', name: 'Innkeeper', build: 'stout', skin: '#d8a888', hair: '#3a2e26', hairStyle: 'short', top: '#7a5a3a', topStyle: 'shirt', bottom: '#4a3e34', shoes: '#2e2620', apron: '#e8e0cc', extras: ['moustache'] },
  { id: 'pip', name: 'Pip', build: 'child', skin: '#f0c8a8', hair: '#c8784a', hairStyle: 'curly', top: '#d8a040', topStyle: 'shirt', bottom: '#4a5a8a', shoes: '#3a2e26' },
  { id: 'hqclerk', name: 'Post clerk', build: 'slim', skin: '#e8c8b0', hair: '#3a3230', hairStyle: 'short', top: '#3d4a6a', topStyle: 'jacket', bottom: '#2f3a52', shoes: '#1e1e24', hat: { style: 'flatcap', colour: '#3d4a6a' }, extras: ['glasses'] },
];

export const JOURNEY_FOLK_SPRITES = JOURNEY_FOLK.map(folkSprites);
