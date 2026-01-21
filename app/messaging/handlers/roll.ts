import type { GameState } from "../../types";
import type { GameCommand, CommandResult, GameEvent } from "../types";
import { createDice, getActiveDice, getBankedDice } from "../../game";
import { isSparkle } from "../../scoring";

export function handleRoll(
  state: GameState,
  command: Extract<GameCommand, { type: "ROLL_DICE" }>
): CommandResult {
  if (state.gameOver) {
    return { state, events: [] };
  }

  const activeDice = getActiveDice(state);
  const newDice = createDice(activeDice.length);
  const bankedDice = getBankedDice(state);
  const sparkled = isSparkle(newDice);

  const newState: GameState = {
    ...state,
    dice: [...bankedDice, ...newDice],
    message: sparkled
      ? "💥 SPARKLE! You lost all points this turn!"
      : "Select scoring dice and bank them, or roll again!",
  };

  const events: GameEvent[] = [
    { type: "DICE_ROLLED", dice: newDice, sparkled },
  ];

  // If sparkled, emit a delayed action to end turn
  if (sparkled) {
    events.push({
      type: "DELAYED_ACTION",
      action: { type: "END_TURN", isSparkled: true },
      delay: 2000,
    });
  }

  return { state: newState, events };
}
