// Each value is a self-contained JS snippet executed via CodeStrategy.
// TABLE_MIN, VIG_PER, FIELD_TRIPLE_12 are injected as outer-scope constants so
// top-level configurable consts can derive from them without needing ctx.

export const PRESET_CODES: Record<string, string> = {

// ─────────────────────────────────────────────────────────────────────────────
'Pass Line + Max Odds': `
// ── configurable ─────────────────────────────────────────────────────────────
const oddsMultiplier = 2; // free odds as a multiple of your flat bet
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Pass Line + Max Odds';
strategy.description = 'Pass Line with free odds. Conservative; maximises time at the table.';
strategy.category = 'conservative';

strategy.decideBets = function(game, ctx) {
  const { bet, odds, Bets, tableMin, bankroll } = ctx;
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE)) bet(Bets.PASS_LINE, tableMin);
    return;
  }
  for (const pl of game.getBets(Bets.PASS_LINE)) {
    if (pl.oddsAmount === 0 && game.point) {
      const amt = pl.amount * oddsMultiplier;
      if (bankroll >= amt) odds(pl, amt);
    }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
"Don't Pass + Lay Odds": `
// ── configurable ─────────────────────────────────────────────────────────────
const oddsMult = 2; // lay odds as a multiple of your flat bet
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = "Don't Pass + Lay Odds";
strategy.description = "Don't Pass with lay odds. Combined edge ~0.43%. Wins on seven-outs.";
strategy.category = 'conservative';

strategy.decideBets = function(game, ctx) {
  const { bet, odds, Bets, tableMin, bankroll } = ctx;
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.DONT_PASS)) bet(Bets.DONT_PASS, tableMin);
    return;
  }
  for (const dp of game.getBets(Bets.DONT_PASS)) {
    if (dp.oddsAmount === 0 && game.point) {
      const amt = dp.amount * oddsMult;
      if (bankroll >= amt) odds(dp, amt);
    }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Place 6 & 8': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 up to the nearest $6 multiple
const betSize = 6 * Math.ceil(TABLE_MIN / 6); // one unit — increase for larger bets
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Place 6 & 8';
strategy.description = 'Place 6 and 8 after point is set. 1.52% house edge. High hit frequency.';
strategy.category = 'conservative';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, bankroll } = ctx;
  if (game.phase !== 'point') return;
  if (game.point !== 6 && !game.hasBet(Bets.PLACE_6) && bankroll >= betSize)
    bet(Bets.PLACE_6, betSize);
  if (game.point !== 8 && !game.hasBet(Bets.PLACE_8) && bankroll >= betSize)
    bet(Bets.PLACE_8, betSize);
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Three Point Molly': `
// ── configurable ─────────────────────────────────────────────────────────────
const oddsMult    = 2; // odds multiplier for pass and come bets
const maxComeBets = 2; // maximum number of come bets at once
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Three Point Molly';
strategy.description = 'Pass Line plus up to 2 Come bets, each with free odds. 3 numbers working.';
strategy.category = 'conservative';

