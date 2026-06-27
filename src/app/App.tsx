import React, { createContext, useContext, useState, useCallback } from 'react';
import { TableConfig } from '../lib/table-config.js';
import {
  loadTables, saveTables,
  loadActiveTableIdx, saveActiveTableIdx,
  loadStrategyConfigs, saveStrategyConfigs,
  loadSimSettings, saveSimSettings,
} from './storage.js';
import type { StrategyConfig, SimSettings, SimResultData } from './types.js';
import { useSimulation } from './hooks/useSimulation.js';
import Layout from './components/Layout.js';

// ── App Context ───────────────────────────────────────────────────────────────

interface AppContextType {
  tables: TableConfig[];
  setTables: (tables: TableConfig[]) => void;
  activeTableIdx: number;
  setActiveTableIdx: (idx: number) => void;
  activeTable: TableConfig;
  strategyConfigs: StrategyConfig[];
  setStrategyConfigs: (configs: StrategyConfig[]) => void;
  simSettings: SimSettings;
  setSimSettings: (s: SimSettings) => void;
  simResult: SimResultData | null;
}

const AppCtx = createContext<AppContextType>(null!);
export const useAppContext = () => useContext(AppCtx);

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [tables, setTablesState] = useState<TableConfig[]>(() => loadTables());
  const [activeTableIdx, setActiveTableIdxState] = useState(() => {
    const idx = loadActiveTableIdx();
    return Math.min(idx, Math.max(0, loadTables().length - 1));
  });
  const [strategyConfigs, setStrategyConfigsState] = useState<StrategyConfig[]>(() => loadStrategyConfigs());
  const [simSettings, setSimSettingsState] = useState<SimSettings>(() => loadSimSettings());

  const { run, cancel, running, progress, accumulators, result, error } = useSimulation();

  const setTables = useCallback((t: TableConfig[]) => {
    setTablesState(t);
    saveTables(t);
  }, []);

  const setActiveTableIdx = useCallback((idx: number) => {
    setActiveTableIdxState(idx);
    saveActiveTableIdx(idx);
  }, []);

  const setStrategyConfigs = useCallback((c: StrategyConfig[]) => {
    setStrategyConfigsState(c);
    saveStrategyConfigs(c);
  }, []);

  const setSimSettings = useCallback((s: SimSettings) => {
    setSimSettingsState(s);
    saveSimSettings(s);
  }, []);

  const activeTable = tables[Math.min(activeTableIdx, tables.length - 1)] ?? new TableConfig();

  return (
    <AppCtx.Provider value={{
      tables, setTables,
      activeTableIdx, setActiveTableIdx,
      activeTable,
      strategyConfigs, setStrategyConfigs,
      simSettings, setSimSettings,
      simResult: result,
    }}>
      <Layout
        run={run}
        cancel={cancel}
        running={running}
        progress={progress}
        accumulators={accumulators}
        error={error}
      />
    </AppCtx.Provider>
  );
}
