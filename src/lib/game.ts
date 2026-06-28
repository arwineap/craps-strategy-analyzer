import { Dice, DiceRoll } from './dice.js';
import {
  ActiveBet, BetOutcome, BetResult, BetType,
  BUY_BET_TYPES, BUY_NUMBER, ODDS_PAYOUT, PLACE_NUMBER, PLACE_PAYOUT,
  LAY_BET_TYPES, LAY_NUMBER, LAY_PAYOUT,
  ALL_REQUIRED_MASK, SMALL_REQUIRED_MASK, TALL_REQUIRED_MASK,
  computeVig,
} from './bets.js';
import { TableConfig } from './table-config.js';

export enum GamePhase {
  COME_OUT = 'come_out',
  POINT    = 'point',
}

// Bets that are OFF on come-out by default
const TOGGLEABLE = new Set<BetType>([
  BetType.PLACE_4, BetType.PLACE_5, BetType.PLACE_6,
  BetType.PLACE_8, BetType.PLACE_9, BetType.PLACE_10,
  BetType.BIG_6, BetType.BIG_8,
  ...BUY_BET_TYPES,
]);

const HARD_TARGETS: Partial<Record<BetType, number>> = {
  [BetType.HARD_4]: 4, [BetType.HARD_6]: 6,
  [BetType.HARD_8]: 8, [BetType.HARD_10]: 10,
};

const HARD_PAYOUTS: Partial<Record<BetType, number>> = {
  [BetType.HARD_4]: 7, [BetType.HARD_6]: 9,
  [BetType.HARD_8]: 9, [BetType.HARD_10]: 7,
};

export class CrapsGame {
  readonly dice: Dice;
  readonly tableConfig: TableConfig | null;
  fieldTwelveTriple: boolean;

  phase: GamePhase = GamePhase.COME_OUT;
  point: number | null = null;
  activeBets: ActiveBet[] = [];
  rollCount = 0;
  shooterRolls = 0;
  totalSevensOut = 0;
  totalPointsMade = 0;

  constructor(dice: Dice, tableConfig?: TableConfig) {
    this.dice = dice;
    this.tableConfig = tableConfig ?? null;
    this.fieldTwelveTriple = tableConfig?.fieldTriple12 ?? false;
  }

  // ── Bet management ──────────────────────────────────────────────────────

  placeBet(betType: BetType, amount: number, comePoint: number | null = null): ActiveBet {
    this.validateBet(betType, amount);
    const working = this.defaultWorking(betType);
    const bet = new ActiveBet(betType, amount, comePoint, 0, 0, working);
    this.activeBets.push(bet);
    return bet;
  }

  addOdds(baseBet: ActiveBet, amount: number): void {
    const ODDS_ELIGIBLE = new Set<BetType>([
      BetType.PASS_LINE, BetType.DONT_PASS,
      BetType.COME, BetType.DONT_COME,
    ]);
    if (!ODDS_ELIGIBLE.has(baseBet.betType)) {
      throw new Error(`Cannot add odds to ${baseBet.betType}`);
    }
    if (this.tableConfig) {
      const point = baseBet.comePoint ?? this.point;
      if (point !== null) {
        const limit = baseBet.amount * this.tableConfig.maxOddsMultiple(point);
        const proposed = baseBet.oddsAmount + amount;
        if (proposed > limit + 0.01) {
          throw new Error(
            `Odds on ${point} limited to ${this.tableConfig.maxOddsMultiple(point)}x ($${limit.toFixed(2)}); requested $${proposed.toFixed(2)}`
          );
        }
      }
    }
    baseBet.oddsAmount += amount;
  }

  removeBet(bet: ActiveBet): number {
    const idx = this.activeBets.indexOf(bet);
    if (idx !== -1) this.activeBets.splice(idx, 1);
    return bet.totalAtRisk;
  }

  setWorking(bet: ActiveBet, working: boolean): void {
    bet.working = working;
  }

  hasBet(betType: BetType): boolean {
    return this.activeBets.some(b => b.betType === betType);
  }

