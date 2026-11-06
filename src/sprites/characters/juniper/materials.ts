import { manual, type Material, ramp } from '../../palette';

/** Juniper Quill: waxed green, wine red and black. */
export const JUNIPER_MATERIALS: Record<string, Material> = {
  coat: ramp('coat', '#3d6a4e', { step: 0.085 }),
  wine: ramp('wine', '#7c2b3e', { step: 0.08 }),
  black: ramp('black', '#2d2b35', { step: 0.07, outlineStep: 1.2 }),
  boots: ramp('boots', '#3a2e30', { step: 0.075, outlineStep: 1.2 }),
  strap: ramp('strap', '#40302c', { step: 0.07 }),
  hair: ramp('hair', '#2f2a38', { step: 0.075, outlineStep: 1.3 }),
  streak: manual('streak', ['#86b4ea', '#4f80c8', '#335c9c', '#223f70'], '#152648'),
  skin: manual('skin', ['#dba07a', '#bb7d57', '#965d3c', '#6e4029'], '#43241a'),
  brass: manual('brass', ['#f4dc8c', '#d3a648', '#9c6e2e', '#6b4724'], '#432a19'),
  glass: manual('glass', ['#ffffff', '#d8eef0', '#a9cdd3', '#7aa3ab'], '#4a6a70'),
  eye: manual('eye', ['#f0c46a', '#c1862e', '#87561c', '#4f3010'], '#24140a'),
  lips: manual('lips', ['#d9877f', '#b8605f', '#93444b', '#6a2e36'], '#3e1a20'),
  waxRed: manual('waxRed', ['#f0786a', '#c8392f', '#962722', '#64191a'], '#3e0f12'),
  waxGold: manual('waxGold', ['#f7d77e', '#d9a441', '#a6762a', '#71501c'], '#45300f'),
  steel: manual('steel', ['#f2f6fa', '#c5cdd8', '#8e98a8', '#5f6878'], '#363c48'),
  white: manual('white', ['#ffffff', '#f2eee6', '#c9c6cf', '#9a98a8'], '#5d5b6e'),
  paper: manual('paper', ['#fffaf0', '#f1e6cf', '#d6c4a2', '#ab9473'], '#6b5640'),
  ink: manual('ink', ['#5a6278', '#3a3f52', '#2a2d3c', '#1c1e29'], '#121219'),
};
