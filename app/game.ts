import type {
  Die,
  DieValue,
  GameState,
  GameAction,
  GameReducerResult,
} from "./types";
import { calculateScore, isSparkle } from "./scoring";

export const BASE_THRESHOLD = 100;

// Utility/Selector Functions

export function calculateThreshold(turnNumber: number): number {
  return BASE_THRESHOLD * Math.pow(2, turnNumber - 1);
}

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
  const selectedScore = getSelectedScore(state);

  // Can only roll if you have selected dice that score (will be auto-banked)
  return activeDice.length > 0 && !state.gameOver && selectedScore > 0;
}

export function canBank(state: GameState): boolean {
  const selectedDice = getSelectedDice(state);
  const selectedScore = getSelectedScore(state);

  return selectedDice.length > 0 && selectedScore > 0 && !state.gameOver;
}

export function canEndTurn(state: GameState): boolean {
  const selectedScore = getSelectedScore(state);

  // Can end turn if there are points to bank (either already banked or selected)
  return !state.gameOver && (state.bankedScore > 0 || selectedScore > 0);
}

// Game Reducer

export function gameReducer(
  state: GameState,
  action: GameAction,
): GameReducerResult {
  switch (action.type) {
    case "TOGGLE_DIE": {
      if (state.gameOver) {
        return { state };
      }

      const newState: GameState = {
        ...state,
        dice: state.dice.map((die) =>
          die.id === action.dieId && !die.banked
            ? { ...die, selected: !die.selected }
            : die,
        ),
        message: "",
      };

      return { state: newState };
    }

    case "ROLL": {
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
            type: "END_TURN",
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

    case "BANK": {
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

    case "END_TURN": {
      const selectedScore = getSelectedScore(state);
      const totalTurnScore = action.isSparkled
        ? 0
        : state.currentScore + selectedScore;

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

        // Check if threshold is met
        if (totalTurnScore < state.threshold) {
          return {
            state: {
              ...state,
              message: `Need ${state.threshold} points to end turn. You only scored ${totalTurnScore}. Keep rolling!`,
            },
          };
        }
      }

      const newTotalScore = state.totalScore + totalTurnScore;
      const gameOver = action.isSparkled || false;
      const nextTurnNumber = state.turnNumber + 1;
      const nextThreshold = calculateThreshold(nextTurnNumber);

      let message = "";
      if (action.isSparkled) {
        message = `💥 Game Over! Final score: ${newTotalScore}`;
      } else {
        message = `Turn over! You scored ${totalTurnScore} points!`;
      }

      // Create new dice for next turn (if not game over)
      const newDice = gameOver ? state.dice : createDice(6);

      // Check if new turn dice sparkle
      if (!gameOver && isSparkle(newDice)) {
        return {
          state: {
            dice: newDice,
            currentScore: 0,
            bankedScore: 0,
            totalScore: newTotalScore,
            threshold: nextThreshold,
            turnNumber: nextTurnNumber,
            gameOver: false,
            message: `Turn over! You scored ${totalTurnScore} points!`,
          },
          delayedAction: {
            type: "END_TURN",
            delay: 2000,
            isSparkled: true,
          },
        };
      }

      return {
        state: {
          dice: newDice,
          currentScore: 0,
          bankedScore: 0,
          totalScore: newTotalScore,
          threshold: nextThreshold,
          turnNumber: nextTurnNumber,
          gameOver,
          message,
        },
      };
    }

    case "RESET": {
      return {
        state: {
          dice: createDice(6),
          currentScore: 0,
          bankedScore: 0,
          totalScore: 0,
          threshold: calculateThreshold(1),
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
