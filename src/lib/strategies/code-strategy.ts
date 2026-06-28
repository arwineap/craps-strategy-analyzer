import {
  ActiveBet, BetOutcome, BetResult, BetType, BUY_BET_TYPES,
  ODDS_MAX_MULTIPLIER,
} from '../bets.js';
import { CrapsGame } from '../game.js';
import { TableConfig } from '../table-config.js';
import { BaseStrategy, BetAction } from './base.js';
import type { BetContext, BetView, BetsMap, GameView, ResultView } from './api-types.js';

// ── Bet type lookup ──────────────────────────────────────────────────────────

const BET_KEY_TO_TYPE: Record<string, BetType> = {
  PASS_LINE:  BetType.PASS_LINE,
  DONT_PASS:  BetType.DONT_PASS,
  COME:       BetType.COME,
  DONT_COME:  BetType.DONT_COME,
  PLACE_4:    BetType.PLACE_4,
  PLACE_5:    BetType.PLACE_5,
  PLACE_6:    BetType.PLACE_6,
  PLACE_8:    BetType.PLACE_8,
  PLACE_9:    BetType.PLACE_9,
  PLACE_10:   BetType.PLACE_10,
  FIELD:      BetType.FIELD,
  ANY_7:      BetType.ANY_7,
  ANY_CRAPS:  BetType.ANY_CRAPS,
  YO:         BetType.YO,
  ACES:       BetType.ACES,
  ACE_DEUCE:  BetType.ACE_DEUCE,
  BOXCARS:    BetType.BOXCARS,
  HARD_4:     BetType.HARD_4,
  HARD_6:     BetType.HARD_6,
  HARD_8:     BetType.HARD_8,
  HARD_10:    BetType.HARD_10,
  BUY_4:      BetType.BUY_4,
  BUY_5:      BetType.BUY_5,
  BUY_6:      BetType.BUY_6,
  BUY_8:      BetType.BUY_8,
  BUY_9:      BetType.BUY_9,
  BUY_10:     BetType.BUY_10,
  BIG_6:      BetType.BIG_6,
  BIG_8:      BetType.BIG_8,
  LAY_4:      BetType.LAY_4,
  LAY_5:      BetType.LAY_5,
  LAY_6:      BetType.LAY_6,
  LAY_8:      BetType.LAY_8,
  LAY_9:      BetType.LAY_9,
  LAY_10:     BetType.LAY_10,
  FIRE_BET:   BetType.FIRE_BET,
  ALL:        BetType.ALL_BET,
  SMALL:      BetType.SMALL_BET,
  TALL:       BetType.TALL_BET,
};

// Exposed to user code: { PASS_LINE: 'Pass Line', PLACE_6: 'Place 6', ... }
export const BETS_MAP: BetsMap = Object.freeze(
  Object.fromEntries(Object.entries(BET_KEY_TO_TYPE).map(([k, v]) => [k, v as string]))
);

// Set of all BetType values for fast reverse lookup
const BET_TYPE_VALUES = new Set<string>(Object.values(BetType));

function resolveBetType(type: string): BetType | null {
  if (type in BET_KEY_TO_TYPE) return BET_KEY_TO_TYPE[type];
  if (BET_TYPE_VALUES.has(type)) return type as BetType;
  return null;
}

function makeBetView(b: ActiveBet): BetView {
  return { type: b.betType as string, amount: b.amount, oddsAmount: b.oddsAmount, comePoint: b.comePoint };
}

// ── Bet-amount rounding ──────────────────────────────────────────────────────
// Place 6/8 must be multiples of $6; Place 4/5/9/10 multiples of $5 (fractional payouts).
// Lay 4/10 multiples of $2; Lay 5/9 multiples of $3; Lay 6/8 multiples of $6.
// Amounts are silently rounded UP to the nearest valid denomination.

