import React, { useState } from 'react';
import type { CustomStrategyDef } from '../../types.js';
import { strategyShareUrl } from '../../utils/share.js';
import StrategyEditor from './StrategyEditor.js';
import APIReference from './APIReference.js';

const BLANK_TEMPLATE = `strategy.name = 'My Strategy';
strategy.description = 'Describe what this strategy does.';
strategy.category = 'conservative'; // conservative | high_reward | casino_points

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll } = ctx;

  // Place a pass line bet on come-out
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE) && bankroll >= tableMin)
      bet(Bets.PASS_LINE, tableMin);
    return;
  }

  // Add your point-phase bets here
};

// Optional: called after each roll's outcomes settle
// strategy.onResults = function(results, game, ctx) { };
`.trim();

type ModalMode = 'create' | 'edit' | 'view';

interface Props {
  mode: ModalMode;
  initialCode?: string;
  initialName?: string;
  strategy?: CustomStrategyDef;
  onSave: (strategy: Omit<CustomStrategyDef, 'id' | 'enabled' | 'bankroll'>) => void;
  onFork?: () => void;
  onClose: () => void;
}

export default function StrategyEditorModal({ mode, initialCode, initialName, strategy, onSave, onFork, onClose }: Props) {
  const [code, setCode] = useState(initialCode ?? strategy?.code ?? BLANK_TEMPLATE);
  const [name, setName] = useState(initialName ?? strategy?.name ?? '');
  const [copied, setCopied] = useState(false);
  const [bannerFlash, setBannerFlash] = useState(false);

  const flashBanner = () => {
    setBannerFlash(false);
    // Force reflow so re-adding the class restarts the animation
    requestAnimationFrame(() => setBannerFlash(true));
  };

  const isReadOnly = mode === 'view';
  const title = mode === 'create' ? 'New Strategy' : mode === 'edit' ? 'Edit Strategy' : 'View Strategy';

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) { alert('Strategy name is required.'); return; }
    onSave({ name: trimmed, description: '', code });
  };

  const handleShare = async () => {
    const url = strategyShareUrl(name.trim() || 'Shared Strategy', code);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy this share URL:', url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium mb-1">{title}</p>
          {isReadOnly ? (
            <h2 className="text-lg font-bold text-gray-900">{name}</h2>
          ) : (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Strategy name"
              className="input py-1 text-base font-semibold w-full max-w-md"
            />
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={handleShare} className="btn-secondary btn-sm">
            {copied ? 'Copied!' : 'Share URL'}
          </button>
          {isReadOnly && onFork && (
            <button onClick={onFork} className="btn-primary btn-sm">Fork</button>
          )}
          <button onClick={onClose} className="btn-secondary btn-sm">Cancel</button>
          {!isReadOnly && (
            <button onClick={handleSave} className="btn-primary btn-sm">Save</button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Editor */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 border-r border-gray-200">
          {isReadOnly && onFork && (
            <div
              className={`flex items-center justify-between gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200 shrink-0 ${bannerFlash ? 'banner-flash' : ''}`}
              onAnimationEnd={() => setBannerFlash(false)}
            >
              <p className="text-sm text-amber-800">
                This is a read-only preset. Fork it to create your own editable copy.
              </p>
              <button onClick={onFork} className="btn-sm shrink-0 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded px-3 py-1 text-sm font-medium">
                Fork to edit
              </button>
            </div>
          )}
          <div
            className="flex-1 overflow-auto"
            onKeyDown={isReadOnly && onFork ? flashBanner : undefined}
          >
            <StrategyEditor
              value={code}
              onChange={isReadOnly ? undefined : setCode}
              readOnly={isReadOnly}
              minHeight="100%"
            />
          </div>
        </div>

        {/* API Reference sidebar */}
        <div className="w-72 shrink-0 overflow-y-auto p-3 bg-gray-50">
          <APIReference />
        </div>
      </div>
    </div>
  );
}
