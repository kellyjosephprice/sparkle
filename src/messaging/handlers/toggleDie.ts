import type { GameState } from "../../types";
import type { CommandResult, GameCommand } from "../types";

export function handleToggleDie(
  state: GameState,
  command: Extract<GameCommand, { type: "TOGGLE_DIE" }>
): CommandResult {
  if (state.gameOver) {
    return { state, events: [] };
  }

  const newState: GameState = {
    ...state,
    dice: state.dice.map((die) =>
      die.id === command.dieId && !die.banked
        ? { ...die, selected: !die.selected }
        : die
    ),
    message: "",
  };

  return {
    state: newState,
    events: [{ type: "DIE_TOGGLED", dieId: command.dieId }],
  };
}