const BET_DENOMINATION: Partial<Record<BetType, number>> = {
  [BetType.PLACE_4]:  5,
  [BetType.PLACE_5]:  5,
  [BetType.PLACE_6]:  6,
  [BetType.PLACE_8]:  6,
  [BetType.PLACE_9]:  5,
  [BetType.PLACE_10]: 5,
  [BetType.LAY_4]:    2,
  [BetType.LAY_5]:    3,
  [BetType.LAY_6]:    6,
  [BetType.LAY_8]:    6,
  [BetType.LAY_9]:    3,
  [BetType.LAY_10]:   2,
};

function roundToDenomination(bt: BetType, amount: number): number {
  const d = BET_DENOMINATION[bt];
  return d ? Math.ceil(amount / d) * d : Math.round(amount);
}

// ── Compiled strategy shape ──────────────────────────────────────────────────

interface CompiledStrategy {
  name?: string;
  description?: string;
  category?: string;
  decideBets?: (game: GameView, ctx: BetContext) => void;
  onResults?: (results: ResultView[], game: GameView, ctx: BetContext) => void;
}

// Inject table constants as outer-scope variables so strategy top-level consts
// can reference them (e.g. const betSize = 6 * Math.ceil(TABLE_MIN / 6)).
function compileCode(
  code: string,
  tableMin: number,
  vigPer: number,
  fieldTriple12: boolean,
  fireBetEnabled: boolean,
  allSmallTallEnabled: boolean,
): CompiledStrategy {
  const obj: CompiledStrategy = {};
  try {
    const fn = new Function(
      'strategy',
      'TABLE_MIN', 'VIG_PER', 'FIELD_TRIPLE_12', 'FIRE_BET_ENABLED', 'ALL_SMALL_TALL_ENABLED',
      'fetch', 'XMLHttpRequest', 'WebSocket', 'postMessage', 'importScripts',
      '"use strict";\n' + code,
    );
    fn(obj, tableMin, vigPer, fieldTriple12, fireBetEnabled, allSmallTallEnabled,
       undefined, undefined, undefined, undefined, undefined);
  } catch (err) {
    console.warn('[CodeStrategy] Compilation error:', err);
  }
  return obj;
}

// ── CodeStrategy ─────────────────────────────────────────────────────────────

export class CodeStrategy extends BaseStrategy {
  private readonly decideBetsFn?: (game: GameView, ctx: BetContext) => void;
  private readonly onResultsFn?: (results: ResultView[], game: GameView, ctx: BetContext) => void;
  private userState: Record<string, unknown> = {};
  private pendingActions: BetAction[] = [];
  private currentGame: CrapsGame | null = null;

  constructor(code: string, initialBankroll: number, tableMin: number, tableConfig?: TableConfig) {
    super(initialBankroll, tableMin);
    if (tableConfig) this.tableConfig = tableConfig;
    const vigPer            = tableConfig?.vigPer            ?? 20;
    const fieldTriple12     = tableConfig?.fieldTriple12     ?? false;
    const fireBetEnabled    = tableConfig?.fireBetEnabled    ?? false;
    const allSmallTallEnabled = tableConfig?.allSmallTallEnabled ?? false;
    const compiled = compileCode(code, tableMin, vigPer, fieldTriple12, fireBetEnabled, allSmallTallEnabled);
    // readonly fields inherited from BaseStrategy; safe to overwrite in constructor via cast
    (this as unknown as { name: string }).name             = compiled.name        ?? 'Custom Strategy';
    (this as unknown as { description: string }).description = compiled.description ?? '';
    (this as unknown as { category: string }).category       = compiled.category    ?? 'custom';
    this.decideBetsFn = compiled.decideBets;
    this.onResultsFn  = compiled.onResults;
  }

  override reset(_game: CrapsGame): void {
    this.userState = {};
  }

  override decideBets(game: CrapsGame, bankroll: number, tableValue: number): BetAction[] {
    if (!this.decideBetsFn) return [];
    this.pendingActions = [];
    this.currentGame = game;
    try {
      this.decideBetsFn(this.makeGameView(game), this.makeContext(game, bankroll, tableValue));
    } catch (err) {
      console.warn(`[CodeStrategy "${this.name}"] decideBets error:`, err);
    }
    return this.pendingActions;
  }

