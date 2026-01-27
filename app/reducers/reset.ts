import { calculateThreshold, createDice } from "../../src/game";
import { DEFAULT_RULES } from "../../src/scoring";
import type { GameReducerResult } from "../../src/types";

export function resetReducer(): GameReducerResult {
  return {
    state: {
      dice: createDice(6),
      currentScore: 0,
      bankedScore: 0,
      totalScore: 0,
      threshold: calculateThreshold(1),
      thresholdLevel: 1,
      turnNumber: 1,
      gameOver: false,
      message: "New game started! Roll the dice!",
      scoringRules: DEFAULT_RULES,
      rerollsAvailable: 1,
      lastRollSparkled: false,
    },
  };
}
