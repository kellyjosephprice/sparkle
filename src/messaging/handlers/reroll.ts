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

  // Calculate cost and how many dice we can re-roll
  const extraDiceAvailable = state.extraDicePool;

  if (extraDiceAvailable <= 0) {
    return {
      state: { ...state, message: STRINGS.errors.noExtraDice },
      events: [{ type: "ERROR", message: STRINGS.errors.noExtraDice }],
    };
  }

  // Cost is 1 extra die per re-roll of any number of dice?
  // No, the previous logic was cost = activeUnstagedDice.length.
  // I will stick to cost = 1 per die for now as it makes more sense with "Extra Dice Pool".
  const cost = activeUnstagedDice.length;
  if (cost > extraDiceAvailable) {
    return {
      state: { ...state, message: STRINGS.errors.noExtraDice },
      events: [{ type: "ERROR", message: STRINGS.errors.noExtraDice }],
    };
  }

  // Create new dice for the ones being re-rolled
  const newRolledDice = createDice(
    activeUnstagedDice.length,
    activeUnstagedDice,
  );

  // Combine: Banked + Staged + Kept (Unstaged - none) + New Rolled (Unstaged)
  const stagedDice = getStagedDice(state);
  const bankedDice = getBankedDice(state);

  const currentActiveDice = [...stagedDice, ...newRolledDice];
  const fizzled = isFizzle(currentActiveDice, state.scoringRules);

  const newExtraDicePool = extraDiceAvailable - cost;

  const allNewDice = [...bankedDice, ...stagedDice, ...newRolledDice];

  const message = fizzled
    ? STRINGS.game.fizzleNoScore
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