strategy.decideBets = function(game, ctx) {
  const { bet, odds, Bets, tableMin, bankroll } = ctx;
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE)) bet(Bets.PASS_LINE, tableMin);
    return;
  }
  for (const pl of game.getBets(Bets.PASS_LINE)) {
    if (pl.oddsAmount === 0 && game.point) {
      const amt = pl.amount * oddsMult;
      if (bankroll >= amt) odds(pl, amt);
    }
  }
  const comeBets = game.getBets(Bets.COME);
  if (comeBets.length < maxComeBets && bankroll >= tableMin)
    bet(Bets.COME, tableMin);
  for (const cb of comeBets) {
    if (cb.comePoint && cb.oddsAmount === 0) {
      const amt = cb.amount * oddsMult;
      if (bankroll >= amt) odds(cb, amt);
    }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Inside (5-6-8-9)': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to nearest $6 and Place 5/9 to nearest $5
const place59 = 5 * Math.ceil(TABLE_MIN / 5); // Place 5 & 9 amount
const place68 = 6 * Math.ceil(TABLE_MIN / 6); // Place 6 & 8 amount
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Inside (5-6-8-9)';
strategy.description = 'Place 5, 6, 8, and 9 after point is set (skips point number).';
strategy.category = 'conservative';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll } = ctx;
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE)) bet(Bets.PASS_LINE, tableMin);
    return;
  }
  for (const [bt, num, amt] of [
    [Bets.PLACE_5,  5, place59],
    [Bets.PLACE_6,  6, place68],
    [Bets.PLACE_8,  8, place68],
    [Bets.PLACE_9,  9, place59],
  ]) {
    if (game.point !== num && !game.hasBet(bt) && bankroll >= amt)
      bet(bt, amt);
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Across (4-5-6-8-9-10)': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to nearest $6 and 4/5/9/10 to nearest $5
const place410 = 5 * Math.ceil(TABLE_MIN / 5); // Place 4 & 10 amount
const place59  = 5 * Math.ceil(TABLE_MIN / 5); // Place 5 & 9 amount
const place68  = 6 * Math.ceil(TABLE_MIN / 6); // Place 6 & 8 amount
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Across (4-5-6-8-9-10)';
strategy.description = 'Place all six numbers after point is set (skips point number).';
strategy.category = 'high_reward';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll } = ctx;
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE)) bet(Bets.PASS_LINE, tableMin);
    return;
  }
  for (const [bt, num, amt] of [
    [Bets.PLACE_4,   4, place410],
    [Bets.PLACE_5,   5, place59],
    [Bets.PLACE_6,   6, place68],
    [Bets.PLACE_8,   8, place68],
    [Bets.PLACE_9,   9, place59],
    [Bets.PLACE_10, 10, place410],
  ]) {
    if (game.point !== num && !game.hasBet(bt) && bankroll >= amt)
      bet(bt, amt);
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Iron Cross': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to nearest $6 and Place 5 to nearest $5
const fieldBet = TABLE_MIN;                    // Field bet amount
const place59  = 5 * Math.ceil(TABLE_MIN / 5); // Place 5 & 9 amount
const place68  = 6 * Math.ceil(TABLE_MIN / 6); // Place 6 & 8 amount
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Iron Cross';
strategy.description = 'Field + Place 5, 6, 8. Wins on every number except 7.';
strategy.category = 'high_reward';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll } = ctx;
  if (game.phase !== 'point') {
    if (!game.hasBet(Bets.PASS_LINE)) bet(Bets.PASS_LINE, tableMin);
    return;
  }
  for (const [bt, amt] of [
    [Bets.PLACE_5, place59],
    [Bets.PLACE_6, place68],
    [Bets.PLACE_8, place68],
    [Bets.FIELD,   fieldBet],
  ]) {
    if (!game.hasBet(bt) && bankroll >= amt) bet(bt, amt);
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Iron Cross Hedge': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to nearest $6 and Place 5 to nearest $5
const fieldBet = TABLE_MIN;                        // Field bet amount
const place5   = 5 * Math.ceil(TABLE_MIN / 5);     // Place 5 amount
const place68  = 6 * Math.ceil(TABLE_MIN * 2 / 6); // ~2× table min: hedge sizing so 6/8 win offsets field loss
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Iron Cross Hedge';
strategy.description = 'Field + Place 5 + doubled Place 6/8. When 6 or 8 hits, the place win offsets the field loss.';
strategy.category = 'high_reward';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll } = ctx;
  if (game.phase !== 'point') {
    if (!game.hasBet(Bets.PASS_LINE)) bet(Bets.PASS_LINE, tableMin);
    return;
  }
  for (const [bt, amt] of [
    [Bets.PLACE_5, place5],
    [Bets.PLACE_6, place68],
    [Bets.PLACE_8, place68],
    [Bets.FIELD,   fieldBet],
  ]) {
    if (!game.hasBet(bt) && bankroll >= amt) bet(bt, amt);
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'High Roller Props': `
// ── configurable ─────────────────────────────────────────────────────────────
const hardBet     = TABLE_MIN; // hardway bet amount
const propBet     = TABLE_MIN; // prop bet — Yo and Any Craps
const includePass = true;      // also bet Pass Line on come-out
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'High Roller Props';
strategy.description = 'Hardways (4/6/8/10) + Yo + Any Craps. High house edge; explosive wins.';
strategy.category = 'high_reward';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin } = ctx;
  let avail = ctx.bankroll;
  if (includePass && game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE) && avail >= tableMin) {
      bet(Bets.PASS_LINE, tableMin);
      avail -= tableMin;
    }
  }
  for (const bt of [Bets.HARD_4, Bets.HARD_6, Bets.HARD_8, Bets.HARD_10]) {
    if (!game.hasBet(bt) && avail >= hardBet) {
      bet(bt, hardBet);
      avail -= hardBet;
    }
  }
  for (const bt of [Bets.YO, Bets.ANY_CRAPS]) {
    if (avail >= propBet) {
      bet(bt, propBet);
      avail -= propBet;
    }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Casino Points': `
strategy.name = 'Casino Points';
strategy.description = 'Table-minimum Pass Line, no odds. 100% of money at risk is rated action.';
strategy.category = 'casino_points';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll } = ctx;
  if (game.phase === 'come_out' && !game.hasBet(Bets.PASS_LINE) && bankroll >= tableMin)
    bet(Bets.PASS_LINE, tableMin);
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Press & Regress (6/8)': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to nearest $6
const baseBet    = 6 * Math.ceil(TABLE_MIN / 6);     // initial bet
const pressedBet = 6 * Math.ceil(TABLE_MIN / 6) * 2; // bet after first win
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Press & Regress (6/8)';
strategy.description = 'Place 6 & 8; press on first hit, regress after second.';
strategy.category = 'high_reward';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll, state } = ctx;
  if (game.phase === 'come_out') {
    state.nextBet  = { 6: baseBet, 8: baseBet };
    state.winCount = { 6: 0, 8: 0 };
    if (!game.hasBet(Bets.PASS_LINE) && bankroll >= tableMin)
      bet(Bets.PASS_LINE, tableMin);
    return;
  }
  if (!state.nextBet) state.nextBet = { 6: baseBet, 8: baseBet };
  for (const [bt, num] of [[Bets.PLACE_6, 6], [Bets.PLACE_8, 8]]) {
    if (game.point === num || game.hasBet(bt)) continue;
    const amt = state.nextBet[num] || baseBet;
    if (bankroll >= amt)          bet(bt, amt);
    else if (bankroll >= baseBet) { bet(bt, baseBet); state.nextBet[num] = baseBet; }
  }
};

