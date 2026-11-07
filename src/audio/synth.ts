/**
 * The Web Audio synth (design 14): every instrument and effect is built
 * from oscillators and filtered noise, with no sample files. Browsers only
 * allow sound after a gesture, so nothing is created until `unlock`.
 * Music is scheduled a little ahead of time from the main loop.
 */
import { parseNotes, type ParsedNote, SONGS, trackLength, type Voice } from './songs';

export type Sfx =
  | 'blip'
  | 'select'
  | 'back'
  | 'paper'
  | 'wax'
  | 'bleat'
  | 'swing'
  | 'hit'
  | 'heal'
  | 'status'
  | 'chime'
  | 'swoosh'
  | 'victory'
  | 'defeat'
  | 'coin'
  | 'encounter'
  | 'bell'
  | 'door'
  | 'ko'
  | 'save'
  | 'join';

interface PlayingTrack {
  voice: Voice;
  notes: ParsedNote[];
  length: number;
  i: number;
  time: number;
  out: GainNode;
  level: number;
  minIntensity: number;
  on: boolean;
}

interface PlayingSong {
  id: string;
  bus: GainNode;
  beat: number;
  tracks: PlayingTrack[];
}

/** How far ahead notes are scheduled, in seconds. */
const LOOKAHEAD = 0.35;
/** Loudness of each voice before the track's own gain. Saw and square waves are much louder than sines. */
const VOICE_LEVEL: Record<Voice, number> = { fiddle: 0.22, reed: 0.16, pluck: 0.5, bass: 0.55, bell: 0.45, drum: 0.7 };

type Ctor = typeof AudioContext;

