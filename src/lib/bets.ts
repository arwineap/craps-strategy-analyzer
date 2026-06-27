export enum BetType {
  PASS_LINE       = 'Pass Line',
  DONT_PASS       = "Don't Pass",
  PASS_ODDS       = 'Pass Odds',
  DONT_PASS_ODDS  = "Don't Pass Odds",
  COME            = 'Come',
  DONT_COME       = "Don't Come",
  COME_ODDS       = 'Come Odds',
  DONT_COME_ODDS  = "Don't Come Odds",
  PLACE_4         = 'Place 4',
  PLACE_5         = 'Place 5',
  PLACE_6         = 'Place 6',
  PLACE_8         = 'Place 8',
  PLACE_9         = 'Place 9',
  PLACE_10        = 'Place 10',
  FIELD           = 'Field',
  ANY_7           = 'Any 7',
  ANY_CRAPS       = 'Any Craps',
  YO              = 'Yo (11)',
  ACES            = 'Aces (2)',
  ACE_DEUCE       = 'Ace-Deuce (3)',
  BOXCARS         = 'Boxcars (12)',
  HARD_4          = 'Hard 4',
  HARD_6          = 'Hard 6',
  HARD_8          = 'Hard 8',
  HARD_10         = 'Hard 10',
  BUY_4           = 'Buy 4',
  BUY_5           = 'Buy 5',
  BUY_6           = 'Buy 6',
  BUY_8           = 'Buy 8',
  BUY_9           = 'Buy 9',
  BUY_10          = 'Buy 10',
  BIG_6           = 'Big 6',
  BIG_8           = 'Big 8',
}

export enum BetOutcome {
  WIN    = 'win',
  LOSE   = 'lose',
  PUSH   = 'push',
  IN_PLAY = 'in_play',
}

export const HOUSE_EDGE: Partial<Record<BetType, number>> = {
  [BetType.PASS_LINE]:      1.41,
  [BetType.DONT_PASS]:      1.36,
  [BetType.PASS_ODDS]:      0.00,
  [BetType.DONT_PASS_ODDS]: 0.00,
  [BetType.COME]:           1.41,
  [BetType.DONT_COME]:      1.36,
  [BetType.COME_ODDS]:      0.00,
  [BetType.DONT_COME_ODDS]: 0.00,
  [BetType.PLACE_4]:        6.67,
  [BetType.PLACE_5]:        4.00,
  [BetType.PLACE_6]:        1.52,
  [BetType.PLACE_8]:        1.52,
  [BetType.PLACE_9]:        4.00,
  [BetType.PLACE_10]:       6.67,
  [BetType.FIELD]:          5.56,
  [BetType.ANY_7]:         16.67,
  [BetType.ANY_CRAPS]:     11.11,
  [BetType.YO]:            11.11,
  [BetType.ACES]:          13.89,
  [BetType.ACE_DEUCE]:     11.11,
  [BetType.BOXCARS]:       13.89,
  [BetType.HARD_4]:        11.11,
  [BetType.HARD_6]:         9.09,
  [BetType.HARD_8]:         9.09,
  [BetType.HARD_10]:       11.11,
  [BetType.BIG_6]:          9.09,
  [BetType.BIG_8]:          9.09,
  [BetType.BUY_4]:          4.76,
  [BetType.BUY_5]:          4.76,
  [BetType.BUY_6]:          4.76,
  [BetType.BUY_8]:          4.76,
  [BetType.BUY_9]:          4.76,
  [BetType.BUY_10]:         4.76,
};

export const RATED_BETS = new Set<BetType>([
  BetType.PASS_LINE, BetType.DONT_PASS,
  BetType.COME, BetType.DONT_COME,
  BetType.PLACE_4, BetType.PLACE_5, BetType.PLACE_6,
  BetType.PLACE_8, BetType.PLACE_9, BetType.PLACE_10,
  BetType.FIELD,
  BetType.ANY_7, BetType.ANY_CRAPS,
  BetType.YO, BetType.ACES, BetType.ACE_DEUCE, BetType.BOXCARS,
  BetType.HARD_4, BetType.HARD_6, BetType.HARD_8, BetType.HARD_10,
  BetType.BIG_6, BetType.BIG_8,
  BetType.BUY_4, BetType.BUY_5, BetType.BUY_6,
  BetType.BUY_8, BetType.BUY_9, BetType.BUY_10,
]);

export const PLACE_NUMBER: Partial<Record<BetType, number>> = {
  [BetType.PLACE_4]: 4, [BetType.PLACE_5]: 5, [BetType.PLACE_6]: 6,
  [BetType.PLACE_8]: 8, [BetType.PLACE_9]: 9, [BetType.PLACE_10]: 10,
};

// Place-bet payout: [numerator, denominator]
export const PLACE_PAYOUT: Partial<Record<BetType, [number, number]>> = {
  [BetType.PLACE_4]:  [9, 5],
  [BetType.PLACE_5]:  [7, 5],
  [BetType.PLACE_6]:  [7, 6],
  [BetType.PLACE_8]:  [7, 6],
  [BetType.PLACE_9]:  [7, 5],
  [BetType.PLACE_10]: [9, 5],
};

// True-odds payout for pass/come: point → [numerator, denominator]
export const ODDS_PAYOUT: Record<number, [number, number]> = {
  4: [2, 1], 5: [3, 2], 6: [6, 5],
  8: [6, 5], 9: [3, 2], 10: [2, 1],
};

export const BUY_NUMBER: Partial<Record<BetType, number>> = {
  [BetType.BUY_4]: 4,  [BetType.BUY_5]: 5,  [BetType.BUY_6]: 6,
  [BetType.BUY_8]: 8,  [BetType.BUY_9]: 9,  [BetType.BUY_10]: 10,
};

export const BUY_BET_TYPES = new Set<BetType>(Object.keys(BUY_NUMBER) as BetType[]);

// Standard 3-4-5x odds table
export const ODDS_MAX_MULTIPLIER: Record<number, number> = {
  4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3,
};

export function computeVig(amount: number, vigPer = 20): number {
  return Math.max(1, Math.floor(amount / vigPer));
}

export class ActiveBet {
  betType: BetType;
  amount: number;
  comePoint: number | null;
  oddsAmount: number;
  winCount: number;
  working: boolean;

  constructor(
    betType: BetType,
    amount: number,
    comePoint: number | null = null,
    oddsAmount = 0,
    winCount = 0,
    working = true,
  ) {
    this.betType = betType;
    this.amount = amount;
    this.comePoint = comePoint;
    this.oddsAmount = oddsAmount;
    this.winCount = winCount;
    this.working = working;
  }

  get totalAtRisk(): number {
    return this.amount + this.oddsAmount;
  }
}

export class BetResult {
  constructor(
    public bet: ActiveBet,
    public outcome: BetOutcome,
    public profit: number,
    public stakeReturned: boolean,
  ) {}
}
