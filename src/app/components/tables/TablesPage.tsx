import React, { useRef, useState } from 'react';
import { TableConfig, DEFAULT_TABLES } from '../../../lib/table-config.js';
import { useAppContext } from '../../App.js';
import { parseImport, readFileAsText } from '../../export.js';
import type { CustomTableDef } from '../../types.js';
import TableCard from './TableCard.js';
import TableEditor from './TableEditor.js';

type Mode = 'list' | 'add' | 'edit';

export default function TablesPage() {
  const { customTables, setCustomTables } = useAppContext();
  const [mode, setMode] = useState<Mode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const editingTable = editingId ? customTables.find(t => t.id === editingId) : null;

  const handleAdd = (table: TableConfig) => {
    const def: CustomTableDef = {
      id: crypto.randomUUID(),
      ...table.toJSON(),
    };
    setCustomTables([...customTables, def]);
    setMode('list');
  };

  const handleEdit = (table: TableConfig) => {
    if (!editingId) return;
    setCustomTables(customTables.map(t => t.id === editingId ? { ...t, ...table.toJSON() } : t));
    setMode('list');
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const t = customTables.find(t => t.id === id);
    if (!t) return;
    if (!confirm(`Delete "${t.name}"?`)) return;
    setCustomTables(customTables.filter(t => t.id !== id));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await readFileAsText(file);
      const parsed = parseImport(text);
      if (parsed.type === 'table') {
        const def: CustomTableDef = { id: crypto.randomUUID(), ...parsed.table.toJSON() };
        setCustomTables([...customTables, def]);
      } else if (parsed.type === 'tables') {
        const defs: CustomTableDef[] = parsed.tables.map(t => ({ id: crypto.randomUUID(), ...t.toJSON() }));
        setCustomTables([...customTables, ...defs]);
      } else if (parsed.type === 'bundle' && parsed.table) {
        const def: CustomTableDef = { id: crypto.randomUUID(), ...parsed.table.toJSON() };
        setCustomTables([...customTables, def]);
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

  if (mode === 'edit' && editingTable) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4">Edit Table</h2>
        <div className="card max-w-lg">
          <TableEditor
            initial={new TableConfig(editingTable)}
            onSave={handleEdit}
            onCancel={() => { setMode('list'); setEditingId(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Casino Tables</h2>
      </div>

      {importError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {importError}
        </div>
      )}

      {/* Presets */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEFAULT_TABLES.map(data => (
            <TableCard
              key={data.name}
              table={new TableConfig(data)}
              isPreset
            />
          ))}
        </div>
      </div>

      {/* My Tables */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">My Tables</h3>
          <div className="flex gap-2">
            <label className="btn-secondary btn-sm cursor-pointer">
              Import
              <input type="file" accept=".json" ref={fileRef} onChange={handleImport} className="hidden" />
            </label>
            <button className="btn-primary btn-sm" onClick={() => setMode('add')}>
              + Add Table
            </button>
          </div>
        </div>

        {customTables.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-2xl mb-2">🎰</p>
            <p className="font-medium text-gray-600">No custom tables yet</p>
            <p className="text-sm mt-1">Click <strong>+ Add Table</strong> to define your own rules.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTables.map(def => (
              <TableCard
                key={def.id}
                table={new TableConfig(def)}
                onEdit={() => { setEditingId(def.id); setMode('edit'); }}
                onDelete={() => handleDelete(def.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}