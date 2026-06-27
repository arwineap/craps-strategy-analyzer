import {
  ActiveBet, BetOutcome, BetResult, BetType,
  BUY_NUMBER, ODDS_MAX_MULTIPLIER, PLACE_NUMBER,
} from '../bets.js';
import { CrapsGame, GamePhase } from '../game.js';
import { TableConfig } from '../table-config.js';
import { BetAction, BaseStrategy } from './base.js';

// ─────────────────────────────────────────────────────────────────────────────
// Conservative – maximise roll count
// ─────────────────────────────────────────────────────────────────────────────

export class PassLineWithOdds extends BaseStrategy {
  readonly name = 'Pass Line + Max Odds';
  readonly description = 'Pass Line with free odds. Conservative; maximises time at the table.';
  readonly category = 'conservative';
  private oddsMultiplier: number;

  constructor(initialBankroll: number, tableMin = 25, oddsMultiplier = 2) {
    super(initialBankroll, tableMin);
    this.oddsMultiplier = oddsMultiplier;
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    const actions: BetAction[] = [];
    if (game.phase === GamePhase.COME_OUT && !this.hasBet(game, BetType.PASS_LINE)) {
      if (this.affordable(this.tableMin, bankroll)) {
        actions.push(new BetAction(BetType.PASS_LINE, this.tableMin));
      }
    } else if (game.phase === GamePhase.POINT) {
      for (const pl of game.getBetsByType(BetType.PASS_LINE)) {
        if (pl.oddsAmount === 0 && game.point) {
          const amt = pl.amount * this.oddsMultiplier;
          if (this.affordable(amt, bankroll)) {
            actions.push(new BetAction(BetType.PASS_LINE, amt, pl));
          }
        }
      }
    }
    return actions;
  }
}

export class PlaceSixEight extends BaseStrategy {
  readonly name = 'Place 6 & 8';
  readonly description = 'Place 6 and 8 after point is set. 1.52% house edge. High hit frequency.';
  readonly category = 'conservative';
  private betSize: number;

  constructor(initialBankroll: number, tableMin = 25, betSize = 30) {
    super(initialBankroll, tableMin);
    this.betSize = betSize;
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    if (game.phase !== GamePhase.POINT) return [];
    const actions: BetAction[] = [];
    for (const bt of [BetType.PLACE_6, BetType.PLACE_8]) {
      const num = bt === BetType.PLACE_6 ? 6 : 8;
      if (game.point === num) continue;
      if (!this.hasBet(game, bt) && this.affordable(this.betSize, bankroll)) {
        actions.push(new BetAction(bt, this.betSize));
      }
    }
    return actions;
  }
}

export class ThreePointMolly extends BaseStrategy {
  readonly name = 'Three Point Molly';
  readonly description = 'Pass Line plus up to 2 Come bets, each with free odds. 3 numbers working.';
  readonly category = 'conservative';
  private oddsMult: number;
  static readonly MAX_COME_BETS = 2;

  constructor(initialBankroll: number, tableMin = 25, oddsMult = 2) {
    super(initialBankroll, tableMin);
    this.oddsMult = oddsMult;
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    const actions: BetAction[] = [];
    if (game.phase === GamePhase.COME_OUT) {
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(this.tableMin, bankroll)) {
        actions.push(new BetAction(BetType.PASS_LINE, this.tableMin));
      }
    } else {
      for (const pl of game.getBetsByType(BetType.PASS_LINE)) {
        if (pl.oddsAmount === 0 && game.point) {
          const odds = pl.amount * this.oddsMult;
          if (this.affordable(odds, bankroll)) {
            actions.push(new BetAction(BetType.PASS_LINE, odds, pl));
          }
        }
      }
      const comeBets = game.getBetsByType(BetType.COME);
      if (comeBets.length < ThreePointMolly.MAX_COME_BETS && this.affordable(this.tableMin, bankroll)) {
        actions.push(new BetAction(BetType.COME, this.tableMin));
      }
      for (const cb of comeBets) {
        if (cb.comePoint && cb.oddsAmount === 0) {
          const odds = cb.amount * this.oddsMult;
          if (this.affordable(odds, bankroll)) {
            actions.push(new BetAction(BetType.COME, odds, cb));
          }
        }
      }
    }
    return actions;
  }
}

