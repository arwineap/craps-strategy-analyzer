import React, { useState } from 'react';

interface Section {
  title: string;
  content: React.ReactNode;
}

function Section({ title, content }: Section) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        {title}
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="pb-3 text-xs text-gray-600 leading-relaxed space-y-1.5">{content}</div>}
    </div>
  );
}

function Code({ children }: { children: string }) {
  return <code className="bg-gray-100 rounded px-1 py-0.5 font-mono text-[11px]">{children}</code>;
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="bg-gray-50 rounded p-2 text-[11px] font-mono overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

export default function APIReference() {
  return (
    <div className="text-sm">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">API Reference</p>

      <Section title="strategy object" content={
        <>
          <p>Assign properties to the injected <Code>strategy</Code> object:</p>
          <Pre>{`strategy.name        = 'My Strategy';
strategy.description = 'One-line summary';
strategy.category    = 'conservative'; // or 'high_reward', 'casino_points'
strategy.decideBets  = function(game, ctx) { ... };
strategy.onResults   = function(results, game, ctx) { ... };`}</Pre>
          <p><Code>decideBets</Code> is called every roll. <Code>onResults</Code> fires after each roll's outcomes (optional).</p>
        </>
      } />

      <Section title="game (read-only)" content={
        <>
          <table className="w-full text-[11px]">
            <tbody>
              {[
                ['game.phase', '"come_out" | "point"'],
                ['game.point', 'number | null'],
                ['game.roll', 'number — rolls this game'],
                ['game.totalSevensOut', 'number — lifetime seven-outs'],
                ['game.totalPointsMade', 'number — lifetime points made'],
                ['game.hasBet(type)', 'boolean'],
                ['game.getBets(type)', 'BetView[]'],
                ['game.allBets()', 'BetView[]'],
              ].map(([name, desc]) => (
                <tr key={name as string} className="border-b border-gray-50">
                  <td className="pr-3 py-1 font-mono text-indigo-700">{name}</td>
                  <td className="py-1 text-gray-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1"><strong>BetView:</strong> <Code>{'{ type, amount, oddsAmount, comePoint }'}</Code></p>
        </>
      } />

      <Section title="Outer-scope table constants" content={
        <>
          <p>Available at the <strong>top level</strong> of your code (outside functions), so you can base configurable constants on them:</p>
          <Pre>{`// ── configurable ───────────────────────────────
const betSize = 6 * Math.ceil(TABLE_MIN / 6);
// bet() auto-rounds Place 6/8 to nearest $6
// ───────────────────────────────────────────────`}</Pre>
          <table className="w-full text-[11px] mt-1">
            <tbody>
              {[
                ['TABLE_MIN', 'table minimum bet'],
                ['VIG_PER', 'vig divisor (20 = 5% vig on buy/lay bets)'],
                ['FIELD_TRIPLE_12', 'true if field 12 pays 3:1'],
                ['FIRE_BET_ENABLED', 'true if fire bet is offered at this table'],
                ['ALL_SMALL_TALL_ENABLED', 'true if All/Small/Tall bets are offered'],
              ].map(([name, desc]) => (
                <tr key={name} className="border-b border-gray-50">
                  <td className="pr-3 py-1 font-mono text-indigo-700">{name}</td>
                  <td className="py-1 text-gray-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      } />

      <Section title="ctx (action context)" content={
        <>
          <table className="w-full text-[11px]">
            <tbody>
              {[
                ['ctx.tableMin', 'table minimum bet (same as TABLE_MIN)'],
                ['ctx.bankroll', 'cash off the table'],
                ['ctx.tableValue', 'cash on the table'],
                ['ctx.state', 'plain object; resets each game'],
                ['ctx.Bets', 'bet-type constants (see below)'],
                ['ctx.vigPer', 'vig divisor (same as VIG_PER)'],
                ['ctx.fieldTriple12', 'true if field 12 pays 3:1'],
                ['ctx.fireBetEnabled', 'true if fire bet is offered at this table'],
                ['ctx.allSmallTallEnabled', 'true if All/Small/Tall bets are offered'],
                ['ctx.bet(type, amt)', 'place a bet; Place 6/8→$6, 4/5/9/10→$5, Lay 6/8→$6, Lay 5/9→$3, Lay 4/10→$2'],
                ['ctx.odds(baseBet, amt)', 'add free odds'],
                ['ctx.takeDown(bet)', 'remove a bet'],
                ['ctx.buyBet(type, amt)', 'buy bet (vig auto)'],
                ['ctx.maxOddsAmount(pt, flat)', 'max odds for point'],
              ].map(([name, desc]) => (
                <tr key={name as string} className="border-b border-gray-50">
                  <td className="pr-3 py-1 font-mono text-indigo-700 whitespace-nowrap">{name}</td>
                  <td className="py-1 text-gray-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      } />

      <Section title="results[] in onResults" content={
        <>
          <p>Each element has:</p>
          <Pre>{`r.betType   // e.g. 'Pass Line'
r.amount
r.oddsAmount
r.comePoint // null if not a come bet
r.won       // boolean
r.lost      // boolean
r.pushed    // boolean
r.inPlay    // bet is still active (come in transit)
r.profit    // net change (negative on loss)`}</Pre>
        </>
      } />

      <Section title="Bets constants" content={
        <>
          <p>Pass <Code>ctx.Bets.KEY</Code> to any function that takes a bet type:</p>
          <Pre>{`PASS_LINE  DONT_PASS  COME  DONT_COME
PLACE_4  PLACE_5  PLACE_6  PLACE_8  PLACE_9  PLACE_10
FIELD  ANY_7  ANY_CRAPS  YO  ACES  ACE_DEUCE  BOXCARS
HARD_4  HARD_6  HARD_8  HARD_10
BUY_4  BUY_5  BUY_6  BUY_8  BUY_9  BUY_10
LAY_4  LAY_5  LAY_6  LAY_8  LAY_9  LAY_10
BIG_6  BIG_8
FIRE_BET  SMALL  TALL  ALL`}</Pre>
          <p className="mt-1 text-xs text-gray-500">Lay bets win on 7, lose on the number (vig on win). FIRE_BET/SMALL/TALL/ALL must be enabled in the table config.</p>
        </>
      } />

      <Section title="ctx.state example" content={
        <>
          <p><Code>ctx.state</Code> persists within a single game (resets on seven-out/win):</p>
          <Pre>{`strategy.decideBets = function(game, ctx) {
  const { state, bet, Bets, tableMin } = ctx;
  if (game.phase === 'come_out') {
    state.hitCount = 0; // reset each game
    bet(Bets.PASS_LINE, tableMin);
  }
};
strategy.onResults = function(results, game, ctx) {
  const { state } = ctx;
  for (const r of results) {
    if (r.won) state.hitCount = (state.hitCount || 0) + 1;
  }
};`}</Pre>
        </>
      } />

      <Section title="Full example: Place 6 & 8 press" content={
        <>
          <Pre>{`strategy.name = 'Place 6 & 8 Press';
strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll, state } = ctx;
  if (game.phase === 'come_out') {
    state.next = { 6: 30, 8: 30 };
    bet(Bets.PASS_LINE, tableMin);
    return;
  }
  for (const [bt, num] of [
    [Bets.PLACE_6, 6], [Bets.PLACE_8, 8]
  ]) {
    if (game.point !== num && !game.hasBet(bt))
      bet(bt, state.next?.[num] ?? 30);
  }
};
strategy.onResults = function(results, _game, ctx) {
  const { state, Bets } = ctx;
  for (const r of results) {
    if (!r.won) continue;
    if (r.betType === Bets.PLACE_6) state.next[6] = r.amount + 6;
    if (r.betType === Bets.PLACE_8) state.next[8] = r.amount + 6;
  }
};`}</Pre>
        </>
      } />
    </div>
  );
}
