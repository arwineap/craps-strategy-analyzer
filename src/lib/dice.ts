export interface DiceRoll {
  readonly die1: number;
  readonly die2: number;
  readonly total: number;
  readonly isHard: boolean;
}

// Mulberry32 seeded PRNG — fast, good distribution, no dependencies
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Dice {
  private rng: () => number;

  constructor(seed?: number) {
    this.rng = seed !== undefined ? seededRng(seed) : Math.random;
  }

  roll(): DiceRoll {
    const die1 = Math.floor(this.rng() * 6) + 1;
    const die2 = Math.floor(this.rng() * 6) + 1;
    return { die1, die2, total: die1 + die2, isHard: die1 === die2 };
  }

  reseed(seed: number): void {
    this.rng = seededRng(seed);
  }
}
