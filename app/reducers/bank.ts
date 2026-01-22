import {
  createDice,
  getActiveDice,
  getSelectedDice,
  getSelectedScore,
} from "../game";
import type { GameReducerResult, GameState } from "../types";

export function bankReducer(state: GameState): GameReducerResult {
  const selectedDice = getSelectedDice(state);
  const selectedScore = getSelectedScore(state);

  if (selectedDice.length === 0) {
    return {
      state: {
        ...state,
        message: "Select some dice first!",
      },
    };
  }

  if (selectedScore === 0) {
    return {
      state: {
        ...state,
        message: "Selected dice do not score!",
      },
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
    };
  } else {
    // Normal bank: just mark selected dice as banked
    return {
      state: {
        ...state,
        dice: state.dice.map((die) =>
          die.selected ? { ...die, selected: false, banked: true } : die,
        ),
        bankedScore: newBankedScore,
        currentScore: state.currentScore + selectedScore,
        message: `Banked ${selectedScore} points! Roll again or end turn.`,
      },
    };
  }
}
