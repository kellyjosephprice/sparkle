import { createDice, getActiveDice, getBankedDice } from "../../game";
import { isSparkle } from "../../scoring";
import { STRINGS } from "../../strings";
import type { GameState } from "../../types";
import type { CommandResult } from "../types";

export function handleReRoll(state: GameState): CommandResult {
  // Validation: Must have re-rolls available
  if (state.rerollsAvailable <= 0) {
    return {
      state: { ...state, message: STRINGS.errors.noRerolls },
      events: [{ type: "ERROR", message: STRINGS.errors.noRerolls }],
    };
  }

  // Validation: Game must not be over
  if (state.gameOver) {
    return { state, events: [] };
  }

  // Re-roll active dice (preserves positions)
  const activeDice = getActiveDice(state);
  const newDice = createDice(activeDice.length, activeDice);
  const bankedDice = getBankedDice(state);
  const sparkled = isSparkle(newDice, state.scoringRules);

  const rerollsRemaining = state.rerollsAvailable - 1;

  return {
    state: {
      ...state,
      dice: [...bankedDice, ...newDice],
      rerollsAvailable: rerollsRemaining,
      lastRollSparkled: sparkled,
      message: sparkled
        ? STRINGS.game.sparkleStillSparkled(rerollsRemaining)
        : STRINGS.game.rerollsRemaining(rerollsRemaining),
    },
    events: [{ type: "DICE_REROLLED", dice: newDice }],
  };
}
