import type { Die, GameState, RuleId, UpgradeType } from "../types";

// Commands - what the UI wants to do
export type GameCommand =
  | { type: "TOGGLE_DIE"; dieId: number }
  | { type: "ROLL_DICE" }
  | { type: "RE_ROLL" }
  | { type: "BANK_DICE" }
  | { type: "SELECT_ALL" }
  | { type: "END_TURN"; isSparkled?: boolean }
  | { type: "RESET_GAME" }
  | { type: "TOGGLE_SCORING_RULE"; ruleId: RuleId }
  | { type: "RESET_SCORING_RULE_COUNTS" }
  | { type: "SELECT_UPGRADE"; upgradeType: UpgradeType }
  | { type: "APPLY_UPGRADE"; position: number }
  | { type: "DISCARD_UNSCORED" }
  | { type: "ADD_EXTRA_DIE" }
  | { type: "EXECUTE_AUTO_REROLL"; dieId: number };

// Events - what happened in the game
export type GameEvent =
  | { type: "DIE_TOGGLED"; dieId: number }
  | { type: "DICE_ROLLED"; dice: Die[]; sparkled: boolean }
  | { type: "DICE_REROLLED"; dice: Die[] }
  | { type: "DICE_BANKED"; score: number; hotDice: boolean }
  | { type: "TURN_ENDED"; totalScore: number; gameOver: boolean; sparkled: boolean }
  | { type: "GAME_RESET" }
  | { type: "ERROR"; message: string }
  | { type: "DELAYED_ACTION"; action: GameCommand; delay: number }
  | { type: "UPGRADE_SELECTED"; upgradeType: UpgradeType }
  | { type: "UPGRADE_APPLIED"; position: number; upgradeType: UpgradeType };

// Result of processing a command
export interface CommandResult {
  state: GameState;
  events: GameEvent[];
}

// Event handler type
export type EventHandler = (event: GameEvent) => void;
