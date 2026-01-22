import { calculateThreshold, createDice } from "../game";
import type { GameReducerResult } from "../types";

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
    },
  };
}
