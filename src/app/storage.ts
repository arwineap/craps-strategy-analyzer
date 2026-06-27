import { TableConfig, TableConfigJSON, DEFAULT_TABLES } from '../lib/table-config.js';
import { PRESET_STRATEGIES } from '../lib/strategies/presets.js';
import type { StrategyConfig, SimSettings } from './types.js';

const KEYS = {
  tables: 'craps:tables',
  activeTableIdx: 'craps:activeTableIdx',
  strategies: 'craps:strategies',
  simSettings: 'craps:simSettings',
} as const;

// ── Tables ───────────────────────────────────────────────────────────────────

export function loadTables(): TableConfig[] {
  try {
    const raw = localStorage.getItem(KEYS.tables);
    if (raw) {
      const data: TableConfigJSON[] = JSON.parse(raw);
      return data.map(d => TableConfig.fromJSON(d));
    }
  } catch {}
  return DEFAULT_TABLES.map(d => TableConfig.fromJSON(d));
}

export function saveTables(tables: TableConfig[]): void {
  localStorage.setItem(KEYS.tables, JSON.stringify(tables.map(t => t.toJSON())));
}

export function loadActiveTableIdx(): number {
  try {
    const raw = localStorage.getItem(KEYS.activeTableIdx);
    if (raw !== null) return parseInt(raw, 10);
  } catch {}
  return 0;
}

export function saveActiveTableIdx(idx: number): void {
  localStorage.setItem(KEYS.activeTableIdx, String(idx));
}

// ── Strategies ───────────────────────────────────────────────────────────────

const DEFAULT_STRATEGY_CONFIGS: StrategyConfig[] = Object.keys(PRESET_STRATEGIES).map(name => ({
  preset: name,
  enabled: true,
  bankroll: 1000,
  params: {},
}));

export function loadStrategyConfigs(): StrategyConfig[] {
  try {
    const raw = localStorage.getItem(KEYS.strategies);
    if (raw) {
      const saved: StrategyConfig[] = JSON.parse(raw);
      // Merge: ensure all known presets are present (handles new presets added after save)
      const knownNames = new Set(saved.map(s => s.preset));
      const missing = DEFAULT_STRATEGY_CONFIGS.filter(d => !knownNames.has(d.preset));
      return [...saved, ...missing];
    }
  } catch {}
  return DEFAULT_STRATEGY_CONFIGS;
}

export function saveStrategyConfigs(configs: StrategyConfig[]): void {
  localStorage.setItem(KEYS.strategies, JSON.stringify(configs));
}

// ── Sim settings ─────────────────────────────────────────────────────────────

const DEFAULT_SIM_SETTINGS: SimSettings = { nGames: 500, maxRolls: 50_000 };

export function loadSimSettings(): SimSettings {
  try {
    const raw = localStorage.getItem(KEYS.simSettings);
    if (raw) return { ...DEFAULT_SIM_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SIM_SETTINGS };
}

export function saveSimSettings(settings: SimSettings): void {
  localStorage.setItem(KEYS.simSettings, JSON.stringify(settings));
}
