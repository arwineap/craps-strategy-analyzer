import React from 'react';
import type { ParamDef } from '../../../lib/strategies/config.js';

interface Props {
  params: ParamDef[];
  values: Record<string, number | boolean>;
  onChange: (key: string, value: number | boolean) => void;
}

export default function StrategyParamEditor({ params, values, onChange }: Props) {
  if (params.length === 0) {
    return <p className="text-xs text-gray-400 italic">No configurable parameters.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {params.map(param => {
        const val = values[param.key] ?? param.default;

        if (param.type === 'boolean') {
          return (
            <div key={param.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={param.key}
                checked={val as boolean}
                onChange={e => onChange(param.key, e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor={param.key} className="text-sm text-gray-700">
                {param.label}
              </label>
            </div>
          );
        }

        return (
          <div key={param.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {param.label}
              {param.description && (
                <span className="ml-1 text-gray-400">({param.description})</span>
              )}
            </label>
            <input
              type="number"
              value={val as number}
              min={param.min}
              max={param.max}
              step={param.step ?? 1}
              onChange={e => onChange(param.key, parseFloat(e.target.value) || 0)}
              className="input py-1 text-sm"
            />
          </div>
        );
      })}
    </div>
  );
}