  override onResults(results: BetResult[], game: CrapsGame, bankroll: number, tableValue: number): BetAction[] {
    if (!this.onResultsFn) return [];
    this.pendingActions = [];
    this.currentGame = game;
    try {
      this.onResultsFn(
        results.map(r => this.makeResultView(r)),
        this.makeGameView(game),
        this.makeContext(game, bankroll, tableValue),
      );
    } catch (err) {
      console.warn(`[CodeStrategy "${this.name}"] onResults error:`, err);
    }
    return this.pendingActions;
  }

  private makeGameView(game: CrapsGame): GameView {
    return {
      phase: game.phase as 'come_out' | 'point',
      point: game.point,
      roll:  game.rollCount,
      totalSevensOut:  game.totalSevensOut,
      totalPointsMade: game.totalPointsMade,
      hasBet: (type) => {
        const bt = resolveBetType(type);
        return bt ? game.hasBet(bt) : false;
      },
      getBets: (type) => {
        const bt = resolveBetType(type);
        return bt ? game.getBetsByType(bt).map(makeBetView) : [];
      },
      allBets: () => game.activeBets.map(makeBetView),
    };
  }

  private makeResultView(r: BetResult): ResultView {
    const betType = r.bet.betType as string;
    return {
      betType,
      type:      betType,
      amount:    r.bet.amount,
      oddsAmount: r.bet.oddsAmount,
      comePoint: r.bet.comePoint,
      won:    r.outcome === BetOutcome.WIN,
      lost:   r.outcome === BetOutcome.LOSE,
      pushed: r.outcome === BetOutcome.PUSH,
      inPlay: r.outcome === BetOutcome.IN_PLAY,
      profit: r.profit,
    };
  }

  private makeContext(game: CrapsGame, bankroll: number, tableValue: number): BetContext {
    const vigPer              = this.tableConfig?.vigPer              ?? 20;
    const fieldTriple12       = this.tableConfig?.fieldTriple12       ?? false;
    const fireBetEnabled      = this.tableConfig?.fireBetEnabled      ?? false;
    const allSmallTallEnabled = this.tableConfig?.allSmallTallEnabled ?? false;
    const tableConfig         = this.tableConfig;

    return {
      tableMin:     this.tableMin,
      bankroll,
      tableValue,
      state: this.userState,
      Bets:  BETS_MAP,
      vigPer,
      fieldTriple12,
      fireBetEnabled,
      allSmallTallEnabled,

      bet: (type, amount) => {
        if (amount <= 0) return;
        const bt = resolveBetType(type);
        if (!bt) return;
        const rounded = roundToDenomination(bt, amount);
        this.pendingActions.push(new BetAction(bt, rounded));
      },

      odds: (baseBet, amount) => {
        if (amount <= 0 || !this.currentGame) return;
        const bt = resolveBetType(baseBet.type);
        if (!bt) return;
        const active = this.currentGame.activeBets.find(
          b => b.betType === bt && b.amount === baseBet.amount && b.comePoint === baseBet.comePoint,
        );
        if (active) this.pendingActions.push(new BetAction(bt, amount, active));
      },

      takeDown: (baseBet) => {
        if (!this.currentGame) return;
        const bt = resolveBetType(baseBet.type);
        if (!bt) return;
        const active = this.currentGame.activeBets.find(
          b => b.betType === bt && b.amount === baseBet.amount && b.comePoint === baseBet.comePoint,
        );
        if (active) this.pendingActions.push(new BetAction(bt, 0, active, vigPer, true));
      },

      buyBet: (type, amount) => {
        if (amount <= 0) return;
        const bt = resolveBetType(type);
        if (bt && BUY_BET_TYPES.has(bt)) this.pendingActions.push(new BetAction(bt, amount, null, vigPer));
      },

      maxOddsAmount: (point, flatBet) => {
        const mult = tableConfig?.maxOddsMultiple(point) ?? (ODDS_MAX_MULTIPLIER[point] ?? 1);
        return flatBet * mult;
      },
    };
  }
}
