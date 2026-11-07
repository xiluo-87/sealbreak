/**
 * Seeded pseudo-random number generator (sfc32).
 *
 * All gameplay randomness goes through an instance of this class so that the
 * same seed and the same inputs always produce the same result. `Math.random`
 * is banned by the lint config.
 */
export interface RngState {
  a: number;
  b: number;
  c: number;
  d: number;
}

/** Hashes a string or number into a 32-bit seed (FNV-1a). */
export function hashSeed(seed: string | number): number {
  const text = String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: string | number = 1) {
    const s = hashSeed(seed);
    this.a = 0x9e3779b9;
    this.b = 0x243f6a88;
    this.c = 0xb7e15162;
    this.d = s;
    // Warm up so that nearby seeds diverge quickly.
    for (let i = 0; i < 15; i++) this.nextUint32();
  }

  static fromState(state: RngState): Rng {
    const rng = new Rng(0);
    rng.a = state.a >>> 0;
    rng.b = state.b >>> 0;
    rng.c = state.c >>> 0;
    rng.d = state.d >>> 0;
    return rng;
  }

  getState(): RngState {
    return { a: this.a >>> 0, b: this.b >>> 0, c: this.c >>> 0, d: this.d >>> 0 };
  }

  /** Next unsigned 32-bit integer. */
  nextUint32(): number {
    const t = (((this.a + this.b) | 0) + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    return this.nextUint32() / 4294967296;
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** True with the given probability (0..1). */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty list');
    return items[this.int(0, items.length - 1)] as T;
  }
}
