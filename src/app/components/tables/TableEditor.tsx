import React, { useState } from 'react';
import { TableConfig, ODDS_OPTIONS, FireBetPayouts, AllSmallTallPayouts } from '../../../lib/table-config.js';

interface Props {
  initial?: TableConfig;
  onSave: (table: TableConfig) => void;
  onCancel: () => void;
}

export default function TableEditor({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? 'My Table');
  const [tableMin, setTableMin] = useState(initial?.tableMin ?? 5);
  const [odds, setOdds] = useState(initial?.odds ?? '3-4-5x');
  const [vigPer, setVigPer] = useState(initial?.vigPer ?? 20);
  const [fieldTriple12, setFieldTriple12] = useState(initial?.fieldTriple12 ?? false);
  const [fireBetEnabled, setFireBetEnabled] = useState(initial?.fireBetEnabled ?? false);
  const [fireBetPayouts, setFireBetPayouts] = useState<FireBetPayouts>(
    initial?.fireBetPayouts ?? { pts4: 25, pts5: 250, pts6: 1000 },
  );
  const [allSmallTallEnabled, setAllSmallTallEnabled] = useState(initial?.allSmallTallEnabled ?? false);
  const [allSmallTallPayouts, setAllSmallTallPayouts] = useState<AllSmallTallPayouts>(
    initial?.allSmallTallPayouts ?? { small: 34, tall: 34, all: 150 },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(new TableConfig({
      name, tableMin, odds, vigPer, fieldTriple12,
      fireBetEnabled, fireBetPayouts,
      allSmallTallEnabled, allSmallTallPayouts,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Table Name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Table Minimum ($)</label>
          <input
            type="number" className="input" value={tableMin} min={1} step={1}
            onChange={e => setTableMin(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Free Odds</label>
          <select className="input" value={odds} onChange={e => setOdds(e.target.value)}>
            {ODDS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Buy/Lay Vig (per $)</label>
          <input
            type="number" className="input" value={vigPer} min={1} step={1}
            onChange={e => setVigPer(parseFloat(e.target.value))}
          />
          <p className="text-xs text-gray-500 mt-1">$1 vig per this many dollars (buy: on stake; lay: on win)</p>
        </div>
        <div className="flex items-center pt-6 gap-2">
          <input
            type="checkbox" id="field12" checked={fieldTriple12}
            onChange={e => setFieldTriple12(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="field12" className="text-sm font-medium text-gray-700">
            Field pays 3:1 on 12
          </label>
        </div>
      </div>

      {/* Fire Bet */}
      <div className="border rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox" id="fireBetEnabled" checked={fireBetEnabled}
            onChange={e => setFireBetEnabled(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="fireBetEnabled" className="text-sm font-medium text-gray-700">
            Fire Bet available
          </label>
        </div>
        {fireBetEnabled && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Payouts for unique points made before seven-out:</p>
            <div className="grid grid-cols-3 gap-2">
              {([['pts4', '4 pts'], ['pts5', '5 pts'], ['pts6', '6 pts']] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-gray-600">{label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" className="input text-sm" value={fireBetPayouts[key]} min={1} step={1}
                      onChange={e => setFireBetPayouts(p => ({ ...p, [key]: parseInt(e.target.value) || 1 }))}
                    />
                    <span className="text-xs text-gray-400">:1</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All / Small / Tall */}
      <div className="border rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox" id="allSmallTallEnabled" checked={allSmallTallEnabled}
            onChange={e => setAllSmallTallEnabled(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="allSmallTallEnabled" className="text-sm font-medium text-gray-700">
            All / Small / Tall bets available
          </label>
        </div>
        {allSmallTallEnabled && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Hit all required numbers before 7 to win:</p>
            <div className="grid grid-cols-3 gap-2">
              {([['small', 'Small (2–6)'], ['tall', 'Tall (8–12)'], ['all', 'All (2–12)']] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-gray-600">{label}</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" className="input text-sm" value={allSmallTallPayouts[key]} min={1} step={1}
                      onChange={e => setAllSmallTallPayouts(p => ({ ...p, [key]: parseInt(e.target.value) || 1 }))}
                    />
                    <span className="text-xs text-gray-400">:1</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn-primary">Save Table</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
