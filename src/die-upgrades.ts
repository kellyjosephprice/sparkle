import { STRINGS } from "./strings";

export type UpgradeType =
  | "BANKED_SCORE_MULTIPLIER" // 2x when banked and more are banked
  | "BANKED_SCORE_BONUS" // 100+ when banked and more are banked
  | "EXTRA_DIE" // +1 Extra Die
  | "AUTO_REROLL" // 3x Auto re-roll on sparkle
  | "SET_BONUS"; // 2x multiplier for each die with this upgrade in a scoring set

export interface UpgradeConfig {
  type: UpgradeType;
  description: string;
  label: string; // Short label for UI
  defaultValue?: number; // For bonuses like +100
  multiplier?: number; // For multipliers like 2x, 10x
  uses?: number; // Default number of uses
  requiresBanked?: boolean; // If true, applies when banked
}

export const DIE_UPGRADES: Record<UpgradeType, UpgradeConfig> = {
  BANKED_SCORE_MULTIPLIER: {
    type: "BANKED_SCORE_MULTIPLIER",
    description: STRINGS.upgrades.descriptions.bankedMultiplier,
    label: STRINGS.upgrades.labels.bankedMultiplier,
    multiplier: 2,
    requiresBanked: true,
  },
  BANKED_SCORE_BONUS: {
    type: "BANKED_SCORE_BONUS",
    description: STRINGS.upgrades.descriptions.bankedBonus,
    label: STRINGS.upgrades.labels.bankedBonus,
    defaultValue: 100,
    requiresBanked: true,
  },
  EXTRA_DIE: {
    type: "EXTRA_DIE",
    description: STRINGS.upgrades.descriptions.extraDie,
    label: STRINGS.upgrades.labels.extraDie,
  },
  AUTO_REROLL: {
    type: "AUTO_REROLL",
    description: STRINGS.upgrades.descriptions.autoReroll,
    label: STRINGS.upgrades.labels.autoReroll,
    uses: 3,
  },
  SET_BONUS: {
    type: "SET_BONUS",
    description: STRINGS.upgrades.descriptions.setBonus,
    label: STRINGS.upgrades.labels.setBonus,
  },
};

export interface DieUpgrade {
  type: UpgradeType;
  id: string;
  remainingUses?: number;
}

export interface UpgradeOption {
  type: UpgradeType;
  description: string;
}
