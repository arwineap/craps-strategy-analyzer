import { TableConfig, TableConfigJSON, DEFAULT_TABLES } from '../lib/table-config.js';
import type { CustomStrategyDef } from './types.js';

export type ExportType = 'bundle' | 'table' | 'strategy';

export interface CrapsExport {
  version: 2;
  type: ExportType;
  table?: TableConfigJSON;
  customStrategies?: CustomStrategyDef[];
}

export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTable(table: TableConfig): void {
  const payload: CrapsExport = { version: 2, type: 'table', table: table.toJSON() };
  const safeName = table.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadJSON(`craps_table_${safeName}.json`, payload);
}

export function exportCustomStrategy(strategy: CustomStrategyDef): void {
  const payload: CrapsExport = { version: 2, type: 'strategy', customStrategies: [strategy] };
  const safeName = strategy.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadJSON(`craps_strategy_${safeName}.json`, payload);
}

export function exportBundle(table: TableConfig, customStrategies: CustomStrategyDef[]): void {
  const payload: CrapsExport = { version: 2, type: 'bundle', table: table.toJSON(), customStrategies };
  downloadJSON('craps_bundle.json', payload);
}

export function exportAllTables(tables: TableConfig[]): void {
  const data = { version: 1, type: 'tables', tables: tables.map(t => t.toJSON()) };
  downloadJSON('craps_tables.json', data);
}

export type ParsedImport =
  | { type: 'table'; table: TableConfig }
  | { type: 'strategy'; customStrategies: CustomStrategyDef[] }
  | { type: 'bundle'; table: TableConfig; customStrategies: CustomStrategyDef[] }
  | { type: 'tables'; tables: TableConfig[] };

export function parseImport(json: string): ParsedImport {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (typeof data !== 'object' || data === null) throw new Error('Invalid import format');
  const obj = data as Record<string, unknown>;

  // Multi-table export (version-agnostic)
  if (obj.type === 'tables' && Array.isArray(obj.tables)) {
    return { type: 'tables', tables: (obj.tables as TableConfigJSON[]).map(t => TableConfig.fromJSON(t)) };
  }

  // Legacy v1 strategy-only exports (old format) — silently ignore preset strategies
  if (obj.version === 1 && obj.type === 'strategy') {
    return { type: 'strategy', customStrategies: [] };
  }
  if (obj.version === 1 && obj.type === 'bundle') {
    const t = obj.table
      ? TableConfig.fromJSON(obj.table as TableConfigJSON)
      : TableConfig.fromJSON(DEFAULT_TABLES[0]);
    return { type: 'bundle', table: t, customStrategies: [] };
  }

  if (obj.version !== 2) throw new Error('Unknown export version');

  if (obj.type === 'table' && obj.table) {
    return { type: 'table', table: TableConfig.fromJSON(obj.table as TableConfigJSON) };
  }

  if (obj.type === 'strategy') {
    return {
      type: 'strategy',
      customStrategies: (obj.customStrategies ?? []) as CustomStrategyDef[],
    };
  }

  if (obj.type === 'bundle') {
    return {
      type: 'bundle',
      table: TableConfig.fromJSON((obj.table as TableConfigJSON) ?? DEFAULT_TABLES[0]),
      customStrategies: (obj.customStrategies ?? []) as CustomStrategyDef[],
    };
  }

  throw new Error(`Unknown import type: ${obj.type}`);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
