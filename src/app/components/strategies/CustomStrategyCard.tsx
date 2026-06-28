import React from 'react';
import type { CustomStrategyDef } from '../../types.js';
import { strategyShareUrl } from '../../utils/share.js';

interface Props {
  strategy: CustomStrategyDef;
  onChange: (s: CustomStrategyDef) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CustomStrategyCard({ strategy, onChange, onEdit, onDelete }: Props) {
  const [copied, setCopied] = React.useState(false);

  const update = (partial: Partial<CustomStrategyDef>) => onChange({ ...strategy, ...partial });

  const handleShare = async () => {
    const url = strategyShareUrl(strategy.name, strategy.code);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy this share URL:', url);
    }
  };

  return (
    <div className={`card ${!strategy.enabled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <input
            type="checkbox"
            checked={strategy.enabled}
            onChange={e => update({ enabled: e.target.checked })}
            className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 leading-tight truncate">{strategy.name}</h3>
            <span className="badge badge-custom mt-1">Custom</span>
            {strategy.description && (
              <p className="text-xs text-gray-500 mt-1 leading-snug">{strategy.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="btn-secondary btn-sm">Edit</button>
          <button onClick={handleShare} className="btn-secondary btn-sm">
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={() => { if (confirm(`Delete "${strategy.name}"?`)) onDelete(); }}
            className="btn-secondary btn-sm text-red-600 hover:bg-red-50"
          >
            Delete
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
          value={strategy.bankroll}
          onChange={e => update({ bankroll: parseFloat(e.target.value) || 1000 })}
        />
      </div>
    </div>
  );
}
