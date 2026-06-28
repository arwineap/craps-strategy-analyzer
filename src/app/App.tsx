import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { TableConfig, DEFAULT_TABLES } from '../lib/table-config.js';
import {
  loadCustomTables, saveCustomTables,
  loadPresetConfigs, savePresetConfigs,
  loadCustomStrategies, saveCustomStrategies,
  loadSimSettings, saveSimSettings,
} from './storage.js';
import type { PresetConfig, CustomStrategyDef, CustomTableDef, SimSettings, SimResultData } from './types.js';
import { useSimulation } from './hooks/useSimulation.js';
import Layout from './components/Layout.js';

// ── App Context ───────────────────────────────────────────────────────────────

interface AppContextType {
  customTables: CustomTableDef[];
  setCustomTables: (tables: CustomTableDef[]) => void;
  activeTable: TableConfig;
  presetConfigs: PresetConfig[];
  setPresetConfigs: (configs: PresetConfig[]) => void;
  customStrategies: CustomStrategyDef[];
  setCustomStrategies: (strategies: CustomStrategyDef[]) => void;
  simSettings: SimSettings;
  setSimSettings: (s: SimSettings) => void;
  simResult: SimResultData | null;
}

const AppCtx = createContext<AppContextType>(null!);
export const useAppContext = () => useContext(AppCtx);

// ── App ───────────────────────────────────────────────────────────────────────

interface AppProps {
  pendingImport?: { name: string; code: string } | null;
}

export default function App({ pendingImport }: AppProps) {
  const [customTables, setCustomTablesState] = useState<CustomTableDef[]>(() => loadCustomTables());
  const [presetConfigs, setPresetConfigsState]   = useState<PresetConfig[]>(() => loadPresetConfigs());
  const [customStrategies, setCustomStrategiesState] = useState<CustomStrategyDef[]>(() => loadCustomStrategies());
  const [simSettings, setSimSettingsState]       = useState<SimSettings>(() => loadSimSettings());

  // Pending shared strategy from URL (shown as a banner)
  const [pending, setPending] = useState<{ name: string; code: string } | null>(pendingImport ?? null);

  const { run, cancel, running, progress, accumulators, result, error } = useSimulation();

  const setCustomTables = useCallback((t: CustomTableDef[]) => {
    setCustomTablesState(t);
    saveCustomTables(t);
  }, []);

  const setPresetConfigs = useCallback((c: PresetConfig[]) => {
    setPresetConfigsState(c);
    savePresetConfigs(c);
  }, []);

  const setCustomStrategies = useCallback((s: CustomStrategyDef[]) => {
    setCustomStrategiesState(s);
    saveCustomStrategies(s);
  }, []);

  const setSimSettings = useCallback((s: SimSettings) => {
    setSimSettingsState(s);
    saveSimSettings(s);
  }, []);

  const activeTable = useMemo(() => {
    const id = simSettings.selectedTableId;
    if (id) {
      const preset = DEFAULT_TABLES.find(t => t.name === id);
      if (preset) return new TableConfig(preset);
      const custom = customTables.find(t => t.id === id);
      if (custom) return new TableConfig(custom);
    }
    return new TableConfig(DEFAULT_TABLES[0]);
  }, [simSettings.selectedTableId, customTables]);

  const acceptPendingImport = () => {
    if (!pending) return;
    const def: CustomStrategyDef = {
      id: crypto.randomUUID(),
      name: pending.name,
      description: '',
      code: pending.code,
      enabled: true,
    };
    const next = [...customStrategies, def];
    setCustomStrategies(next);
    setPending(null);
  };

  return (
    <AppCtx.Provider value={{
      customTables, setCustomTables,
      activeTable,
      presetConfigs, setPresetConfigs,
      customStrategies, setCustomStrategies,
      simSettings, setSimSettings,
      simResult: result,
    }}>
      {pending && (
        <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between gap-4 text-sm">
          <span>
            Someone shared a strategy: <strong>"{pending.name}"</strong>. Add it to My Strategies?
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={acceptPendingImport}
              className="bg-white text-indigo-600 font-medium px-3 py-1 rounded hover:bg-indigo-50 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setPending(null)}
              className="text-indigo-200 hover:text-white px-2 py-1 rounded"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
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