export class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private current: PlayingSong | null = null;
  private wanted: string | null = null;
  private intensity = 0;
  private volume = 0.8;
  private muted = false;
  /** A tiny LCG for noise and variation. Sound isn't gameplay, but it stays deterministic anyway. */
  private seed = 0x2f6b1d;

  get started(): boolean {
    return this.ctx !== null;
  }

  /** Create or resume the audio context. Call from a user gesture. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const w = globalThis as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
    const C = w.AudioContext ?? w.webkitAudioContext;
    if (!C) return;
    let ctx: AudioContext;
    try {
      ctx = new C();
    } catch {
      return;
    }
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    comp.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.connect(comp);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0.5;
    this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.8;
    this.sfxBus.connect(this.master);
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = this.rand() * 2 - 1;
    this.applyVolume();
    if (ctx.state === 'suspended') void ctx.resume();
    if (this.wanted) this.startSong(this.wanted);
  }

  setVolume(volume: number, muted: boolean): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.muted = muted;
    this.applyVolume();
  }

  private applyVolume(): void {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
  }

  /** Ask for a tune, or null for silence. Asking for the one already playing does nothing. */
  music(id: string | null, intensity = 0): void {
    this.intensity = intensity;
    if (id === this.wanted) return;
    this.wanted = id;
    if (this.ctx) this.startSong(id);
  }

  private startSong(id: string | null): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus) return;
    const now = ctx.currentTime;
    if (this.current) {
      const old = this.current.bus;
      old.gain.cancelScheduledValues(now);
      old.gain.setValueAtTime(old.gain.value, now);
      old.gain.linearRampToValueAtTime(0, now + 0.6);
      setTimeout(() => old.disconnect(), 900);
      this.current = null;
    }
    const song = id ? SONGS[id] : undefined;
    if (!song) return;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0, now);
    bus.gain.linearRampToValueAtTime(1, now + 0.5);
    bus.connect(this.musicBus);
    const start = now + 0.15;
    this.current = {
      id: song.id,
      bus,
      beat: 60 / song.bpm,
      tracks: song.tracks.map((t) => {
        const notes = parseNotes(t.notes);
        const out = ctx.createGain();
        const on = (t.minIntensity ?? 0) <= this.intensity;
        out.gain.value = on ? 1 : 0;
        out.connect(bus);
        return { voice: t.voice, notes, length: trackLength(notes), i: 0, time: start, out, level: t.gain * VOICE_LEVEL[t.voice], minIntensity: t.minIntensity ?? 0, on };
      }),
    };
  }

  /** Called every step: schedule the next notes and follow the battle's intensity. */
  update(): void {
    const ctx = this.ctx;
    const song = this.current;
    if (!ctx || !song || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    // After the tab was hidden the clock jumped. Move the whole song on together, by whole
    // beats, so every track picks up from now and they all stay in step.
    const earliest = Math.min(...song.tracks.map((t) => t.time));
    if (earliest < now - 0.25) {
      const behind = Math.ceil((now + 0.05 - earliest) / song.beat) * song.beat;
      for (const t of song.tracks) t.time += behind;
    }
    for (const t of song.tracks) {
      const on = t.minIntensity <= this.intensity;
      if (on !== t.on) {
        t.on = on;
        t.out.gain.setTargetAtTime(on ? 1 : 0, now, 0.5);
      }
      let guard = 0;
      while (t.time < now + LOOKAHEAD && guard++ < 64) {
        const n = t.notes[t.i];
        if (!n) break;
        const dur = n.beats * song.beat;
        if (n.drum) this.drum(n.drum, t.time, t.out, t.level);
        else if (n.freq > 0) this.note(t.voice, n.freq, t.time, dur, t.out, t.level);
        t.time += dur;
        t.i = (t.i + 1) % t.notes.length;
      }
    }
  }

  private rand(): number {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }

  private osc(type: OscillatorType, freq: number, t: number, end: number, out: AudioNode): OscillatorNode {
    const ctx = this.ctx as AudioContext;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.connect(out);
    o.start(t);
    o.stop(end);
    return o;
  }

  private gain(out: AudioNode, value = 0): GainNode {
    const g = (this.ctx as AudioContext).createGain();
    g.gain.value = value;
    g.connect(out);
    return g;
  }

  /** A gain that modulates a parameter, for vibrato and wobble. */
  private paramGain(param: AudioParam, value: number): GainNode {
    const g = (this.ctx as AudioContext).createGain();
    g.gain.value = value;
    g.connect(param);
    return g;
  }

  private filter(type: BiquadFilterType, freq: number, q: number, out: AudioNode): BiquadFilterNode {
    const f = (this.ctx as AudioContext).createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    f.connect(out);
    return f;
  }

  private noiseBurst(t: number, dur: number, out: AudioNode, offset = 0): AudioBufferSourceNode {
    const ctx = this.ctx as AudioContext;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.connect(out);
    src.start(t, offset % 0.9);
    src.stop(t + dur);
    return src;
  }

  /** One pitched note on a voice. */
  private note(voice: Voice, freq: number, t: number, dur: number, out: AudioNode, level: number): void {
    const hold = dur * 0.92;
    switch (voice) {
      case 'fiddle': {
        // A bowed saw: soft attack, slow vibrato that arrives after the bow settles.
        const env = this.gain(out);
        const f = this.filter('lowpass', 2400, 0.8, env);
        const o = this.osc('sawtooth', freq, t, t + hold + 0.2, f);
        const depth = this.paramGain(o.frequency, 0);
        this.osc('sine', 5.4, t, t + hold + 0.2, depth);
        depth.gain.setValueAtTime(0, t);
        depth.gain.linearRampToValueAtTime(freq * 0.008, t + Math.min(0.25, hold));
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(level, t + 0.06);
        env.gain.linearRampToValueAtTime(level * 0.8, t + 0.18);
        env.gain.setValueAtTime(level * 0.8, t + hold);
        env.gain.linearRampToValueAtTime(0, t + hold + 0.15);
        break;
      }
      case 'reed': {
        const env = this.gain(out);
        const f = this.filter('lowpass', 1500, 2.5, env);
        this.osc('square', freq, t, t + hold + 0.15, f);
        this.osc('triangle', freq * 2, t, t + hold + 0.15, this.gain(f, 0.3));
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(level, t + 0.04);
        env.gain.linearRampToValueAtTime(level * 0.7, t + 0.2);
        env.gain.setValueAtTime(level * 0.7, t + hold);
        env.gain.linearRampToValueAtTime(0, t + hold + 0.1);
        break;
      }
      case 'pluck': {
        const ring = Math.min(1.2, Math.max(0.35, dur * 2));
        const env = this.gain(out);
        const f = this.filter('lowpass', 3200, 1.5, env);
        f.frequency.setValueAtTime(3200, t);
        f.frequency.exponentialRampToValueAtTime(500, t + ring);
        this.osc('triangle', freq, t, t + ring + 0.05, f);
        this.osc('sawtooth', freq, t, t + ring + 0.05, this.gain(f, 0.25));
        env.gain.setValueAtTime(level, t);
        env.gain.exponentialRampToValueAtTime(0.0005, t + ring);
        break;
      }
      case 'bass': {
        const env = this.gain(out);
        const f = this.filter('lowpass', 600, 1, env);
        this.osc('triangle', freq, t, t + hold + 0.1, f);
        this.osc('sine', freq / 2, t, t + hold + 0.1, this.gain(f, 0.5));
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(level, t + 0.012);
        env.gain.exponentialRampToValueAtTime(level * 0.5, t + Math.max(0.05, hold));
        env.gain.linearRampToValueAtTime(0, t + hold + 0.08);
        break;
      }
      case 'bell': {
        const ring = 2.4;
        const env = this.gain(out);
        this.osc('sine', freq, t, t + ring, env);
        this.osc('sine', freq * 2.76, t, t + ring, this.gain(env, 0.3));
        this.osc('sine', freq * 5.4, t, t + ring * 0.5, this.gain(env, 0.1));
        env.gain.setValueAtTime(level, t);
        env.gain.exponentialRampToValueAtTime(0.0005, t + ring);
        break;
      }
      case 'drum':
        break;
    }
  }

  private drum(kind: 'K' | 'S' | 'H', t: number, out: AudioNode, level: number): void {
    if (kind === 'K') {
      const env = this.gain(out);
      const o = this.osc('sine', 150, t, t + 0.3, env);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      env.gain.setValueAtTime(level, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    } else if (kind === 'S') {
      const env = this.gain(out);
      this.noiseBurst(t, 0.18, this.filter('bandpass', 1900, 0.7, env), this.rand());
      this.osc('triangle', 190, t, t + 0.08, this.gain(env, 0.5));
      env.gain.setValueAtTime(level * 0.7, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    } else {
      const env = this.gain(out);
      this.noiseBurst(t, 0.06, this.filter('highpass', 7000, 0.7, env), this.rand());
      env.gain.setValueAtTime(level * 0.35, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    }
  }

  /** A short tone used by the interface sounds. */
  private tone(type: OscillatorType, freq: number, t: number, dur: number, level: number, slideTo?: number): void {
    const out = this.sfxBus as GainNode;
    const env = this.gain(out);
    const o = this.osc(type, freq, t, t + dur + 0.05, env);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(level, t + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  }

  private noiseHit(t: number, dur: number, type: BiquadFilterType, freq: number, q: number, level: number): BiquadFilterNode {
    const env = this.gain(this.sfxBus as GainNode);
    const f = this.filter(type, freq, q, env);
    this.noiseBurst(t, dur + 0.02, f, this.rand());
    env.gain.setValueAtTime(level, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + dur);
    return f;
  }

  /** Play an interface or battle effect. Silent until unlocked. */
  sound(name: Sfx): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfxBus || ctx.state !== 'running') return;
    const t = ctx.currentTime + 0.01;
    switch (name) {
      case 'blip':
        this.tone('square', 880, t, 0.04, 0.05);
        break;
      case 'select':
        this.tone('square', 660, t, 0.05, 0.06);
        this.tone('square', 990, t + 0.05, 0.07, 0.06);
        break;
      case 'back':
        this.tone('square', 520, t, 0.05, 0.05);
        this.tone('square', 350, t + 0.05, 0.07, 0.05);
        break;
      case 'paper': {
        // Paper: a handful of short, bright noise scuffs at uneven intervals.
        let at = t;
        for (let i = 0; i < 8; i++) {
          const len = 0.02 + this.rand() * 0.045;
          this.noiseHit(at, len, 'bandpass', 2400 + this.rand() * 3200, 0.8 + this.rand() * 1.5, 0.12 + this.rand() * 0.2);
          at += len * (0.5 + this.rand());
        }
        break;
      }
      case 'wax': {
        // A crack of wax: two sharp clicks, a brittle snap and a soft thud.
        this.noiseHit(t, 0.012, 'highpass', 2500, 0.7, 0.7);
        this.noiseHit(t + 0.028, 0.02, 'bandpass', 1300, 5, 0.6);
        this.noiseHit(t + 0.05, 0.01, 'highpass', 3500, 0.7, 0.35);
        this.tone('sine', 230, t, 0.09, 0.3, 80);
        break;
      }
      case 'bleat':
        this.bleat(t);
        break;
      case 'swing':
        this.noiseHit(t, 0.12, 'bandpass', 900, 1.2, 0.25).frequency.exponentialRampToValueAtTime(2800, t + 0.12);
        break;
      case 'hit':
        this.noiseHit(t, 0.09, 'lowpass', 1800, 0.8, 0.5);
        this.tone('sine', 140, t, 0.12, 0.45, 55);
        break;
      case 'heal':
        [784, 988, 1175, 1568].forEach((f, i) => this.tone('sine', f, t + i * 0.06, 0.25, 0.08));
        break;
      case 'status':
        this.tone('triangle', 420, t, 0.18, 0.12, 300);
        this.tone('triangle', 445, t + 0.02, 0.18, 0.08, 310);
        break;
      case 'chime':
        [784, 1175, 1568].forEach((f, i) => {
          this.tone('sine', f, t + i * 0.11, 1.1, 0.12);
          this.tone('sine', f * 2.76, t + i * 0.11, 0.4, 0.025);
        });
        break;
      case 'swoosh':
        this.noiseHit(t, 0.28, 'bandpass', 400, 1.5, 0.3).frequency.exponentialRampToValueAtTime(3200, t + 0.26);
        break;
      case 'victory':
        [523, 659, 784, 1047].forEach((f, i) => this.tone('triangle', f, t + i * 0.1, i === 3 ? 0.7 : 0.14, 0.14));
        this.tone('square', 784, t + 0.4, 0.6, 0.04);
        break;
      case 'defeat':
        [392, 349, 311, 262].forEach((f, i) => this.tone('triangle', f, t + i * 0.22, 0.3, 0.13));
        break;
      case 'coin':
        this.tone('square', 988, t, 0.06, 0.05);
        this.tone('square', 1319, t + 0.06, 0.2, 0.05);
        break;
      case 'encounter':
        this.noiseHit(t, 0.35, 'bandpass', 300, 2, 0.25).frequency.exponentialRampToValueAtTime(2400, t + 0.3);
        this.tone('sawtooth', 220, t, 0.3, 0.06, 440);
        break;
      case 'bell':
        [1319, 1319].forEach((f, i) => {
          this.tone('sine', f, t + i * 0.18, 0.9, 0.12);
          this.tone('sine', f * 2.76, t + i * 0.18, 0.3, 0.03);
        });
        break;
      case 'door':
        this.tone('sine', 110, t, 0.15, 0.3, 70);
        this.noiseHit(t, 0.05, 'lowpass', 900, 0.7, 0.2);
        break;
      case 'ko':
        this.tone('triangle', 330, t, 0.35, 0.15, 110);
        break;
      case 'save':
        this.tone('sine', 1047, t, 0.3, 0.07);
        this.tone('sine', 1568, t + 0.09, 0.45, 0.06);
        break;
      case 'join':
        [587, 740, 880].forEach((f, i) => this.tone('triangle', f, t + i * 0.08, 0.3, 0.1));
        break;
    }
  }

  /**
   * The goat. A nasal saw through two vowel filters, with a fast wobble in
   * pitch that slows as she runs out of breath, and a small upward flick at
   * the end, as if she had one more thing to say about it.
   */
  private bleat(t: number): void {
    const out = this.sfxBus as GainNode;
    const len = 0.55 + this.rand() * 0.2;
    const base = 470 + this.rand() * 60;
    const env = this.gain(out);
    const src = this.gain(this.filter('bandpass', 620, 4, env), 1);
    src.connect(this.filter('bandpass', 1750, 6, this.gain(env, 0.6)));
    src.connect(this.gain(env, 0.12));
    const saw = this.osc('sawtooth', base, t, t + len + 0.1, src);
    const sq = this.osc('square', base, t, t + len + 0.1, this.gain(src, 0.25));
    const wobble = this.osc('sine', 24, t, t + len + 0.1, this.paramGain(saw.frequency, base * 0.05));
    wobble.connect(this.paramGain(sq.frequency, base * 0.05));
    wobble.frequency.linearRampToValueAtTime(13, t + len);
    for (const p of [saw.frequency, sq.frequency]) {
      p.setValueAtTime(base * 0.94, t);
      p.linearRampToValueAtTime(base * 1.06, t + 0.07);
      p.linearRampToValueAtTime(base * 0.86, t + len * 0.85);
      p.linearRampToValueAtTime(base * 1.02, t + len);
    }
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.5, t + 0.03);
    env.gain.setValueAtTime(0.45, t + len * 0.7);
    env.gain.linearRampToValueAtTime(0, t + len);
  }
}
