import React, { useState } from 'react';
import { useAppContext } from '../../App.js';
import KPITable from './KPITable.js';
import BankrollChart from './BankrollChart.js';
import GameBrowser from './GameBrowser.js';

export default function AnalysisPage() {
  const { simResult } = useAppContext();
  const [showIndividual, setShowIndividual] = useState(true);

  if (!simResult) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-5xl mb-4">📊</p>
        <p className="text-lg font-medium">No results yet</p>
        <p className="text-sm mt-1">Run a simulation on the Simulation tab first</p>
      </div>
    );
  }

  const { totalGames, accumulators, seed, runConfig } = simResult;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Analysis</h2>
        <p className="text-sm text-gray-500">
          {totalGames.toLocaleString()} games · {accumulators.length} strateg{accumulators.length === 1 ? 'y' : 'ies'}
          {' · '}
          <span className="font-mono">seed {seed}</span>
        </p>
      </div>

      {/* Bankroll chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Bankroll Curves</h3>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showIndividual}
              onChange={e => setShowIndividual(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Show individual games
          </label>
        </div>
        <BankrollChart accumulators={accumulators} showIndividual={showIndividual} />
      </div>

      {/* KPI table */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Key Performance Indicators</h3>
        <KPITable accumulators={accumulators} />
      </div>

      {/* Game browser */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Browse Games</h3>
        <p className="text-sm text-gray-500 mb-3">
          Click any row for a roll-by-roll replay. Use seed <span className="font-mono">{seed}</span> to reproduce this run.
        </p>
        <GameBrowser accumulators={accumulators} seed={seed} runConfig={runConfig} />
      </div>

      {/* Legend / explanation */}
      <div className="card bg-blue-50 border-blue-100">
        <h4 className="font-semibold text-blue-900 mb-2 text-sm">How to read the KPIs</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-blue-800">
          <p><strong>ROI</strong> — Net profit ÷ total wagered. All strategies are negative (house edge).</p>
          <p><strong>House Edge</strong> — Effective edge as seen empirically. Should match theoretical.</p>
          <p><strong>Avg Rolls</strong> — How many dice rolls until bankroll is exhausted.</p>
          <p><strong>P10 / P90</strong> — 10th and 90th percentile roll counts (short vs long games).</p>
          <p><strong>Peak/Start</strong> — Average ratio of peak bankroll to starting bankroll.</p>
          <p><strong>Survival 2×</strong> — Fraction of games where bankroll reached double the start.</p>
          <p><strong>Casino Pts/Game</strong> — Total rated-bet action per game (for comps).</p>
          <p><strong>Sharpe</strong> — Return ÷ volatility. Higher = better risk-adjusted outcome.</p>
        </div>
      </div>
    </div>
  );
}