strategy.onResults = function(results, _game, ctx) {
  const { state, Bets } = ctx;
  if (!state.nextBet)  state.nextBet  = { 6: baseBet, 8: baseBet };
  if (!state.winCount) state.winCount = { 6: 0, 8: 0 };
  const numFor = { [Bets.PLACE_6]: 6, [Bets.PLACE_8]: 8 };
  for (const r of results) {
    if (!r.won) continue;
    const num = numFor[r.betType];
    if (num === undefined) continue;
    state.winCount[num] = (state.winCount[num] || 0) + 1;
    if (state.winCount[num] === 1) {
      state.nextBet[num] = pressedBet;
    } else {
      state.nextBet[num] = baseBet;
      state.winCount[num] = 0;
    }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Place 6 & 8 - Press 1 Unit': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to nearest $6
const baseBet = 6 * Math.ceil(TABLE_MIN / 6); // initial bet size
const unit    = 6 * Math.ceil(TABLE_MIN / 6); // press increment after each win
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = 'Place 6 & 8 - Press 1 Unit';
strategy.description = 'Place 6 & 8; press by one unit after every hit. Rides hot shooters.';
strategy.category = 'high_reward';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll, state } = ctx;
  if (game.phase === 'come_out') {
    state.nextBet = { 6: baseBet, 8: baseBet };
    if (!game.hasBet(Bets.PASS_LINE) && bankroll >= tableMin)
      bet(Bets.PASS_LINE, tableMin);
    return;
  }
  if (!state.nextBet) state.nextBet = { 6: baseBet, 8: baseBet };
  for (const [bt, num] of [[Bets.PLACE_6, 6], [Bets.PLACE_8, 8]]) {
    if (game.point === num || game.hasBet(bt)) continue;
    const amt = state.nextBet[num] || baseBet;
    if (bankroll >= amt)          bet(bt, amt);
    else if (bankroll >= baseBet) { bet(bt, baseBet); state.nextBet[num] = baseBet; }
  }
};

