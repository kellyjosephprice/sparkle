import { calculateThreshold, createDice } from "../../game";
import { DEFAULT_RULES } from "../../scoring";
import type { GameState } from "../../types";
import type { CommandResult } from "../types";

export function handleReset(state: GameState): CommandResult {
  return {
    state: {
      ...state,
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
    events: [{ type: "GAME_RESET" }],
  };
}