export class CasinoPoints extends BaseStrategy {
  readonly name = 'Casino Points';
  readonly description = 'Table-minimum Pass Line, no odds. 100% of money at risk is rated action.';
  readonly category = 'casino_points';

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    if (game.phase === GamePhase.COME_OUT && !this.hasBet(game, BetType.PASS_LINE)) {
      if (this.affordable(this.tableMin, bankroll)) {
        return [new BetAction(BetType.PASS_LINE, this.tableMin)];
      }
    }
    return [];
  }
}

export class DontPassLay extends BaseStrategy {
  readonly name = "Don't Pass + Lay Odds";
  readonly description = "Don't Pass with lay odds. Combined edge ~0.43%. Wins on seven-outs.";
  readonly category = 'conservative';
  private oddsMult: number;

  constructor(initialBankroll: number, tableMin = 25, oddsMult = 2) {
    super(initialBankroll, tableMin);
    this.oddsMult = oddsMult;
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    const actions: BetAction[] = [];
    if (game.phase === GamePhase.COME_OUT) {
      if (!this.hasBet(game, BetType.DONT_PASS) && this.affordable(this.tableMin, bankroll)) {
        actions.push(new BetAction(BetType.DONT_PASS, this.tableMin));
      }
    } else {
      for (const dp of game.getBetsByType(BetType.DONT_PASS)) {
        if (dp.oddsAmount === 0 && game.point) {
          const odds = dp.amount * this.oddsMult;
          if (this.affordable(odds, bankroll)) {
            actions.push(new BetAction(BetType.DONT_PASS, odds, dp));
          }
        }
      }
    }
    return actions;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// High-reward strategies
// ─────────────────────────────────────────────────────────────────────────────

export class IronCross extends BaseStrategy {
  readonly name = 'Iron Cross';
  readonly description = 'Field + Place 5, 6, 8. Wins on every number except 7.';
  readonly category = 'high_reward';
  private fieldBet: number;
  private place59: number;
  private place68: number;

  constructor(initialBankroll: number, tableMin = 25, fieldBet?: number, place59?: number, place68?: number) {
    super(initialBankroll, tableMin);
    this.fieldBet = fieldBet || tableMin;
    this.place59 = place59 || tableMin;
    this.place68 = place68 || tableMin * 1.2;
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    if (game.phase !== GamePhase.POINT) {
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(this.tableMin, bankroll)) {
        return [new BetAction(BetType.PASS_LINE, this.tableMin)];
      }
      return [];
    }
    const actions: BetAction[] = [];
    for (const [bt, amount] of [
      [BetType.PLACE_5, this.place59] as [BetType, number],
      [BetType.PLACE_6, this.place68] as [BetType, number],
      [BetType.PLACE_8, this.place68] as [BetType, number],
      [BetType.FIELD, this.fieldBet]  as [BetType, number],
    ]) {
      if (!this.hasBet(game, bt) && this.affordable(amount, bankroll)) {
        actions.push(new BetAction(bt, amount));
      }
    }
    return actions;
  }
}

export class HighRoller extends BaseStrategy {
  readonly name = 'High Roller Props';
  readonly description = 'Hardways (4/6/8/10) + Yo + Any Craps. High house edge; explosive wins.';
  readonly category = 'high_reward';
  private hardBet: number;
  private propBet: number;
  private includePass: boolean;

  constructor(initialBankroll: number, tableMin = 25, hardBet = 5, propBet = 5, includePass = true) {
    super(initialBankroll, tableMin);
    this.hardBet = hardBet;
    this.propBet = propBet;
    this.includePass = includePass;
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    const actions: BetAction[] = [];
    let avail = bankroll;
    if (this.includePass && game.phase === GamePhase.COME_OUT) {
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(this.tableMin, avail)) {
        actions.push(new BetAction(BetType.PASS_LINE, this.tableMin));
        avail -= this.tableMin;
      }
    }
    for (const bt of [BetType.HARD_4, BetType.HARD_6, BetType.HARD_8, BetType.HARD_10]) {
      if (!this.hasBet(game, bt) && this.affordable(this.hardBet, avail)) {
        actions.push(new BetAction(bt, this.hardBet));
        avail -= this.hardBet;
      }
    }
    for (const bt of [BetType.YO, BetType.ANY_CRAPS]) {
      if (this.affordable(this.propBet, avail)) {
        actions.push(new BetAction(bt, this.propBet));
        avail -= this.propBet;
      }
    }
    return actions;
  }
}

