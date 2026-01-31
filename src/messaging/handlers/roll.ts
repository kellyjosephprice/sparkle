import { STRINGS } from "@/src//strings";
import { createDice, getActiveDice, getBankedDice } from "@/src/game";
import { isFizzle } from "@/src/game/scoring";
import type { GameState } from "@/src/game/types";

import type { CommandResult, GameCommand, GameEvent } from "../types";

export function handleRoll(state: GameState): CommandResult {
  if (state.gameOver) {
    return { state, events: [] };
  }

  const rollsInTurn = state.rollsInTurn + 1;
  const activeDice = getActiveDice(state);

  // Logic for Certification: "If any of the re-rolled dice have the same value as the set, you must ignore that roll and re-roll."
  let newDice = createDice(activeDice.length, activeDice);
  let ignored = false;
  if (state.certificationNeededValue !== null) {
    while (newDice.some((d) => d.value === state.certificationNeededValue)) {
      ignored = true;
      newDice = createDice(activeDice.length, activeDice);
    }
  }

  const fizzled = isFizzle(newDice, state.scoringRules);

  let message = fizzled
    ? STRINGS.game.fizzleNoScore
    : STRINGS.game.selectAndBank;

  if (ignored) {
    message = STRINGS.game.certificationIgnored + " " + message;
  }

  const bankedDice = getBankedDice(state);
  const events: GameEvent[] = [
    { type: "DICE_ROLLED", dice: newDice, sparkled: fizzled }, // sparkled here means fizzled in the event type
  ];

  const newState: GameState = {
    ...state,
    dice: [...bankedDice, ...newDice],
    lastRollFizzled: fizzled,
    message: message,
    rollsInTurn,
  };

  // If we were certifying and we scored, certification is cleared
  if (state.certificationNeededValue !== null && !fizzled) {
    newState.certificationNeededValue = null;
  }

  // Handle free extra die on fizzle with 5 dice
  if (fizzled && newDice.length === 5) {
    newState.extraDicePool += 1;
    newState.message += " (+1 Extra Die!)";
  }

  // Handle Guhkle (first roll fizzle AND 5 dice)
  if (fizzled && rollsInTurn === 1 && activeDice.length === 5) {
    newState.message = STRINGS.game.guhkleTriggered + " (+1 Extra Die!)";
    newState.isGuhkleAttempt = true;
    events.push({
      type: "DELAYED_ACTION",
      action: { type: "EXECUTE_GUHKLE_REROLL" },
      delay: 1000,
    });
    return { state: newState, events };
  }

  // Handle Auto Re-roll upgrade via delayed action
  if (fizzled) {
    const autoRerollDie = newDice.find((d) =>
      d.upgrades.some(
        (u) => u.type === "AUTO_REROLL" && (u.remainingUses ?? 0) > 0,
      ),
    );

    if (autoRerollDie) {
      events.push({
        type: "DELAYED_ACTION",
        action: { type: "EXECUTE_AUTO_REROLL", dieId: autoRerollDie.id },
        delay: 600,
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
  let newDice = createDice(activeDice.length, activeDice);

  // Re-apply certification ignore logic if applicable
  if (state.certificationNeededValue !== null) {
    while (newDice.some((d) => d.value === state.certificationNeededValue)) {
      newDice = createDice(activeDice.length, activeDice);
    }
  }

  const bankedDice = updatedDice.filter((d) => d.banked);
  const fizzled = isFizzle(newDice, state.scoringRules);

  const message = fizzled
    ? STRINGS.game.autoRerollFailed
    : STRINGS.game.autoRerollSaved;

  const newState: GameState = {
    ...state,
    dice: [...bankedDice, ...newDice],
    lastRollFizzled: fizzled,
    message,
  };

  if (state.certificationNeededValue !== null && !fizzled) {
    newState.certificationNeededValue = null;
  }

  return {
    state: newState,
    events: [{ type: "DICE_ROLLED", dice: newDice, sparkled: fizzled }],
  };
}

export function handleExecuteGuhkleReroll(state: GameState): CommandResult {
  const activeDice = getActiveDice(state);
  let newDice = createDice(activeDice.length, activeDice);

  if (state.certificationNeededValue !== null) {
    while (newDice.some((d) => d.value === state.certificationNeededValue)) {
      newDice = createDice(activeDice.length, activeDice);
    }
  }

  const bankedDice = getBankedDice(state);
  const fizzled = isFizzle(newDice, state.scoringRules);

  if (fizzled) {
    const newState: GameState = {
      ...state,
      dice: [...bankedDice, ...newDice],
      lastRollFizzled: true,
      message: STRINGS.game.guhkleFailed,
      isGuhkleAttempt: false,
    };

    return {
      state: newState,
      events: [{ type: "DICE_ROLLED", dice: newDice, sparkled: true }],
    };
  }

  const newState: GameState = {
    ...state,
    dice: [...bankedDice, ...newDice],
    lastRollFizzled: false,
    message: STRINGS.game.guhkleSaved,
    isGuhkleAttempt: false,
    certificationNeededValue: null,
  };

  return {
    state: newState,
    events: [{ type: "DICE_ROLLED", dice: newDice, sparkled: false }],
  };
}
