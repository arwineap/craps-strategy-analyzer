// Each value is a self-contained JS snippet executed via CodeStrategy.
// TABLE_MIN, VIG_PER, FIELD_TRIPLE_12 are injected as outer-scope constants so
// top-level configurable consts can derive from them without needing ctx.

export const PRESET_CODES: Record<string, string> = {

// ─────────────────────────────────────────────────────────────────────────────
'Pass Line + Max Odds': `
// ── configurable ─────────────────────────────────────────────────────────────
const oddsMult = Infinity; // free-odds multiplier; Infinity = table max, or set e.g. 2 for 2× odds
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Pass Line + Max Odds';
strategy.description = 'Pass line with max free odds. Lowest possible house edge on a standard craps table.';
strategy.category = 'conservative';

strategy.decideBets = function(game, ctx) {
  const { bet, odds, Bets, tableMin, bankroll } = ctx;

  // ── come-out phase ──────────────────────────────────────────────────────────
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE)) {
      bet(Bets.PASS_LINE, tableMin);
    }
    return;
  }

  // ── point phase ─────────────────────────────────────────────────────────────
  // take free odds on the pass line
  // ctx.maxOddsAmount() respects the table's limit — exceeding it causes an error
  for (const pl of game.getBets(Bets.PASS_LINE)) {
    if (pl.oddsAmount === 0) {
      const maxAmt = ctx.maxOddsAmount(game.point, pl.amount);
      const amt    = Math.min(pl.amount * oddsMult, maxAmt);
      if (bankroll >= amt) {
        odds(pl, amt);
      }
    }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
"Don't Pass + Lay Odds": `
// ── configurable ─────────────────────────────────────────────────────────────
const oddsMult = Infinity; // lay-odds multiplier; Infinity = table max, or set e.g. 2 for 2× odds
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = "Don't Pass + Lay Odds";
strategy.description = "Don't Pass with free lay odds. Lowest house edge on the don't side. Wins on seven-outs.";
strategy.category = 'conservative';

strategy.decideBets = function(game, ctx) {
  const { bet, odds, Bets, tableMin, bankroll } = ctx;

  // ── come-out phase ──────────────────────────────────────────────────────────
  // Note: 7 and 11 lose for Don't Pass on come-out; 2 and 3 win; 12 is a push
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.DONT_PASS)) {
      bet(Bets.DONT_PASS, tableMin);
    }
    return;
  }

  // ── point phase ─────────────────────────────────────────────────────────────
  // odds() on a Don't Pass bet lays free odds (no vig) — you risk more to win less,
  // but the bet pays true odds so there is zero house edge on the odds portion.
  // This is different from a lay bet (Bets.LAY_*), which charges a vig.
  for (const dp of game.getBets(Bets.DONT_PASS)) {
    if (dp.oddsAmount === 0) {
      const maxAmt = ctx.maxOddsAmount(game.point, dp.amount);
      const amt    = Math.min(dp.amount * oddsMult, maxAmt);
      if (bankroll >= amt) {
        odds(dp, amt);
      }
    }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Place 6 & 8 w/ pass': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to the nearest $6 multiple
const betSize  = 6 * Math.ceil(TABLE_MIN / 6); // place bet unit
const playPass = true;      // bet the pass line during come-out
const oddsMult = Infinity;  // free-odds multiplier on pass line; change to e.g. 2 for 2× odds
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Place 6 & 8 w/ pass';
strategy.description = 'Pass line with max free odds, plus Place 6 & 8. Skips placing whichever number is the point since pass line already covers it.';
strategy.category = 'conservative';

strategy.decideBets = function(game, ctx) {
  const { bet, odds, Bets, bankroll } = ctx;

  // ── come-out phase ──────────────────────────────────────────────────────────
  if (game.phase === 'come_out') {
    if (playPass && !game.hasBet(Bets.PASS_LINE)) {
      bet(Bets.PASS_LINE, TABLE_MIN);
    }
    return;
  }

  // ── point phase ─────────────────────────────────────────────────────────────
  // take free odds on the pass line
  // ctx.maxOddsAmount() respects the table's limit — exceeding it causes an error
  if (playPass && oddsMult > 0) {
    for (const pl of game.getBets(Bets.PASS_LINE)) {
      if (pl.oddsAmount === 0) {
        const maxAmt = ctx.maxOddsAmount(game.point, pl.amount);
        const amt    = Math.min(pl.amount * oddsMult, maxAmt);
        if (bankroll >= amt) {
          odds(pl, amt);
        }
      }
    }
  }

  // place 6 and 8; skip whichever is the point when the pass line already covers it
  if (!game.hasBet(Bets.PLACE_6) && (game.point !== 6 || !playPass) && bankroll >= betSize) {
    bet(Bets.PLACE_6, betSize);
  }
  if (!game.hasBet(Bets.PLACE_8) && (game.point !== 8 || !playPass) && bankroll >= betSize) {
    bet(Bets.PLACE_8, betSize);
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Three Point Molly': `
// ── configurable ─────────────────────────────────────────────────────────────
const oddsMult    = Infinity; // free-odds multiplier; Infinity = table max, or set e.g. 2 for 2× odds
const maxComeBets = 2;        // how many come bets to keep working at once (pass line counts separately)
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Three Point Molly';
strategy.description = 'Pass line plus up to 2 come bets, each backed with max free odds. Keeps 3 numbers working at all times.';
strategy.category = 'conservative';

strategy.decideBets = function(game, ctx) {
  const { bet, odds, Bets, tableMin, bankroll } = ctx;

  // ── come-out phase ──────────────────────────────────────────────────────────
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE)) {
      bet(Bets.PASS_LINE, tableMin);
    }
    return;
  }

  // ── point phase ─────────────────────────────────────────────────────────────
  // take free odds on the pass line
  // ctx.maxOddsAmount() respects the table's limit — exceeding it causes an error
  for (const pl of game.getBets(Bets.PASS_LINE)) {
    if (pl.oddsAmount === 0) {
      const maxAmt = ctx.maxOddsAmount(game.point, pl.amount);
      const amt    = Math.min(pl.amount * oddsMult, maxAmt);
      if (bankroll >= amt) {
        odds(pl, amt);
      }
    }
  }

  // place a new come bet if we have room for another number
  const comeBets = game.getBets(Bets.COME);
  if (comeBets.length < maxComeBets && bankroll >= tableMin) {
    bet(Bets.COME, tableMin);
  }

  // take free odds on any come bet that has established a point
  for (const cb of comeBets) {
    if (cb.comePoint && cb.oddsAmount === 0) {
      const maxAmt = ctx.maxOddsAmount(cb.comePoint, cb.amount);
      const amt    = Math.min(cb.amount * oddsMult, maxAmt);
      if (bankroll >= amt) {
        odds(cb, amt);
      }
    }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Inside (5-6-8-9)': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to the nearest $6, Place 5/9 to the nearest $5
const place59 = 5 * Math.ceil(TABLE_MIN / 5); // Place 5 & 9 amount
const place68 = 6 * Math.ceil(TABLE_MIN / 6); // Place 6 & 8 amount
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Inside (5-6-8-9)';
strategy.description = 'Pass line plus place bets on all inside numbers (5, 6, 8, 9). Skips the point number to avoid redundancy with the pass line.';
strategy.category = 'conservative';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll } = ctx;

  // ── come-out phase ──────────────────────────────────────────────────────────
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE)) {
      bet(Bets.PASS_LINE, tableMin);
    }
    return;
  }

  // ── point phase ─────────────────────────────────────────────────────────────
  // place all inside numbers except the point (pass line already covers it)
  const inside = [
    [Bets.PLACE_5, 5, place59],
    [Bets.PLACE_6, 6, place68],
    [Bets.PLACE_8, 8, place68],
    [Bets.PLACE_9, 9, place59],
  ];
  for (const [bt, num, amt] of inside) {
    if (game.point !== num && !game.hasBet(bt) && bankroll >= amt) {
      bet(bt, amt);
    }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Across (4-5-6-8-9-10)': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to the nearest $6, all others to the nearest $5
const place59  = 5 * Math.ceil(TABLE_MIN / 5); // Place 4, 5, 9 & 10 amount (all pay the same)
const place68  = 6 * Math.ceil(TABLE_MIN / 6); // Place 6 & 8 amount
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Across (4-5-6-8-9-10)';
strategy.description = 'Pass line plus place bets on all six numbers. Skips the point number to avoid redundancy with the pass line.';
strategy.category = 'high_reward';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll } = ctx;

  // ── come-out phase ──────────────────────────────────────────────────────────
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE)) {
      bet(Bets.PASS_LINE, tableMin);
    }
    return;
  }

  // ── point phase ─────────────────────────────────────────────────────────────
  // place all six numbers except the point (pass line already covers it)
  const across = [
    [Bets.PLACE_4,   4, place59],
    [Bets.PLACE_5,   5, place59],
    [Bets.PLACE_6,   6, place68],
    [Bets.PLACE_8,   8, place68],
    [Bets.PLACE_9,   9, place59],
    [Bets.PLACE_10, 10, place59],
  ];
  for (const [bt, num, amt] of across) {
    if (game.point !== num && !game.hasBet(bt) && bankroll >= amt) {
      bet(bt, amt);
    }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Iron Cross': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to the nearest $6, Place 5 to the nearest $5
const fieldBet = TABLE_MIN;                    // Field bet amount
const place5   = 5 * Math.ceil(TABLE_MIN / 5); // Place 5 amount (9 is already covered by the Field)
const place68  = 6 * Math.ceil(TABLE_MIN / 6); // Place 6 & 8 amount
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Iron Cross';
strategy.description = 'Pass line plus Field and Place 5, 6, 8. Every number except 7 pays something.';
strategy.category = 'high_reward';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll } = ctx;

  // ── come-out phase ──────────────────────────────────────────────────────────
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE)) {
      bet(Bets.PASS_LINE, tableMin);
    }
    return;
  }

  // ── point phase ─────────────────────────────────────────────────────────────
  // Field covers 2, 3, 4, 9, 10, 11, 12 — Place 5, 6, 8 fill the gaps
  const bets = [
    [Bets.PLACE_5, place5],
    [Bets.PLACE_6, place68],
    [Bets.PLACE_8, place68],
    [Bets.FIELD,   fieldBet],
  ];
  for (const [bt, amt] of bets) {
    if (!game.hasBet(bt) && bankroll >= amt) {
      bet(bt, amt);
    }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Press & Regress (6/8)': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to the nearest $6
const baseBet    = 6 * Math.ceil(TABLE_MIN / 6);     // starting bet
const pressedBet = 6 * Math.ceil(TABLE_MIN / 6) * 2; // doubled bet after first win
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Press & Regress (6/8)';
strategy.description = 'Pass line plus Place 6 & 8. After the first hit on each number, press to double; after the second, regress back to base. Repeats each shooter.';
strategy.category = 'high_reward';

// The cycle for each number (6 and 8 are tracked independently):
//   Hit 1: collect the payout, then re-bet at pressedBet (the "press")
//   Hit 2: collect the larger payout, then re-bet at baseBet (the "regress")
//   Hit 3+: cycle repeats from Hit 1
//   Seven-out: bets are lost; state resets for the next shooter
//
// state.pressed[num] = false → place at baseBet next time
// state.pressed[num] = true  → place at pressedBet next time

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll, state } = ctx;

  // ── come-out phase ──────────────────────────────────────────────────────────
  if (game.phase === 'come_out') {
    state.pressed = { 6: false, 8: false }; // fresh cycle for each new shooter
    if (!game.hasBet(Bets.PASS_LINE)) {
      bet(Bets.PASS_LINE, tableMin);
    }
    return;
  }

  // ── point phase ─────────────────────────────────────────────────────────────
  // place bets are taken down after each win and re-placed here at the next size
  if (!state.pressed) state.pressed = { 6: false, 8: false };

  for (const [bt, num] of [[Bets.PLACE_6, 6], [Bets.PLACE_8, 8]]) {
    if (game.point === num || game.hasBet(bt)) continue;
    const amt = state.pressed[num] ? pressedBet : baseBet;
    if (bankroll >= amt) {
      bet(bt, amt);
    }
  }
};

// onResults fires after each roll's outcomes settle — update press state so
// decideBets knows what size to place the bet at on the next roll.
// Winning place bets are already removed from the table by the engine before
// this fires, so decideBets will always re-place them at the updated size.
strategy.onResults = function(results, _game, ctx) {
  const { state, Bets } = ctx;
  if (!state.pressed) state.pressed = { 6: false, 8: false };

  for (const r of results) {
    if (!r.won) continue;
    // toggle: false → true (will press next), true → false (will regress next)
    if (r.betType === Bets.PLACE_6) state.pressed[6] = !state.pressed[6];
    if (r.betType === Bets.PLACE_8) state.pressed[8] = !state.pressed[8];
  }
};
`.trim(),

}; // end PRESET_CODES

export const PRESET_NAMES = Object.keys(PRESET_CODES);
