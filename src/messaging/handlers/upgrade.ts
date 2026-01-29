import { STRINGS } from "../../strings";
import type { GameState } from "../../types";
import type { CommandResult, GameCommand } from "../types";

export function handleSelectUpgrade(
  state: GameState,
  command: Extract<GameCommand, { type: "SELECT_UPGRADE" }>,
): CommandResult {
  const upgradeType = command.upgradeType;
  const position = state.potentialUpgradePosition;

  if (upgradeType === "ADDITIONAL_REROLL") {
    return {
      state: {
        ...state,
        rerollsAvailable: state.rerollsAvailable + 1,
        upgradeOptions: [],
        potentialUpgradePosition: null,
        message: STRINGS.game.bonusRerollAdded,
      },
      events: [{ type: "UPGRADE_SELECTED", upgradeType: "ADDITIONAL_REROLL" }],
    };
  }

  if (position === null) {
    return { state, events: [] };
  }

  const newState = {
    ...state,
    dice: state.dice.map((die) =>
      die.position === position
        ? {
            ...die,
            upgrades: [
              ...die.upgrades,
              {
                type: upgradeType,
                id: `upgrade-${Date.now()}`,
                remainingUses:
                  upgradeType === "AUTO_REROLL" ||
                  upgradeType === "TEN_X_MULTIPLIER"
                    ? 3
                    : undefined,
              },
            ],
          }
        : die,
    ),
    upgradeOptions: [],
    potentialUpgradePosition: null,
    message: STRINGS.game.upgradeApplied,
  };

  return {
    state: newState,
    events: [
      {
        type: "UPGRADE_APPLIED",
        position: position,
        upgradeType: upgradeType,
      },
    ],
  };
}

export function handleApplyUpgrade(state: GameState): CommandResult {
  // This is now handled in handleSelectUpgrade as the position is pre-selected
  return { state, events: [] };
}
