import type { GameState, GameAction, GameReducerResult } from "../types";
import { createDice, calculateThreshold } from "../game";

export function resetReducer(
  state: GameState,
  action: Extract<GameAction, { type: "RESET" }>
): GameReducerResult {
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
