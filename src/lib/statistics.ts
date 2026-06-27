import { StrategyAccumulator } from './simulator.js';

export interface StrategyKPIs {
  name: string;
  category: string;
  initialBankroll: number;
  games: number;
  avgRolls: number;
  medianRolls: number;
  p10Rolls: number;
  p90Rolls: number;
  avgPeak: number;
  peakToInitial: number;
  survivalRate2x: number;
  totalWagered: number;
  totalWon: number;
  netPnl: number;
  roiPct: number;
  effectiveHouseEdge: number;
  avgCasinoPointsPerGame: number;
  casinoPointsEfficiency: number;
  estimatedCompPerGame: number;
  compRateUsed: number;
  volatility: number;
  sharpe: number;
}

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

function percentile(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (s.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return lo === hi ? s[lo] : s[lo] * (hi - idx) + s[hi] * (idx - lo);
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length);
}

const DEFAULT_COMP_RATE = 0.004; // 0.4% of rated action

export function computeKpis(
  acc: StrategyAccumulator,
  category = '',
  compRate = DEFAULT_COMP_RATE,
): StrategyKPIs {
  const rolls = acc.rollsPerGame;
  const peaks = acc.peakBankrolls;
  const finals = acc.perGameFinal;
  const initial = acc.initialBankroll;

  const avgPeak = mean(peaks);
  const survival2x = peaks.length ? peaks.filter(p => p >= 2 * initial).length / peaks.length : 0;

  const avgWageredPerGame = acc.gamesCompleted ? acc.totalWagered / acc.gamesCompleted : 0;
  const avgPts = acc.avgCasinoPointsPerGame;
  const ptsEff = avgWageredPerGame ? avgPts / avgWageredPerGame : 0;

  const returns = initial ? finals.map(f => (f - initial) / initial) : finals;
  const meanRet = mean(returns);
  const vol = stdDev(returns);

  return {
    name: acc.name,
    category,
    initialBankroll: initial,
    games: acc.gamesCompleted,
    avgRolls: mean(rolls),
    medianRolls: median(rolls),
    p10Rolls: percentile(rolls, 10),
    p90Rolls: percentile(rolls, 90),
    avgPeak,
    peakToInitial: initial ? avgPeak / initial : 0,
    survivalRate2x: survival2x,
    totalWagered: acc.totalWagered,
    totalWon: acc.totalWon,
    netPnl: acc.netPnl,
    roiPct: acc.roi,
    effectiveHouseEdge: -acc.roi,
    avgCasinoPointsPerGame: avgPts,
    casinoPointsEfficiency: ptsEff,
    estimatedCompPerGame: avgPts * compRate,
    compRateUsed: compRate,
    volatility: vol,
    sharpe: vol > 0 ? meanRet / vol : 0,
  };
}
