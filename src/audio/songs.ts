/**
 * The music, as data (design 14): a short looping tune per region with a
 * fiddle-like lead, a reed counter-line, plucked chords and a bass, and a
 * battle theme in layers. Notes are written as "E5:1" (note, length in
 * beats) and "-:1" for a rest. Every tune is original.
 */

export type Voice = 'fiddle' | 'reed' | 'pluck' | 'bass' | 'bell' | 'drum';

export interface Track {
  voice: Voice;
  notes: string;
  /** Relative loudness. */
  gain: number;
  /** Battle layers: this track only plays at or above this intensity. */
  minIntensity?: number;
}

export interface Song {
  id: string;
  bpm: number;
  /** Every track loops on its own length, which divides the longest track's, so they stay in step. */
  tracks: Track[];
}

/** Chords as plucked arpeggios: "Gmaj:3" means the triad on G for three beats, played as quavers. */
function arp(chords: string, octave = 4, pattern = [0, 1, 2, 1]): string {
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const out: string[] = [];
  for (const tok of chords.trim().split(/\s+/)) {
    const [name, beatsRaw] = tok.split(':');
    const beats = Number(beatsRaw ?? 2);
    const m = /^([A-G]#?)(maj|min)$/.exec(name ?? '');
    if (!m) continue;
    const root = NAMES.indexOf(m[1] ?? 'C');
    const third = m[2] === 'maj' ? 4 : 3;
    const tones = [root, root + third, root + 7].map((n) => `${NAMES[n % 12]}${octave + Math.floor(n / 12)}`);
    for (let i = 0; i < beats * 2; i++) out.push(`${tones[pattern[i % pattern.length] ?? 0]}:0.5`);
  }
  return out.join(' ');
}

/** A bass line from the same chords: root on each beat, fifth on the off-beats. */
function bassFrom(chords: string, octave = 2): string {
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const out: string[] = [];
  for (const tok of chords.trim().split(/\s+/)) {
    const [name, beatsRaw] = tok.split(':');
    const beats = Number(beatsRaw ?? 2);
    const m = /^([A-G]#?)(maj|min)$/.exec(name ?? '');
    if (!m) continue;
    const root = NAMES.indexOf(m[1] ?? 'C');
    const fifth = (root + 7) % 12;
    for (let i = 0; i < beats; i++) out.push(`${NAMES[i % 2 === 0 ? root : fifth]}${octave + (i % 2 === 1 && fifth < root ? 1 : 0)}:1`);
  }
  return out.join(' ');
}

const THISTLE_CHORDS = 'Gmaj:3 Cmaj:3 Gmaj:3 Dmaj:3 Gmaj:3 Cmaj:3 Dmaj:3 Gmaj:3';
const FEN_CHORDS = 'Dmin:4 Cmaj:4 Dmin:4 Amin:4';
const COPPER_CHORDS = 'Emin:4 Cmaj:4 Dmaj:4 Bmin:4';
const SALT_CHORDS = 'Amaj:3 Gmaj:3 Amaj:3 Emin:3 Amaj:3 Gmaj:3 Dmaj:3 Amaj:3';
const KING_CHORDS = 'Cmaj:4 Fmaj:4 Gmaj:4 Cmaj:4 Amin:4 Fmaj:4 Gmaj:4 Cmaj:4';
const BATTLE_CHORDS = 'Dmin:2 Dmin:2 A#maj:2 Cmaj:2 Dmin:2 Dmin:2 Fmaj:2 Amaj:2';
const ENDING_CHORDS = 'Fmaj:4 Cmaj:4 Dmin:4 A#maj:4 Fmaj:4 Cmaj:4 A#maj:4 Cmaj:4';

export const SONGS: Record<string, Song> = {
  thistle: {
    id: 'thistle',
    bpm: 108,
    tracks: [
      { voice: 'fiddle', gain: 0.5, notes: 'D5:1 G5:1 A5:1 E5:1.5 G5:0.5 E5:1 D5:1 G5:1 B5:1 A5:2 F#5:1 G5:1 B5:1 D6:1 E6:1.5 D6:0.5 C6:1 B5:1 A5:1 F#5:1 G5:3' },
      { voice: 'pluck', gain: 0.35, notes: arp(THISTLE_CHORDS, 4, [0, 1, 2, 1, 2, 1]) },
      { voice: 'bass', gain: 0.4, notes: bassFrom(THISTLE_CHORDS) },
    ],
  },
  fen: {
    id: 'fen',
    bpm: 76,
    tracks: [
      { voice: 'reed', gain: 0.45, notes: 'A4:2 C5:1 D5:1 E5:3 D5:1 C5:2 A4:2 G4:2 -:2 A4:1 C5:1 D5:2 F5:2 E5:1 D5:1 A4:4 -:4' },
      { voice: 'pluck', gain: 0.25, notes: arp(FEN_CHORDS, 3, [0, 2, 1, 2]) },
      { voice: 'bass', gain: 0.35, notes: bassFrom(FEN_CHORDS) },
    ],
  },
  copperhill: {
    id: 'copperhill',
    bpm: 92,
    tracks: [
      { voice: 'reed', gain: 0.45, notes: 'E4:1 E4:0.5 G4:0.5 B4:1 A4:1 G4:1 E4:1 D4:2 E4:1 G4:1 A4:1 B4:1 D5:1.5 B4:0.5 A4:2 G4:1 F#4:1 E4:2 -:2 G4:1 A4:1 B4:2 A4:1 G4:1 F#4:4' },
      { voice: 'fiddle', gain: 0.25, notes: '-:8 B4:2 C5:2 D5:2 B4:2' },
      { voice: 'pluck', gain: 0.22, notes: arp(COPPER_CHORDS, 3) },
      { voice: 'bass', gain: 0.45, notes: bassFrom(COPPER_CHORDS) },
    ],
  },
  salt: {
    id: 'salt',
    bpm: 112,
    tracks: [
      { voice: 'fiddle', gain: 0.48, notes: 'E5:1 A5:1 B5:1 C#6:1.5 B5:0.5 A5:1 G5:1 E5:1 D5:1 E5:3 E5:1 A5:1 B5:1 C#6:1 E6:1 C#6:1 B5:1 A5:1 G5:1 A5:3' },
      { voice: 'pluck', gain: 0.3, notes: arp(SALT_CHORDS, 4, [0, 1, 2, 1, 2, 1]) },
      { voice: 'bass', gain: 0.4, notes: bassFrom(SALT_CHORDS) },
    ],
  },
  kingsend: {
    id: 'kingsend',
    bpm: 84,
    tracks: [
      { voice: 'reed', gain: 0.4, notes: 'G4:2 C5:2 E5:2 D5:1 C5:1 B4:2 D5:2 G4:4 A4:2 C5:2 F5:2 E5:1 D5:1 C5:2 B4:2 C5:4' },
      { voice: 'bell', gain: 0.18, notes: 'C6:4 -:4 G5:4 -:4 A5:4 -:4 G5:4 -:4' },
      { voice: 'pluck', gain: 0.25, notes: arp(KING_CHORDS, 3) },
      { voice: 'bass', gain: 0.38, notes: bassFrom(KING_CHORDS) },
    ],
  },
  abbey: {
    id: 'abbey',
    bpm: 66,
    tracks: [
      { voice: 'reed', gain: 0.38, notes: 'F4:2 A4:2 C5:2 A4:2 A#4:2 C5:2 D5:2 C5:2 A4:2 F4:2 G4:2 A4:4 -:6' },
      { voice: 'bell', gain: 0.15, notes: 'F5:8 C5:8 F5:8 -:8' },
      { voice: 'bass', gain: 0.32, notes: 'F2:4 C3:4 A#2:4 F2:4 D3:4 C3:4 F2:8' },
    ],
  },
  oldfront: {
    id: 'oldfront',
    bpm: 70,
    tracks: [
      { voice: 'fiddle', gain: 0.38, notes: 'A4:3 C5:1 B4:2 A4:2 E4:6 A4:2 C5:2 D5:2 E5:3 D5:1 C5:2 B4:2 A4:4' },
      { voice: 'bass', gain: 0.3, notes: 'A2:4 E2:4 F2:4 E2:4 A2:4 D3:4 E2:4 A2:4' },
    ],
  },
  gulls: {
    id: 'gulls',
    bpm: 96,
    tracks: [
      { voice: 'fiddle', gain: 0.4, notes: 'E5:2 A5:1 B5:1 C#6:2 B5:1 A5:1 F#5:2 E5:2 -:2 A5:1 B5:1 C#6:2 E6:2 D6:1 C#6:1 B5:2 A5:4 -:4' },
      { voice: 'pluck', gain: 0.22, notes: arp('Amaj:4 F#min:4 Dmaj:4 Emaj:4', 4) },
      { voice: 'bass', gain: 0.32, notes: bassFrom('Amaj:4 F#min:4 Dmaj:4 Emaj:4') },
    ],
  },
  office: {
    id: 'office',
    bpm: 60,
    tracks: [
      { voice: 'reed', gain: 0.32, notes: 'D4:4 F4:4 E4:4 A3:4 D4:4 G4:4 F4:2 E4:2 D4:4' },
      { voice: 'bass', gain: 0.35, notes: 'D2:8 A1:8 D2:8 A1:4 D2:4' },
    ],
  },
  battle: {
    id: 'battle',
    bpm: 136,
    tracks: [
      { voice: 'bass', gain: 0.5, notes: bassFrom(BATTLE_CHORDS) },
      { voice: 'pluck', gain: 0.3, notes: arp(BATTLE_CHORDS, 4, [0, 1, 2, 1]) },
      { voice: 'drum', gain: 0.4, minIntensity: 1, notes: 'K:1 H:0.5 H:0.5 S:1 H:0.5 H:0.5 K:1 K:0.5 H:0.5 S:1 H:1' },
      { voice: 'fiddle', gain: 0.42, minIntensity: 1, notes: 'D5:1 F5:0.5 A5:0.5 D6:1 C6:1 A#5:1 A5:1 G5:1 A5:1 D5:1 F5:0.5 A5:0.5 C6:1 A#5:1 A5:2 C#6:2' },
      { voice: 'reed', gain: 0.3, minIntensity: 2, notes: 'A4:2 A#4:2 C5:2 A4:2 D5:2 C5:2 C#5:4' },
    ],
  },
  ending: {
    id: 'ending',
    bpm: 64,
    tracks: [
      { voice: 'fiddle', gain: 0.4, notes: 'C5:2 A4:1 C5:1 F5:3 E5:1 D5:2 C5:2 A4:4 C5:2 D5:1 E5:1 F5:2 G5:2 E5:2 C5:2 -:4' },
      { voice: 'pluck', gain: 0.22, notes: arp(ENDING_CHORDS, 3, [0, 1, 2, 1]) },
      { voice: 'bass', gain: 0.3, notes: bassFrom(ENDING_CHORDS) },
    ],
  },
};

/** Which tune a map plays: detours and the office have their own, everything else follows the region. */
export function songFor(region: string, theme?: string): string {
  if (theme === 'office') return 'office';
  if (theme === 'mine') return 'copperhill';
  return SONGS[region] ? region : 'thistle';
}

export interface ParsedNote {
  /** Frequency in Hz, or 0 for a rest. Drums use K, S and H. */
  freq: number;
  drum?: 'K' | 'S' | 'H';
  beats: number;
}

const SEMI: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

/** Frequency of a note name such as "A4" (440 Hz). */
export function noteFreq(name: string): number {
  const m = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!m) return 0;
  const semi = SEMI[m[1] ?? 'A'] ?? 9;
  const octave = Number(m[2]);
  return 440 * Math.pow(2, (semi - 9 + (octave - 4) * 12) / 12);
}

export function parseNotes(text: string): ParsedNote[] {
  return text
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((tok) => {
      const [name, b] = tok.split(':');
      const beats = Number(b ?? 1) || 1;
      if (name === 'K' || name === 'S' || name === 'H') return { freq: 0, drum: name, beats };
      return { freq: name === '-' ? 0 : noteFreq(name ?? ''), beats };
    });
}

export function trackLength(notes: ParsedNote[]): number {
  return notes.reduce((a, n) => a + n.beats, 0);
}
