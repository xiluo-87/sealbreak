/**
 * Map data format and parser. Maps are hand-authored text grids: one
 * character per 32x32 tile (see src/data/tiles.ts). Building footprints are
 * blocks of one capital letter with a `D` for the door.
 */
import { BUILDINGS, DOOR, type TileDef, TILES } from '../data/tiles';
import type { Condition } from '../game/conditions';
import type { Dir } from './dir';

export type MapKind = 'town' | 'interior' | 'road';

export interface ExitDef {
  x: number;
  y: number;
  to: string;
  toX: number;
  toY: number;
  facing: Dir;
  /** If set and false, the exit is closed and `blocked` dialogue plays instead. */
  if?: Condition;
  blocked?: string;
}

export interface NpcDef {
  id: string;
  /** Field sprite id (see src/sprites/fieldSprites.ts). */
  sprite: string;
  x: number;
  y: number;
  facing: Dir;
  dialogue?: string;
  if?: Condition;
  /** Turn to face the player when spoken to. Default true. */
  turns?: boolean;
}

export interface EventDef {
  id: string;
  /** enter: on arriving in the map. step: on stepping onto (x, y). interact: on pressing confirm facing (x, y). */
  on: 'enter' | 'step' | 'interact';
  x?: number;
  y?: number;
  if?: Condition;
  cutscene?: string;
  dialogue?: string;
}

export interface MapDef {
  id: string;
  name: string;
  kind: MapKind;
  region: string;
  grid: string[];
  exits: ExitDef[];
  npcs: NpcDef[];
  events: EventDef[];
}

export interface Building {
  letter: string;
  style: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  door: { x: number; y: number } | null;
}

export interface ParsedMap {
  def: MapDef;
  width: number;
  height: number;
  /** Tile at each cell; building cells use the grass tile underneath. */
  tiles: TileDef[];
  buildings: Building[];
  /** Index of the building covering each cell, or -1. */
  buildingAt: Int16Array;
}

export function parseMap(def: MapDef): ParsedMap {
  const height = def.grid.length;
  const width = def.grid[0]?.length ?? 0;
  if (width === 0) throw new Error(`map ${def.id}: empty grid`);
  const tiles: TileDef[] = [];
  const grass = TILES['.'] as TileDef;
  const floor = TILES['-'] as TileDef;
  const letters = new Map<string, [number, number][]>();
  const doors: [number, number][] = [];
  def.grid.forEach((row, y) => {
    if (row.length !== width) throw new Error(`map ${def.id}: row ${y} is ${row.length} wide, expected ${width}`);
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? '.';
      if (BUILDINGS[ch]) {
        const list = letters.get(ch) ?? [];
        list.push([x, y]);
        letters.set(ch, list);
        tiles.push(grass);
      } else if (ch === DOOR) {
        doors.push([x, y]);
        tiles.push(def.kind === 'interior' ? floor : grass);
      } else {
        const t = TILES[ch];
        if (!t) throw new Error(`map ${def.id}: unknown tile "${ch}" at ${x},${y}`);
        tiles.push(t);
      }
    }
  });
  const buildingAt = new Int16Array(width * height).fill(-1);
  const buildings: Building[] = [];
  for (const [letter, cells] of letters) {
    const xs = cells.map((c) => c[0]);
    const ys = cells.map((c) => c[1]);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    const x1 = Math.max(...xs);
    const y1 = Math.max(...ys);
    const door = doors.find(([dx, dy]) => dx >= x0 && dx <= x1 && dy >= y0 && dy <= y1) ?? null;
    const info = BUILDINGS[letter] ?? { id: 'house', name: 'House' };
    const idx = buildings.length;
    buildings.push({ letter, style: info.id, name: info.name, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, door: door ? { x: door[0], y: door[1] } : null });
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) buildingAt[y * width + x] = idx;
  }
  return { def, width, height, tiles, buildings, buildingAt };
}

export function inBounds(m: ParsedMap, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < m.width && y < m.height;
}

/** True if terrain or a building blocks the cell. Doors are open. */
export function solidAt(m: ParsedMap, x: number, y: number): boolean {
  if (!inBounds(m, x, y)) return true;
  const i = y * m.width + x;
  const b = m.buildingAt[i] ?? -1;
  if (b >= 0) {
    const door = m.buildings[b]?.door;
    return !(door && door.x === x && door.y === y);
  }
  return m.tiles[i]?.solid ?? true;
}

export function exitAt(m: ParsedMap, x: number, y: number): ExitDef | undefined {
  return m.def.exits.find((e) => e.x === x && e.y === y);
}