export class PressAndRegress extends BaseStrategy {
  readonly name = 'Press & Regress (6/8)';
  readonly description = 'Place 6 & 8; press on first hit, regress after second.';
  readonly category = 'high_reward';
  private baseBet: number;
  private pressedBet: number;
  private nextBet: Record<number, number> = {};
  private winCountMap: Record<number, number> = {};

  constructor(initialBankroll: number, tableMin = 25, baseBet = 30, pressedBet = 60) {
    super(initialBankroll, tableMin);
    this.baseBet = baseBet;
    this.pressedBet = pressedBet;
    this.resetState();
  }

  private resetState() {
    this.nextBet = { 6: this.baseBet, 8: this.baseBet };
    this.winCountMap = { 6: 0, 8: 0 };
  }

  reset(_game: CrapsGame): void { this.resetState(); }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    if (game.phase === GamePhase.COME_OUT) {
      this.resetState();
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(this.tableMin, bankroll)) {
        return [new BetAction(BetType.PASS_LINE, this.tableMin)];
      }
      return [];
    }
    const actions: BetAction[] = [];
    for (const [bt, num] of [[BetType.PLACE_6, 6], [BetType.PLACE_8, 8]] as [BetType, number][]) {
      if (game.point === num) continue;
      if (!this.hasBet(game, bt)) {
        const amount = this.nextBet[num] ?? this.baseBet;
        if (this.affordable(amount, bankroll)) {
          actions.push(new BetAction(bt, amount));
        } else if (this.affordable(this.baseBet, bankroll)) {
          actions.push(new BetAction(bt, this.baseBet));
          this.nextBet[num] = this.baseBet;
        }
      }
    }
    return actions;
  }

  onResults(results: BetResult[], _game: CrapsGame): BetAction[] {
    const numMap: Partial<Record<BetType, number>> = { [BetType.PLACE_6]: 6, [BetType.PLACE_8]: 8 };
    for (const res of results) {
      if (res.outcome !== BetOutcome.WIN || numMap[res.bet.betType] === undefined) continue;
      const num = numMap[res.bet.betType]!;
      this.winCountMap[num] = (this.winCountMap[num] ?? 0) + 1;
      if (this.winCountMap[num] === 1) {
        this.nextBet[num] = this.pressedBet;
      } else {
        this.nextBet[num] = this.baseBet;
        this.winCountMap[num] = 0;
      }
    }
    return [];
  }
}

export class Place68PressOneUnit extends BaseStrategy {
  readonly name = 'Place 6 & 8 - Press 1 Unit';
  readonly description = 'Place 6 & 8; press by one unit after every hit. Rides hot shooters.';
  readonly category = 'high_reward';
  private baseBet: number;
  private unit: number;
  private nextBet: Record<number, number> = {};

  constructor(initialBankroll: number, tableMin = 25, baseBet = 30, unit = 30) {
    super(initialBankroll, tableMin);
    this.baseBet = baseBet;
    this.unit = unit;
    this.nextBet = { 6: baseBet, 8: baseBet };
  }

