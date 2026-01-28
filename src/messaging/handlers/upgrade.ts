import type { GameState } from "../../types";
import type { CommandResult, GameCommand } from "../types";

export function handleSelectUpgrade(
  state: GameState,
  command: Extract<GameCommand, { type: "SELECT_UPGRADE" }>,
): CommandResult {
  if (command.upgradeType === "ADDITIONAL_REROLL") {
    return {
      state: {
        ...state,
        rerollsAvailable: state.rerollsAvailable + 1,
        upgradeModalOpen: false,
        upgradeOptions: [],
        message: "Bonus re-roll added!",
      },
      events: [{ type: "UPGRADE_SELECTED", upgradeType: "ADDITIONAL_REROLL" }],
    };
  }

  return {
    state: {
      ...state,
      upgradeModalOpen: false,
      upgradeOptions: [],
      pendingUpgradeDieSelection: command.upgradeType,
      message: "Select a die to apply the upgrade to.",
    },
    events: [{ type: "UPGRADE_SELECTED", upgradeType: command.upgradeType }],
  };
}

export function handleApplyUpgrade(
  state: GameState,
  command: Extract<GameCommand, { type: "APPLY_UPGRADE" }>,
): CommandResult {
  if (!state.pendingUpgradeDieSelection) {
    return { state, events: [] };
  }

  const upgradeType = state.pendingUpgradeDieSelection;
  const newState = {
    ...state,
    dice: state.dice.map((die) =>
      die.position === command.position
        ? {
            ...die,
            upgrades: [
              ...die.upgrades,
              { type: upgradeType, id: `upgrade-${Date.now()}` },
            ],
          }
        : die,
    ),
    pendingUpgradeDieSelection: null,
    message: "Upgrade applied!",
  };

  return {
    state: newState,
    events: [
      {
        type: "UPGRADE_APPLIED",
        position: command.position,
        upgradeType: upgradeType,
      },
    ],
  };
}
