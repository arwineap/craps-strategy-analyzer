import React from 'react';
import type { SimSettings } from '../../types.js';

interface Props {
  settings: SimSettings;
  onChange: (s: SimSettings) => void;
}

export default function SimulationControls({ settings, onChange }: Props) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-3">Simulation Settings</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <label className="label">Max Rolls / Game</label>
          <select
            className="input"
            value={settings.maxRolls}
            onChange={e => onChange({ ...settings, maxRolls: parseInt(e.target.value, 10) })}
          >
            {[1000, 5000, 10000, 50000].map(n => (
              <option key={n} value={n}>{n.toLocaleString()}</option>
            ))}
          </select>
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
