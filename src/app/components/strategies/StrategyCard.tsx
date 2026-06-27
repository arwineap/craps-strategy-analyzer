import React, { useState } from 'react';
import { STRATEGY_PARAMS } from '../../../lib/strategies/config.js';
import type { StrategyConfig } from '../../types.js';
import { exportStrategy } from '../../export.js';
import StrategyParamEditor from './StrategyParamEditor.js';

interface Props {
  config: StrategyConfig;
  onChange: (config: StrategyConfig) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  conservative: 'Conservative',
  high_reward: 'High Reward',
  casino_points: 'Casino Points',
};

// Derive category from preset name (matches strategy class properties)
const PRESET_CATEGORIES: Record<string, string> = {
  'Pass Line + Max Odds':       'conservative',
  "Don't Pass + Lay Odds":      'conservative',
  'Place 6 & 8':                'conservative',
  'Three Point Molly':          'conservative',
  'Inside (5-6-8-9)':           'conservative',
  'Infinite Molly':             'conservative',
  'Casino Points':              'casino_points',
  'Iron Cross':                 'high_reward',
  'Iron Cross Hedge':           'high_reward',
  'High Roller Props':          'high_reward',
  'Across (4-5-6-8-9-10)':      'high_reward',
  'Press & Regress (6/8)':      'high_reward',
  'Place 6 & 8 - Press 1 Unit': 'high_reward',
  'Come Ladder (7-unit)':       'high_reward',
  '6/8 Build → Across':         'high_reward',
  'Across → Infinity Come':     'high_reward',
};

export default function StrategyCard({ config, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const params = STRATEGY_PARAMS[config.preset] ?? [];
  const category = PRESET_CATEGORIES[config.preset] ?? 'custom';

  const update = (partial: Partial<StrategyConfig>) => onChange({ ...config, ...partial });

  return (
    <div className={`card ${!config.enabled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={e => update({ enabled: e.target.checked })}
            className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">{config.preset}</h3>
            <span className={`badge-${category} badge mt-1`}>{CATEGORY_LABELS[category] ?? category}</span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => exportStrategy(config)}
            className="btn-secondary btn-sm"
            title="Export recipe"
          >
            Export
          </button>
          <button
            onClick={() => setExpanded(x => !x)}
            className="btn-secondary btn-sm"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
          <div>
            <label className="label text-xs">Starting Bankroll ($)</label>
            <input
              type="number" className="input py-1 text-sm" min={1} step={100}
              value={config.bankroll}
              onChange={e => update({ bankroll: parseFloat(e.target.value) || 1000 })}
            />
          </div>

          {params.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Parameters</p>
              <StrategyParamEditor
                params={params}
                values={config.params}
                onChange={(key, val) => update({ params: { ...config.params, [key]: val } })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