  getBetsByType(betType: BetType): ActiveBet[] {
    return this.activeBets.filter(b => b.betType === betType);
  }

  // ── Roll ────────────────────────────────────────────────────────────────

  roll(): [DiceRoll, BetResult[]] {
    const dr = this.dice.roll();
    this.rollCount++;
    this.shooterRolls++;

    const results = this.resolveAll(dr);
    this.advancePhase(dr);

    return [dr, results];
  }

  // ── Internal helpers ────────────────────────────────────────────────────

  private validateBet(betType: BetType, amount: number): void {
    if (amount <= 0) throw new Error('Bet amount must be positive');
    if ((betType === BetType.PASS_LINE || betType === BetType.DONT_PASS || betType === BetType.FIRE_BET) && this.phase !== GamePhase.COME_OUT) {
      throw new Error('Pass Line / Don\'t Pass / Fire Bet can only be placed on the come-out roll');
    }
    if ((betType === BetType.COME || betType === BetType.DONT_COME) && this.phase !== GamePhase.POINT) {
      throw new Error('Come / Don\'t Come can only be placed during the point phase');
    }
  }

  private defaultWorking(betType: BetType): boolean {
    if (this.phase === GamePhase.COME_OUT && TOGGLEABLE.has(betType)) return false;
    return true;
  }

  private resolveAll(dr: DiceRoll): BetResult[] {
    const results: BetResult[] = [];
    const toRemove: ActiveBet[] = [];

    for (const bet of this.activeBets) {
      const result = this.resolveSingle(bet, dr);
      if (result) {
        results.push(result);
        if (result.outcome === BetOutcome.WIN || result.outcome === BetOutcome.LOSE || result.outcome === BetOutcome.PUSH) {
          toRemove.push(bet);
        }
      }
    }

    for (const bet of toRemove) {
      const idx = this.activeBets.indexOf(bet);
      if (idx !== -1) this.activeBets.splice(idx, 1);
    }

    return results;
  }

