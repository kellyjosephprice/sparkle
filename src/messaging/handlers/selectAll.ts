import { getActiveDice } from "@/src/game";
import { calculateScore } from "@/src/game/scoring";
import type { GameState } from "@/src/game/types";

import type { CommandResult } from "../types";

export function handleSelectAll(state: GameState): CommandResult {
  if (state.gameOver) {
    return { state, events: [] };
  }

  const activeDice = getActiveDice(state);
  const { scoredDice } = calculateScore(activeDice, state.scoringRules);
  const scoredIds = new Set(scoredDice.map((d) => d.id));

  const newState: GameState = {
    ...state,
    dice: state.dice.map((die) =>
      scoredIds.has(die.id) ? { ...die, staged: true } : die,
    ),
    message: "",
  };

  return {
    state: newState,
    events: [],
  };
}
