import { createDice } from "../../game";
import { isSparkle } from "../../scoring";
import type { GameState } from "../../types";
import type { CommandResult, GameCommand } from "../types";

export function handleDiscardDie(
  state: GameState,
  command: Extract<GameCommand, { type: "DISCARD_DIE" }>,
): CommandResult {
  if (!state.lastRollSparkled) {
    return {
      state: { ...state, message: "You can only discard dice after a sparkle!" },
      events: [{ type: "ERROR", message: "You can only discard dice after a sparkle!" }],
    };
  }

  const dieToDiscard = state.dice.find((d) => d.id === command.dieId);
  if (!dieToDiscard || dieToDiscard.banked) {
    return {
      state: { ...state, message: "Invalid die selection." },
      events: [{ type: "ERROR", message: "Invalid die selection." }],
    };
  }

  // Remove the die
  const remainingDice = state.dice.filter((d) => d.id !== command.dieId);
  
  // After discarding, we automatically roll the remaining active dice
  const activeDice = remainingDice.filter(d => !d.banked);
  const bankedDice = remainingDice.filter(d => d.banked);

  if (activeDice.length === 0) {
    return {
      state: { 
        ...state, 
        dice: remainingDice, 
        message: "All active dice discarded. Turn over.",
        lastRollSparkled: true
      },
      events: [],
    };
  }

  const rolledDice = createDice(activeDice.length, activeDice);
  const sparkled = isSparkle(rolledDice, state.scoringRules);

  const message = sparkled
    ? "💥 SPARKLE! Still no scoring dice! Discard another or end turn."
    : "Discarded and re-rolled! Select scoring dice.";

  return {
    state: {
      ...state,
      dice: [...bankedDice, ...rolledDice],
      lastRollSparkled: sparkled,
      message,
    },
    events: [
      { type: "DICE_ROLLED", dice: rolledDice, sparkled }
    ],
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
