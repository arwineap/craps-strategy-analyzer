import React, { useState } from 'react';
import { useAppContext } from '../App.js';
import type { SerializedAccumulator, RunConfig } from '../types.js';
import SimulationPage from './simulation/SimulationPage.js';
import StrategyManagerPage from './strategies/StrategyManagerPage.js';
import AnalysisPage from './analysis/AnalysisPage.js';
import TablesPage from './tables/TablesPage.js';
import DocsModal from './docs/DocsModal.js';

type Tab = 'simulation' | 'strategies' | 'analysis' | 'tables';

interface LayoutProps {
  run: (config: RunConfig) => void;
  cancel: () => void;
  running: boolean;
  progress: number;
  accumulators: SerializedAccumulator[];
  error: string | null;
}

export default function Layout({ run, cancel, running, progress, accumulators, error }: LayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('simulation');
  const [docsOpen, setDocsOpen] = useState(false);
  const { simResult } = useAppContext();

  const tabs: { id: Tab; label: string }[] = [
    { id: 'simulation', label: '🎲 Simulation' },
    { id: 'strategies', label: '⚙️ Strategies' },
    { id: 'analysis',   label: '📊 Analysis' },
    { id: 'tables',     label: '🎰 Tables' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎲</span>
            <div>
              <h1 className="text-lg font-bold leading-tight">Craps Strategy Analyzer</h1>
              <p className="text-gray-400 text-xs">Browser-based simulation</p>
            </div>
          </div>

          <button
            onClick={() => setDocsOpen(true)}
            className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
          >
            Docs
          </button>
        </div>
      </header>

      {docsOpen && <DocsModal onClose={() => setDocsOpen(false)} />}

      {/* Tab bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'tab-active' : 'tab-inactive'}
              >
                {tab.label}
                {tab.id === 'analysis' && simResult && (
                  <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5">
                    {simResult.totalGames}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <strong>Simulation error:</strong> {error}
          </div>
        )}

        {activeTab === 'simulation' && (
          <SimulationPage
            run={run}
            cancel={cancel}
            running={running}
            progress={progress}
            accumulators={accumulators}
            onViewAnalysis={() => setActiveTab('analysis')}
          />
        )}
        {activeTab === 'strategies' && <StrategyManagerPage />}
        {activeTab === 'analysis' && <AnalysisPage />}
        {activeTab === 'tables' && <TablesPage />}
      </main>

      <footer className="bg-white border-t border-gray-200 py-3 text-center text-xs text-gray-400">
        Craps Strategy Analyzer — runs entirely in your browser. No server, no data sent anywhere.
      </footer>
    </div>
  );
}