  reset(_game: CrapsGame): void {
    this.nextBet = { 6: this.baseBet, 8: this.baseBet };
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    if (game.phase === GamePhase.COME_OUT) {
      this.nextBet = { 6: this.baseBet, 8: this.baseBet };
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(this.tableMin, bankroll)) {
        return [new BetAction(BetType.PASS_LINE, this.tableMin)];
      }
      return [];
    }
    const actions: BetAction[] = [];
    for (const [bt, num] of [[BetType.PLACE_6, 6], [BetType.PLACE_8, 8]] as [BetType, number][]) {
      if (game.point === num) continue;
      if (!this.hasBet(game, bt)) {
        const amount = this.nextBet[num] ?? this.baseBet;
        if (this.affordable(amount, bankroll)) {
          actions.push(new BetAction(bt, amount));
        } else if (this.affordable(this.baseBet, bankroll)) {
          actions.push(new BetAction(bt, this.baseBet));
          this.nextBet[num] = this.baseBet;
        }
      }
    }
    return actions;
  }

  onResults(results: BetResult[]): BetAction[] {
    for (const res of results) {
      if (res.outcome !== BetOutcome.WIN) continue;
      if (res.bet.betType === BetType.PLACE_6) this.nextBet[6] = res.bet.amount + this.unit;
      else if (res.bet.betType === BetType.PLACE_8) this.nextBet[8] = res.bet.amount + this.unit;
    }
    return [];
  }
}

export class Inside extends BaseStrategy {
  readonly name = 'Inside (5-6-8-9)';
  readonly description = 'Place 5, 6, 8, and 9 after point is set (skips point number).';
  readonly category = 'conservative';
  private place59: number;
  private place68: number;

  constructor(initialBankroll: number, tableMin = 25, place59?: number, place68?: number) {
    super(initialBankroll, tableMin);
    this.place59 = place59 || tableMin;
    this.place68 = place68 || tableMin * 1.2;
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    if (game.phase === GamePhase.COME_OUT) {
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(this.tableMin, bankroll)) {
        return [new BetAction(BetType.PASS_LINE, this.tableMin)];
      }
      return [];
    }
    const actions: BetAction[] = [];
    for (const [bt, amount] of [
      [BetType.PLACE_5, this.place59] as [BetType, number],
      [BetType.PLACE_6, this.place68] as [BetType, number],
      [BetType.PLACE_8, this.place68] as [BetType, number],
      [BetType.PLACE_9, this.place59] as [BetType, number],
    ]) {
      if (game.point === PLACE_NUMBER[bt]) continue;
      if (!this.hasBet(game, bt) && this.affordable(amount, bankroll)) {
        actions.push(new BetAction(bt, amount));
      }
    }
    return actions;
  }
}

export class Across extends BaseStrategy {
  readonly name = 'Across (4-5-6-8-9-10)';
  readonly description = 'Place all six numbers after point is set (skips point number).';
  readonly category = 'high_reward';
  private place410: number;
  private place59: number;
  private place68: number;

  constructor(initialBankroll: number, tableMin = 25, place410?: number, place59?: number, place68?: number) {
    super(initialBankroll, tableMin);
    this.place410 = place410 || tableMin;
    this.place59 = place59 || tableMin;
    this.place68 = place68 || tableMin * 1.2;
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    if (game.phase === GamePhase.COME_OUT) {
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(this.tableMin, bankroll)) {
        return [new BetAction(BetType.PASS_LINE, this.tableMin)];
      }
      return [];
    }
    const amountMap: Partial<Record<BetType, number>> = {
      [BetType.PLACE_4]: this.place410, [BetType.PLACE_5]: this.place59,
      [BetType.PLACE_6]: this.place68,  [BetType.PLACE_8]: this.place68,
      [BetType.PLACE_9]: this.place59,  [BetType.PLACE_10]: this.place410,
    };
    const actions: BetAction[] = [];
    for (const [bt, amount] of Object.entries(amountMap) as [BetType, number][]) {
      if (game.point === PLACE_NUMBER[bt]) continue;
      if (!this.hasBet(game, bt) && this.affordable(amount, bankroll)) {
        actions.push(new BetAction(bt, amount));
      }
    }
    return actions;
  }
}

export class IronCrossHedge extends BaseStrategy {
  readonly name = 'Iron Cross Hedge';
  readonly description = 'Field + Place 5 + doubled Place 6/8. When 6 or 8 hits, the place win offsets the field loss.';
  readonly category = 'high_reward';
  private fieldBet: number;
  private place5: number;
  private place68: number;

