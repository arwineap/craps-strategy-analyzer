import React, { useState } from 'react';
import { TableConfig, ODDS_OPTIONS } from '../../../lib/table-config.js';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(new TableConfig({ name, tableMin, odds, vigPer, fieldTriple12 }));
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
          <label className="label">Buy-bet Vig (per $)</label>
          <input
            type="number" className="input" value={vigPer} min={1} step={1}
            onChange={e => setVigPer(parseFloat(e.target.value))}
          />
          <p className="text-xs text-gray-500 mt-1">$1 vig per this many dollars of buy stake</p>
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

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn-primary">Save Table</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
