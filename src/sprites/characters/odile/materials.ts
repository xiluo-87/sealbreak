import { manual, type Material, ramp } from '../../palette';

/** Odile Marsh: plum, ash grey and ink black. */
export const ODILE_MATERIALS: Record<string, Material> = {
  cardigan: ramp('cardigan', '#7b4b70', { step: 0.08 }),
  blouse: ramp('blouse', '#ddd5c6', { step: 0.065 }),
  skirt: ramp('skirt', '#34323f', { step: 0.065, outlineStep: 1.2 }),
  hair: manual('hair', ['#eceaf0', '#c3c0c9', '#98949f', '#6f6a78'], '#47414f'),
  skin: manual('skin', ['#f8d8bf', '#e8b797', '#c78f71', '#9b6553'], '#5e3832'),
  gloves: ramp('gloves', '#2e2c38', { step: 0.065, outlineStep: 1.2 }),
  inkStain: manual('inkStain', ['#4a64a8', '#2f4686', '#22315f', '#18213f'], '#10152a'),
  wood: ramp('wood', '#6e4c34', { step: 0.075 }),
  brass: manual('brass', ['#f4dc8c', '#d3a648', '#9c6e2e', '#6b4724'], '#432a19'),
  boots: ramp('boots', '#3e3138', { step: 0.065 }),
  eye: manual('eye', ['#9fb59c', '#68806d', '#46584b', '#2c3830'], '#1a211c'),
  glass: manual('glass', ['#ffffff', '#e2ebf0', '#bccbd4', '#93a3b0'], '#5d6773'),
  blush: manual('blush', ['#f2a796', '#e08d7f', '#c47066', '#9e5650'], '#5e3832'),
  white: manual('white', ['#ffffff', '#f2eee6', '#c9c6cf', '#9a98a8'], '#5d5b6e'),
  paper: manual('paper', ['#fffaf0', '#f1e6cf', '#d6c4a2', '#ab9473'], '#6b5640'),
  wax: manual('wax', ['#f0786a', '#c8392f', '#962722', '#64191a'], '#3e0f12'),
  ink: manual('ink', ['#5a6278', '#3a3f52', '#2a2d3c', '#1c1e29'], '#121219'),
};
