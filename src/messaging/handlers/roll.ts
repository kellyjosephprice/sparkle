import { createDice, getActiveDice, getBankedDice } from "../../game";
import { isSparkle } from "../../scoring";
import { STRINGS } from "../../strings";
import type { GameState } from "../../types";
import type { CommandResult, GameCommand, GameEvent } from "../types";

export function handleRoll(state: GameState): CommandResult {
  if (state.gameOver) {
    return { state, events: [] };
  }

  const rollsInTurn = state.rollsInTurn + 1;
  const activeDice = getActiveDice(state);
  const newDice = createDice(activeDice.length, activeDice);
  const sparkled = isSparkle(newDice, state.scoringRules);

  const message = sparkled
    ? STRINGS.game.sparkleNoScore
    : STRINGS.game.selectAndBank;

  const bankedDice = getBankedDice(state);
  const events: GameEvent[] = [
    { type: "DICE_ROLLED", dice: newDice, sparkled },
  ];

  const newState: GameState = {
    ...state,
    dice: [...bankedDice, ...newDice],
    lastRollSparkled: sparkled,
    message: message,
    rollsInTurn,
  };

  // Handle Guhkle (first roll sparkle)
  if (sparkled && rollsInTurn === 1) {
    newState.message = STRINGS.game.guhkleTriggered;
    newState.isGuhkleAttempt = true;
    events.push({
      type: "DELAYED_ACTION",
      action: { type: "EXECUTE_GUHKLE_REROLL" },
      delay: 1000,
    });
    return { state: newState, events };
  }

  // Handle Auto Re-roll upgrade via delayed action
  if (sparkled) {
    const autoRerollDie = newDice.find((d) =>
      d.upgrades.some(
        (u) => u.type === "AUTO_REROLL" && (u.remainingUses ?? 0) > 0,
      ),
    );

    if (autoRerollDie) {
      events.push({
        type: "DELAYED_ACTION",
        action: { type: "EXECUTE_AUTO_REROLL", dieId: autoRerollDie.id },
        delay: 600, // Slightly more than animation duration
      });
    }
  }

  return { state: newState, events };
}

export function handleExecuteAutoReroll(
  state: GameState,
  command: Extract<GameCommand, { type: "EXECUTE_AUTO_REROLL" }>,
): CommandResult {
  const dieId = command.dieId;
  const die = state.dice.find((d) => d.id === dieId);

  if (!die || die.banked) return { state, events: [] };

  // Find the upgrade and decrement uses
  const updatedDice = state.dice.map((d) =>
    d.id === dieId
      ? {
          ...d,
          upgrades: d.upgrades.map((u) =>
            u.type === "AUTO_REROLL" && (u.remainingUses ?? 0) > 0
              ? { ...u, remainingUses: u.remainingUses! - 1 }
              : u,
          ),
        }
      : d,
  );

  const activeDice = updatedDice.filter((d) => !d.banked);
  const newDice = createDice(activeDice.length, activeDice);
  const bankedDice = updatedDice.filter((d) => d.banked);
  const sparkled = isSparkle(newDice, state.scoringRules);

  const message = sparkled ? STRINGS.game.autoRerollFailed : STRINGS.game.autoRerollSaved;

  const newState: GameState = {
    ...state,
    dice: [...bankedDice, ...newDice],
    lastRollSparkled: sparkled,
    message,
  };

  return {
    state: newState,
    events: [{ type: "DICE_ROLLED", dice: newDice, sparkled }],
  };
}

export function handleExecuteGuhkleReroll(
  state: GameState,
): CommandResult {
  const activeDice = getActiveDice(state);
  const newDice = createDice(activeDice.length, activeDice);
  const bankedDice = getBankedDice(state);
  const sparkled = isSparkle(newDice, state.scoringRules);

  if (sparkled) {
    // Double Guhkle!
    // Player can still try to re-roll if they have extra dice.
    
    const newState: GameState = {
      ...state,
      dice: [...bankedDice, ...newDice],
      lastRollSparkled: true,
      message: STRINGS.game.guhkleFailed,
      isGuhkleAttempt: false,
    };

    return {
      state: newState,
      events: [
        { type: "DICE_ROLLED", dice: newDice, sparkled: true },
      ],
    };
  }

  // Guhkle saved!
  const newState: GameState = {
    ...state,
    dice: [...bankedDice, ...newDice],
    lastRollSparkled: false,
    message: STRINGS.game.guhkleSaved,
    isGuhkleAttempt: false,
  };

  return {
    state: newState,
    events: [{ type: "DICE_ROLLED", dice: newDice, sparkled: false }],
  };
}
