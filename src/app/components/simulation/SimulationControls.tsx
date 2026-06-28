import React from 'react';
import { DEFAULT_TABLES } from '../../../lib/table-config.js';
import { useAppContext } from '../../App.js';
import type { SimSettings } from '../../types.js';

interface Props {
  settings: SimSettings;
  onChange: (s: SimSettings) => void;
}

export default function SimulationControls({ settings, onChange }: Props) {
  const { customTables } = useAppContext();

  const allTableOptions = [
    ...DEFAULT_TABLES.map(t => ({ id: t.name, label: t.name })),
    ...customTables.map(t => ({ id: t.id, label: t.name })),
  ];

  const selectedId = settings.selectedTableId ?? DEFAULT_TABLES[0].name;

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-3">Simulation Settings</h3>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div>
          <label className="label">Table</label>
          <select
            className="input"
            value={selectedId}
            onChange={e => onChange({ ...settings, selectedTableId: e.target.value })}
          >
            {allTableOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
            {allTableOptions.length === 0 && <option value="">No tables defined</option>}
          </select>
        </div>

        <div>
          <label className="label">Starting Bankroll ($)</label>
          <input
            type="number"
            className="input"
            min={1}
            step={100}
            value={settings.bankroll}
            onChange={e => {
              const val = parseFloat(e.target.value);
              if (val > 0) onChange({ ...settings, bankroll: val });
            }}
          />
        </div>

        <div>
          <label className="label">Games</label>
          <select
            className="input"
            value={settings.nGames}
            onChange={e => onChange({ ...settings, nGames: parseInt(e.target.value, 10) })}
          >
            {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map(n => (
              <option key={n} value={n}>{n.toLocaleString()}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Rolls / Game</label>
          <input
            type="number"
            className="input"
            min={1}
            value={settings.maxRolls}
            onChange={e => {
              const val = parseInt(e.target.value, 10);
              if (val > 0) onChange({ ...settings, maxRolls: val });
            }}
          />
        </div>

        <div>
          <label className="label">
            Seed
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="number"
            className="input"
            placeholder="Random"
            value={settings.seed ?? ''}
            onChange={e => {
              const val = e.target.value;
              onChange({ ...settings, seed: val ? parseInt(val, 10) : undefined });
            }}
          />
        </div>

        <div className="flex items-end">
          <p className="text-xs text-gray-500">
            A fixed seed produces identical results across runs — useful for comparing strategies fairly.
          </p>
        </div>
      </div>
    </div>
  );
}