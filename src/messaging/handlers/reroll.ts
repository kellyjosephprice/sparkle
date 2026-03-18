import {
  createDice,
  getActiveDice,
  getBankedDice,
  getStagedDice,
} from "@/src/game";
import { isFizzle } from "@/src/game/scoring";
import type { GameState } from "@/src/game/types";
import { STRINGS } from "@/src/strings";

import type { CommandResult } from "../types";

export function handleReRoll(state: GameState): CommandResult {
  // Validation: Game must not be over
  if (state.gameOver) {
    return { state, events: [] };
  }

  const activeDice = getActiveDice(state);
  // We want to re-roll unstaged dice. Staged dice are safe.
  const activeUnstagedDice = activeDice.filter((d) => !d.staged);

  if (activeUnstagedDice.length === 0) {
    return { state, events: [] };
  }

  // Calculate how many dice we can re-roll
  const extraDiceAvailable = state.extraDicePool;

  if (extraDiceAvailable <= 0) {
    return {
      state: { ...state, message: STRINGS.errors.noExtraDice },
      events: [{ type: "ERROR", message: STRINGS.errors.noExtraDice }],
    };
  }

  // Prioritize Spark for re-rolling
  const sortedActiveUnstaged = [...activeUnstagedDice].sort((a, b) => {
    if (a.value === "spark") return -1;
    if (b.value === "spark") return 1;
    return 0;
  });

  const numToReroll = Math.min(activeUnstagedDice.length, extraDiceAvailable);
  const diceToReroll = sortedActiveUnstaged.slice(0, numToReroll);
  const diceToKeep = sortedActiveUnstaged.slice(numToReroll);

  const cost = numToReroll;

  // Create new dice for the ones being re-rolled
  const newRolledDice = createDice(diceToReroll.length, diceToReroll);

  // Combine: Banked + Staged + Kept + New Rolled
  const stagedDice = getStagedDice(state);
  const bankedDice = getBankedDice(state);

  const currentActiveDice = [...stagedDice, ...diceToKeep, ...newRolledDice];
  const fizzled = isFizzle(currentActiveDice, state.scoringRules);

  const newExtraDicePool = extraDiceAvailable - cost;

  const allNewDice = [
    ...bankedDice,
    ...stagedDice,
    ...diceToKeep,
    ...newRolledDice,
  ];

  const message = fizzled
    ? STRINGS.game.fizzleStillFizzled(newExtraDicePool)
    : STRINGS.game.rerollsRemaining(newExtraDicePool);

  const newState: GameState = {
    ...state,
    dice: allNewDice,
    extraDicePool: newExtraDicePool,
    lastRollFizzled: fizzled,
    message: message,
  };

  // Clear certification if we were in it and now we have a score
  if (state.certificationNeededValue !== null && !fizzled) {
    newState.certificationNeededValue = null;
  }

  return {
    state: newState,
    events: [{ type: "DICE_REROLLED", dice: newRolledDice }],
  };
}
