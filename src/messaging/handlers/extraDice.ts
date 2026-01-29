import { createDice } from "../../game";
import { isSparkle } from "../../scoring";
import type { GameState } from "../../types";
import type { CommandResult } from "../types";

export function handleDiscardUnscored(
  state: GameState,
): CommandResult {
  if (!state.lastRollSparkled) {
    return {
      state: { ...state, message: "You can only discard dice after a sparkle!" },
      events: [{ type: "ERROR", message: "You can only discard dice after a sparkle!" }],
    };
  }

  // Remove ALL non-banked dice
  const remainingDice = state.dice.filter((d) => d.banked);
  
  return {
    state: {
      ...state,
      dice: remainingDice,
      message: "Discarded all unscored dice. Add extra dice to continue!",
      lastRollSparkled: false, // Clearing sparkle state as we discarded the offending dice
    },
    events: [],
  };
}

export function handleAddExtraDie(
  state: GameState,
): CommandResult {
  if (state.extraDicePool <= 0) {
    return {
      state: { ...state, message: "No extra dice available!" },
      events: [{ type: "ERROR", message: "No extra dice available!" }],
    };
  }

  if (state.dice.length >= 6) {
    return {
      state: { ...state, message: "Board is already full!" },
      events: [{ type: "ERROR", message: "Board is already full!" }],
    };
  }

  // Find an available position
  const usedPositions = state.dice.map(d => d.position);
  let position = 1;
  for (let i = 1; i <= 6; i++) {
    if (!usedPositions.includes(i)) {
      position = i;
      break;
    }
  }

  const newDie = createDice(1)[0];
  newDie.position = position;
  newDie.banked = false;
  newDie.staged = false;

  const newDicePool = [...state.dice, newDie];
  const activeDice = newDicePool.filter(d => !d.banked);
  const sparkled = isSparkle(activeDice, state.scoringRules);

  return {
    state: {
      ...state,
      dice: newDicePool,
      extraDicePool: state.extraDicePool - 1,
      lastRollSparkled: sparkled,
      message: sparkled ? "Added a die, but still no score!" : "Added a die! It might help.",
    },
    events: [],
  };
}