  constructor(initialBankroll: number, tableMin = 25, fieldBet?: number, place5?: number, place68?: number) {
    super(initialBankroll, tableMin);
    this.fieldBet = fieldBet || tableMin;
    this.place5 = place5 || tableMin;
    this.place68 = place68 || tableMin * 2.4;
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    if (game.phase !== GamePhase.POINT) {
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(this.tableMin, bankroll)) {
        return [new BetAction(BetType.PASS_LINE, this.tableMin)];
      }
      return [];
    }
    const actions: BetAction[] = [];
    for (const [bt, amount] of [
      [BetType.PLACE_5, this.place5]  as [BetType, number],
      [BetType.PLACE_6, this.place68] as [BetType, number],
      [BetType.PLACE_8, this.place68] as [BetType, number],
      [BetType.FIELD,   this.fieldBet] as [BetType, number],
    ]) {
      if (!this.hasBet(game, bt) && this.affordable(amount, bankroll)) {
        actions.push(new BetAction(bt, amount));
      }
    }
    return actions;
  }
}

export class BuildAcrossPress extends BaseStrategy {
  readonly name = '6/8 Build → Across';
  readonly description = 'Place 6 & 8; press 1 unit on first hit, then fund Place 5, 9, 4, 10 one per hit. Resets on seven-out.';
  readonly category = 'high_reward';

  private static readonly TRACKED = new Set<BetType>([
    BetType.PLACE_5, BetType.PLACE_6, BetType.PLACE_8, BetType.PLACE_9,
    BetType.BUY_4, BetType.BUY_10,
  ]);

  private base68: number;
  private sevensSeenCount = 0;
  private firstHitDone = false;
  private placed5 = false;
  private placed9 = false;
  private placed4 = false;
  private placed10 = false;
  private nextBet: Record<number, number> = {};

  constructor(initialBankroll: number, tableMin = 25, base68 = 30) {
    super(initialBankroll, tableMin);
    this.base68 = base68;
    this.initState();
  }

  private initState() {
    this.firstHitDone = false;
    this.placed5 = false;
    this.placed9 = false;
    this.placed4 = false;
    this.placed10 = false;
    this.nextBet = { 6: this.base68, 8: this.base68, 5: this.tableMin, 9: this.tableMin, 4: this.tableMin, 10: this.tableMin };
  }

  reset(_game: CrapsGame): void { this.sevensSeenCount = 0; this.initState(); }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    if (game.phase === GamePhase.COME_OUT) {
      if (game.totalSevensOut > this.sevensSeenCount) {
        this.sevensSeenCount = game.totalSevensOut;
        this.initState();
      }
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(this.tableMin, bankroll)) {
        return [new BetAction(BetType.PASS_LINE, this.tableMin)];
      }
      return [];
    }
    const actions: BetAction[] = [];
    for (const [bt, num] of [[BetType.PLACE_6, 6], [BetType.PLACE_8, 8]] as [BetType, number][]) {
      if (game.point === num) continue;
      if (!this.hasBet(game, bt) && this.affordable(this.nextBet[num], bankroll)) {
        actions.push(new BetAction(bt, this.nextBet[num]));
      }
    }
    for (const [bt, num, placed] of [
      [BetType.PLACE_5, 5, this.placed5] as [BetType, number, boolean],
      [BetType.PLACE_9, 9, this.placed9] as [BetType, number, boolean],
      [BetType.BUY_4,  4, this.placed4] as [BetType, number, boolean],
      [BetType.BUY_10, 10, this.placed10] as [BetType, number, boolean],
    ]) {
      if (!placed || game.point === num) continue;
      if (!this.hasBet(game, bt) && this.affordable(this.nextBet[num], bankroll)) {
        if (bt === BetType.BUY_4 || bt === BetType.BUY_10) {
          actions.push(this.buyBet(bt, this.nextBet[num]));
        } else {
          actions.push(new BetAction(bt, this.nextBet[num]));
        }
      }
    }
    return actions;
  }

  onResults(results: BetResult[]): BetAction[] {
    for (const res of results) {
      if (res.outcome !== BetOutcome.WIN) continue;
      if (!BuildAcrossPress.TRACKED.has(res.bet.betType)) continue;
      const bt = res.bet.betType;
      const num = PLACE_NUMBER[bt] ?? BUY_NUMBER[bt];
      if (num === undefined) continue;
      const unit = (num === 6 || num === 8) ? this.base68 : this.tableMin;
      if (!this.firstHitDone)     { this.firstHitDone = true; this.nextBet[num] += unit; }
      else if (!this.placed5)     { this.placed5 = true; }
      else if (!this.placed9)     { this.placed9 = true; }
      else if (!this.placed4)     { this.placed4 = true; }
      else if (!this.placed10)    { this.placed10 = true; }
      else                        { this.nextBet[num] += unit; }
    }
    return [];
  }
}

