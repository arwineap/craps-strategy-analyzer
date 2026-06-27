import React, { useRef, useState } from 'react';
import { useAppContext } from '../../App.js';
import { parseImport, readFileAsText } from '../../export.js';
import type { StrategyConfig } from '../../types.js';
import StrategyCard from './StrategyCard.js';

export default function StrategyManagerPage() {
  const { strategyConfigs, setStrategyConfigs, tables, activeTableIdx } = useAppContext();
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (idx: number, config: StrategyConfig) => {
    const next = [...strategyConfigs];
    next[idx] = config;
    setStrategyConfigs(next);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await readFileAsText(file);
      const parsed = parseImport(text);
      if (parsed.type === 'strategy' || (parsed.type === 'bundle' && parsed.strategies?.length)) {
        const incoming = parsed.type === 'strategy' ? parsed.strategies : parsed.strategies;
        const next = [...strategyConfigs];
        for (const inc of incoming) {
          const idx = next.findIndex(s => s.preset === inc.preset);
          if (idx !== -1) {
            next[idx] = { ...next[idx], ...inc };
          }
        }
        setStrategyConfigs(next);

        // If bundle also has a table, import it
        if (parsed.type === 'bundle' && parsed.table) {
          // handled by tables page; just notify user
        }
      } else {
        setImportError('File does not contain strategy data.');
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const enableAll = () => setStrategyConfigs(strategyConfigs.map(s => ({ ...s, enabled: true })));
  const disableAll = () => setStrategyConfigs(strategyConfigs.map(s => ({ ...s, enabled: false })));
  const resetAll = () => setStrategyConfigs(strategyConfigs.map(s => ({ ...s, params: {}, bankroll: 1000 })));

  const activeTable = tables[activeTableIdx];
  const enabledCount = strategyConfigs.filter(s => s.enabled).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">Strategy Manager</h2>
          <p className="text-sm text-gray-500">
            {enabledCount} of {strategyConfigs.length} enabled
            {activeTable && ` · Active table: ${activeTable.name}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary btn-sm" onClick={enableAll}>Enable All</button>
          <button className="btn-secondary btn-sm" onClick={disableAll}>Disable All</button>
          <button className="btn-secondary btn-sm" onClick={resetAll}>Reset Params</button>
          <label className="btn-secondary btn-sm cursor-pointer">
            Import Recipe
            <input type="file" accept=".json" ref={fileRef} onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {importError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {importError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {strategyConfigs.map((config, idx) => (
          <StrategyCard
            key={config.preset}
            config={config}
            onChange={cfg => update(idx, cfg)}
          />
        ))}
      </div>
    </div>
  );
}
