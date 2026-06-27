/// <reference lib="webworker" />

import { TableConfig } from '../lib/table-config.js';
import { Simulator, StrategyAccumulator } from '../lib/simulator.js';
import { buildStrategy } from '../lib/strategies/presets.js';

export interface StrategyConfig {
  preset: string;
  enabled: boolean;
  bankroll: number;
  params: Record<string, number | boolean>;
}

export interface RunConfig {
  strategyConfigs: StrategyConfig[];
  tableData: ReturnType<TableConfig['toJSON']>;
  nGames: number;
  maxRolls: number;
  seed?: number;
}

export type WorkerOutMessage =
  | { type: 'update'; gameNum: number; total: number; accumulators: SerializedAccumulator[] }
  | { type: 'done'; totalGames: number; accumulators: SerializedAccumulator[]; seed: number }
  | { type: 'error'; message: string };

export interface SerializedAccumulator {
  name: string;
  color: string;
  initialBankroll: number;
  gamesCompleted: number;
  totalRolls: number;
  totalWagered: number;
  totalWon: number;
  totalCasinoPoints: number;
  peakBankrolls: number[];
  rollsPerGame: number[];
  perGameFinal: number[];
  avgBankrollCurve: number[];
  perGameSamples: number[][];
}

function serialize(acc: StrategyAccumulator): SerializedAccumulator {
  return {
    name: acc.name,
    color: acc.color,
    initialBankroll: acc.initialBankroll,
    gamesCompleted: acc.gamesCompleted,
    totalRolls: acc.totalRolls,
    totalWagered: acc.totalWagered,
    totalWon: acc.totalWon,
    totalCasinoPoints: acc.totalCasinoPoints,
    peakBankrolls: [...acc.peakBankrolls],
    rollsPerGame: [...acc.rollsPerGame],
    perGameFinal: [...acc.perGameFinal],
    avgBankrollCurve: [...acc.avgBankrollCurve],
    perGameSamples: acc.perGameSamples.map(s => [...s]),
  };
}

self.addEventListener('message', (e: MessageEvent<{ type: 'run'; config: RunConfig }>) => {
  const { config } = e.data;

  try {
    const tableConfig = TableConfig.fromJSON(config.tableData);

    const strategies = config.strategyConfigs.map(sc =>
      buildStrategy(sc.preset, sc.bankroll, tableConfig.tableMin, sc.params, tableConfig)
    );

    const rngSeed = config.seed ?? Math.floor(Math.random() * 2 ** 31);

    const simulator = new Simulator();
    const gen = simulator.runStream(strategies, config.nGames, config.maxRolls, rngSeed, tableConfig);

    // Post at most ~200 UI updates regardless of total game count
    const interval = Math.max(1, Math.floor(config.nGames / 200));
    let lastAccumulators: SerializedAccumulator[] = [];

    for (const update of gen) {
      const serialized = update.accumulators.map(serialize);
      lastAccumulators = serialized;

      if (update.gameNum % interval === 0 || update.gameNum === config.nGames) {
        const msg: WorkerOutMessage = {
          type: 'update',
          gameNum: update.gameNum,
          total: update.total,
          accumulators: serialized,
        };
        self.postMessage(msg);
      }
    }

    const doneMsg: WorkerOutMessage = {
      type: 'done',
      totalGames: config.nGames,
      accumulators: lastAccumulators,
      seed: rngSeed,
    };
    self.postMessage(doneMsg);
  } catch (err) {
    const errMsg: WorkerOutMessage = {
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(errMsg);
  }
});