export class ComeLadder extends BaseStrategy {
  readonly name = 'Come Ladder (7-unit)';
  readonly description = 'Pass Line + self-sizing come bets forming a geometric ladder. Total units never exceed 7.';
  readonly category = 'high_reward';
  static readonly CAP_UNITS = 7;

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    const unit = this.tableMin;
    const actions: BetAction[] = [];
    if (game.phase === GamePhase.COME_OUT) {
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(unit, bankroll)) {
        actions.push(new BetAction(BetType.PASS_LINE, unit));
      }
      return actions;
    }
    const deployed = game.getBetsByType(BetType.COME)
      .reduce((s, b) => s + Math.round(b.amount / unit), 0);
    const nextUnits = deployed + 1;
    const nextAmount = nextUnits * unit;
    if (deployed + nextUnits <= ComeLadder.CAP_UNITS && this.affordable(nextAmount, bankroll)) {
      actions.push(new BetAction(BetType.COME, nextAmount));
    }
    return actions;
  }
}

export class InfiniteMolly extends BaseStrategy {
  readonly name = 'Infinite Molly';
  readonly description = 'Pass Line + max odds, then one Come bet in transit every roll with max odds. Lowest blended house edge.';
  readonly category = 'conservative';

  private maxOdds(point: number, flat: number): number {
    const mult = this.tableConfig?.maxOddsMultiple(point) ?? (ODDS_MAX_MULTIPLIER[point] ?? 1);
    return flat * mult;
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    const actions: BetAction[] = [];
    let avail = bankroll;
    if (game.phase === GamePhase.COME_OUT) {
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(this.tableMin, avail)) {
        actions.push(new BetAction(BetType.PASS_LINE, this.tableMin));
      }
      return actions;
    }
    for (const pl of game.getBetsByType(BetType.PASS_LINE)) {
      if (pl.oddsAmount === 0 && game.point) {
        const amt = this.maxOdds(game.point, pl.amount);
        if (this.affordable(amt, avail)) {
          actions.push(new BetAction(BetType.PASS_LINE, amt, pl));
          avail -= amt;
        }
      }
    }
    for (const cb of game.getBetsByType(BetType.COME)) {
      if (cb.comePoint !== null && cb.oddsAmount === 0) {
        const amt = this.maxOdds(cb.comePoint, cb.amount);
        if (this.affordable(amt, avail)) {
          actions.push(new BetAction(BetType.COME_ODDS, amt, cb));
          avail -= amt;
        }
      }
    }
    const inTransit = game.getBetsByType(BetType.COME).some(cb => cb.comePoint === null);
    if (!inTransit && this.affordable(this.tableMin, avail)) {
      actions.push(new BetAction(BetType.COME, this.tableMin));
    }
    return actions;
  }
}

// Map point number → place-bet type (for AcrossToInfinityCome take-downs)
const PLACE_FOR_NUM: Record<number, BetType> = {
  4: BetType.PLACE_4, 5: BetType.PLACE_5, 6: BetType.PLACE_6,
  8: BetType.PLACE_8, 9: BetType.PLACE_9, 10: BetType.PLACE_10,
};

export class AcrossToInfinityCome extends BaseStrategy {
  readonly name = 'Across → Infinity Come';
  readonly description = 'Place across all numbers, then continuously cycle Come bets with max odds. Place bets taken down as Come bets establish.';
  readonly category = 'high_reward';

  private sevensSeenCount = 0;
  private placedAcross = false;
  private comeNumbers = new Set<number>();

