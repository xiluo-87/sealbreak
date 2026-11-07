/**
 * Saves live in localStorage under one versioned key. Reading never throws:
 * missing, corrupt or unrecognised data is treated as "no save". Older save
 * versions are upgraded by the migration table before use.
 */
import { DIRS, isDir } from '../field/dir';
import type { RngState } from './rng';
import { START_COIN, START_ITEMS } from '../data/items';
import { ITEMS } from '../data/items';
import { statsAt } from '../data/party';
import { xpForLevel, BALANCE } from '../data/balance';
import { cleanName, type FlagValue, freshMember, type GameState, type MemberState, PARTY_IDS, type PartyId, STATE_VERSION } from './state';

export const SAVE_KEY = 'sealbreak.save.v1';
export const SLOT_IDS = ['auto', '1', '2', '3'] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export interface SaveSlot {
  savedAt: number;
  state: GameState;
}

export interface SaveFile {
  version: number;
  slots: Partial<Record<SlotId, SaveSlot>>;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Upgrades a state object from version N to N + 1. */
export type Migration = (old: Record<string, unknown>) => Record<string, unknown>;

/**
 * Version 1 (Milestone 2) had no party progress, coin or items. Version 2
 * adds them with starting values, everyone at level 1 and full health.
 */
export const MIGRATIONS: Record<number, Migration> = {
  1: (old) => ({
    ...old,
    members: Object.fromEntries(PARTY_IDS.map((id) => [id, freshMember(id)])),
    coin: START_COIN,
    items: { ...START_ITEMS },
  }),
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Runs migrations until the state reaches the current version. */
export function migrate(raw: unknown, migrations: Record<number, Migration> = MIGRATIONS, target = STATE_VERSION): Record<string, unknown> | null {
  if (!isRecord(raw)) return null;
  let s = raw;
  let v = typeof s.version === 'number' ? s.version : 0;
  if (v > target) return null;
  while (v < target) {
    const step = migrations[v];
    if (!step) return null;
    s = { ...step(s), version: v + 1 };
    v++;
  }
  return s;
}

function finite(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Checks a migrated state and fills anything missing. Returns null if it cannot be used. */
export function normalizeState(raw: unknown): GameState | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.mapId !== 'string' || raw.mapId.length === 0) return null;
  const flags: Record<string, FlagValue> = {};
  if (isRecord(raw.flags)) {
    for (const [k, v] of Object.entries(raw.flags)) {
      if (typeof v === 'boolean' || typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v))) flags[k] = v;
    }
  }
  const party = Array.isArray(raw.party) ? raw.party.filter((p): p is PartyId => PARTY_IDS.includes(p as PartyId)) : [];
  if (!party.includes('rookie')) party.unshift('rookie');
  const rng = isRecord(raw.rng) ? raw.rng : {};
  const rngState: RngState = {
    a: finite(rng.a, 1) >>> 0,
    b: finite(rng.b, 2) >>> 0,
    c: finite(rng.c, 3) >>> 0,
    d: finite(rng.d, 4) >>> 0,
  };
  const members = {} as Record<PartyId, MemberState>;
  const rawMembers = isRecord(raw.members) ? raw.members : {};
  for (const id of PARTY_IDS) {
    const m = rawMembers[id];
    if (!isRecord(m)) {
      members[id] = freshMember(id);
      continue;
    }
    const level = Math.min(BALANCE.levelCap, Math.max(1, Math.round(finite(m.level, 1))));
    const stats = statsAt(id, level);
    members[id] = {
      level,
      xp: Math.max(xpForLevel(level), Math.round(finite(m.xp, 0))),
      hp: Math.min(stats.hp, Math.max(0, Math.round(finite(m.hp, stats.hp)))),
      fp: Math.min(stats.fp, Math.max(0, Math.round(finite(m.fp, stats.fp)))),
    };
  }
  const items: Record<string, number> = {};
  if (isRecord(raw.items)) {
    for (const [k, v] of Object.entries(raw.items)) {
      if (ITEMS[k] && typeof v === 'number' && Number.isFinite(v) && v > 0) items[k] = Math.min(99, Math.floor(v));
    }
  }
  return {
    version: STATE_VERSION,
    rookieName: cleanName(typeof raw.rookieName === 'string' ? raw.rookieName : ''),
    mapId: raw.mapId,
    x: Math.round(finite(raw.x, 0)),
    y: Math.round(finite(raw.y, 0)),
    facing: isDir(raw.facing) ? raw.facing : (DIRS[1] ?? 'down'),
    flags,
    party: [...new Set(party)],
    day: Math.max(1, Math.round(finite(raw.day, 1))),
    steps: Math.max(0, Math.round(finite(raw.steps, 0))),
    playMs: Math.max(0, finite(raw.playMs, 0)),
    rng: rngState,
    members,
    coin: Math.max(0, Math.round(finite(raw.coin, START_COIN))),
    items,
  };
}

export function readSaves(storage: StorageLike | null): SaveFile {
  const empty: SaveFile = { version: STATE_VERSION, slots: {} };
  if (!storage) return empty;
  let text: string | null;
  try {
    text = storage.getItem(SAVE_KEY);
  } catch {
    return empty;
  }
  if (!text) return empty;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return empty;
  }
  if (!isRecord(parsed) || !isRecord(parsed.slots)) return empty;
  const out: SaveFile = { version: STATE_VERSION, slots: {} };
  for (const id of SLOT_IDS) {
    const slot = parsed.slots[id];
    if (!isRecord(slot)) continue;
    const state = normalizeState(migrate(slot.state));
    if (!state) continue;
    out.slots[id] = { savedAt: finite(slot.savedAt, 0), state };
  }
  return out;
}

export function writeSlot(storage: StorageLike | null, id: SlotId, state: GameState, now: number): boolean {
  if (!storage) return false;
  const file = readSaves(storage);
  file.slots[id] = { savedAt: now, state: JSON.parse(JSON.stringify(state)) as GameState };
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

export function loadSlot(storage: StorageLike | null, id: SlotId): GameState | null {
  return readSaves(storage).slots[id]?.state ?? null;
}

/** The most recently saved slot, if any. */
export function latestSlot(storage: StorageLike | null): SlotId | null {
  const file = readSaves(storage);
  let best: SlotId | null = null;
  let bestAt = -Infinity;
  for (const id of SLOT_IDS) {
    const s = file.slots[id];
    if (s && s.savedAt > bestAt) {
      best = id;
      bestAt = s.savedAt;
    }
  }
  return best;
}

/** localStorage if it works here, otherwise null (private mode, blocked storage). */
export function browserStorage(): StorageLike | null {
  try {
    const s = window.localStorage;
    const probe = '__sealbreak_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}
