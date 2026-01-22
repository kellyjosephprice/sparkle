import type { GameAction, GameReducerResult, GameState } from "../types";

export function toggleDieReducer(
  state: GameState,
  action: Extract<GameAction, { type: "TOGGLE_DIE" }>
): GameReducerResult {
  if (state.gameOver) {
    return { state };
  }

  const newState: GameState = {
    ...state,
    dice: state.dice.map((die) =>
      die.id === action.dieId && !die.banked
        ? { ...die, selected: !die.selected }
        : die
    ),
    message: "",
  };

  return { state: newState };
}
