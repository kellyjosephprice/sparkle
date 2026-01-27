import { createDice, getActiveDice, getBankedDice } from "../../game";
import { isSparkle } from "../../scoring";
import type { GameState } from "../../types";
import type { CommandResult, GameEvent } from "../types";

export function handleRoll(state: GameState): CommandResult {
  if (state.gameOver) {
    return { state, events: [] };
  }

  const activeDice = getActiveDice(state);
  const newDice = createDice(activeDice.length, activeDice);
  const bankedDice = getBankedDice(state);
  const sparkled = isSparkle(newDice, state.scoringRules);

  const newState: GameState = {
    ...state,
    dice: [...bankedDice, ...newDice],
    lastRollSparkled: sparkled,
    message: sparkled
      ? "💥 SPARKLE! No scoring dice! Use a re-roll or end turn."
      : "Select scoring dice and bank them, or roll again!",
  };

  const events: GameEvent[] = [
    { type: "DICE_ROLLED", dice: newDice, sparkled },
  ];

  return { state: newState, events };
}