  private resolveSingle(bet: ActiveBet, dr: DiceRoll): BetResult | null {
    const t = dr.total;
    const hard = dr.isHard;
    const bt = bet.betType;

    // ── Pass Line ──────────────────────────────────────────────────────────
    if (bt === BetType.PASS_LINE) {
      if (this.phase === GamePhase.COME_OUT) {
        if (t === 7 || t === 11) return this.win(bet, bet.amount);
        if (t === 2 || t === 3 || t === 12) return this.lose(bet);
        return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
      } else {
        if (t === this.point) {
          const profit = bet.amount + this.oddsPayout(bet.oddsAmount, this.point!);
          return this.win(bet, profit);
        }
        if (t === 7) return this.lose(bet);
        return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
      }
    }

    // ── Don't Pass ─────────────────────────────────────────────────────────
    if (bt === BetType.DONT_PASS) {
      if (this.phase === GamePhase.COME_OUT) {
        if (t === 7 || t === 11) return this.lose(bet);
        if (t === 2 || t === 3) return this.win(bet, bet.amount);
        if (t === 12) return new BetResult(bet, BetOutcome.PUSH, 0, true);
        return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
      } else {
        if (t === this.point) return this.lose(bet);
        if (t === 7) {
          const profit = bet.amount + this.dontOddsPayout(bet.oddsAmount, this.point!);
          return this.win(bet, profit);
        }
        return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
      }
    }

    // ── Come ───────────────────────────────────────────────────────────────
    if (bt === BetType.COME) {
      if (bet.comePoint === null) {
        if (t === 7 || t === 11) return this.win(bet, bet.amount);
        if (t === 2 || t === 3 || t === 12) return this.lose(bet);
        bet.comePoint = t;
        bet.working = true;
        return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
      } else {
        if (t === bet.comePoint) {
          const profit = bet.amount + this.oddsPayout(bet.oddsAmount, bet.comePoint);
          return this.win(bet, profit);
        }
        if (t === 7) return this.lose(bet);
        return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
      }
    }

    // ── Don't Come ─────────────────────────────────────────────────────────
    if (bt === BetType.DONT_COME) {
      if (bet.comePoint === null) {
        if (t === 7 || t === 11) return this.lose(bet);
        if (t === 2 || t === 3) return this.win(bet, bet.amount);
        if (t === 12) return new BetResult(bet, BetOutcome.PUSH, 0, true);
        bet.comePoint = t;
        bet.working = true;
        return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
      } else {
        if (t === bet.comePoint) return this.lose(bet);
        if (t === 7) {
          const profit = bet.amount + this.dontOddsPayout(bet.oddsAmount, bet.comePoint);
          return this.win(bet, profit);
        }
        return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
      }
    }

    // ── Place bets ─────────────────────────────────────────────────────────
    if (PLACE_NUMBER[bt] !== undefined) {
      if (!bet.working) return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
      const num = PLACE_NUMBER[bt]!;
      if (t === num) {
        const [n, d] = PLACE_PAYOUT[bt]!;
        return this.win(bet, (bet.amount / d) * n);
      }
      if (t === 7) return this.lose(bet);
      return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
    }

    // ── Buy bets ───────────────────────────────────────────────────────────
    if (BUY_BET_TYPES.has(bt)) {
      if (!bet.working) return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
      const num = BUY_NUMBER[bt]!;
      if (t === num) {
        const [n, d] = ODDS_PAYOUT[num];
        return this.win(bet, (bet.amount / d) * n);
      }
      if (t === 7) return this.lose(bet);
      return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
    }

    // ── Field ──────────────────────────────────────────────────────────────
    if (bt === BetType.FIELD) {
      if (t === 3 || t === 4 || t === 9 || t === 10 || t === 11) return this.win(bet, bet.amount);
      if (t === 2) return this.win(bet, 2 * bet.amount);
      if (t === 12) return this.win(bet, (this.fieldTwelveTriple ? 3 : 2) * bet.amount);
      return this.lose(bet); // 5, 6, 7, 8
    }

    // ── One-roll props ─────────────────────────────────────────────────────
    if (bt === BetType.ANY_7)     return t === 7             ? this.win(bet, 4  * bet.amount) : this.lose(bet);
    if (bt === BetType.ANY_CRAPS) return (t===2||t===3||t===12) ? this.win(bet, 7  * bet.amount) : this.lose(bet);
    if (bt === BetType.YO)        return t === 11            ? this.win(bet, 15 * bet.amount) : this.lose(bet);
    if (bt === BetType.ACES)      return t === 2             ? this.win(bet, 30 * bet.amount) : this.lose(bet);
    if (bt === BetType.ACE_DEUCE) return t === 3             ? this.win(bet, 15 * bet.amount) : this.lose(bet);
    if (bt === BetType.BOXCARS)   return t === 12            ? this.win(bet, 30 * bet.amount) : this.lose(bet);

    // ── Hardways ───────────────────────────────────────────────────────────
    const hardTarget = HARD_TARGETS[bt];
    if (hardTarget !== undefined) {
      const payoutMult = HARD_PAYOUTS[bt]!;
      if (t === hardTarget && hard) return this.win(bet, payoutMult * bet.amount);
      if (t === hardTarget || t === 7) return this.lose(bet);
      return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
    }

    // ── Big 6 / Big 8 ──────────────────────────────────────────────────────
    if (bt === BetType.BIG_6 || bt === BetType.BIG_8) {
      if (!bet.working) return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
      const target = bt === BetType.BIG_6 ? 6 : 8;
      if (t === target) return this.win(bet, bet.amount);
      if (t === 7) return this.lose(bet);
      return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
    }

    // ── Lay bets ────────────────────────────────────────────────────────────
    // Always working. Win if 7 rolls first; lose if the number rolls. Vig on win.
    if (LAY_BET_TYPES.has(bt)) {
      const num = LAY_NUMBER[bt]!;
      if (t === 7) {
        const [n, d] = LAY_PAYOUT[bt]!;
        const gross = (bet.amount / d) * n;
        const vig   = this.tableConfig ? this.tableConfig.computeVig(gross) : computeVig(gross);
        return this.win(bet, gross - vig);
      }
      if (t === num) return this.lose(bet);
      return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
    }

    // ── Fire Bet ────────────────────────────────────────────────────────────
    // Placed on come-out. Tracks unique points made this shooter's hand.
    // Resolves only on seven-out (7 while in point phase).
    if (bt === BetType.FIRE_BET) {
      if (this.phase === GamePhase.POINT) {
        if (t === this.point) {
          // Point made — record it and stay in play
          bet.pointsMask |= (1 << t);
          return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
        }
        if (t === 7) {
          const unique = [4, 5, 6, 8, 9, 10].filter(p => (bet.pointsMask >> p) & 1).length;
          const p = this.tableConfig?.fireBetPayouts ?? { pts4: 25, pts5: 250, pts6: 1000 };
          if (unique >= 6) return this.win(bet, p.pts6 * bet.amount);
          if (unique >= 5) return this.win(bet, p.pts5 * bet.amount);
          if (unique >= 4) return this.win(bet, p.pts4 * bet.amount);
          return this.lose(bet);
        }
      }
      return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
    }

    // ── All / Small / Tall ──────────────────────────────────────────────────
    // Continuous bets: accumulate rolled numbers, win when all required hit.
    // Lose on any 7.
    if (bt === BetType.SMALL_BET || bt === BetType.TALL_BET || bt === BetType.ALL_BET) {
      if (t === 7) return this.lose(bet);
      bet.pointsMask |= (1 << t);
      const required = bt === BetType.SMALL_BET ? SMALL_REQUIRED_MASK
                     : bt === BetType.TALL_BET   ? TALL_REQUIRED_MASK
                                                 : ALL_REQUIRED_MASK;
      if ((bet.pointsMask & required) === required) {
        const p = this.tableConfig?.allSmallTallPayouts ?? { small: 34, tall: 34, all: 150 };
        const mult = bt === BetType.SMALL_BET ? p.small
                   : bt === BetType.TALL_BET   ? p.tall
                                               : p.all;
        return this.win(bet, mult * bet.amount);
      }
      return new BetResult(bet, BetOutcome.IN_PLAY, 0, false);
    }

    return null;
  }

