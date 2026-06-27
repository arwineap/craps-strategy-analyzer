import { ActiveBet, BetType, BUY_BET_TYPES, RATED_BETS } from '../bets.js';
import { CrapsGame } from '../game.js';
import { BetResult } from '../bets.js';
import { TableConfig } from '../table-config.js';

export class BetAction {
  betType: BetType;
  amount: number;
  targetBet: ActiveBet | null;
  vigPer: number;
  takeDown: boolean;

  constructor(
    betType: BetType,
    amount: number,
    targetBet: ActiveBet | null = null,
    vigPer = 20,
    takeDown = false,
  ) {
    this.betType = betType;
    this.amount = amount;
    this.targetBet = targetBet;
    this.vigPer = vigPer;
    this.takeDown = takeDown;
  }

  get vigAmount(): number {
    if (this.takeDown) return 0;
    if (BUY_BET_TYPES.has(this.betType)) return Math.max(1, Math.floor(this.amount / this.vigPer));
    return 0;
  }

  get isRated(): boolean {
    if (this.targetBet !== null || this.takeDown) return false;
    return RATED_BETS.has(this.betType);
  }

  execute(game: CrapsGame, bankroll: number): number {
    if (this.takeDown) {
      if (this.targetBet && game.activeBets.includes(this.targetBet)) {
        const refund = game.removeBet(this.targetBet);
        return -refund;
      }
      return 0;
    }

    const totalCost = this.amount + this.vigAmount;
    if (totalCost <= 0 || bankroll < totalCost) return 0;

    try {
      if (this.targetBet !== null) {
        game.addOdds(this.targetBet, this.amount);
      } else {
        game.placeBet(this.betType, this.amount);
      }
      return totalCost;
    } catch {
      return 0;
    }
  }
}

export abstract class BaseStrategy {
  readonly name: string = 'Base';
  readonly description: string = '';
  readonly category: string = 'custom';

  readonly initialBankroll: number;
  protected tableMin: number;
  tableConfig: TableConfig | null = null;

  constructor(initialBankroll: number, tableMin = 5.0) {
    this.initialBankroll = initialBankroll;
    this.tableMin = tableMin;
  }

  reset(_game: CrapsGame): void {}

  decideBets(_game: CrapsGame, _bankroll: number, _tableValue: number): BetAction[] {
    return [];
  }

  onResults(_results: BetResult[], _game: CrapsGame, _bankroll: number, _tableValue: number): BetAction[] {
    return [];
  }

  protected hasBet(game: CrapsGame, betType: BetType): boolean {
    return game.hasBet(betType);
  }

  protected roundToUnit(amount: number, unit: number): number {
    if (unit <= 0) return amount;
    return Math.max(unit, Math.floor(amount / unit) * unit);
  }

  protected affordable(amount: number, bankroll: number): boolean {
    return bankroll >= amount;
  }

  protected buyBet(betType: BetType, amount: number): BetAction {
    const vigPer = this.tableConfig?.vigPer ?? 20;
    return new BetAction(betType, amount, null, vigPer);
  }
}
