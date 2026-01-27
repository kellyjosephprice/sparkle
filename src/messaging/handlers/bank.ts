import {
  createDice,
  getActiveDice,
  getStagedDice,
  getStagedScore,
} from "../../../src/game";
import { calculateScore } from "../../../src/scoring";
import type { GameState, RuleMap } from "../../../src/types";
import type { CommandResult } from "../types";

export function handleBank(state: GameState): CommandResult {
  const stagedDice = getStagedDice(state);
  const stagedScore = getStagedScore(state);

  if (stagedDice.length === 0) {
    return {
      state: { ...state, message: "Select some dice first!" },
      events: [{ type: "ERROR", message: "Select some dice first!" }],
    };
  }

  if (stagedScore === 0) {
    return {
      state: { ...state, message: "Selected dice do not score!" },
      events: [{ type: "ERROR", message: "Selected dice do not score!" }],
    };
  }

  const { scoringRuleIds } = calculateScore(stagedDice, state.scoringRules);

  // Increment activation counts for the rules that were used
  const updatedRules = Object.values(state.scoringRules).reduce<RuleMap>(
    (memo, rule) => {
      const count = scoringRuleIds.filter((id) => id === rule.id).length;

      if (count > 0) {
        memo[rule.id] = {
          ...rule,
          activationCount: rule.activationCount + count,
        };
      } else {
        memo[rule.id] = rule;
      }

      return memo;
    },
    {} as RuleMap,
  );

  const activeDice = getActiveDice(state);
  const newBankedScore = state.bankedScore + stagedScore;
  const allDiceUsed = activeDice.length === stagedDice.length;

  if (allDiceUsed) {
    // Hot dice: clear banked dice and roll 6 new dice
    const newDice = createDice(6, state.dice);
    return {
      state: {
        ...state,
        dice: newDice,
        bankedScore: newBankedScore,
        message: `Banked ${stagedScore} points! Hot dice! Rolling all 6 dice again...`,
        scoringRules: updatedRules,
        lastRollSparkled: false,
      },
      events: [{ type: "DICE_BANKED", score: stagedScore, hotDice: true }],
    };
  } else {
    // Normal bank: just mark staged dice as banked
    return {
      state: {
        ...state,
        dice: state.dice.map((die) =>
          die.staged ? { ...die, staged: false, banked: true } : die,
        ),
        bankedScore: newBankedScore,
        message: `Banked ${stagedScore} points! Roll again or end turn.`,
        scoringRules: updatedRules,
        lastRollSparkled: false,
      },
      events: [{ type: "DICE_BANKED", score: stagedScore, hotDice: false }],
    };
  }
}
