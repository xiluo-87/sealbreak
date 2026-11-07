/**
 * Terrain tiles, by the character used in map grids. Buildings are not
 * tiles: each building's footprint is a block of one capital letter (see
 * BUILDINGS), and `D` marks its door.
 */
export interface TileDef {
  id: string;
  solid: boolean;
  /** Tall things draw their top half over characters standing behind them. */
  tall?: boolean;
}

export const TILES: Record<string, TileDef> = {
  '.': { id: 'grass', solid: false },
  ',': { id: 'flowers', solid: false },
  _: { id: 'dirt', solid: false },
  '=': { id: 'cobble', solid: false },
  T: { id: 'tree', solid: true, tall: true },
  t: { id: 'bush', solid: true },
  h: { id: 'hedge', solid: true },
  H: { id: 'topiary', solid: true, tall: true },
  f: { id: 'fence', solid: true },
  '~': { id: 'water', solid: true },
  b: { id: 'bridge', solid: false },
  o: { id: 'well', solid: true },
  l: { id: 'lamp', solid: true, tall: true },
  x: { id: 'crates', solid: true },
  n: { id: 'noticeboard', solid: true },
  p: { id: 'pole', solid: true, tall: true },
  g: { id: 'tollgate', solid: true },
  '#': { id: 'boardwalk', solid: false },
  ':': { id: 'reeds', solid: true },
  '%': { id: 'slag', solid: true },
  j: { id: 'rails', solid: false },
  '^': { id: 'rocks', solid: true },
  '!': { id: 'memorial', solid: true, tall: true },
  '+': { id: 'grave', solid: true },
  // Interiors.
  W: { id: 'wall', solid: true },
  w: { id: 'wallside', solid: true },
  '-': { id: 'floor', solid: false },
  c: { id: 'counter', solid: true },
  k: { id: 'pigeonholes', solid: true },
  s: { id: 'shelf', solid: true },
  r: { id: 'rug', solid: false },
  e: { id: 'table', solid: true },
  v: { id: 'stove', solid: true },
  m: { id: 'doormat', solid: false },
};

/** Building styles by footprint letter. */
export const BUILDINGS: Record<string, { id: string; name: string }> = {
  P: { id: 'postoffice', name: 'Post office' },
  I: { id: 'inn', name: 'The Thistle and Crown' },
  S: { id: 'shop', name: 'Dray’s Sundries' },
  K: { id: 'bakery', name: 'Cobb’s Bakery' },
  M: { id: 'mayor', name: 'The Mayor’s house' },
  F: { id: 'cottage', name: 'Finch cottage' },
  R: { id: 'house', name: 'House' },
  Q: { id: 'house2', name: 'House' },
  B: { id: 'tollbooth', name: 'Toll booth' },
  L: { id: 'lockup', name: 'Lock-up' },
  U: { id: 'hall', name: 'Union Hall' },
  E: { id: 'mine', name: 'The Old Mine' },
  A: { id: 'stilt', name: 'House' },
  C: { id: 'abbey', name: 'Mirrow Abbey' },
  G: { id: 'office', name: 'Office' },
  J: { id: 'warehouse', name: 'Warehouse' },
  N: { id: 'lighthouse', name: 'Lighthouse' },
  O: { id: 'hut', name: 'Hut' },
  V: { id: 'palace', name: 'Palace' },
};

export const DOOR = 'D';
