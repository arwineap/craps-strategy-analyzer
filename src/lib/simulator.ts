import { Dice } from './dice.js';
import { BetOutcome } from './bets.js';
import { CrapsGame } from './game.js';
import { TableConfig } from './table-config.js';
import { BaseStrategy } from './strategies/base.js';

export interface GameResult {
  rolls: number;
  finalBankroll: number;
  peakBankroll: number;
  troughBankroll: number;
  totalWagered: number;
  totalWon: number;
  casinoPoints: number;
  pointsMade: number;
  sevensOut: number;
  bankrollSamples: number[];
}

export class StrategyAccumulator {
  name: string;
  color: string;
  initialBankroll: number;
  gamesCompleted = 0;
  totalRolls = 0;
  totalWagered = 0;
  totalWon = 0;
  totalCasinoPoints = 0;
  peakBankrolls: number[] = [];
  rollsPerGame: number[] = [];
  perGameFinal: number[] = [];
  avgBankrollCurve: number[] = [];
  perGameSamples: number[][] = []; // capped at 50

  constructor(name: string, color: string, initialBankroll: number) {
    this.name = name;
    this.color = color;
    this.initialBankroll = initialBankroll;
  }

  absorb(result: GameResult): void {
    this.gamesCompleted++;
    this.totalRolls += result.rolls;
    this.totalWagered += result.totalWagered;
    this.totalWon += result.totalWon;
    this.totalCasinoPoints += result.casinoPoints;
    this.peakBankrolls.push(result.peakBankroll);
    this.rollsPerGame.push(result.rolls);
    this.perGameFinal.push(result.finalBankroll);

    // Truncate samples at bust point
    const bustFloor = this.initialBankroll * 0.005;
    let samples = result.bankrollSamples;
    const bustIdx = samples.findIndex(v => v < bustFloor);
    if (bustIdx !== -1) samples = samples.slice(0, bustIdx + 1);

    if (this.perGameSamples.length < 50) {
      this.perGameSamples.push([...samples]);
    }

    // Update rolling average curve
    const n = this.gamesCompleted;
    if (n === 1) {
      this.avgBankrollCurve = [...samples];
    } else {
      const prev = this.avgBankrollCurve;
      const curr = samples;
      const maxLen = Math.max(prev.length, curr.length);
      const prevLast = prev[prev.length - 1] ?? 0;
      const currLast = curr[curr.length - 1] ?? 0;
      const prevPad = [...prev, ...Array(maxLen - prev.length).fill(prevLast)];
      const currPad = [...curr, ...Array(maxLen - curr.length).fill(currLast)];
      this.avgBankrollCurve = prevPad.map((p, i) => (p * (n - 1) + currPad[i]) / n);
    }
  }

  get avgRolls(): number {
    return this.gamesCompleted ? this.totalRolls / this.gamesCompleted : 0;
  }

  get avgPeak(): number {
    return this.peakBankrolls.length
      ? this.peakBankrolls.reduce((a, b) => a + b, 0) / this.peakBankrolls.length
      : 0;
  }

  get roi(): number {
    if (!this.totalWagered) return 0;
    return ((this.totalWon - this.totalWagered) / this.totalWagered) * 100;
  }

  get avgCasinoPointsPerGame(): number {
    return this.gamesCompleted ? this.totalCasinoPoints / this.gamesCompleted : 0;
  }

  get netPnl(): number {
    return this.totalWon - this.totalWagered;
  }
}

export interface SimulationUpdate {
  gameNum: number;
  total: number;
  accumulators: StrategyAccumulator[];
}

const SAMPLE_EVERY = 5;

const COLORS = [
  '#2196F3', '#FF5722', '#4CAF50', '#9C27B0',
  '#FF9800', '#00BCD4', '#F44336', '#8BC34A',
];

export class Simulator {
  *runStream(
    strategies: BaseStrategy[],
    nGames: number,
    maxRolls = 50_000,
    seed?: number,
    tableConfig?: TableConfig,
  ): Generator<SimulationUpdate> {
    const accumulators = strategies.map(
      (s, i) => new StrategyAccumulator(s.name, COLORS[i % COLORS.length], s.initialBankroll)
    );

    const rngSeed = seed ?? Math.floor(Math.random() * 2 ** 31);

    for (let gameNum = 1; gameNum <= nGames; gameNum++) {
      for (let i = 0; i < strategies.length; i++) {
        const result = this.runSingleGame(strategies[i], maxRolls, rngSeed * 1000 + gameNum, tableConfig);
        accumulators[i].absorb(result);
      }
      yield { gameNum, total: nGames, accumulators };
    }
  }

  private runSingleGame(
    strategy: BaseStrategy,
    maxRolls: number,
    seed: number,
    tableConfig?: TableConfig,
  ): GameResult {
    const dice = new Dice(seed);
    const game = new CrapsGame(dice, tableConfig);
    strategy.reset(game);

    let bankroll = strategy.initialBankroll;
    let tableValue = 0;
    let totalWagered = 0;
    let totalWon = 0;
    let casinoPoints = 0;
    let peak = bankroll;
    let trough = bankroll;
    const samples: number[] = [bankroll];
    let idleRolls = 0;

    for (let rollNum = 0; rollNum < maxRolls; rollNum++) {
      const totalAssets = bankroll + tableValue;
      if (totalAssets <= 0) break;

      // Strategy places bets
      const actions = strategy.decideBets(game, bankroll, tableValue);
      for (const action of actions) {
        const cost = action.execute(game, bankroll);
        bankroll -= cost;
        tableValue += cost - action.vigAmount;
        if (cost > 0) {
          totalWagered += cost;
          if (action.isRated) casinoPoints += cost;
        }
      }

      // Roll dice
      const [, results] = game.roll();

      // Resolve results
      for (const res of results) {
        if (res.outcome === BetOutcome.WIN) {
          bankroll += res.profit + res.bet.amount + res.bet.oddsAmount;
          tableValue -= res.bet.amount + res.bet.oddsAmount;
          totalWon += res.profit + res.bet.amount + res.bet.oddsAmount;
        } else if (res.outcome === BetOutcome.LOSE) {
          tableValue -= res.bet.amount + res.bet.oddsAmount;
        } else if (res.outcome === BetOutcome.PUSH) {
          bankroll += res.bet.amount + res.bet.oddsAmount;
          tableValue -= res.bet.amount + res.bet.oddsAmount;
          totalWon += res.bet.amount + res.bet.oddsAmount;
        }
      }

      // Strategy reacts
      const pressActions = strategy.onResults(results, game, bankroll, tableValue);
      for (const action of pressActions) {
        const cost = action.execute(game, bankroll);
        bankroll -= cost;
        tableValue += cost - action.vigAmount;
        if (cost > 0) {
          totalWagered += cost;
          if (action.isRated) casinoPoints += cost;
        }
      }

      const assets = bankroll + tableValue;
      peak = Math.max(peak, assets);
      trough = Math.min(trough, assets);

      if (rollNum % SAMPLE_EVERY === 0) samples.push(assets);

      // Idle-bust detection
      if (!game.activeBets.length && !actions.length && !pressActions.length) {
        if (++idleRolls > 40) break;
      } else {
        idleRolls = 0;
      }
    }

    return {
      rolls: game.rollCount,
      finalBankroll: bankroll + tableValue,
      peakBankroll: peak,
      troughBankroll: trough,
      totalWagered,
      totalWon,
      casinoPoints,
      pointsMade: game.totalPointsMade,
      sevensOut: game.totalSevensOut,
      bankrollSamples: samples,
    };
  }
}
