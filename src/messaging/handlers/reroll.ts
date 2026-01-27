import { createDice, getActiveDice, getBankedDice } from "../../game";
import { isSparkle } from "../../scoring";
import type { GameState } from "../../types";
import type { CommandResult } from "../types";

export function handleReRoll(state: GameState): CommandResult {
  // Validation: Must have re-rolls available
  if (state.rerollsAvailable <= 0) {
    return {
      state: { ...state, message: "No re-rolls available!" },
      events: [{ type: "ERROR", message: "No re-rolls available!" }],
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
        ? `💥 SPARKLE! Re-rolled into a sparkle! ${rerollsRemaining} re-roll(s) left.`
        : `Re-rolled! ${rerollsRemaining} re-roll(s) remaining.`,
    },
    events: [{ type: "DICE_REROLLED", dice: newDice }],
  };
}
