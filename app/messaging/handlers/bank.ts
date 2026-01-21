import type { GameState } from "../../types";
import type { GameCommand, CommandResult } from "../types";
import {
  getSelectedDice,
  getSelectedScore,
  getActiveDice,
  createDice,
} from "../../game";

export function handleBank(
  state: GameState,
  command: Extract<GameCommand, { type: "BANK_DICE" }>
): CommandResult {
  const selectedDice = getSelectedDice(state);
  const selectedScore = getSelectedScore(state);

  if (selectedDice.length === 0) {
    return {
      state: { ...state, message: "Select some dice first!" },
      events: [{ type: "ERROR", message: "Select some dice first!" }],
    };
  }

  if (selectedScore === 0) {
    return {
      state: { ...state, message: "Selected dice do not score!" },
      events: [{ type: "ERROR", message: "Selected dice do not score!" }],
    };
  }

  const activeDice = getActiveDice(state);
  const newBankedScore = state.bankedScore + selectedScore;
  const allDiceUsed = activeDice.length === selectedDice.length;

  if (allDiceUsed) {
    // Hot dice: clear banked dice and roll 6 new dice
    const newDice = createDice(6);
    return {
      state: {
        ...state,
        dice: newDice,
        bankedScore: newBankedScore,
        currentScore: state.currentScore + selectedScore,
        message: `Banked ${selectedScore} points! Hot dice! Rolling all 6 dice again...`,
      },
      events: [{ type: "DICE_BANKED", score: selectedScore, hotDice: true }],
    };
  } else {
    // Normal bank: just mark selected dice as banked
    return {
      state: {
        ...state,
        dice: state.dice.map((die) =>
          die.selected ? { ...die, selected: false, banked: true } : die
        ),
        bankedScore: newBankedScore,
        currentScore: state.currentScore + selectedScore,
        message: `Banked ${selectedScore} points! Roll again or end turn.`,
      },
      events: [{ type: "DICE_BANKED", score: selectedScore, hotDice: false }],
    };
  }
}
