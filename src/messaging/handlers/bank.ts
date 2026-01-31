import {
  createDice,
  getActiveDice,
  getStagedDice,
  getStagedScore,
} from "@/src/game";
import { calculateScore } from "@/src/game/scoring";
import type { GameState, RuleMap } from "@/src/game/types";
import { STRINGS } from "@/src/strings";

import type { CommandResult } from "../types";

export function handleBank(state: GameState): CommandResult {
  const stagedDice = getStagedDice(state);
  const stagedScore = getStagedScore(state);

  if (stagedDice.length === 0) {
    return {
      state: { ...state, message: STRINGS.errors.selectDice },
      events: [{ type: "ERROR", message: STRINGS.errors.selectDice }],
    };
  }

  if (stagedScore === 0) {
    return {
      state: { ...state, message: STRINGS.errors.notScoring },
      events: [{ type: "ERROR", message: STRINGS.errors.notScoring }],
    };
  }

  const { scoredDice, scoringRuleIds, groups } = calculateScore(
    stagedDice,
    state.scoringRules,
  );

  // Check for sets to certify
  const hasNewSet = groups.some((g) => g.ruleId === "set");
  const certificationNeededValue = hasNewSet
    ? groups.find((g) => g.ruleId === "set")!.value
    : state.certificationNeededValue;

  // Decrement charges for limited use upgrades
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
    // Landslide: clear banked dice and roll new dice
    const newDice = createDice(state.dice.length, updatedDiceState);
    return {
      state: {
        ...state,
        dice: newDice,
        bankedScore: newBankedScore,
        message: STRINGS.game.landslide,
        scoringRules: updatedRules,
        lastRollFizzled: false,
        hotDiceCount: state.hotDiceCount + 1,
        permanentMultiplier: (state.permanentMultiplier ?? 1) + 1,
        certificationNeededValue,
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
        message: STRINGS.game.bankedPoints(stagedScore),
        scoringRules: updatedRules,
        lastRollFizzled: false,
        certificationNeededValue,
      },
      events: [{ type: "DICE_BANKED", score: stagedScore, hotDice: false }],
    };
  }
}
