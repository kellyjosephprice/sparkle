import type { GameState } from "../types";
import { eventBus } from "./eventBus";
import {
  handleApplyUpgrade,
  handleBank,
  handleEndTurn,
  handleReRoll,
  handleReset,
  handleResetRuleCounts,
  handleRoll,
  handleSelectAll,
  handleSelectUpgrade,
  handleToggleDie,
  handleToggleRule,
  handleAddExtraDie,
  handleDiscardDie,
} from "./handlers";
import type { CommandResult, GameCommand } from "./types";

export class GameEngine {
  processCommand(state: GameState, command: GameCommand): CommandResult {
    let result: CommandResult;

    switch (command.type) {
      case "TOGGLE_DIE":
        result = handleToggleDie(state, command);
        break;

      case "ROLL_DICE":
        result = handleRoll(state);
        break;

      case "RE_ROLL":
        result = handleReRoll(state);
        break;

      case "BANK_DICE":
        result = handleBank(state);
        break;

      case "SELECT_ALL":
        result = handleSelectAll(state);
        break;

      case "END_TURN":
        result = handleEndTurn(state, command);
        break;

      case "RESET_GAME":
        result = handleReset(state);
        break;

      case "TOGGLE_SCORING_RULE":
        result = handleToggleRule(state, command);
        break;

      case "RESET_SCORING_RULE_COUNTS":
        result = handleResetRuleCounts(state);
        break;

      case "SELECT_UPGRADE":
        result = handleSelectUpgrade(state, command);
        break;

      case "APPLY_UPGRADE":
        result = handleApplyUpgrade(state);
        break;

      case "DISCARD_DIE":
        result = handleDiscardDie(state, command);
        break;

      case "ADD_EXTRA_DIE":
        result = handleAddExtraDie(state);
        break;

      default:
        result = { state, events: [] };
    }

    // Emit all events
    eventBus.emitAll(result.events);

    return result;
  }
}

export const gameEngine = new GameEngine();
