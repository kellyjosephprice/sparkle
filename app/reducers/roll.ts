import type { GameState, GameAction, GameReducerResult } from "../types";
import { createDice, getActiveDice, getBankedDice } from "../game";
import { isSparkle } from "../scoring";

export function rollReducer(
  state: GameState,
  action: Extract<GameAction, { type: "ROLL" }>
): GameReducerResult {
  if (state.gameOver) {
    return { state };
  }

  const activeDice = getActiveDice(state);
  const newDice = createDice(activeDice.length);
  const bankedDice = getBankedDice(state);

  // Check for sparkle
  if (isSparkle(newDice)) {
    return {
      state: {
        ...state,
        dice: [...bankedDice, ...newDice],
        message: "💥 SPARKLE! You lost all points this turn!",
      },
      delayedAction: {
        type: "END_TURN",
        delay: 2000,
        isSparkled: true,
      },
    };
  }

  return {
    state: {
      ...state,
      dice: [...bankedDice, ...newDice],
      message: "Select scoring dice and bank them, or roll again!",
    },
  };
}
