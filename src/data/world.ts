/**
 * The journey (design 4): the main stops in order, the road that leads into
 * each, and the detours. Travel is the only thing that uses up days.
 */
import type { Dir } from '../field/dir';

export type StopId = 'thistle' | 'fen' | 'copperhill' | 'salt' | 'kingsend';
export type DetourId = 'abbey' | 'oldfront' | 'gulls';

export interface Place {
  map: string;
  x: number;
  y: number;
  facing: Dir;
}

export interface StopDef {
  id: StopId;
  name: string;
  /** Where the road into this stop begins. Thistle Cross has none: the game starts there. */
  arrive?: Place;
  /** Where the party stands when they come back from a detour. */
  hub: Place;
  next?: StopId;
  detour?: DetourId;
  /** What the road map says about the place. */
  blurb: string;
}

export interface DetourDef {
  id: DetourId;
  name: string;
  from: StopId;
  arrive: Place;
  blurb: string;
  /** A delivered letter's flag that makes this detour cost no days. */
  freeWith?: string;
}

export const DEADLINE_DAY = 7;

export const STOPS: Record<StopId, StopDef> = {
  thistle: {
    id: 'thistle',
    name: 'Thistle Cross',
    hub: { map: 'thistle-road', x: 81, y: 4, facing: 'left' },
    next: 'fen',
    blurb: 'Home. The office is locked and the goat is with you.',
  },
  fen: {
    id: 'fen',
    name: 'Bellwether Fen',
    arrive: { map: 'fen-road', x: 1, y: 14, facing: 'right' },
    hub: { map: 'bellwether-fen', x: 46, y: 14, facing: 'left' },
    next: 'copperhill',
    detour: 'abbey',
    blurb: 'A village on stilts over the reeds. Eels, mostly. A bailiff, unfortunately.',
  },
  copperhill: {
    id: 'copperhill',
    name: 'Copperhill',
    arrive: { map: 'copperhill-road', x: 1, y: 12, facing: 'right' },
    hub: { map: 'copperhill', x: 46, y: 10, facing: 'left' },
    next: 'salt',
    detour: 'oldfront',
    blurb: 'A mining town that still keeps its war memorial polished.',
  },
  salt: {
    id: 'salt',
    name: 'The Salt Road',
    arrive: { map: 'salt-road', x: 1, y: 12, facing: 'right' },
    hub: { map: 'salt-town', x: 30, y: 1, facing: 'down' },
    next: 'kingsend',
    detour: 'gulls',
    blurb: 'The old enemy’s coast. A harbour, a market, and long memories.',
  },
  kingsend: {
    id: 'kingsend',
    name: 'Kingsend',
    arrive: { map: 'kingsend-road', x: 1, y: 12, facing: 'right' },
    hub: { map: 'kingsend', x: 2, y: 13, facing: 'right' },
    blurb: 'The capital. The Post HQ, the palace gate, and the Dead Letter Office.',
  },
};

export const DETOURS: Record<DetourId, DetourDef> = {
  abbey: { id: 'abbey', name: 'Mirrow Abbey', from: 'fen', arrive: { map: 'mirrow-abbey', x: 1, y: 12, facing: 'right' }, blurb: 'A quiet abbey with a library, a cloister and a crypt nobody mentions.' },
  oldfront: { id: 'oldfront', name: 'The Old Front', from: 'copperhill', arrive: { map: 'old-front', x: 1, y: 12, facing: 'right' }, blurb: 'Overgrown trenches from the Long Quarrel. A hermit lives out there.' },
  gulls: { id: 'gulls', name: 'Gull’s Rest', from: 'salt', arrive: { map: 'gulls-rest', x: 1, y: 14, facing: 'right' }, blurb: 'A lighthouse on the cliffs, and a great many stairs.', freeWith: 'boat' },
};

export const STOP_ORDER: StopId[] = ['thistle', 'fen', 'copperhill', 'salt', 'kingsend'];

/** Where each letter's recipient is, for Moss's map. */
export const LETTER_PLACES: Record<StopId | DetourId, string[]> = {
  thistle: ['L01', 'L02', 'L03'],
  fen: ['L04', 'L05', 'L06', 'L07'],
  copperhill: ['L08', 'L09', 'L10', 'L11'],
  salt: ['L12', 'L13', 'L14', 'L15'],
  kingsend: ['L16', 'L17', 'L18'],
  abbey: ['L19', 'L20'],
  oldfront: ['L21', 'L22'],
  gulls: ['L23', 'L24'],
};
