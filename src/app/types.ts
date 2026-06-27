import type { SerializedAccumulator } from '../worker/simulation.worker.js';

export type { SerializedAccumulator };

export interface StrategyConfig {
  preset: string;
  enabled: boolean;
  bankroll: number;
  params: Record<string, number | boolean>;
}

export interface SimSettings {
  nGames: number;
  maxRolls: number;
  seed?: number;
}

export interface SimResultData {
  totalGames: number;
  accumulators: SerializedAccumulator[];
  seed: number;
  runConfig: RunConfig;
}

export interface RunConfig {
  strategyConfigs: StrategyConfig[];
  tableData: {
    name: string;
    tableMin: number;
    odds: string;
    vigPer: number;
    fieldTriple12: boolean;
  };
  nGames: number;
  maxRolls: number;
  seed?: number;
}
