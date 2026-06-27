import React, { useRef, useState } from 'react';
import { TableConfig } from '../../../lib/table-config.js';
import { useAppContext } from '../../App.js';
import {
  exportAllTables, parseImport, readFileAsText,
  exportBundle,
} from '../../export.js';
import TableCard from './TableCard.js';
import TableEditor from './TableEditor.js';

type Mode = 'list' | 'add' | 'edit';

export default function TablesPage() {
  const { tables, setTables, activeTableIdx, setActiveTableIdx, strategyConfigs } = useAppContext();
  const [mode, setMode] = useState<Mode>('list');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAdd = (table: TableConfig) => {
    setTables([...tables, table]);
    setMode('list');
  };

  const handleEdit = (table: TableConfig) => {
    if (editingIdx === null) return;
    const next = [...tables];
    next[editingIdx] = table;
    setTables(next);
    setMode('list');
    setEditingIdx(null);
  };

  const handleDelete = (idx: number) => {
    if (tables.length <= 1) return alert('You must keep at least one table.');
    if (!confirm(`Delete "${tables[idx].name}"?`)) return;
    const next = tables.filter((_, i) => i !== idx);
    setTables(next);
    if (activeTableIdx >= next.length) setActiveTableIdx(next.length - 1);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await readFileAsText(file);
      const parsed = parseImport(text);
      if (parsed.type === 'table') {
        setTables([...tables, parsed.table]);
      } else if (parsed.type === 'tables') {
        setTables([...tables, ...parsed.tables]);
      } else if (parsed.type === 'bundle' && parsed.table) {
        setTables([...tables, parsed.table]);
      } else {
        setImportError('File does not contain table data.');
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  if (mode === 'add') {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Add Table</h2>
        <div className="card max-w-lg">
          <TableEditor onSave={handleAdd} onCancel={() => setMode('list')} />
        </div>
      </div>
    );
  }

  if (mode === 'edit' && editingIdx !== null) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Edit Table</h2>
        <div className="card max-w-lg">
          <TableEditor
            initial={tables[editingIdx]}
            onSave={handleEdit}
            onCancel={() => { setMode('list'); setEditingIdx(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Casino Tables</h2>
        <div className="flex gap-2">
          <button
            className="btn-secondary btn-sm"
            onClick={() => exportAllTables(tables)}
          >
            Export All
          </button>
          <button
            className="btn-secondary btn-sm"
            onClick={() => exportBundle(tables[activeTableIdx], strategyConfigs)}
          >
            Export Bundle
          </button>
          <label className="btn-secondary btn-sm cursor-pointer">
            Import
            <input
              type="file" accept=".json" ref={fileRef}
              onChange={handleImport} className="hidden"
            />
          </label>
          <button className="btn-primary btn-sm" onClick={() => setMode('add')}>
            + Add Table
          </button>
        </div>
      </div>

      {importError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {importError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table, idx) => (
          <TableCard
            key={idx}
            table={table}
            isActive={idx === activeTableIdx}
            onActivate={() => setActiveTableIdx(idx)}
            onEdit={() => { setEditingIdx(idx); setMode('edit'); }}
            onDelete={() => handleDelete(idx)}
          />
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">🎰</p>
          <p>No tables defined. Add one to get started.</p>
        </div>
      )}
    </div>
  );
}
