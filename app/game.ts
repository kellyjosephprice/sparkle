import type { Die, DieValue, GameState, GameAction, GameReducerResult } from "./types";
import { calculateScore, isSparkle } from "./scoring";

export const WINNING_SCORE = 10000;
export const MIN_SCORE_TO_GET_ON_BOARD = 500;

// Utility/Selector Functions

export function createDice(count: number): Die[] {
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    value: (Math.floor(Math.random() * 6) + 1) as DieValue,
    selected: false,
    banked: false,
  }));
}

export function getActiveDice(state: GameState): Die[] {
  return state.dice.filter((d) => !d.banked);
}

export function getBankedDice(state: GameState): Die[] {
  return state.dice.filter((d) => d.banked);
}

export function getSelectedDice(state: GameState): Die[] {
  return state.dice.filter((d) => d.selected && !d.banked);
}

export function getSelectedScore(state: GameState): number {
  return calculateScore(getSelectedDice(state));
}

// Validation Functions

export function canRoll(state: GameState): boolean {
  const activeDice = getActiveDice(state);
  const selectedDice = getSelectedDice(state);

  return (
    activeDice.length > 0 &&
    selectedDice.length === 0 &&
    !state.gameOver &&
    state.bankedScore > 0
  );
}

export function canBank(state: GameState): boolean {
  const selectedDice = getSelectedDice(state);
  const selectedScore = getSelectedScore(state);

  return selectedDice.length > 0 && selectedScore > 0 && !state.gameOver;
}

export function canEndTurn(state: GameState): boolean {
  const selectedScore = getSelectedScore(state);

  return (
    !state.gameOver &&
    (state.bankedScore > 0 || selectedScore > 0) &&
    selectedScore === 0
  );
}

// Game Reducer

export function gameReducer(state: GameState, action: GameAction): GameReducerResult {
  switch (action.type) {
    case 'TOGGLE_DIE': {
      if (state.gameOver) {
        return { state };
      }

      const newState: GameState = {
        ...state,
        dice: state.dice.map((die) =>
          die.id === action.dieId && !die.banked
            ? { ...die, selected: !die.selected }
            : die
        ),
        message: "",
      };

      return { state: newState };
    }

    case 'ROLL': {
      if (state.gameOver) {
        return { state };
      }

      const activeDice = getActiveDice(state);
      const newDice = createDice(activeDice.length);
      const bankedDice = getBankedDice(state);

      // Check for sparkle
      if (isSparkle(newDice)) {
        return {
          state: {
            ...state,
            dice: [...bankedDice, ...newDice],
            message: "💥 SPARKLE! You lost all points this turn!",
          },
          delayedAction: {
            type: 'END_TURN',
            delay: 2000,
            isSparkled: true,
          },
        };
      }

      return {
        state: {
          ...state,
          dice: [...bankedDice, ...newDice],
          message: "Select scoring dice and bank them, or roll again!",
        },
      };
    }

    case 'BANK': {
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
              die.selected ? { ...die, selected: false, banked: true } : die
            ),
            bankedScore: newBankedScore,
            currentScore: state.currentScore + selectedScore,
            message: `Banked ${selectedScore} points! Roll again or end turn.`,
          },
        };
      }
    }

    case 'END_TURN': {
      const selectedScore = getSelectedScore(state);

      // Validation (only if not sparkled - sparkle auto-ends turn)
      if (!action.isSparkled) {
        if (state.bankedScore === 0 && selectedScore === 0) {
          return {
            state: {
              ...state,
              message: "You must bank some points before ending your turn!",
            },
          };
        }

        if (selectedScore > 0) {
          return {
            state: {
              ...state,
              message: "Bank your selected dice first!",
            },
          };
        }
      }

      const totalTurnScore = action.isSparkled
        ? 0
        : state.currentScore + selectedScore;
      const newTotalScore = state.totalScore + totalTurnScore;
      const canGetOnBoard =
        !state.isOnBoard && totalTurnScore >= MIN_SCORE_TO_GET_ON_BOARD;
      const nowOnBoard = state.isOnBoard || canGetOnBoard;

      let message = "";
      if (!state.isOnBoard && !canGetOnBoard && totalTurnScore > 0) {
        message = `Need ${MIN_SCORE_TO_GET_ON_BOARD} points to get on the board. You only scored ${totalTurnScore}. Try again!`;
      }

      const finalScore = nowOnBoard ? newTotalScore : state.totalScore;
      const gameOver = action.isSparkled || false;

      if (action.isSparkled) {
        message = `💥 Game Over! Final score: ${finalScore}`;
      } else {
        if (canGetOnBoard) {
          message = `You're on the board! Scored ${totalTurnScore} points!`;
        } else if (nowOnBoard) {
          message = `Turn over! You scored ${totalTurnScore} points!`;
        }
      }

      return {
        state: {
          dice: createDice(6),
          currentScore: 0,
          bankedScore: 0,
          totalScore: finalScore,
          isOnBoard: nowOnBoard,
          turnNumber: state.turnNumber + 1,
          gameOver,
          message,
        },
      };
    }

    case 'RESET': {
      return {
        state: {
          dice: createDice(6),
          currentScore: 0,
          bankedScore: 0,
          totalScore: 0,
          isOnBoard: false,
          turnNumber: 1,
          gameOver: false,
          message: "New game started! Roll the dice!",
        },
      };
    }

    default:
      return { state };
  }
}