  private placeSize(num: number): number {
    const unit = (num === 6 || num === 8) ? 6 : 5;
    return unit * Math.ceil(this.tableMin / unit);
  }

  private maxOdds(point: number, flat: number): number {
    const mult = this.tableConfig?.maxOddsMultiple(point) ?? (ODDS_MAX_MULTIPLIER[point] ?? 1);
    return flat * mult;
  }

  reset(_game: CrapsGame): void {
    this.sevensSeenCount = 0;
    this.placedAcross = false;
    this.comeNumbers.clear();
  }

  decideBets(game: CrapsGame, bankroll: number): BetAction[] {
    const actions: BetAction[] = [];
    let avail = bankroll;

    if (game.phase === GamePhase.COME_OUT) {
      if (game.totalSevensOut > this.sevensSeenCount) {
        this.sevensSeenCount = game.totalSevensOut;
        this.placedAcross = false;
        this.comeNumbers.clear();
      }
      if (!this.hasBet(game, BetType.PASS_LINE) && this.affordable(this.tableMin, avail)) {
        actions.push(new BetAction(BetType.PASS_LINE, this.tableMin));
      }
      return actions;
    }

    // Pass-line odds
    for (const pl of game.getBetsByType(BetType.PASS_LINE)) {
      if (pl.oddsAmount === 0 && game.point) {
        const amt = this.maxOdds(game.point, pl.amount);
        if (this.affordable(amt, avail)) {
          actions.push(new BetAction(BetType.PASS_LINE, amt, pl));
          avail -= amt;
        }
      }
    }

    // Place across on first point after each seven-out
    if (!this.placedAcross) {
      this.placedAcross = true;
      for (const [num, bt] of Object.entries(PLACE_FOR_NUM) as [string, BetType][]) {
        const n = parseInt(num);
        if (n === game.point || this.comeNumbers.has(n)) continue;
        if (!this.hasBet(game, bt)) {
          const amt = this.placeSize(n);
          if (this.affordable(amt, avail)) {
            actions.push(new BetAction(bt, amt));
            avail -= amt;
          }
        }
      }
    }

    // Max odds on established Come bets
    for (const cb of game.getBetsByType(BetType.COME)) {
      if (cb.comePoint !== null && cb.oddsAmount === 0) {
        const amt = this.maxOdds(cb.comePoint, cb.amount);
        if (this.affordable(amt, avail)) {
          actions.push(new BetAction(BetType.COME_ODDS, amt, cb));
          avail -= amt;
        }
      }
    }

    // One Come bet in transit
    const inTransit = game.getBetsByType(BetType.COME).some(cb => cb.comePoint === null);
    if (!inTransit && this.affordable(this.tableMin, avail)) {
      actions.push(new BetAction(BetType.COME, this.tableMin));
    }

    return actions;
  }

