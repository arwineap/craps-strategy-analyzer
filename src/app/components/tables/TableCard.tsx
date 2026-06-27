import React from 'react';
import { TableConfig } from '../../../lib/table-config.js';
import { exportTable } from '../../export.js';

interface Props {
  table: TableConfig;
  isActive: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TableCard({ table, isActive, onActivate, onEdit, onDelete }: Props) {
  return (
    <div className={`card flex flex-col gap-3 ${isActive ? 'ring-2 ring-indigo-500' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{table.name}</h3>
          {isActive && <span className="badge bg-indigo-100 text-indigo-700 mt-1">Active</span>}
        </div>
        <div className="flex gap-1">
          <button onClick={() => exportTable(table)} className="btn-secondary btn-sm">Export</button>
          <button onClick={onEdit} className="btn-secondary btn-sm">Edit</button>
          <button onClick={onDelete} className="btn-danger btn-sm">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="text-gray-500">Minimum</div>
        <div className="font-medium">${table.tableMin}</div>
        <div className="text-gray-500">Odds</div>
        <div className="font-medium">{table.oddsLabel}</div>
        <div className="text-gray-500">Buy vig</div>
        <div className="font-medium">{table.vigLabel}</div>
        <div className="text-gray-500">Field 12</div>
        <div className="font-medium">{table.fieldTriple12 ? '3:1 (triple)' : '2:1 (double)'}</div>
      </div>

      {!isActive && (
        <button onClick={onActivate} className="btn-secondary w-full mt-1">
          Set as Active
        </button>
      )}
    </div>
  );
}
