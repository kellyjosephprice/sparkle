import { calculateThreshold, createDice } from "../../../src/game";
import type { CommandResult } from "../types";

export function handleReset(): CommandResult {
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
    events: [{ type: "GAME_RESET" }],
  };
}
