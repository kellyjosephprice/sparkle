import {
  calculateThreshold,
  createDice,
  STARTING_EXTRA_DICE,
} from "../../game";
import { DEFAULT_RULES } from "../../scoring";
import { STRINGS } from "../../strings";
import type { GameState } from "../../types";
import type { CommandResult } from "../types";

export function handleReset(state: GameState): CommandResult {
  return {
    state: {
      ...state,
      dice: createDice(5),
      bankedScore: 0,
      totalScore: 0,
      threshold: calculateThreshold(1),
      turnNumber: 0,
      rollsInTurn: 0,
      isGuhkleAttempt: false,
      gameOver: false,
      message: STRINGS.game.newGameStarted,
      scoringRules: DEFAULT_RULES,
      lastRollFizzled: false,
      extraDicePool: STARTING_EXTRA_DICE,
      certificationNeededValue: null,
      upgradeOptions: [],
      pendingUpgradeDieSelection: null,
      potentialUpgradePosition: null,
    },
    events: [{ type: "GAME_RESET" }],
  };
}
