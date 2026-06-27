import { TableConfig, TableConfigJSON } from '../lib/table-config.js';
import type { StrategyConfig } from './types.js';

export type ExportType = 'bundle' | 'table' | 'strategy';

export interface CrapsExport {
  version: 1;
  type: ExportType;
  table?: TableConfigJSON;
  strategies?: StrategyConfig[];
}

export function downloadJSON(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportTable(table: TableConfig): void {
  const payload: CrapsExport = { version: 1, type: 'table', table: table.toJSON() };
  const safeName = table.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadJSON(`craps_table_${safeName}.json`, payload);
}

export function exportStrategy(config: StrategyConfig): void {
  const payload: CrapsExport = { version: 1, type: 'strategy', strategies: [config] };
  const safeName = config.preset.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  downloadJSON(`craps_strategy_${safeName}.json`, payload);
}

export function exportBundle(table: TableConfig, strategies: StrategyConfig[]): void {
  const payload: CrapsExport = {
    version: 1,
    type: 'bundle',
    table: table.toJSON(),
    strategies,
  };
  downloadJSON('craps_bundle.json', payload);
}

export function exportAllTables(tables: TableConfig[]): void {
  const payload: CrapsExport = {
    version: 1,
    type: 'bundle',
    strategies: [],
    table: tables[0]?.toJSON(),
  };
  // Encode all tables as a pseudo-bundle
  const data = { version: 1, type: 'tables', tables: tables.map(t => t.toJSON()) };
  downloadJSON('craps_tables.json', data);
}

export type ParsedImport =
  | { type: 'table'; table: TableConfig }
  | { type: 'strategy'; strategies: StrategyConfig[] }
  | { type: 'bundle'; table: TableConfig; strategies: StrategyConfig[] }
  | { type: 'tables'; tables: TableConfig[] };

export function parseImport(json: string): ParsedImport {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid import format');
  }

  const obj = data as Record<string, unknown>;

  // Multi-table export
  if (obj.type === 'tables' && Array.isArray(obj.tables)) {
    return {
      type: 'tables',
      tables: (obj.tables as TableConfigJSON[]).map(t => TableConfig.fromJSON(t)),
    };
  }

  if (obj.version !== 1) throw new Error('Unknown export version');

  if (obj.type === 'table' && obj.table) {
    return { type: 'table', table: TableConfig.fromJSON(obj.table as TableConfigJSON) };
  }

  if (obj.type === 'strategy' && obj.strategies) {
    return { type: 'strategy', strategies: obj.strategies as StrategyConfig[] };
  }

  if (obj.type === 'bundle') {
    const result: ParsedImport = {
      type: 'bundle',
      table: TableConfig.fromJSON((obj.table as TableConfigJSON) ?? {}),
      strategies: (obj.strategies as StrategyConfig[]) ?? [],
    };
    return result;
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
