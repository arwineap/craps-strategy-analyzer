export interface BetView {
  type: string;
  amount: number;
  oddsAmount: number;
  comePoint: number | null;
}

export interface GameView {
  phase: 'come_out' | 'point';
  point: number | null;
  roll: number;
  totalSevensOut: number;
  totalPointsMade: number;
  hasBet(type: string): boolean;
  getBets(type: string): BetView[];
  allBets(): BetView[];
}

export interface ResultView {
  betType: string;
  /** Alias for betType — makes ResultView usable wherever BetView is expected (e.g. odds()) */
  type: string;
  amount: number;
  oddsAmount: number;
  comePoint: number | null;
  won: boolean;
  lost: boolean;
  pushed: boolean;
  inPlay: boolean;
  profit: number;
}

export type BetsMap = Readonly<Record<string, string>>;

export interface BetContext {
  tableMin: number;
  bankroll: number;
  tableValue: number;
  /** Persists within a single game; auto-reset between games. Use freely. */
  state: Record<string, unknown>;
  /** Bet type constants, e.g. Bets.PASS_LINE, Bets.PLACE_6 */
  Bets: BetsMap;
  /** Vig percentage used for buy-bet commission (default 20 = 5%) */
  vigPer: number;
  /** Whether the field bet pays triple on 12 (vs. double) */
  fieldTriple12: boolean;
  /** Whether the fire bet is offered at this table */
  fireBetEnabled: boolean;
  /** Whether All/Small/Tall bets are offered at this table */
  allSmallTallEnabled: boolean;
  /** Place a new bet on the table. Place 6/8 amounts are rounded up to the nearest $6; Place 4/5/9/10 to the nearest $5. */
  bet(type: string, amount: number): void;
  /** Add free odds to an existing pass/come/don't bet */
  odds(baseBet: BetView, amount: number): void;
  /** Take down an active bet, returning its stake to bankroll */
  takeDown(activeBet: BetView): void;
  /** Place a buy bet (vig deducted automatically) */
  buyBet(type: string, amount: number): void;
  /** Return the max free-odds amount for this point, respecting table limits */
  maxOddsAmount(point: number, flatBet: number): number;
}
