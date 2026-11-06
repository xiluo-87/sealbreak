import { manual, type Material, ramp } from '../../palette';

/** The Rookie: faded post blue, brass and tan. */
export const ROOKIE_MATERIALS: Record<string, Material> = {
  coat: ramp('coat', '#56739a', { step: 0.08 }),
  lining: ramp('lining', '#b8c2cc', { step: 0.07 }),
  visor: ramp('visor', '#2e3447', { step: 0.07 }),
  brass: manual('brass', ['#f4dc8c', '#d3a648', '#9c6e2e', '#6b4724'], '#432a19'),
  skin: manual('skin', ['#f3c9a2', '#dda27b', '#b9785a', '#8d5444'], '#5a3030'),
  hair: ramp('hair', '#56392a', { step: 0.075 }),
  trousers: ramp('trousers', '#7a6650', { step: 0.075 }),
  leather: ramp('leather', '#b38656', { step: 0.08 }),
  belt: ramp('belt', '#5e4334', { step: 0.07 }),
  boots: ramp('boots', '#54403a', { step: 0.07 }),
  shirt: ramp('shirt', '#e8dec6', { step: 0.06 }),
  tin: ramp('tin', '#b44a3e', { step: 0.08 }),
  eye: manual('eye', ['#6f86b0', '#3b4a6e', '#252a3e', '#16182a'], '#0e0f1a'),
  blush: manual('blush', ['#f2a28c', '#e48a78', '#c86c62', '#a2524e'], '#5a3030'),
};

/** Extra materials used by battle sprites and portraits. */
export const ROOKIE_EXTRA: Record<string, Material> = {
  white: manual('white', ['#ffffff', '#f2eee6', '#c9c6cf', '#9a98a8'], '#5d5b6e'),
  paper: manual('paper', ['#fffaf0', '#f1e6cf', '#d6c4a2', '#ab9473'], '#6b5640'),
  wax: manual('wax', ['#f0786a', '#c8392f', '#962722', '#64191a'], '#3e0f12'),
  ink: manual('ink', ['#5a6278', '#3a3f52', '#2a2d3c', '#1c1e29'], '#121219'),
};
