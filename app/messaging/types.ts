import type { GameState, Die } from "../types";

// Commands - what the UI wants to do
export type GameCommand =
  | { type: "TOGGLE_DIE"; dieId: number }
  | { type: "ROLL_DICE" }
  | { type: "BANK_DICE" }
  | { type: "END_TURN"; isSparkled?: boolean }
  | { type: "RESET_GAME" };

// Events - what happened in the game
export type GameEvent =
  | { type: "DIE_TOGGLED"; dieId: number }
  | { type: "DICE_ROLLED"; dice: Die[]; sparkled: boolean }
  | { type: "DICE_BANKED"; score: number; hotDice: boolean }
  | { type: "TURN_ENDED"; totalScore: number; gameOver: boolean; sparkled: boolean }
  | { type: "GAME_RESET" }
  | { type: "ERROR"; message: string }
  | { type: "DELAYED_ACTION"; action: GameCommand; delay: number };

// Result of processing a command
export interface CommandResult {
  state: GameState;
  events: GameEvent[];
}

// Event handler type
export type EventHandler = (event: GameEvent) => void;