strategy.onResults = function(results, _game, ctx) {
  const { state, Bets } = ctx;
  if (!state.nextBet) state.nextBet = { 6: baseBet, 8: baseBet };
  for (const r of results) {
    if (!r.won) continue;
    if (r.betType === Bets.PLACE_6) state.nextBet[6] = r.amount + unit;
    if (r.betType === Bets.PLACE_8) state.nextBet[8] = r.amount + unit;
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Come Ladder (7-unit)': `
strategy.name = 'Come Ladder (7-unit)';
strategy.description = 'Pass Line + self-sizing come bets forming a geometric ladder. Total units never exceed 7.';
strategy.category = 'high_reward';

strategy.decideBets = function(game, ctx) {
  const { bet, Bets, tableMin, bankroll } = ctx;
  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE) && bankroll >= tableMin)
      bet(Bets.PASS_LINE, tableMin);
    return;
  }
  const comeBets  = game.getBets(Bets.COME);
  const deployed  = comeBets.reduce(function(s, b) { return s + Math.round(b.amount / tableMin); }, 0);
  const nextUnits = deployed + 1;
  const nextAmt   = nextUnits * tableMin;
  if (deployed + nextUnits <= 7 && bankroll >= nextAmt)
    bet(Bets.COME, nextAmt);
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'6/8 Build → Across': `
// ── configurable ─────────────────────────────────────────────────────────────
// bet() auto-rounds Place 6/8 to nearest $6 and Place 5/9 to nearest $5
const base68 = 6 * Math.ceil(TABLE_MIN / 6); // starting Place 6 & 8 bet
// ─────────────────────────────────────────────────────────────────────────────

strategy.name = '6/8 Build → Across';
strategy.description = 'Place 6 & 8; press 1 unit on first hit, then fund Place 5, 9, 4, 10 one per hit. Resets on seven-out.';
strategy.category = 'high_reward';

const base59 = 5 * Math.ceil(TABLE_MIN / 5);

function resetState(state) {
  state.firstHitDone = false;
  state.placed5  = false;
  state.placed9  = false;
  state.placed4  = false;
  state.placed10 = false;
  state.nextBet  = { 6: base68, 8: base68, 5: base59, 9: base59, 4: base59, 10: base59 };
}

strategy.decideBets = function(game, ctx) {
  const { bet, buyBet, Bets, tableMin, bankroll, state } = ctx;
  if (!state.ready) { resetState(state); state.ready = true; state.sevens = 0; }

  if (game.phase === 'come_out') {
    if (game.totalSevensOut > state.sevens) {
      state.sevens = game.totalSevensOut;
      resetState(state);
    }
    if (!game.hasBet(Bets.PASS_LINE) && bankroll >= tableMin)
      bet(Bets.PASS_LINE, tableMin);
    return;
  }

  for (const [bt, num] of [[Bets.PLACE_6, 6], [Bets.PLACE_8, 8]]) {
    if (game.point !== num && !game.hasBet(bt) && bankroll >= state.nextBet[num])
      bet(bt, state.nextBet[num]);
  }
  for (const [bt, num, placed] of [
    [Bets.PLACE_5,   5,  state.placed5],
    [Bets.PLACE_9,   9,  state.placed9],
    [Bets.BUY_4,     4,  state.placed4],
    [Bets.BUY_10,   10,  state.placed10],
  ]) {
    if (!placed || game.point === num) continue;
    if (!game.hasBet(bt) && bankroll >= state.nextBet[num]) {
      if (bt === Bets.BUY_4 || bt === Bets.BUY_10) buyBet(bt, state.nextBet[num]);
      else bet(bt, state.nextBet[num]);
    }
  }
};

strategy.onResults = function(results, _game, ctx) {
  const { state, Bets } = ctx;
  if (!state.ready) return;
  const tracked = [Bets.PLACE_5, Bets.PLACE_6, Bets.PLACE_8, Bets.PLACE_9, Bets.BUY_4, Bets.BUY_10];
  const numFor  = {
    [Bets.PLACE_5]:5, [Bets.PLACE_6]:6, [Bets.PLACE_8]:8,
    [Bets.PLACE_9]:9, [Bets.BUY_4]:4,   [Bets.BUY_10]:10,
  };
  for (const r of results) {
    if (!r.won || !tracked.includes(r.betType)) continue;
    const num = numFor[r.betType];
    if (num === undefined) continue;
    const unit = (num === 6 || num === 8) ? base68 : base59;
    if (!state.firstHitDone)  { state.firstHitDone = true; state.nextBet[num] += unit; }
    else if (!state.placed5)  { state.placed5  = true; }
    else if (!state.placed9)  { state.placed9  = true; }
    else if (!state.placed4)  { state.placed4  = true; }
    else if (!state.placed10) { state.placed10 = true; }
    else                      { state.nextBet[num] += unit; }
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Across → Infinity Come': `
strategy.name = 'Across → Infinity Come';
strategy.description = 'Place across all numbers, then continuously cycle Come bets with max odds. Place bets taken down as Come bets establish.';
strategy.category = 'high_reward';

const place68init = 6 * Math.ceil(TABLE_MIN / 6);
const place59init = 5 * Math.ceil(TABLE_MIN / 5);

