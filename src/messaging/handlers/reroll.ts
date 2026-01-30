import { createDice, getActiveDice, getBankedDice, getStagedDice } from "../../game";
import { isSparkle } from "../../scoring";
import { STRINGS } from "../../strings";
import type { Die, GameState } from "../../types";
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
  const diceCount = activeUnstagedDice.length;
  const extraDiceAvailable = state.extraDicePool;
  
  if (extraDiceAvailable <= 0) {
     return {
      state: { ...state, message: STRINGS.errors.noExtraDice },
      events: [{ type: "ERROR", message: STRINGS.errors.noExtraDice }],
    };
  }

  const numToReroll = Math.min(diceCount, extraDiceAvailable);
  const cost = numToReroll;

  // Select dice to re-roll
  let diceToReroll: Die[] = [];
  let diceToKeep: Die[] = [];

  if (numToReroll === diceCount) {
    // Re-roll all
    diceToReroll = activeUnstagedDice;
  } else {
    // Randomly select subset
    // Shuffle activeUnstagedDice
    const shuffled = [...activeUnstagedDice].sort(() => Math.random() - 0.5);
    diceToReroll = shuffled.slice(0, numToReroll);
    diceToKeep = shuffled.slice(numToReroll);
  }

  // Create new dice for the ones being re-rolled
  // We pass diceToReroll to createDice to preserve positions/upgrades of those specific dice
  const newRolledDice = createDice(diceToReroll.length, diceToReroll);
  
  // Combine: Banked + Staged + Kept (Unstaged) + New Rolled (Unstaged)
  const stagedDice = getStagedDice(state);
  const bankedDice = getBankedDice(state);
  
  // The new active dice pool for scoring check includes Staged + Kept + NewRolled
  // Wait, isSparkle checks the passed dice. Usually we check ALL active dice.
  // But if I staged some, they are scoring. So the combined set definitely has score.
  // Sparkle usually only matters if I have NO scoring dice.
  // If I have staged dice, I am safe from Sparkle.
  // If I have NO staged dice (e.g. bust), then we check the new combined set (Kept + NewRolled).
  
  const currentActiveDice = [...stagedDice, ...diceToKeep, ...newRolledDice];
  const sparkled = isSparkle(currentActiveDice, state.scoringRules);

  const newExtraDicePool = extraDiceAvailable - cost;

  // Re-assemble all dice
  // We need to ensure the order/positions are correct or at least unique IDs are preserved.
  // createDice generates new IDs? No, it uses nextDieId++.
  // But we want to preserve the IDs of the KEPT dice.
  
  const allNewDice = [...bankedDice, ...stagedDice, ...diceToKeep, ...newRolledDice];
  // Sort by position to keep UI stable? Dice component handles positioning by `die.position`.
  
  const message = sparkled
    ? STRINGS.game.sparkleNoScore
    : STRINGS.game.rerollsRemaining(newExtraDicePool).replace("re-roll(s) remaining", "Extra Dice left"); 
    // TODO: Update string to reflect Extra Dice concept properly

  return {
    state: {
      ...state,
      dice: allNewDice,
      extraDicePool: newExtraDicePool,
      lastRollSparkled: sparkled,
      message: message,
    },
    events: [{ type: "DICE_REROLLED", dice: newRolledDice }],
  };
}

