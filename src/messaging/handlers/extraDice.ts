import { createDice } from "../../game";
import { isSparkle } from "../../scoring";
import { STRINGS } from "../../strings";
import type { GameState } from "../../types";
import type { CommandResult } from "../types";

export function handleDiscardUnscored(
  state: GameState,
): CommandResult {
  if (!state.lastRollSparkled) {
    return {
      state: { ...state, message: STRINGS.errors.onlyDiscardAfterSparkle },
      events: [{ type: "ERROR", message: STRINGS.errors.onlyDiscardAfterSparkle }],
    };
  }

  // Remove ALL non-banked dice permanently
  // Convert banked dice into active dice for a re-roll
  const bankedDice = state.dice.filter((d) => d.banked);
  
  if (bankedDice.length === 0) {
      return {
          state: {
              ...state,
              dice: [],
              message: STRINGS.game.turnOver(state.bankedScore),
              lastRollSparkled: true, // Still stuck if no dice left to roll
          },
          events: [],
      };
  }

  // Re-roll the formerly banked dice
  const rolledDice = createDice(bankedDice.length, bankedDice);
  const sparkled = isSparkle(rolledDice, state.scoringRules);

  const newState: GameState = {
    ...state,
    dice: rolledDice,
    lastRollSparkled: sparkled,
    message: sparkled ? STRINGS.game.sparkleStillSparkled(state.rerollsAvailable) : STRINGS.game.discardSuccess,
  };

  return {
    state: newState,
    events: [{ type: "DICE_ROLLED", dice: rolledDice, sparkled }],
  };
}

export function handleAddExtraDie(
  state: GameState,
): CommandResult {
  if (state.extraDicePool <= 0) {
    return {
      state: { ...state, message: STRINGS.errors.noExtraDice },
      events: [{ type: "ERROR", message: STRINGS.errors.noExtraDice }],
    };
  }

  if (state.dice.length >= 6) {
    return {
      state: { ...state, message: STRINGS.errors.boardFull },
      events: [{ type: "ERROR", message: STRINGS.errors.boardFull }],
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
      message: sparkled ? STRINGS.game.addDieSparkle : STRINGS.game.addDieHelp,
    },
    events: [],
  };
}
