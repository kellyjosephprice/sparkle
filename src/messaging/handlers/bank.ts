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

  const { scoredDice, scoringRuleIds } = calculateScore(
    stagedDice,
    state.scoringRules,
  );

  // Decrement charges for limited use upgrades (like TEN_X_MULTIPLIER)
  const stagedWithDecrementedCharges = stagedDice.map((die) => {
    const isScoring = scoredDice.some((sd) => sd.id === die.id);
    if (!isScoring) return die;

    return {
      ...die,
      upgrades: die.upgrades.map((u) =>
        u.type === "TEN_X_MULTIPLIER" && (u.remainingUses ?? 0) > 0
          ? { ...u, remainingUses: u.remainingUses! - 1 }
          : u,
      ),
    };
  });

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

  // Update ALL dice in state to reflect decremented charges on staged dice
  const updatedDiceState = state.dice.map((die) => {
    const updatedStagedDie = stagedWithDecrementedCharges.find(
      (d) => d.id === die.id,
    );
    return updatedStagedDie ?? die;
  });

  if (allDiceUsed) {
    // Hot dice: clear banked dice and roll 6 new dice
    const newDice = createDice(6, updatedDiceState);
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
        dice: updatedDiceState.map((die) =>
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
