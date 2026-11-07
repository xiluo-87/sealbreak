/** The four movement directions. Same strings as sprite facings. */
export type Dir = 'up' | 'down' | 'left' | 'right';

export const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];

export function delta(d: Dir): [number, number] {
  switch (d) {
    case 'up':
      return [0, -1];
    case 'down':
      return [0, 1];
    case 'left':
      return [-1, 0];
    case 'right':
      return [1, 0];
  }
}

export function opposite(d: Dir): Dir {
  return d === 'up' ? 'down' : d === 'down' ? 'up' : d === 'left' ? 'right' : 'left';
}

/** The direction that best points along (dx, dy). Vertical wins ties. */
export function dirToward(dx: number, dy: number): Dir {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'up' : 'down';
}

export function isDir(v: unknown): v is Dir {
  return v === 'up' || v === 'down' || v === 'left' || v === 'right';
}
