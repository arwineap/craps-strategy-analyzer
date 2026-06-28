import type { SerializedAccumulator } from '../worker/simulation.worker.js';

export type { SerializedAccumulator };

// ── Preset strategies ────────────────────────────────────────────────────────

export interface PresetConfig {
  name: string;
  enabled: boolean;
  bankroll: number;
}

// ── Custom strategies ────────────────────────────────────────────────────────

export interface CustomStrategyDef {
  id: string;
  name: string;
  description: string;
  code: string;
  enabled: boolean;
  bankroll: number;
}

// ── Worker ───────────────────────────────────────────────────────────────────

/** Unified shape sent to the simulation worker for each strategy */
export interface WorkerStrategyConfig {
  name: string;
  code: string;
  bankroll: number;
}

// ── Simulation settings ──────────────────────────────────────────────────────

export interface SimSettings {
  nGames: number;
  maxRolls: number;
  seed?: number;
}

export interface RunConfig {
  strategyConfigs: WorkerStrategyConfig[];
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

export interface SimResultData {
  totalGames: number;
  accumulators: SerializedAccumulator[];
  seed: number;
  runConfig: RunConfig;
}
