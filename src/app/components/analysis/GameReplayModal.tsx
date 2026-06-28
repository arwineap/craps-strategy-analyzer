import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, CategoryScale, Tooltip,
} from 'chart.js';
import { CodeStrategy } from '../../../lib/strategies/code-strategy.js';
import { TableConfig } from '../../../lib/table-config.js';
import { replayGame } from '../../../lib/replay.js';
import type { SerializedAccumulator, RunConfig } from '../../types.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip);

interface Props {
  gameNum: number;
  stratIdx: number;
  accumulators: SerializedAccumulator[];
  seed: number;
  runConfig: RunConfig;
  onClose: () => void;
}

const MAX_DISPLAY_ROLLS = 2000;

// Expected probability for each total (out of 36 combinations)
const EXPECTED_WAYS: Record<number, number> = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
};

export default function GameReplayModal({ gameNum, stratIdx, accumulators, seed, runConfig, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const [activeTab, setActiveTab] = useState<'rolls' | 'dice'>('rolls');
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState<number>(1); // updated once replay loads

  const replay = useMemo(() => {
    const sc = runConfig.strategyConfigs[stratIdx];
    if (!sc) return null;
    const tableConfig = TableConfig.fromJSON(runConfig.tableData);
    const strategy = new CodeStrategy(sc.code, sc.bankroll, tableConfig.tableMin, tableConfig);
    return replayGame(strategy, gameNum, seed, runConfig.maxRolls, tableConfig);
  }, [gameNum, stratIdx, seed, runConfig]);

  // Reset range and tab when game changes
  useEffect(() => {
    setActiveTab('rolls');
    setRangeFrom(1);
    setRangeTo(replay?.rolls.length ?? 1);
  }, [replay]);

  const acc = accumulators[stratIdx];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !replay) return;

    chartRef.current?.destroy();

    const assets = replay.rolls.map(r => r.bankroll + r.tableValue);
    const labels = replay.rolls.map(r => String(r.rollNum));

    chartRef.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Total Assets',
          data: assets,
          borderColor: acc?.color ?? '#2196F3',
          backgroundColor: (acc?.color ?? '#2196F3') + '20',
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.15,
          fill: true,
        }],
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => `$${(ctx.raw as number).toFixed(0)}` },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Roll', font: { size: 10 } },
            ticks: { maxTicksLimit: 8, font: { size: 9 } },
          },
          y: {
            ticks: {
              font: { size: 9 },
              callback: v => `$${Number(v).toLocaleString()}`,
            },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); chartRef.current = null; };
  }, [replay, acc]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Dice stats for the selected range
  const diceStats = useMemo(() => {
    if (!replay) return null;
    const n = replay.rolls.length;
    const from = Math.max(1, rangeFrom);
    const to = Math.min(n, rangeTo);
    const filtered = replay.rolls.filter(r => r.rollNum >= from && r.rollNum <= to);

    const totals: Record<number, number> = {};
    const die1: Record<number, number> = {};
    const die2: Record<number, number> = {};
    for (let i = 2; i <= 12; i++) totals[i] = 0;
    for (let i = 1; i <= 6; i++) { die1[i] = 0; die2[i] = 0; }

    for (const roll of filtered) {
      totals[roll.total]++;
      die1[roll.die1]++;
      die2[roll.die2]++;
    }

    return { totals, die1, die2, n: filtered.length };
  }, [replay, rangeFrom, rangeTo]);

  if (!replay) return null;

  const totalRolls = replay.rolls.length;
  const pnl = replay.finalBankroll - replay.initialBankroll;
  const displayRolls = replay.rolls.slice(0, MAX_DISPLAY_ROLLS);
  const truncated = replay.rolls.length > MAX_DISPLAY_ROLLS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Game #{gameNum} · {replay.strategyName}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500 mt-0.5">
              <span>
                Final:{' '}
                <strong className={pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  ${replay.finalBankroll.toFixed(0)}
                </strong>
              </span>
              <span>Peak: ${replay.peakBankroll.toFixed(0)}</span>
              <span>Rolls: {replay.rolls.length.toLocaleString()}</span>
              <span>
                P&L:{' '}
                <strong className={pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}
                </strong>
              </span>
              <span className="text-gray-400 font-mono text-xs">seed {seed} · game {gameNum}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary btn-sm ml-4 flex-shrink-0">✕</button>
        </div>

        {/* Bankroll chart */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex-shrink-0" style={{ height: 180 }}>
          <canvas ref={canvasRef} />
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('rolls')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'rolls'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Rolls ({totalRolls.toLocaleString()})
          </button>
          <button
            onClick={() => setActiveTab('dice')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === 'dice'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Dice Stats
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Rolls tab ── */}
          {activeTab === 'rolls' && (
            <>
              {truncated && (
                <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100">
                  Showing first {MAX_DISPLAY_ROLLS.toLocaleString()} of {replay.rolls.length.toLocaleString()} rolls
                </div>
              )}
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white border-b border-gray-200 z-10">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 w-12">#</th>
                    <th className="text-center px-2 py-2 font-semibold text-gray-600 w-20">Dice</th>
                    <th className="text-left px-2 py-2 font-semibold text-gray-600 w-28">Event</th>
                    <th className="text-left px-2 py-2 font-semibold text-gray-600">Wins</th>
                    <th className="text-left px-2 py-2 font-semibold text-gray-600">Losses</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-600 w-20">Net</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-600 w-24">Assets</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRolls.map(roll => (
                    <tr key={roll.rollNum} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-400 tabular-nums">{roll.rollNum}</td>
                      <td className="px-2 py-1.5 text-center font-mono font-medium text-gray-700">
                        {roll.die1}+{roll.die2}={roll.total}
                      </td>
                      <td className={`px-2 py-1.5 font-medium whitespace-nowrap ${
                        roll.event.includes('!') ? 'text-emerald-700' :
                        roll.event.startsWith('Seven') ? 'text-red-600' :
                        roll.event.startsWith('Natural') ? 'text-emerald-600' :
                        roll.event.startsWith('Craps') ? 'text-red-500' :
                        'text-gray-600'
                      }`}>
                        {roll.event}
                      </td>
                      <td className="px-2 py-1.5 text-emerald-700">
                        {roll.wins.map((w, i) => (
                          <span key={i} className="mr-2 whitespace-nowrap">{w.label} +${w.net.toFixed(0)}</span>
                        ))}
                      </td>
                      <td className="px-2 py-1.5 text-red-600">
                        {roll.losses.map((l, i) => (
                          <span key={i} className="mr-2 whitespace-nowrap">{l.label} ${l.net.toFixed(0)}</span>
                        ))}
                      </td>
                      <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${
                        roll.delta > 0.005 ? 'text-emerald-600' :
                        roll.delta < -0.005 ? 'text-red-600' :
                        'text-gray-400'
                      }`}>
                        {Math.abs(roll.delta) > 0.005
                          ? `${roll.delta > 0 ? '+' : ''}$${roll.delta.toFixed(0)}`
                          : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-gray-800">
                        ${(roll.bankroll + roll.tableValue).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ── Dice Stats tab ── */}
          {activeTab === 'dice' && diceStats && (
            <div className="p-4 space-y-5">

              {/* Range selector */}
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-gray-600 font-medium">Rolls</span>
                <input
                  type="number"
                  min={1}
                  max={totalRolls}
                  value={rangeFrom}
                  onChange={e => setRangeFrom(Math.max(1, Math.min(totalRolls, parseInt(e.target.value) || 1)))}
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="number"
                  min={1}
                  max={totalRolls}
                  value={rangeTo}
                  onChange={e => setRangeTo(Math.max(1, Math.min(totalRolls, parseInt(e.target.value) || totalRolls)))}
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
                <button
                  onClick={() => { setRangeFrom(1); setRangeTo(totalRolls); }}
                  className="btn-secondary btn-sm"
                >
                  Reset
                </button>
                <span className="text-gray-400 text-xs">
                  {diceStats.n.toLocaleString()} roll{diceStats.n !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Totals distribution */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Totals Distribution
                </h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-center px-3 py-2 font-semibold text-gray-600 w-12">Total</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-600 w-16">Count</th>
                        <th className="px-3 py-2 font-semibold text-gray-600">Actual %</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-600 w-20">Expected %</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-600 w-16">Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 11 }, (_, i) => i + 2).map(t => {
                        const count = diceStats.totals[t] ?? 0;
                        const actualPct = diceStats.n > 0 ? (count / diceStats.n) * 100 : 0;
                        const expectedPct = (EXPECTED_WAYS[t] / 36) * 100;
                        const delta = actualPct - expectedPct;
                        // Bar width: scale so 7's expected ~16.7% fills ~70% of bar container
                        const barPct = Math.min(100, (actualPct / 20) * 100);
                        const barColor = delta > 3 ? '#10b981' : delta < -3 ? '#ef4444' : '#818cf8';
                        return (
                          <tr key={t} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                            <td className="px-3 py-2 text-center font-semibold text-gray-700 tabular-nums">{t}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-600">{count}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-0">
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{ width: `${barPct}%`, background: barColor }}
                                  />
                                </div>
                                <span className="w-10 text-right tabular-nums text-gray-700">
                                  {actualPct.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-400">
                              {expectedPct.toFixed(1)}%
                            </td>
                            <td className={`px-3 py-2 text-right tabular-nums font-medium ${
                              delta > 3 ? 'text-emerald-600' :
                              delta < -3 ? 'text-red-500' :
                              'text-gray-400'
                            }`}>
                              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Individual die faces */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Die Face Frequencies
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {(['die1', 'die2'] as const).map((dieKey, di) => (
                    <div key={dieKey} className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5">
                        <span className="text-xs font-semibold text-gray-600">Die {di + 1}</span>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-center px-2 py-1.5 font-semibold text-gray-500 w-10">Face</th>
                            <th className="text-right px-2 py-1.5 font-semibold text-gray-500 w-12">Count</th>
                            <th className="px-2 py-1.5 font-semibold text-gray-500">Freq</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3, 4, 5, 6].map(face => {
                            const count = diceStats[dieKey][face] ?? 0;
                            const pct = diceStats.n > 0 ? (count / diceStats.n) * 100 : 0;
                            const expected = 100 / 6;
                            const delta = pct - expected;
                            const barPct = Math.min(100, (pct / 25) * 100);
                            const barColor = delta > 3 ? '#10b981' : delta < -3 ? '#ef4444' : '#818cf8';
                            return (
                              <tr key={face} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                <td className="px-2 py-1.5 text-center font-semibold text-gray-700 tabular-nums">{face}</td>
                                <td className="px-2 py-1.5 text-right tabular-nums text-gray-600">{count}</td>
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-0">
                                      <div
                                        className="h-1.5 rounded-full"
                                        style={{ width: `${barPct}%`, background: barColor }}
                                      />
                                    </div>
                                    <span className="w-9 text-right tabular-nums text-gray-600">
                                      {pct.toFixed(1)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}