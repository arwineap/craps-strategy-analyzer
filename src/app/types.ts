import type { SerializedAccumulator } from '../worker/simulation.worker.js';
import type { FireBetPayouts, AllSmallTallPayouts } from '../lib/table-config.js';

export type { SerializedAccumulator };

// ── Preset strategies ────────────────────────────────────────────────────────

export interface PresetConfig {
  name: string;
  enabled: boolean;
}

// ── Custom strategies ────────────────────────────────────────────────────────

export interface CustomStrategyDef {
  id: string;
  name: string;
  description: string;
  code: string;
  enabled: boolean;
}

// ── Custom tables ────────────────────────────────────────────────────────────

export interface CustomTableDef {
  id: string;
  name: string;
  tableMin: number;
  odds: string;
  vigPer: number;
  fieldTriple12: boolean;
  fireBetEnabled: boolean;
  fireBetPayouts: FireBetPayouts;
  allSmallTallEnabled: boolean;
  allSmallTallPayouts: AllSmallTallPayouts;
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
  bankroll: number;
  seed?: number;
  selectedTableId?: string;
}

export interface RunConfig {
  strategyConfigs: WorkerStrategyConfig[];
  tableData: import('../lib/table-config.js').TableConfigJSON;
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
