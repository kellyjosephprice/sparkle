import { createDice, getActiveDice, getBankedDice } from "../../game";
import { isSparkle } from "../../scoring";
import type { Die, GameState } from "../../types";
import type { CommandResult, GameEvent } from "../types";

export function handleRoll(state: GameState): CommandResult {
  if (state.gameOver) {
    return { state, events: [] };
  }

  let activeDice = getActiveDice(state);
  let newDice = createDice(activeDice.length, activeDice);
  let sparkled = isSparkle(newDice, state.scoringRules);

  let message = sparkled
    ? "💥 SPARKLE! No scoring dice! Discard a die or use a re-roll."
    : "Select scoring dice and bank them, or roll again!";

  // Handle Auto Re-roll upgrade
  if (sparkled) {
    const autoRerollDie = newDice.find((d) =>
      d.upgrades.some(
        (u) => u.type === "AUTO_REROLL" && (u.remainingUses ?? 0) > 0,
      ),
    );

    if (autoRerollDie) {
      // Find the upgrade and decrement uses
      const updatedDice = newDice.map((d) =>
        d.id === autoRerollDie.id
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

      // Perform the re-roll
      newDice = createDice(activeDice.length, updatedDice);
      sparkled = isSparkle(newDice, state.scoringRules);
      message = `🔄 Auto Re-roll used! ${sparkled ? "Still sparkled! 💥" : "Saved!"}`;
    }
  }

  const bankedDice = getBankedDice(state);

  const newState: GameState = {
    ...state,
    dice: [...bankedDice, ...newDice],
    lastRollSparkled: sparkled,
    message: message,
  };

  const events: GameEvent[] = [
    { type: "DICE_ROLLED", dice: newDice, sparkled },
  ];

  return { state: newState, events };
}
