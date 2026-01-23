import type { GameState } from "../types";
import { eventBus } from "./eventBus";
import {
  handleBank,
  handleEndTurn,
  handleReset,
  handleResetScoringRuleCounts,
  handleRoll,
  handleToggleDie,
  handleToggleScoringRule,
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

      case "BANK_DICE":
        result = handleBank(state);
        break;

      case "END_TURN":
        result = handleEndTurn(state, command);
        break;

      case "RESET_GAME":
        result = handleReset();
        break;

      case "TOGGLE_SCORING_RULE":
        result = handleToggleScoringRule(state, command);
        break;

      case "RESET_SCORING_RULE_COUNTS":
        result = handleResetScoringRuleCounts(state, command);
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
