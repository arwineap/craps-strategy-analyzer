import React from 'react';
import type { StrategyConfig } from '../../types.js';

interface Props {
  configs: StrategyConfig[];
  selected: Set<string>;
  onToggle: (preset: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

export default function StrategySelector({ configs, selected, onToggle, onSelectAll, onClearAll }: Props) {
  const enabled = configs.filter(c => c.enabled);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">
          Strategies to run
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({selected.size} selected)
          </span>
        </h3>
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={onSelectAll}>All</button>
          <button className="btn-secondary btn-sm" onClick={onClearAll}>None</button>
        </div>
      </div>

      {enabled.length === 0 ? (
        <p className="text-sm text-gray-500">No enabled strategies. Enable some in the Strategies tab.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {enabled.map(config => (
            <label key={config.preset} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selected.has(config.preset)}
                onChange={() => onToggle(config.preset)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-tight">
                {config.preset}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
