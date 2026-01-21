import type { GameState } from "../../types";
import type { GameCommand, CommandResult } from "../types";
import { createDice, calculateThreshold } from "../../game";

export function handleReset(
  state: GameState,
  command: Extract<GameCommand, { type: "RESET_GAME" }>
): CommandResult {
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
