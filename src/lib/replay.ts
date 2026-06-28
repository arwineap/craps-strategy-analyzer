import { Dice } from './dice.js';
import { CrapsGame, GamePhase } from './game.js';
import { BetOutcome } from './bets.js';
import { TableConfig } from './table-config.js';
import { BaseStrategy } from './strategies/base.js';

export interface ReplayRoll {
  rollNum: number;
  die1: number;
  die2: number;
  total: number;
  event: string;
  wins: Array<{ label: string; net: number }>;
  losses: Array<{ label: string; net: number }>;
  bankroll: number;
  tableValue: number;
  delta: number;
}

export interface GameReplay {
  gameNum: number;
  strategyName: string;
  initialBankroll: number;
  rolls: ReplayRoll[];
  finalBankroll: number;
  peakBankroll: number;
}

export function replayGame(
  strategy: BaseStrategy,
  gameNum: number,
  rngSeed: number,
  maxRolls: number,
  tableConfig?: TableConfig,
): GameReplay {
  const dice = new Dice(rngSeed * 1000 + gameNum);
  const game = new CrapsGame(dice, tableConfig);
  strategy.reset(game);

  const initialBankroll = strategy.initialBankroll;
  let bankroll = initialBankroll;
  let tableValue = 0;
  let peak = bankroll;
  const rolls: ReplayRoll[] = [];
  let idleRolls = 0;

  for (let rollNum = 0; rollNum < maxRolls; rollNum++) {
    const totalAssets = bankroll + tableValue;
    if (totalAssets <= 0) break;

    const phaseBefore = game.phase;
    const pointBefore = game.point;
    const assetsBefore = totalAssets;

    const actions = strategy.decideBets(game, bankroll, tableValue);
    let anyBetPlaced = false;
    for (const action of actions) {
      const cost = action.execute(game, bankroll);
      if (cost > 0) anyBetPlaced = true;
      bankroll -= cost;
      tableValue += cost - action.vigAmount;
    }

    const [dr, results] = game.roll();

    let event = '';
    if (phaseBefore === GamePhase.COME_OUT) {
      if (dr.total === 7 || dr.total === 11) event = `Natural ${dr.total}`;
      else if (dr.total === 2 || dr.total === 3 || dr.total === 12) event = `Craps ${dr.total}`;
      else event = `Point ${dr.total}`;
    } else {
      if (dr.total === pointBefore) event = `Hit ${pointBefore}!`;
      else if (dr.total === 7) event = 'Seven-out';
    }

    const wins: Array<{ label: string; net: number }> = [];
    const losses: Array<{ label: string; net: number }> = [];

    for (const res of results) {
      const label = res.bet.comePoint
        ? `${res.bet.betType} (${res.bet.comePoint})`
        : String(res.bet.betType);

      if (res.outcome === BetOutcome.WIN) {
        bankroll += res.profit + res.bet.amount + res.bet.oddsAmount;
        tableValue -= res.bet.amount + res.bet.oddsAmount;
        wins.push({ label, net: res.profit });
      } else if (res.outcome === BetOutcome.LOSE) {
        tableValue -= res.bet.amount + res.bet.oddsAmount;
        losses.push({ label, net: -(res.bet.amount + res.bet.oddsAmount) });
      } else if (res.outcome === BetOutcome.PUSH) {
        bankroll += res.bet.amount + res.bet.oddsAmount;
        tableValue -= res.bet.amount + res.bet.oddsAmount;
      }
    }

    const pressActions = strategy.onResults(results, game, bankroll, tableValue);
    for (const action of pressActions) {
      const cost = action.execute(game, bankroll);
      if (cost > 0) anyBetPlaced = true;
      bankroll -= cost;
      tableValue += cost - action.vigAmount;
    }

    const assetsAfter = bankroll + tableValue;
    peak = Math.max(peak, assetsAfter);

    rolls.push({
      rollNum: rollNum + 1,
      die1: dr.die1,
      die2: dr.die2,
      total: dr.total,
      event,
      wins,
      losses,
      bankroll,
      tableValue,
      delta: assetsAfter - assetsBefore,
    });

    if (!game.activeBets.length && !anyBetPlaced) {
      if (++idleRolls > 40) break;
    } else {
      idleRolls = 0;
    }
  }

  return {
    gameNum,
    strategyName: strategy.name,
    initialBankroll,
    rolls,
    finalBankroll: bankroll + tableValue,
    peakBankroll: peak,
  };
}