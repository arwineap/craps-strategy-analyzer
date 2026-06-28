const ODDS_345X: Record<number, number> = { 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3 };

export const ODDS_OPTIONS = ['1x', '2x', '3x', '3-4-5x', '5x', '10x', '20x', '100x'];

export interface FireBetPayouts {
  pts4: number;
  pts5: number;
  pts6: number;
}

export interface AllSmallTallPayouts {
  small: number;
  tall: number;
  all: number;
}

export interface TableConfigJSON {
  name: string;
  tableMin: number;
  odds: string;
  vigPer: number;
  fieldTriple12: boolean;
  fireBetEnabled: boolean;
  fireBetPayouts: FireBetPayouts;
  allSmallTallEnabled: boolean;
  allSmallTallPayouts: AllSmallTallPayouts;
}

export class TableConfig {
  name: string;
  tableMin: number;
  odds: string;
  vigPer: number;
  fieldTriple12: boolean;
  fireBetEnabled: boolean;
  fireBetPayouts: FireBetPayouts;
  allSmallTallEnabled: boolean;
  allSmallTallPayouts: AllSmallTallPayouts;

  constructor(data: Partial<TableConfigJSON> = {}) {
    this.name = data.name ?? 'My Table';
    this.tableMin = data.tableMin ?? 5.0;
    this.odds = data.odds ?? '3-4-5x';
    this.vigPer = data.vigPer ?? 20.0;
    this.fieldTriple12 = data.fieldTriple12 ?? false;
    this.fireBetEnabled = data.fireBetEnabled ?? false;
    this.fireBetPayouts = data.fireBetPayouts ?? { pts4: 25, pts5: 250, pts6: 1000 };
    this.allSmallTallEnabled = data.allSmallTallEnabled ?? false;
    this.allSmallTallPayouts = data.allSmallTallPayouts ?? { small: 34, tall: 34, all: 150 };
  }

  maxOddsMultiple(point: number): number {
    if (this.odds === '3-4-5x') {
      return ODDS_345X[point] ?? 1;
    }
    const n = parseFloat(this.odds.replace('x', ''));
    return isNaN(n) ? 1 : n;
  }

  computeVig(amount: number): number {
    return Math.max(1, Math.floor(amount / this.vigPer));
  }

  get oddsLabel(): string {
    if (this.odds === '3-4-5x') return '3-4-5x (4→3×, 5→4×, 6/8→5×)';
    return `${this.odds.replace('x', '')}× all points`;
  }

  get vigLabel(): string {
    return `$1 per $${this.vigPer.toFixed(0)} buy`;
  }

  toJSON(): TableConfigJSON {
    return {
      name: this.name,
      tableMin: this.tableMin,
      odds: this.odds,
      vigPer: this.vigPer,
      fieldTriple12: this.fieldTriple12,
      fireBetEnabled: this.fireBetEnabled,
      fireBetPayouts: { ...this.fireBetPayouts },
      allSmallTallEnabled: this.allSmallTallEnabled,
      allSmallTallPayouts: { ...this.allSmallTallPayouts },
    };
  }

  static fromJSON(d: TableConfigJSON): TableConfig {
    return new TableConfig(d);
  }

  clone(): TableConfig {
    return TableConfig.fromJSON(this.toJSON());
  }
}

const DEFAULT_FIRE = { pts4: 25, pts5: 250, pts6: 1000 };
const DEFAULT_AST  = { small: 34, tall: 34, all: 150 };

export const DEFAULT_TABLES: TableConfigJSON[] = [
  { name: 'Vegas Strip $5 (3-4-5x)',  tableMin: 5,  odds: '3-4-5x', vigPer: 20, fieldTriple12: false, fireBetEnabled: false, fireBetPayouts: DEFAULT_FIRE, allSmallTallEnabled: false, allSmallTallPayouts: DEFAULT_AST },
  { name: 'Vegas Strip $25 (3-4-5x)', tableMin: 25, odds: '3-4-5x', vigPer: 20, fieldTriple12: false, fireBetEnabled: false, fireBetPayouts: DEFAULT_FIRE, allSmallTallEnabled: false, allSmallTallPayouts: DEFAULT_AST },
  { name: 'Downtown $5 (10x)',         tableMin: 5,  odds: '10x',    vigPer: 20, fieldTriple12: false, fireBetEnabled: false, fireBetPayouts: DEFAULT_FIRE, allSmallTallEnabled: false, allSmallTallPayouts: DEFAULT_AST },
  { name: 'High Roller $25 (2x)',      tableMin: 25, odds: '2x',     vigPer: 25, fieldTriple12: false, fireBetEnabled: false, fireBetPayouts: DEFAULT_FIRE, allSmallTallEnabled: false, allSmallTallPayouts: DEFAULT_AST },
  { name: 'Friendly $5 (3x)',          tableMin: 5,  odds: '3x',     vigPer: 20, fieldTriple12: false, fireBetEnabled: false, fireBetPayouts: DEFAULT_FIRE, allSmallTallEnabled: false, allSmallTallPayouts: DEFAULT_AST },
];
