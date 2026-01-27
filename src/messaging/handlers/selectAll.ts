import type { GameState } from "../../types";
import type { CommandResult } from "../types";

export function handleSelectAll(state: GameState): CommandResult {
  if (state.gameOver) {
    return { state, events: [] };
  }

  const newState: GameState = {
    ...state,
    dice: state.dice.map((die) =>
      !die.banked ? { ...die, staged: true } : die
    ),
    message: "",
  };

  return {
    state: newState,
    events: [],
  };
}
