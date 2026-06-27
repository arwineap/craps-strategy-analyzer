import React, { useState } from 'react';
import type { SerializedAccumulator, RunConfig } from '../../types.js';
import GameReplayModal from './GameReplayModal.js';

interface Props {
  accumulators: SerializedAccumulator[];
  seed: number;
  runConfig: RunConfig;
}

const PAGE_SIZE = 50;

export default function GameBrowser({ accumulators, seed, runConfig }: Props) {
  const [stratIdx, setStratIdx] = useState(0);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<{ gameNum: number; stratIdx: number } | null>(null);

  const acc = accumulators[Math.min(stratIdx, accumulators.length - 1)];
  if (!acc) return null;

  const total = acc.perGameFinal.length;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const pageLen = Math.min(PAGE_SIZE, total - start);

  return (
    <div>
      {accumulators.length > 1 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {accumulators.map((a, i) => (
            <button
              key={a.name}
              onClick={() => { setStratIdx(i); setPage(0); }}
              className={i === stratIdx ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
                style={{ background: a.color }}
              />
              {a.name}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm bg-white">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-700">Game</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-700">Final</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-700">Rolls</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-700">Peak</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-700">P&L</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: pageLen }, (_, i) => {
              const gn = start + i + 1;
              const final = acc.perGameFinal[start + i];
              const rolls = acc.rollsPerGame[start + i];
              const peak = acc.peakBankrolls[start + i];
              const pnl = final - acc.initialBankroll;
              return (
                <tr
                  key={gn}
                  className="border-b border-gray-100 last:border-0 hover:bg-indigo-50 cursor-pointer transition-colors"
                  onClick={() => setSelected({ gameNum: gn, stratIdx })}
                >
                  <td className="px-4 py-2 text-gray-500 tabular-nums">#{gn}</td>
                  <td className="text-right px-3 py-2 tabular-nums font-medium text-gray-800">
                    ${final.toFixed(0)}
                  </td>
                  <td className="text-right px-3 py-2 tabular-nums text-gray-600">{rolls}</td>
                  <td className="text-right px-3 py-2 tabular-nums text-gray-600">${peak.toFixed(0)}</td>
                  <td className={`text-right px-3 py-2 tabular-nums font-semibold ${pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-gray-500">
            {(start + 1).toLocaleString()}–{Math.min(start + PAGE_SIZE, total).toLocaleString()} of{' '}
            {total.toLocaleString()} games
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary btn-sm"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              className="btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selected && (
        <GameReplayModal
          gameNum={selected.gameNum}
          stratIdx={selected.stratIdx}
          accumulators={accumulators}
          seed={seed}
          runConfig={runConfig}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
