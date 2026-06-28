import React, { useState, useEffect, useRef } from 'react';

const sections = [
  { id: 'intro',         label: 'Introduction' },
  { id: 'simulation',    label: 'Simulation' },
  { id: 'strategies',    label: 'Strategy Manager' },
  { id: 'analysis',      label: 'Analysis' },
  { id: 'tables',        label: 'Tables' },
  { id: 'strategy-api',  label: 'Strategy API' },
  { id: 'table-settings', label: 'Table Settings' },
] as const;

type SectionId = typeof sections[number]['id'];

interface Props {
  onClose: () => void;
}

export default function DocsModal({ onClose }: Props) {
  const [active, setActive] = useState<SectionId>('intro');
  const contentRef = useRef<HTMLDivElement>(null);

  // Update highlighted nav item as user scrolls
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const onScroll = () => {
      const scrollTop = container.scrollTop + 80;
      let current: SectionId = sections[0].id;
      for (const { id } of sections) {
        const el = container.querySelector(`#doc-${id}`) as HTMLElement | null;
        if (el && el.offsetTop <= scrollTop) current = id;
      }
      setActive(current);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const scrollTo = (id: SectionId) => {
    const el = contentRef.current?.querySelector(`#doc-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-5xl flex flex-col bg-white shadow-2xl h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Documentation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close docs"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <nav className="w-48 shrink-0 border-r border-gray-200 py-4 overflow-y-auto">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  active === s.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium border-r-2 border-indigo-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto px-8 py-6 prose prose-sm max-w-none">
            <Section id="intro" title="Introduction">
              <p>
                <strong>Craps Strategy Analyzer</strong> runs entirely in your browser — no server,
                no account, no data sent anywhere. It lets you define craps betting strategies as
                JavaScript snippets and simulate thousands of games in seconds to see how they
                perform statistically.
              </p>
              <h4>Quick Start</h4>
              <ol>
                <li>Go to <strong>Strategies</strong> and enable the presets you want to test (or write your own).</li>
                <li>Go to <strong>Simulation</strong>, set your table, bankroll, and game count, then click <strong>Run Simulation</strong>.</li>
                <li>When it finishes, click <strong>View Full Analysis</strong> to explore per-strategy charts and game-by-game breakdowns.</li>
              </ol>
              <h4>Key concepts</h4>
              <ul>
                <li><strong>Game</strong> — a full simulated session. It runs until the bankroll hits $0 or the Rolls / Game limit is reached. Each game starts fresh with the configured starting bankroll.</li>
                <li><strong>Round</strong> — one shooter's sequence within a game: a come-out roll, then rolling until the point is made or a seven-out occurs. Many rounds happen within a single game.</li>
                <li><strong>Roll</strong> — a single dice throw.</li>
                <li><strong>Bankroll</strong> — the starting balance for each simulated game. Strategies are evaluated against this.</li>
                <li><strong>ROI</strong> — (total won − total wagered) / total wagered. Negative for all craps strategies over time.</li>
              </ul>
            </Section>

            <Section id="simulation" title="Simulation">
              <p>
                The Simulation tab is where you run experiments. Configure the settings, select
                which strategies to include, and click <strong>Run Simulation</strong>.
              </p>
              <h4>Settings</h4>
              <ul>
                <li><strong>Table</strong> — the casino table rules to simulate against (min bet, odds, etc.).</li>
                <li><strong>Starting Bankroll</strong> — each simulated game starts with this amount. A game ends early if the bankroll hits $0.</li>
                <li><strong>Games</strong> — how many independent games to run per strategy. More games = more accurate statistics.</li>
                <li><strong>Rolls / Game</strong> — maximum rolls per game before the game is cut off. Simulates a real casino session.</li>
                <li><strong>Seed</strong> — optional fixed seed for the random number generator. The same seed produces identical results, making it easy to compare strategies on equal footing.</li>
              </ul>
              <h4>Strategy selector</h4>
              <p>
                Below the settings, check or uncheck strategies to include them in the run.
                All enabled strategies in the Strategy Manager appear here. You can run as many
                simultaneously as you like — each gets its own independent simulation.
              </p>
              <h4>Live chart</h4>
              <p>
                While a simulation runs, the chart updates in real time showing each strategy's
                bankroll trajectory. The Quick Summary table appears once the run completes.
              </p>
            </Section>

            <Section id="strategies" title="Strategy Manager">
              <p>
                Strategies are JavaScript functions that tell the simulator what bets to place on
                each roll. The Strategy Manager has two sections:
              </p>
              <h4>Presets</h4>
              <p>
                Built-in reference strategies covering common craps systems — Pass Line, Come bets,
                Place bets, Iron Cross, etc. Toggle the checkbox to include or exclude a preset from
                simulations. Click <strong>View</strong> to read the code or <strong>Fork</strong>
                to create your own variant based on it.
              </p>
              <h4>My Strategies</h4>
              <p>
                Your custom strategies. Click <strong>+ New Strategy</strong> to open the editor,
                or fork a preset. The editor includes a live syntax check. See the
                <strong> Strategy API</strong> section for the full interface your code can use.
              </p>
              <p>
                Strategies can be exported as <code>.json</code> files and shared — anyone can
                import them via the Import button. A share link can also be copied from the editor.
              </p>
            </Section>

            <Section id="analysis" title="Analysis">
              <p>
                The Analysis tab shows deep statistics from the last simulation run.
              </p>
              <ul>
                <li><strong>KPI table</strong> — ROI, bust rate, double-up rate, average peak bankroll, and more per strategy.</li>
                <li><strong>Bankroll distribution chart</strong> — histogram of final bankrolls across all games, showing the spread of outcomes.</li>
                <li><strong>Game browser</strong> — browse individual simulated games. Filter by outcome (won, bust, etc.) and click any game to replay it roll by roll, seeing exactly which bets were placed and what happened.</li>
              </ul>
            </Section>

            <Section id="tables" title="Tables">
              <p>
                A table defines the casino rules the simulation uses. The selected table is shown
                in the Simulation settings dropdown.
              </p>
              <h4>Presets</h4>
              <p>
                Five built-in tables cover common real-world configurations (Vegas Strip $5 3-4-5x,
                Downtown $5 10x, etc.). Preset tables are read-only.
              </p>
              <h4>My Tables</h4>
              <p>
                Add your own table to match the specific casino you play at. Custom tables support
                all the same settings as presets — see <strong>Table Settings</strong> for
                a full reference. Custom tables can be exported and imported as JSON.
              </p>
            </Section>

            <Section id="strategy-api" title="Strategy API">
              <p>
                A strategy is a plain JavaScript object assigned to the <code>strategy</code>
                variable. You define two optional functions on it:
              </p>
              <Code>{`strategy.name = 'My Strategy';
strategy.description = 'Brief description shown in the UI.';

// Called before every roll. Place new bets here.
strategy.decideBets = function(game, ctx) {
  // ...
};

// Called after every roll with the results of settled bets.
strategy.onResults = function(results, game, ctx) {
  // ...
};`}</Code>

              <h4>Table constants (outer scope)</h4>
              <p>These are injected as top-level constants so you can use them in <code>const</code> declarations at the top of your strategy:</p>
              <table>
                <thead><tr><th>Constant</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>TABLE_MIN</code></td><td>number</td><td>Table minimum bet in dollars</td></tr>
                  <tr><td><code>VIG_PER</code></td><td>number</td><td>Buy-bet vig rate (default 20 = $1 per $20)</td></tr>
                  <tr><td><code>FIELD_TRIPLE_12</code></td><td>boolean</td><td>Whether field pays 3:1 on 12</td></tr>
                  <tr><td><code>FIRE_BET_ENABLED</code></td><td>boolean</td><td>Whether the fire bet is offered</td></tr>
                  <tr><td><code>ALL_SMALL_TALL_ENABLED</code></td><td>boolean</td><td>Whether All/Small/Tall bets are offered</td></tr>
                </tbody>
              </table>

              <h4>The <code>game</code> object</h4>
              <table>
                <thead><tr><th>Property / Method</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>game.phase</code></td><td><code>'come_out' | 'point'</code></td><td>Current phase of the game</td></tr>
                  <tr><td><code>game.point</code></td><td><code>number | null</code></td><td>The established point (null on come-out)</td></tr>
                  <tr><td><code>game.roll</code></td><td>number</td><td>Number of rolls so far this game</td></tr>
                  <tr><td><code>game.totalSevensOut</code></td><td>number</td><td>Total seven-outs this game</td></tr>
                  <tr><td><code>game.totalPointsMade</code></td><td>number</td><td>Total points made this game</td></tr>
                  <tr><td><code>game.hasBet(type)</code></td><td>boolean</td><td>Returns true if an active bet of that type exists</td></tr>
                  <tr><td><code>game.getBets(type)</code></td><td>BetView[]</td><td>Returns all active bets of that type</td></tr>
                  <tr><td><code>game.allBets()</code></td><td>BetView[]</td><td>Returns all active bets on the table</td></tr>
                </tbody>
              </table>

              <h4>BetView</h4>
              <table>
                <thead><tr><th>Property</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>type</code></td><td>string</td><td>Bet type string (e.g. <code>'Pass Line'</code>)</td></tr>
                  <tr><td><code>amount</code></td><td>number</td><td>Flat bet amount</td></tr>
                  <tr><td><code>oddsAmount</code></td><td>number</td><td>Free odds wagered on this bet</td></tr>
                  <tr><td><code>comePoint</code></td><td><code>number | null</code></td><td>Point number for come/don't-come bets</td></tr>
                </tbody>
              </table>

              <h4>The <code>ctx</code> object</h4>
              <table>
                <thead><tr><th>Property / Method</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>ctx.tableMin</code></td><td>number</td><td>Table minimum bet</td></tr>
                  <tr><td><code>ctx.bankroll</code></td><td>number</td><td>Current bankroll at this moment</td></tr>
                  <tr><td><code>ctx.tableValue</code></td><td>number</td><td>Total amount currently at risk on the table</td></tr>
                  <tr><td><code>ctx.state</code></td><td>object</td><td>Persists across calls within one game; auto-reset between games. Use for counters, flags, etc.</td></tr>
                  <tr><td><code>ctx.Bets</code></td><td>object</td><td>Bet-type constants (see below)</td></tr>
                  <tr><td><code>ctx.vigPer</code></td><td>number</td><td>Same as <code>VIG_PER</code> — available at call time</td></tr>
                  <tr><td><code>ctx.fieldTriple12</code></td><td>boolean</td><td>Whether field pays 3:1 on 12</td></tr>
                  <tr><td><code>ctx.fireBetEnabled</code></td><td>boolean</td><td>Whether fire bet is offered</td></tr>
                  <tr><td><code>ctx.allSmallTallEnabled</code></td><td>boolean</td><td>Whether All/Small/Tall are offered</td></tr>
                  <tr><td><code>ctx.bet(type, amount)</code></td><td>void</td><td>Place a new flat bet. Place 6/8 rounded up to nearest $6; Place 4/5/9/10 to nearest $5.</td></tr>
                  <tr><td><code>ctx.odds(betView, amount)</code></td><td>void</td><td>Add free odds to an existing pass/come/don't bet</td></tr>
                  <tr><td><code>ctx.buyBet(type, amount)</code></td><td>void</td><td>Place a buy bet; vig is deducted automatically</td></tr>
                  <tr><td><code>ctx.takeDown(betView)</code></td><td>void</td><td>Remove an active bet and return its stake</td></tr>
                  <tr><td><code>ctx.maxOddsAmount(point, flatBet)</code></td><td>number</td><td>Maximum free-odds amount for this point given the flat bet size</td></tr>
                </tbody>
              </table>

              <h4>Bet type constants (<code>ctx.Bets</code>)</h4>
              <p>Pass the string value or use the <code>ctx.Bets</code> constants:</p>
              <Code>{`const { Bets, bet } = ctx;

// Line bets
Bets.PASS_LINE    // 'Pass Line'
Bets.DONT_PASS    // "Don't Pass"
Bets.COME         // 'Come'
Bets.DONT_COME    // "Don't Come"

// Place bets (rounded to nearest $5 or $6 automatically)
Bets.PLACE_4   Bets.PLACE_5   Bets.PLACE_6
Bets.PLACE_8   Bets.PLACE_9   Bets.PLACE_10

// Buy bets (use ctx.buyBet — vig deducted automatically)
Bets.BUY_4   Bets.BUY_5   Bets.BUY_6
Bets.BUY_8   Bets.BUY_9   Bets.BUY_10

// Lay bets (wrong-side; vig on the win)
Bets.LAY_4   Bets.LAY_5   Bets.LAY_6
Bets.LAY_8   Bets.LAY_9   Bets.LAY_10

// Proposition bets
Bets.FIELD       // Field (2,3,4,9,10,11,12)
Bets.ANY_7       // Any 7
Bets.ANY_CRAPS   // Any Craps (2,3,12)
Bets.YO          // Yo (11)
Bets.ACES        // Aces (2)
Bets.ACE_DEUCE   // Ace-Deuce (3)
Bets.BOXCARS     // Boxcars (12)

// Hardways
Bets.HARD_4   Bets.HARD_6   Bets.HARD_8   Bets.HARD_10

// Big 6/8 (same payout as Place 6/8 but worse odds — for completeness)
Bets.BIG_6   Bets.BIG_8

// Specials (only when enabled on the table)
Bets.FIRE_BET   // Fire Bet
Bets.ALL        // All (2–12 before 7)
Bets.SMALL      // Small (2–6 before 7)
Bets.TALL       // Tall (8–12 before 7)`}</Code>

              <h4>ResultView (in <code>onResults</code>)</h4>
              <p><code>onResults</code> receives an array of <code>ResultView</code> objects — one per bet that was resolved on that roll:</p>
              <table>
                <thead><tr><th>Property</th><th>Type</th><th>Description</th></tr></thead>
                <tbody>
                  <tr><td><code>betType</code></td><td>string</td><td>Bet type string</td></tr>
                  <tr><td><code>amount</code></td><td>number</td><td>Flat bet amount</td></tr>
                  <tr><td><code>oddsAmount</code></td><td>number</td><td>Odds amount on this bet</td></tr>
                  <tr><td><code>comePoint</code></td><td><code>number | null</code></td><td>Come point if applicable</td></tr>
                  <tr><td><code>won</code></td><td>boolean</td><td>Bet was won this roll</td></tr>
                  <tr><td><code>lost</code></td><td>boolean</td><td>Bet was lost this roll</td></tr>
                  <tr><td><code>pushed</code></td><td>boolean</td><td>Bet pushed (e.g. Don't Pass on 12 come-out)</td></tr>
                  <tr><td><code>inPlay</code></td><td>boolean</td><td>Bet is still active (no resolution yet)</td></tr>
                  <tr><td><code>profit</code></td><td>number</td><td>Net profit/loss on this bet this roll (negative = loss)</td></tr>
                </tbody>
              </table>

              <h4>Example: Pass Line with max odds</h4>
              <Code>{`strategy.name = 'Pass Line + Max Odds';

strategy.decideBets = function(game, ctx) {
  const { bet, odds, Bets, tableMin, bankroll } = ctx;

  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE)) {
      bet(Bets.PASS_LINE, tableMin);
    }
    return;
  }

  // Add max free odds once a point is established
  for (const pl of game.getBets(Bets.PASS_LINE)) {
    if (pl.oddsAmount === 0) {
      const maxAmt = ctx.maxOddsAmount(game.point, pl.amount);
      if (bankroll >= maxAmt) odds(pl, maxAmt);
    }
  }
};`}</Code>

              <h4>Example: using <code>ctx.state</code> for tracking</h4>
              <Code>{`strategy.name = 'Martingale Pass Line';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll, state } = ctx;

  if (game.phase === 'come_out' && !game.hasBet(Bets.PASS_LINE)) {
    // state persists across rolls within a game; reset between games automatically
    const nextBet = state.nextBet ?? tableMin;
    if (bankroll >= nextBet) bet(Bets.PASS_LINE, nextBet);
  }
};

strategy.onResults = function(results, game, ctx) {
  const { state, tableMin } = ctx;
  for (const r of results) {
    if (r.betType === ctx.Bets.PASS_LINE) {
      state.nextBet = r.won ? tableMin : (state.nextBet ?? tableMin) * 2;
    }
  }
};`}</Code>
            </Section>

            <Section id="table-settings" title="Table Settings">
              <p>
                These settings define the rules of the casino table used in a simulation.
                Custom tables let you match any real-world casino's specific rules.
              </p>
              <table>
                <thead><tr><th>Setting</th><th>Description</th></tr></thead>
                <tbody>
                  <tr>
                    <td><strong>Table Minimum</strong></td>
                    <td>The minimum bet amount in dollars. Strategies receive this as <code>ctx.tableMin</code> and <code>TABLE_MIN</code>.</td>
                  </tr>
                  <tr>
                    <td><strong>Free Odds</strong></td>
                    <td>
                      Maximum free-odds multiplier offered. Options: 1×, 2×, 3×, 3-4-5×, 5×, 10×, 20×, 100×.
                      <br /><em>3-4-5×</em> means 3× on 4/10, 4× on 5/9, 5× on 6/8 — the most common Vegas configuration.
                      Free odds carry zero house edge.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Buy/Lay Vig</strong></td>
                    <td>
                      Commission on buy and lay bets, expressed as <em>$1 per N dollars</em>. Default is $1 per $20 (5%).
                      A higher value means a lower vig (e.g. $1 per $25 = 4%).
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Field pays 3:1 on 12</strong></td>
                    <td>
                      When enabled, rolling 12 on a Field bet pays 3:1 instead of the standard 2:1.
                      This reduces the house edge on the Field from 5.56% to 2.78%.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Fire Bet</strong></td>
                    <td>
                      Side bet that pays when the shooter makes multiple unique points before seven-ing out.
                      Payouts are configurable for 4, 5, or 6 unique points. House edge is very high (~24.9%).
                      Must be placed before the come-out roll using <code>ctx.bet(Bets.FIRE_BET, amount)</code>.
                      Only available when enabled on the table.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>All / Small / Tall</strong></td>
                    <td>
                      Side bets that win if the shooter rolls all required numbers before a seven-out:
                      Small = 2,3,4,5,6 · Tall = 8,9,10,11,12 · All = 2 through 12.
                      Payouts are configurable. Must be placed via <code>ctx.bet()</code> before the come-out.
                      Only available when enabled on the table.
                    </td>
                  </tr>
                </tbody>
              </table>

              <h4>Odds reference</h4>
              <table>
                <thead><tr><th>Bet</th><th>Payout</th><th>House Edge</th></tr></thead>
                <tbody>
                  <tr><td>Pass Line / Come</td><td>1:1 (flat); true odds on free odds</td><td>1.41%</td></tr>
                  <tr><td>Don't Pass / Don't Come</td><td>1:1 (flat); true odds on lay odds</td><td>1.36%</td></tr>
                  <tr><td>Free Odds</td><td>True odds — 2:1 on 4/10, 3:2 on 5/9, 6:5 on 6/8</td><td>0%</td></tr>
                  <tr><td>Place 6 / 8</td><td>7:6</td><td>1.52%</td></tr>
                  <tr><td>Place 5 / 9</td><td>7:5</td><td>4.00%</td></tr>
                  <tr><td>Place 4 / 10</td><td>9:5</td><td>6.67%</td></tr>
                  <tr><td>Buy 4/5/6/8/9/10</td><td>True odds minus vig</td><td>~4.76%</td></tr>
                  <tr><td>Field (triple 12)</td><td>2:1 on 2, 3:1 on 12, 1:1 otherwise</td><td>2.78%</td></tr>
                  <tr><td>Field (double 12)</td><td>2:1 on 2/12, 1:1 otherwise</td><td>5.56%</td></tr>
                  <tr><td>Any 7</td><td>4:1</td><td>16.67%</td></tr>
                  <tr><td>Hardways 4/10</td><td>7:1</td><td>11.11%</td></tr>
                  <tr><td>Hardways 6/8</td><td>9:1</td><td>9.09%</td></tr>
                </tbody>
              </table>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={`doc-${id}`} className="mb-10">
      <h3 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">{title}</h3>
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-gray-950 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed my-3">
      <code>{children}</code>
    </pre>
  );
}
