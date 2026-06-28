import React from 'react';
import { TableConfig } from '../../../lib/table-config.js';
import { exportTable } from '../../export.js';

interface Props {
  table: TableConfig;
  isPreset?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TableCard({ table, isPreset, onEdit, onDelete }: Props) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{table.name}</h3>
          {isPreset && <span className="badge bg-gray-100 text-gray-500 mt-1">Preset</span>}
        </div>
        <div className="flex gap-1">
          <button onClick={() => exportTable(table)} className="btn-secondary btn-sm">Export</button>
          {!isPreset && onEdit && (
            <button onClick={onEdit} className="btn-secondary btn-sm">Edit</button>
          )}
          {!isPreset && onDelete && (
            <button onClick={onDelete} className="btn-danger btn-sm">Delete</button>
          )}
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
    </div>
  );
}