import { DIE_UPGRADES } from "../../die-upgrades";
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
        extraDicePool: state.extraDicePool + 1,
        upgradeOptions: [],
        potentialUpgradePosition: null,
        message: STRINGS.game.bonusRerollAdded.replace("re-roll", "Extra Die"), // Hacky but works for now
      },
      events: [{ type: "UPGRADE_SELECTED", upgradeType: "ADDITIONAL_REROLL" }],
    };
  }

  if (position === null) {
    return { state, events: [] };
  }

  const config = DIE_UPGRADES[upgradeType];

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
                remainingUses: config.uses,
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