strategy.decideBets = function(game, ctx) {
  const { bet, odds, Bets, tableMin, maxOddsAmount, state } = ctx;
  if (!state.ready) {
    state.sevens = 0; state.placedAcross = false; state.comeNums = {}; state.ready = true;
  }

  if (game.phase === 'come_out') {
    if (game.totalSevensOut > state.sevens) {
      state.sevens = game.totalSevensOut;
      state.placedAcross = false;
      state.comeNums = {};
    }
    if (!game.hasBet(Bets.PASS_LINE) && ctx.bankroll >= tableMin)
      bet(Bets.PASS_LINE, tableMin);
    return;
  }

  let avail = ctx.bankroll;

  for (const pl of game.getBets(Bets.PASS_LINE)) {
    if (pl.oddsAmount === 0 && game.point) {
      const amt = maxOddsAmount(game.point, pl.amount);
      if (avail >= amt) { odds(pl, amt); avail -= amt; }
    }
  }

  if (!state.placedAcross) {
    state.placedAcross = true;
    const amounts = { 4: place59init, 5: place59init, 6: place68init, 8: place68init, 9: place59init, 10: place59init };
    const placeFor = {
      4: Bets.PLACE_4, 5: Bets.PLACE_5,  6: Bets.PLACE_6,
      8: Bets.PLACE_8, 9: Bets.PLACE_9, 10: Bets.PLACE_10,
    };
    for (const [numStr, bt] of Object.entries(placeFor)) {
      const num = Number(numStr);
      if (num === game.point || state.comeNums[num]) continue;
      if (!game.hasBet(bt)) {
        const amt = amounts[num];
        if (avail >= amt) { bet(bt, amt); avail -= amt; }
      }
    }
  }

  for (const cb of game.getBets(Bets.COME)) {
    if (cb.comePoint !== null && cb.oddsAmount === 0) {
      const amt = maxOddsAmount(cb.comePoint, cb.amount);
      if (avail >= amt) { odds(cb, amt); avail -= amt; }
    }
  }

  const inTransit = game.getBets(Bets.COME).some(function(cb) { return cb.comePoint === null; });
  if (!inTransit && avail >= tableMin) bet(Bets.COME, tableMin);
};

strategy.onResults = function(results, game, ctx) {
  const { takeDown, odds, Bets, maxOddsAmount, state } = ctx;
  if (!state.ready) return;

  let avail = ctx.bankroll;
  const placeFor = {
    4: Bets.PLACE_4, 5: Bets.PLACE_5,  6: Bets.PLACE_6,
    8: Bets.PLACE_8, 9: Bets.PLACE_9, 10: Bets.PLACE_10,
  };

  for (const r of results) {
    if (r.betType === Bets.COME && r.inPlay && r.comePoint !== null && !state.comeNums[r.comePoint]) {
      const num = r.comePoint;
      state.comeNums[num] = true;
      const placeBt = placeFor[num];
      if (placeBt) {
        for (const pb of game.getBets(placeBt)) { takeDown(pb); avail += pb.amount; }
      }
      const amt = maxOddsAmount(num, r.amount);
      if (avail >= amt) { odds(r, amt); avail -= amt; }
    }
    if (r.betType === Bets.COME && (r.won || r.lost) && r.comePoint !== null)
      state.comeNums[r.comePoint] = false;
  }
};
`.trim(),

// ─────────────────────────────────────────────────────────────────────────────
'Infinite Molly': `
strategy.name = 'Infinite Molly';
strategy.description = 'Pass Line + max odds, then one Come bet in transit every roll with max odds. Lowest blended house edge.';
strategy.category = 'conservative';

strategy.decideBets = function(game, ctx) {
  const { bet, odds, Bets, tableMin, maxOddsAmount } = ctx;
  let avail = ctx.bankroll;

  if (game.phase === 'come_out') {
    if (!game.hasBet(Bets.PASS_LINE) && avail >= tableMin)
      bet(Bets.PASS_LINE, tableMin);
    return;
  }

  for (const pl of game.getBets(Bets.PASS_LINE)) {
    if (pl.oddsAmount === 0 && game.point) {
      const amt = maxOddsAmount(game.point, pl.amount);
      if (avail >= amt) { odds(pl, amt); avail -= amt; }
    }
  }

  for (const cb of game.getBets(Bets.COME)) {
    if (cb.comePoint !== null && cb.oddsAmount === 0) {
      const amt = maxOddsAmount(cb.comePoint, cb.amount);
      if (avail >= amt) { odds(cb, amt); avail -= amt; }
    }
  }

  const inTransit = game.getBets(Bets.COME).some(function(cb) { return cb.comePoint === null; });
  if (!inTransit && avail >= tableMin) bet(Bets.COME, tableMin);
};
`.trim(),

}; // end PRESET_CODES

export const PRESET_NAMES = Object.keys(PRESET_CODES);
