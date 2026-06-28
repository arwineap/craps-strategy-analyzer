import { TableConfig, TableConfigJSON, DEFAULT_TABLES } from '../lib/table-config.js';
import { PRESET_NAMES, PRESET_CODES } from '../lib/strategies/preset-codes.js';
import type { PresetConfig, CustomStrategyDef, SimSettings } from './types.js';

const KEYS = {
  tables:          'craps:tables',
  activeTableIdx:  'craps:activeTableIdx',
  presets:         'craps:presets',
  customStrategies:'craps:customStrategies',
  simSettings:     'craps:simSettings',
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

// ── Preset configs ───────────────────────────────────────────────────────────

const DEFAULT_PRESET_CONFIGS: PresetConfig[] = PRESET_NAMES.map(name => ({
  name,
  enabled: true,
  bankroll: 1000,
}));

export function loadPresetConfigs(): PresetConfig[] {
  try {
    // New format
    const raw = localStorage.getItem(KEYS.presets);
    if (raw) {
      const saved: PresetConfig[] = JSON.parse(raw);
      const knownNames = new Set(saved.map(s => s.name));
      const missing = DEFAULT_PRESET_CONFIGS.filter(d => !knownNames.has(d.name));
      return [...saved, ...missing];
    }

    // Migration: old format used 'craps:strategies' with { preset, enabled, bankroll, params }
    const legacy = localStorage.getItem('craps:strategies');
    if (legacy) {
      type OldConfig = { preset: string; enabled: boolean; bankroll: number };
      const old: OldConfig[] = JSON.parse(legacy);
      const migrated: PresetConfig[] = old
        .filter(o => PRESET_CODES[o.preset] !== undefined)
        .map(o => ({ name: o.preset, enabled: o.enabled, bankroll: o.bankroll }));
      const knownNames = new Set(migrated.map(s => s.name));
      const missing = DEFAULT_PRESET_CONFIGS.filter(d => !knownNames.has(d.name));
      return [...migrated, ...missing];
    }
  } catch {}
  return DEFAULT_PRESET_CONFIGS;
}

export function savePresetConfigs(configs: PresetConfig[]): void {
  localStorage.setItem(KEYS.presets, JSON.stringify(configs));
}

// ── Custom strategies ────────────────────────────────────────────────────────

export function loadCustomStrategies(): CustomStrategyDef[] {
  try {
    const raw = localStorage.getItem(KEYS.customStrategies);
    if (raw) return JSON.parse(raw) as CustomStrategyDef[];
  } catch {}
  return [];
}

export function saveCustomStrategies(strategies: CustomStrategyDef[]): void {
  localStorage.setItem(KEYS.customStrategies, JSON.stringify(strategies));
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
