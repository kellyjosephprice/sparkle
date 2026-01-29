import { createDice, getActiveDice, getBankedDice } from "../../game";
import { isSparkle } from "../../scoring";
import type { Die, GameState } from "../../types";
import type { CommandResult, GameCommand, GameEvent } from "../types";

export function handleRoll(state: GameState): CommandResult {
  if (state.gameOver) {
    return { state, events: [] };
  }

  let activeDice = getActiveDice(state);
  let newDice = createDice(activeDice.length, activeDice);
  let sparkled = isSparkle(newDice, state.scoringRules);

  let message = sparkled
    ? "💥 SPARKLE! No scoring dice! Discard unscored or use a re-roll."
    : "Select scoring dice and bank them, or roll again!";

  const bankedDice = getBankedDice(state);

  let newState: GameState = {
    ...state,
    dice: [...bankedDice, ...newDice],
    lastRollSparkled: sparkled,
    message: message,
  };

  const events: GameEvent[] = [
    { type: "DICE_ROLLED", dice: newDice, sparkled },
  ];

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

  const message = `🔄 Auto Re-roll used! ${sparkled ? "Still sparkled! 💥" : "Saved!"}`;

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
