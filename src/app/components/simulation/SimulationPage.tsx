import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../App.js';
import { saveSimSettings } from '../../storage.js';
import type { SerializedAccumulator, RunConfig } from '../../types.js';
import SimulationControls from './SimulationControls.js';
import StrategySelector from './StrategySelector.js';
import LiveChart from './LiveChart.js';

interface Props {
  run: (config: RunConfig) => void;
  cancel: () => void;
  running: boolean;
  progress: number;
  accumulators: SerializedAccumulator[];
}

export default function SimulationPage({ run, cancel, running, progress, accumulators }: Props) {
  const { activeTable, strategyConfigs, simSettings, setSimSettings } = useAppContext();

  const enabledPresets = strategyConfigs.filter(s => s.enabled).map(s => s.preset);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(enabledPresets));

  const handleToggle = useCallback((preset: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(preset)) next.delete(preset);
      else next.add(preset);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelected(new Set(enabledPresets));
  }, [enabledPresets]);

  const handleClearAll = useCallback(() => setSelected(new Set()), []);

  const handleRun = () => {
    const toRun = strategyConfigs.filter(s => s.enabled && selected.has(s.preset));
    if (toRun.length === 0) {
      alert('Select at least one strategy to run.');
      return;
    }

    const config: RunConfig = {
      strategyConfigs: toRun,
      tableData: activeTable.toJSON(),
      nGames: simSettings.nGames,
      maxRolls: simSettings.maxRolls,
      seed: simSettings.seed,
    };
    run(config);
  };

  const handleSettingsChange = (s: typeof simSettings) => {
    setSimSettings(s);
    saveSimSettings(s);
  };

  const pct = Math.round(progress * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Simulation</h2>
          <p className="text-sm text-gray-500">Table: <strong>{activeTable.name}</strong></p>
        </div>
        <div className="flex gap-2">
          {running ? (
            <button className="btn-danger" onClick={cancel}>
              ⏹ Cancel
            </button>
          ) : (
            <button className="btn-primary" onClick={handleRun} disabled={running}>
              ▶ Run Simulation
            </button>
          )}
        </div>
      </div>

      <SimulationControls settings={simSettings} onChange={handleSettingsChange} />

      <StrategySelector
        configs={strategyConfigs}
        selected={selected}
        onToggle={handleToggle}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />

      {/* Progress bar */}
      {(running || pct > 0) && (
        <div className="card">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-gray-700">
              {running ? 'Running…' : 'Complete'}
            </span>
            <span className="text-sm text-gray-500">{pct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Live chart */}
      {accumulators.length > 0 && <LiveChart accumulators={accumulators} />}

      {/* Quick stats table */}
      {accumulators.length > 0 && !running && (
        <div className="card overflow-x-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Summary</h3>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1.5 pr-4 font-medium text-gray-600">Strategy</th>
                <th className="text-right py-1.5 pr-4 font-medium text-gray-600">Avg Rolls</th>
                <th className="text-right py-1.5 pr-4 font-medium text-gray-600">ROI</th>
                <th className="text-right py-1.5 font-medium text-gray-600">Avg Peak</th>
              </tr>
            </thead>
            <tbody>
              {accumulators.map(acc => {
                const roi = acc.totalWagered
                  ? ((acc.totalWon - acc.totalWagered) / acc.totalWagered) * 100
                  : 0;
                const avgRolls = acc.gamesCompleted ? acc.totalRolls / acc.gamesCompleted : 0;
                const avgPeak = acc.peakBankrolls.length
                  ? acc.peakBankrolls.reduce((a, b) => a + b, 0) / acc.peakBankrolls.length
                  : 0;
                return (
                  <tr key={acc.name} className="border-b border-gray-100 last:border-0">
                    <td className="py-1.5 pr-4">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                        style={{ background: acc.color }}
                      />
                      {acc.name}
                    </td>
                    <td className="text-right py-1.5 pr-4 tabular-nums">{avgRolls.toFixed(0)}</td>
                    <td className={`text-right py-1.5 pr-4 tabular-nums font-medium ${roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {roi.toFixed(2)}%
                    </td>
                    <td className="text-right py-1.5 tabular-nums">${avgPeak.toFixed(0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {accumulators.length === 0 && !running && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🎲</p>
          <p className="text-lg font-medium">Ready to simulate</p>
          <p className="text-sm mt-1">Select strategies above and click Run Simulation</p>
        </div>
      )}
    </div>
  );
}
