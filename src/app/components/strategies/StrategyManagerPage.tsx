import React, { useRef, useState } from 'react';
import { useAppContext } from '../../App.js';
import { parseImport, readFileAsText, exportBundle, exportCustomStrategy } from '../../export.js';
import { PRESET_CODES } from '../../../lib/strategies/preset-codes.js';
import type { PresetConfig, CustomStrategyDef } from '../../types.js';
import StrategyCard from './StrategyCard.js';
import CustomStrategyCard from './CustomStrategyCard.js';
import StrategyEditorModal from './StrategyEditorModal.js';

type ModalState =
  | { mode: 'view';   code: string; name: string }
  | { mode: 'fork';   code: string; name: string }
  | { mode: 'create' }
  | { mode: 'edit';   strategy: CustomStrategyDef };

export default function StrategyManagerPage() {
  const {
    presetConfigs, setPresetConfigs,
    customStrategies, setCustomStrategies,
    tables, activeTableIdx,
  } = useAppContext();

  const [importError, setImportError]   = useState<string | null>(null);
  const [modal, setModal]               = useState<ModalState | null>(null);
  const [presetsCollapsed, setCollapsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Preset actions ────────────────────────────────────────────────────────

  const updatePreset = (idx: number, config: PresetConfig) => {
    const next = [...presetConfigs];
    next[idx] = config;
    setPresetConfigs(next);
  };

  const enableAllPresets  = () => setPresetConfigs(presetConfigs.map(s => ({ ...s, enabled: true })));
  const disableAllPresets = () => setPresetConfigs(presetConfigs.map(s => ({ ...s, enabled: false })));

  // ── Custom strategy actions ───────────────────────────────────────────────

  const updateCustom = (idx: number, s: CustomStrategyDef) => {
    const next = [...customStrategies];
    next[idx] = s;
    setCustomStrategies(next);
  };

  const deleteCustom = (idx: number) => {
    setCustomStrategies(customStrategies.filter((_, i) => i !== idx));
  };

  const handleSaveModal = (draft: Omit<CustomStrategyDef, 'id' | 'enabled' | 'bankroll'>) => {
    if (!modal) return;
    if (modal.mode === 'edit') {
      const idx = customStrategies.indexOf(modal.strategy);
      if (idx !== -1) updateCustom(idx, { ...modal.strategy, ...draft });
    } else {
      // create or fork
      const def: CustomStrategyDef = {
        id: crypto.randomUUID(),
        name: draft.name,
        description: draft.description,
        code: draft.code,
        enabled: true,
        bankroll: 1000,
      };
      setCustomStrategies([...customStrategies, def]);
    }
    setModal(null);
  };

  // ── Import / Export ───────────────────────────────────────────────────────

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text   = await readFileAsText(file);
      const parsed = parseImport(text);
      if (parsed.type === 'strategy' || parsed.type === 'bundle') {
        const incoming = parsed.customStrategies ?? [];
        if (incoming.length > 0) {
          const withIds = incoming.map(s => ({ ...s, id: s.id || crypto.randomUUID() }));
          setCustomStrategies([...customStrategies, ...withIds]);
        }
        if (incoming.length === 0)
          setImportError('File does not contain custom strategy data (preset imports are no longer supported).');
      } else if (parsed.type === 'tables') {
        setImportError('This is a table export — use the Tables tab to import it.');
      } else {
        setImportError('File does not contain strategy data.');
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleExportBundle = () => {
    const table = tables[activeTableIdx];
    if (table) exportBundle(table, customStrategies);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const enabledCount = presetConfigs.filter(s => s.enabled).length + customStrategies.filter(s => s.enabled).length;
  const totalCount   = presetConfigs.length + customStrategies.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Strategy Manager</h2>
          <p className="text-sm text-gray-500">{enabledCount} of {totalCount} enabled</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="btn-secondary btn-sm cursor-pointer">
            Import
            <input type="file" accept=".json" ref={fileRef} onChange={handleImport} className="hidden" />
          </label>
          {customStrategies.length > 0 && (
            <button className="btn-secondary btn-sm" onClick={handleExportBundle}>Export Bundle</button>
          )}
        </div>
      </div>

      {importError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {importError}
        </div>
      )}

      {/* ── Presets section ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            className="flex items-center gap-2 font-semibold text-gray-900 hover:text-gray-700"
            onClick={() => setCollapsed(x => !x)}
          >
            Presets
            <span className="text-xs text-gray-400">{presetsCollapsed ? '▼' : '▲'}</span>
          </button>
          {!presetsCollapsed && (
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm" onClick={enableAllPresets}>Enable All</button>
              <button className="btn-secondary btn-sm" onClick={disableAllPresets}>Disable All</button>
            </div>
          )}
        </div>

        {!presetsCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {presetConfigs.map((config, idx) => (
              <StrategyCard
                key={config.name}
                config={config}
                onChange={cfg => updatePreset(idx, cfg)}
                onView={() => setModal({ mode: 'view', code: PRESET_CODES[config.name] ?? '', name: config.name })}
                onFork={() => setModal({ mode: 'fork', code: PRESET_CODES[config.name] ?? '', name: `${config.name} (fork)` })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── My Strategies section ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">My Strategies</h3>
          <button className="btn-primary btn-sm" onClick={() => setModal({ mode: 'create' })}>
            + New Strategy
          </button>
        </div>

        {customStrategies.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <p className="text-2xl mb-2">✏️</p>
            <p className="font-medium text-gray-600">No custom strategies yet</p>
            <p className="text-sm mt-1">Click <strong>+ New Strategy</strong> or <strong>Fork</strong> a preset to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {customStrategies.map((s, idx) => (
              <CustomStrategyCard
                key={s.id}
                strategy={s}
                onChange={updated => updateCustom(idx, updated)}
                onEdit={() => setModal({ mode: 'edit', strategy: s })}
                onDelete={() => deleteCustom(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      {modal && (
        <StrategyEditorModal
          mode={modal.mode === 'edit' ? 'edit' : modal.mode === 'view' ? 'view' : 'create'}
          initialCode={modal.mode === 'view' || modal.mode === 'fork' ? modal.code : undefined}
          initialName={modal.mode === 'view' || modal.mode === 'fork' ? modal.name : undefined}
          strategy={modal.mode === 'edit' ? modal.strategy : undefined}
          onSave={handleSaveModal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
