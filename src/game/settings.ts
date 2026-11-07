/**
 * Player options (design 15): text speed, reduced motion, larger text,
 * encounter rate and sound. Stored apart from saves, so they apply to every
 * game. Reads survive missing or corrupt data.
 */
export interface Settings {
  textSpeed: 'slow' | 'normal' | 'fast';
  reducedMotion: boolean;
  largeText: boolean;
  lowEncounters: boolean;
  muted: boolean;
  volume: number;
}

export const SETTINGS_KEY = 'sealbreak.settings.v1';

export const DEFAULT_SETTINGS: Settings = { textSpeed: 'normal', reducedMotion: false, largeText: false, lowEncounters: false, muted: false, volume: 0.7 };

/** The live settings. UI code changes these and calls `saveSettings`. */
export const settings: Settings = { ...DEFAULT_SETTINGS };

export function parseSettings(text: string | null): Settings {
  const out = { ...DEFAULT_SETTINGS };
  if (!text) return out;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return out;
  }
  if (typeof raw !== 'object' || raw === null) return out;
  const r = raw as Record<string, unknown>;
  if (r.textSpeed === 'slow' || r.textSpeed === 'normal' || r.textSpeed === 'fast') out.textSpeed = r.textSpeed;
  for (const k of ['reducedMotion', 'largeText', 'lowEncounters', 'muted'] as const) if (typeof r[k] === 'boolean') out[k] = r[k];
  if (typeof r.volume === 'number' && Number.isFinite(r.volume)) out.volume = Math.max(0, Math.min(1, r.volume));
  return out;
}

export function loadSettings(storage: Pick<Storage, 'getItem'> | null): void {
  let text: string | null;
  try {
    text = storage?.getItem(SETTINGS_KEY) ?? null;
  } catch {
    text = null;
  }
  Object.assign(settings, parseSettings(text));
}

export function saveSettings(storage: Pick<Storage, 'setItem'> | null): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be full or blocked; the options still apply for this session.
  }
}
