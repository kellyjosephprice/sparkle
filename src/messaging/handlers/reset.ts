import { calculateThreshold, createDice, STARTING_REROLLS } from "../../game";
import { DEFAULT_RULES } from "../../scoring";
import type { GameState } from "../../types";
import type { CommandResult } from "../types";

export function handleReset(state: GameState): CommandResult {
  return {
    state: {
      ...state,
      dice: createDice(6),
      bankedScore: 0,
      totalScore: 0,
      threshold: calculateThreshold(1),
      turnNumber: 1,
      gameOver: false,
      message: "New game started! Roll the dice!",
      scoringRules: DEFAULT_RULES,
      rerollsAvailable: STARTING_REROLLS,
      lastRollSparkled: false,
      upgradeOptions: [],
      pendingUpgradeDieSelection: null,
      potentialUpgradePosition: null,
    },
    events: [{ type: "GAME_RESET" }],
  };
}