  private advancePhase(dr: DiceRoll): void {
    const t = dr.total;
    if (this.phase === GamePhase.COME_OUT) {
      if (t !== 2 && t !== 3 && t !== 7 && t !== 11 && t !== 12) {
        this.point = t;
        this.phase = GamePhase.POINT;
        for (const b of this.activeBets) {
          if (TOGGLEABLE.has(b.betType)) b.working = true;
        }
      }
    } else {
      if (t === this.point) {
        this.totalPointsMade++;
        this.point = null;
        this.phase = GamePhase.COME_OUT;
        this.shooterRolls = 0;
        for (const b of this.activeBets) {
          if (TOGGLEABLE.has(b.betType)) b.working = false;
        }
      } else if (t === 7) {
        this.totalSevensOut++;
        this.point = null;
        this.phase = GamePhase.COME_OUT;
        this.shooterRolls = 0;
      }
    }
  }

  private oddsPayout(oddsAmount: number, point: number): number {
    if (oddsAmount <= 0) return 0;
    const [n, d] = ODDS_PAYOUT[point];
    return (oddsAmount / d) * n;
  }

  private dontOddsPayout(oddsAmount: number, point: number): number {
    if (oddsAmount <= 0) return 0;
    const [n, d] = ODDS_PAYOUT[point];
    return (oddsAmount / n) * d;
  }

  private win(bet: ActiveBet, profit: number): BetResult {
    bet.winCount++;
    return new BetResult(bet, BetOutcome.WIN, profit, true);
  }

  private lose(bet: ActiveBet): BetResult {
    return new BetResult(bet, BetOutcome.LOSE, -bet.totalAtRisk, false);
  }
}