  onResults(results: BetResult[], game: CrapsGame, bankroll: number): BetAction[] {
    const actions: BetAction[] = [];
    let avail = bankroll;

    for (const res of results) {
      const bt = res.bet.betType;

      if (
        bt === BetType.COME &&
        res.outcome === BetOutcome.IN_PLAY &&
        res.bet.comePoint !== null &&
        !this.comeNumbers.has(res.bet.comePoint)
      ) {
        const num = res.bet.comePoint;
        this.comeNumbers.add(num);

        // Take down the Place bet on this number if we have one
        const placeBt = PLACE_FOR_NUM[num];
        if (placeBt) {
          const existing = game.activeBets.find(b => b.betType === placeBt);
          if (existing) {
            actions.push(new BetAction(placeBt, 0, existing, 20, true));
            avail += existing.amount;
          }
        }

        // Add max odds to the newly established Come bet
        const amt = this.maxOdds(num, res.bet.amount);
        if (this.affordable(amt, avail)) {
          actions.push(new BetAction(BetType.COME_ODDS, amt, res.bet));
          avail -= amt;
        }
      }

      if (bt === BetType.COME && (res.outcome === BetOutcome.WIN || res.outcome === BetOutcome.LOSE)) {
        if (res.bet.comePoint !== null) {
          this.comeNumbers.delete(res.bet.comePoint);
        }
      }
    }

    return actions;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

// Registry is used only for getting the list of preset names
export const PRESET_STRATEGIES: Record<string, unknown> = {
  'Pass Line + Max Odds':       PassLineWithOdds,
  "Don't Pass + Lay Odds":      DontPassLay,
  'Place 6 & 8':                PlaceSixEight,
  'Three Point Molly':          ThreePointMolly,
  'Inside (5-6-8-9)':           Inside,
  'Across (4-5-6-8-9-10)':      Across,
  'Iron Cross':                 IronCross,
  'Iron Cross Hedge':           IronCrossHedge,
  'High Roller Props':          HighRoller,
  'Casino Points':              CasinoPoints,
  'Press & Regress (6/8)':      PressAndRegress,
  'Place 6 & 8 - Press 1 Unit': Place68PressOneUnit,
  'Come Ladder (7-unit)':       ComeLadder,
  '6/8 Build → Across':         BuildAcrossPress,
  'Across → Infinity Come':     AcrossToInfinityCome,
  'Infinite Molly':             InfiniteMolly,
};

export function buildStrategy(
  preset: string,
  bankroll: number,
  tableMin: number,
  params: Record<string, number | boolean> = {},
  tableConfig?: TableConfig,
): BaseStrategy {
  const p = params;
  const tm = tableConfig?.tableMin ?? tableMin;
  let strategy: BaseStrategy;

  switch (preset) {
    case 'Pass Line + Max Odds':
      strategy = new PassLineWithOdds(bankroll, tm, (p.oddsMultiplier as number) || 2);
      break;
    case "Don't Pass + Lay Odds":
      strategy = new DontPassLay(bankroll, tm, (p.oddsMult as number) || 2);
      break;
    case 'Place 6 & 8':
      strategy = new PlaceSixEight(bankroll, tm, (p.betSize as number) || 30);
      break;
    case 'Three Point Molly':
      strategy = new ThreePointMolly(bankroll, tm, (p.oddsMult as number) || 2);
      break;
    case 'Inside (5-6-8-9)':
      strategy = new Inside(bankroll, tm, (p.place59 as number) || undefined, (p.place68 as number) || undefined);
      break;
    case 'Across (4-5-6-8-9-10)':
      strategy = new Across(bankroll, tm, (p.place410 as number) || undefined, (p.place59 as number) || undefined, (p.place68 as number) || undefined);
      break;
    case 'Iron Cross':
      strategy = new IronCross(bankroll, tm, (p.fieldBet as number) || undefined, (p.place59 as number) || undefined, (p.place68 as number) || undefined);
      break;
    case 'Iron Cross Hedge':
      strategy = new IronCrossHedge(bankroll, tm, (p.fieldBet as number) || undefined, (p.place5 as number) || undefined, (p.place68 as number) || undefined);
      break;
    case 'High Roller Props':
      strategy = new HighRoller(bankroll, tm, (p.hardBet as number) || 5, (p.propBet as number) || 5, (p.includePass as boolean) ?? true);
      break;
    case 'Casino Points':
      strategy = new CasinoPoints(bankroll, tm);
      break;
    case 'Press & Regress (6/8)':
      strategy = new PressAndRegress(bankroll, tm, (p.baseBet as number) || 30, (p.pressedBet as number) || 60);
      break;
    case 'Place 6 & 8 - Press 1 Unit':
      strategy = new Place68PressOneUnit(bankroll, tm, (p.baseBet as number) || 30, (p.unit as number) || 30);
      break;
    case 'Come Ladder (7-unit)':
      strategy = new ComeLadder(bankroll, tm);
      break;
    case '6/8 Build → Across':
      strategy = new BuildAcrossPress(bankroll, tm, (p.base68 as number) || 30);
      break;
    case 'Across → Infinity Come':
      strategy = new AcrossToInfinityCome(bankroll, tm);
      break;
    case 'Infinite Molly':
      strategy = new InfiniteMolly(bankroll, tm);
      break;
    default:
      throw new Error(`Unknown strategy: ${preset}`);
  }

  if (tableConfig) strategy.tableConfig = tableConfig;
  return strategy;
}
