import type { GameState } from "../types";
import type { GameCommand, CommandResult } from "./types";
import {
  handleToggleDie,
  handleRoll,
  handleBank,
  handleEndTurn,
  handleReset,
} from "./handlers";
import { eventBus } from "./eventBus";

export class GameEngine {
  processCommand(state: GameState, command: GameCommand): CommandResult {
    let result: CommandResult;

    switch (command.type) {
      case "TOGGLE_DIE":
        result = handleToggleDie(state, command);
        break;

      case "ROLL_DICE":
        result = handleRoll(state, command);
        break;

      case "BANK_DICE":
        result = handleBank(state, command);
        break;

      case "END_TURN":
        result = handleEndTurn(state, command);
        break;

      case "RESET_GAME":
        result = handleReset(state, command);
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
