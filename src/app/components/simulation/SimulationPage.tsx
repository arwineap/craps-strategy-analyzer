import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../App.js';
import { saveSimSettings } from '../../storage.js';
import { PRESET_CODES } from '../../../lib/strategies/preset-codes.js';
import type { SerializedAccumulator, RunConfig, WorkerStrategyConfig } from '../../types.js';
import SimulationControls from './SimulationControls.js';
import StrategySelector from './StrategySelector.js';
import LiveChart from './LiveChart.js';

interface Props {
  run: (config: RunConfig) => void;
  cancel: () => void;
  running: boolean;
  progress: number;
  accumulators: SerializedAccumulator[];
  onViewAnalysis: () => void;
}

type SortCol = 'name' | 'avgRolls' | 'roi' | 'avgPeak' | 'doubled' | 'bust';
type SortDir = 'asc' | 'desc';

export default function SimulationPage({ run, cancel, running, progress, accumulators, onViewAnalysis }: Props) {
  const { activeTable, presetConfigs, customStrategies, simSettings, setSimSettings } = useAppContext();

  const { bankroll } = simSettings;
  const allEnabled: WorkerStrategyConfig[] = [
    ...presetConfigs
      .filter(p => p.enabled && PRESET_CODES[p.name])
      .map(p => ({ name: p.name, code: PRESET_CODES[p.name], bankroll })),
    ...customStrategies
      .filter(c => c.enabled)
      .map(c => ({ name: c.name, code: c.code, bankroll })),
  ];

  const [selected, setSelected] = useState<Set<string>>(() => new Set(allEnabled.map(s => s.name)));
  const [sortCol, setSortCol] = useState<SortCol>('roi');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleToggle = useCallback((name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleSelectAll  = useCallback(() => setSelected(new Set(allEnabled.map(s => s.name))), [allEnabled]);
  const handleClearAll   = useCallback(() => setSelected(new Set()), []);

  const handleRun = () => {
    const toRun = allEnabled.filter(s => selected.has(s.name));
    if (toRun.length === 0) {
      alert('Select at least one strategy to run.');
      return;
    }
    const config: RunConfig = {
      strategyConfigs: toRun,
      tableData: activeTable.toJSON(),
      nGames:   simSettings.nGames,
      maxRolls: simSettings.maxRolls,
      seed:     simSettings.seed,
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
        items={allEnabled}
        selected={selected}
        onToggle={handleToggle}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
      />

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

      {accumulators.length > 0 && <LiveChart accumulators={accumulators} />}

      {accumulators.length > 0 && !running && (
        <>
          <SummaryTable accumulators={accumulators} sortCol={sortCol} sortDir={sortDir} onSort={(col, dir) => { setSortCol(col); setSortDir(dir); }} />
          <div className="flex justify-center pt-2">
            <button className="btn-primary" onClick={onViewAnalysis}>
              View Full Analysis →
            </button>
          </div>
        </>
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

function SummaryTable({ accumulators, sortCol, sortDir, onSort }: {
  accumulators: SerializedAccumulator[];
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol, dir: SortDir) => void;
}) {
  function handleSort(col: SortCol) {
    if (col === sortCol) {
      onSort(col, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(col, col === 'name' ? 'asc' : 'desc');
    }
  }

  const rows = accumulators.map(acc => {
    const n = acc.perGameFinal.length;
    const doubled = n ? (acc.perGameFinal.filter(f => f >= acc.initialBankroll * 2).length / n) * 100 : 0;
    const bust    = n ? (acc.perGameFinal.filter(f => f === 0).length / n) * 100 : 0;
    return {
      acc,
      avgRolls: acc.gamesCompleted ? acc.totalRolls / acc.gamesCompleted : 0,
      roi: acc.totalWagered ? ((acc.totalWon - acc.totalWagered) / acc.totalWagered) * 100 : 0,
      avgPeak: acc.peakBankrolls.length
        ? acc.peakBankrolls.reduce((a, b) => a + b, 0) / acc.peakBankrolls.length
        : 0,
      doubled,
      bust,
    };
  });

  rows.sort((a, b) => {
    let cmp = 0;
    if (sortCol === 'name') cmp = a.acc.name.localeCompare(b.acc.name);
    else if (sortCol === 'avgRolls') cmp = a.avgRolls - b.avgRolls;
    else if (sortCol === 'roi') cmp = a.roi - b.roi;
    else if (sortCol === 'avgPeak') cmp = a.avgPeak - b.avgPeak;
    else if (sortCol === 'doubled') cmp = a.doubled - b.doubled;
    else if (sortCol === 'bust') cmp = a.bust - b.bust;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function Th({ col, children, align = 'right' }: { col: SortCol; children: React.ReactNode; align?: 'left' | 'right' }) {
    const active = sortCol === col;
    const arrow = active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
    return (
      <th
        className={`py-1.5 pr-4 font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 ${align === 'right' ? 'text-right' : 'text-left'} ${active ? 'text-gray-900' : ''}`}
        onClick={() => handleSort(col)}
      >
        {children}{arrow && <span className="text-xs ml-0.5">{arrow}</span>}
      </th>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <h3 className="font-semibold text-gray-900 mb-3">Quick Summary</h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <Th col="name" align="left">Strategy</Th>
            <Th col="avgRolls">Avg Rolls</Th>
            <Th col="roi">ROI</Th>
            <Th col="doubled">2x Rate</Th>
            <Th col="bust">Bust Rate</Th>
            <Th col="avgPeak">Avg Peak</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ acc, avgRolls, roi, doubled, bust, avgPeak }) => (
            <tr key={acc.name} className="border-b border-gray-100 last:border-0">
              <td className="py-1.5 pr-4">
                <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: acc.color }} />
                {acc.name}
              </td>
              <td className="text-right py-1.5 pr-4 tabular-nums">{avgRolls.toFixed(0)}</td>
              <td className={`text-right py-1.5 pr-4 tabular-nums font-medium ${roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {roi.toFixed(2)}%
              </td>
              <td className="text-right py-1.5 pr-4 tabular-nums text-indigo-600 font-medium">
                {doubled.toFixed(1)}%
              </td>
              <td className="text-right py-1.5 pr-4 tabular-nums text-red-600 font-medium">
                {bust.toFixed(1)}%
              </td>
              <td className="text-right py-1.5 tabular-nums">${avgPeak.toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
