import { describe, expect, it } from 'vitest';
import { noteFreq, parseNotes, songFor, SONGS, trackLength } from '../src/audio/songs';
import { REGIONS } from '../src/data/regions';
import { MAPS } from '../src/data/maps';

describe('music data', () => {
  it('tunes A4 to 440 Hz and an octave to double', () => {
    expect(noteFreq('A4')).toBeCloseTo(440);
    expect(noteFreq('A5')).toBeCloseTo(880);
    expect(noteFreq('C4')).toBeCloseTo(261.63, 1);
    expect(noteFreq('nonsense')).toBe(0);
  });

  it('parses rests, drums and lengths', () => {
    expect(parseNotes('C4:0.5 -:1 K:1 G4')).toEqual([
      { freq: noteFreq('C4'), beats: 0.5 },
      { freq: 0, beats: 1 },
      { freq: 0, drum: 'K', beats: 1 },
      { freq: noteFreq('G4'), beats: 1 },
    ]);
  });

  for (const song of Object.values(SONGS)) {
    it(`${song.id}: every note is a real pitch and every track stays in step`, () => {
      const lengths = song.tracks.map((t) => trackLength(parseNotes(t.notes)));
      const loop = Math.max(...lengths);
      for (const [i, t] of song.tracks.entries()) {
        const notes = parseNotes(t.notes);
        expect(notes.length).toBeGreaterThan(0);
        for (const n of notes) expect(n.freq > 0 || n.drum !== undefined || t.notes.includes('-')).toBe(true);
        // Every token that isn't a rest or a drum must name a pitch.
        for (const tok of t.notes.trim().split(/\s+/)) {
          const name = tok.split(':')[0] ?? '';
          if (name !== '-' && !['K', 'S', 'H'].includes(name)) expect(noteFreq(name), `${song.id} ${t.voice} ${tok}`).toBeGreaterThan(20);
        }
        expect(loop % (lengths[i] ?? 1), `${song.id} ${t.voice} is ${lengths[i]} beats in a ${loop}-beat loop`).toBe(0);
      }
    });
  }

  it('gives every region and map a tune', () => {
    for (const id of Object.keys(REGIONS)) expect(SONGS[songFor(id)]).toBeDefined();
    for (const m of Object.values(MAPS)) expect(SONGS[songFor(m.region, m.theme)]).toBeDefined();
    expect(songFor('kingsend', 'office')).toBe('office');
  });

  it('builds the battle theme in layers', () => {
    const layers = new Set(SONGS.battle?.tracks.map((t) => t.minIntensity ?? 0));
    expect([...layers].sort()).toEqual([0, 1, 2]);
  });
});
