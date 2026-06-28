import React from 'react';
import type { PresetConfig } from '../../types.js';
import { PRESET_CODES } from '../../../lib/strategies/preset-codes.js';

interface Props {
  config: PresetConfig;
  onChange: (config: PresetConfig) => void;
  onView: () => void;
  onFork: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  conservative:  'Conservative',
  high_reward:   'High Reward',
  casino_points: 'Casino Points',
  custom:        'Custom',
};

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

export default function StrategyCard({ config, onChange, onView, onFork }: Props) {
  const category = PRESET_CATEGORIES[config.name] ?? 'custom';
  const update   = (partial: Partial<PresetConfig>) => onChange({ ...config, ...partial });

  return (
    <div className={`card ${!config.enabled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={e => update({ enabled: e.target.checked })}
            className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 leading-tight">{config.name}</h3>
            <span className={`badge badge-${category} mt-1`}>{CATEGORY_LABELS[category]}</span>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onView} className="btn-secondary btn-sm" title="Read-only code view">
            View Code
          </button>
          <button onClick={onFork} className="btn-secondary btn-sm" title="Fork into My Strategies">
            Fork
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <label className="label text-xs">Starting Bankroll ($)</label>
        <input
          type="number"
          className="input py-1 text-sm"
          min={1}
          step={100}
          value={config.bankroll}
          onChange={e => update({ bankroll: parseFloat(e.target.value) || 1000 })}
        />
      </div>
    </div>
  );
}
