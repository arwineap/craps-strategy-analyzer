import React from 'react';
import { computeKpis } from '../../../lib/statistics.js';
import { StrategyAccumulator } from '../../../lib/simulator.js';
import type { SerializedAccumulator } from '../../types.js';
import { downloadJSON } from '../../export.js';

interface Props {
  accumulators: SerializedAccumulator[];
}

function toAccumulator(s: SerializedAccumulator): StrategyAccumulator {
  const acc = new StrategyAccumulator(s.name, s.color, s.initialBankroll);
  acc.gamesCompleted = s.gamesCompleted;
  acc.totalRolls = s.totalRolls;
  acc.totalWagered = s.totalWagered;
  acc.totalWon = s.totalWon;
  acc.totalCasinoPoints = s.totalCasinoPoints;
  acc.peakBankrolls = s.peakBankrolls;
  acc.rollsPerGame = s.rollsPerGame;
  acc.perGameFinal = s.perGameFinal;
  acc.avgBankrollCurve = s.avgBankrollCurve;
  acc.perGameSamples = s.perGameSamples;
  return acc;
}

function fmt(n: number, prefix = '', suffix = '', decimals = 1) {
  return `${prefix}${n.toFixed(decimals)}${suffix}`;
}

export default function KPITable({ accumulators }: Props) {
  const kpis = accumulators.map(s => computeKpis(toAccumulator(s)));

  const handleExportCSV = () => {
    const headers = [
      'Strategy', 'Games', 'Avg Rolls', 'Median Rolls',
      'Avg Peak ($)', 'Peak/Start', 'Survival 2x (%)',
      'ROI (%)', 'House Edge (%)', 'Net P&L ($)',
      'Avg Casino Pts ($)', 'Est Comp/Game ($)',
      'Volatility', 'Sharpe',
    ];
    const rows = kpis.map(k => [
      k.name, k.games, k.avgRolls.toFixed(0), k.medianRolls.toFixed(0),
      k.avgPeak.toFixed(0), k.peakToInitial.toFixed(2), (k.survivalRate2x * 100).toFixed(1),
      k.roiPct.toFixed(2), k.effectiveHouseEdge.toFixed(2), k.netPnl.toFixed(0),
      k.avgCasinoPointsPerGame.toFixed(0), k.estimatedCompPerGame.toFixed(2),
      k.volatility.toFixed(4), k.sharpe.toFixed(3),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'craps_analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const cols: { label: string; key: keyof typeof kpis[0]; format: (v: number) => string; good?: 'high' | 'low' }[] = [
    { label: 'Avg Rolls',      key: 'avgRolls',               format: v => v.toFixed(0),            good: 'high' },
    { label: 'Median Rolls',   key: 'medianRolls',            format: v => v.toFixed(0),            good: 'high' },
    { label: 'P10 Rolls',      key: 'p10Rolls',               format: v => v.toFixed(0) },
    { label: 'P90 Rolls',      key: 'p90Rolls',               format: v => v.toFixed(0) },
    { label: 'Avg Peak',       key: 'avgPeak',                format: v => `$${v.toFixed(0)}`,      good: 'high' },
    { label: 'Peak/Start',     key: 'peakToInitial',          format: v => `${v.toFixed(2)}×`,      good: 'high' },
    { label: 'Survival 2×',    key: 'survivalRate2x',         format: v => `${(v*100).toFixed(1)}%`, good: 'high' },
    { label: 'ROI',            key: 'roiPct',                 format: v => `${v.toFixed(2)}%`,      good: 'high' },
    { label: 'House Edge',     key: 'effectiveHouseEdge',     format: v => `${v.toFixed(2)}%`,      good: 'low' },
    { label: 'Net P&L',        key: 'netPnl',                 format: v => `$${v.toFixed(0)}`,      good: 'high' },
    { label: 'Casino Pts/Game',key: 'avgCasinoPointsPerGame', format: v => `$${v.toFixed(0)}`,      good: 'high' },
    { label: 'Est Comp/Game',  key: 'estimatedCompPerGame',   format: v => `$${v.toFixed(2)}`,      good: 'high' },
    { label: 'Volatility',     key: 'volatility',             format: v => v.toFixed(4),            good: 'low' },
    { label: 'Sharpe',         key: 'sharpe',                 format: v => v.toFixed(3),            good: 'high' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button onClick={handleExportCSV} className="btn-secondary btn-sm">Export CSV</button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm bg-white">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="sticky left-0 bg-gray-50 text-left px-4 py-2.5 font-semibold text-gray-700 whitespace-nowrap">
                Strategy
              </th>
              {cols.map(c => (
                <th key={c.key} className="text-right px-3 py-2.5 font-semibold text-gray-700 whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi, ri) => (
              <tr key={kpi.name} className={`border-b border-gray-100 last:border-0 ${ri % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                <td className="sticky left-0 bg-inherit px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                    style={{ background: accumulators[ri]?.color }}
                  />
                  {kpi.name}
                </td>
                {cols.map(c => {
                  const val = kpi[c.key] as number;
                  let colorClass = 'text-gray-700';
                  if (c.good === 'high') colorClass = val > 0 ? 'text-emerald-700' : 'text-red-600';
                  if (c.good === 'low')  colorClass = val < 5 ? 'text-emerald-700' : 'text-orange-600';
                  return (
                    <td key={c.key} className={`text-right px-3 py-2 tabular-nums whitespace-nowrap ${colorClass}`}>
                      {c.format(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
