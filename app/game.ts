import type {
  Die,
  DieValue,
  GameState,
  GameAction,
  GameReducerResult,
} from "./types";
import { calculateScore, isSparkle } from "./scoring";
import {
  toggleDieReducer,
  rollReducer,
  bankReducer,
  endTurnReducer,
  resetReducer,
} from "./reducers";

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
    case "TOGGLE_DIE":
      return toggleDieReducer(state, action);

    case "ROLL":
      return rollReducer(state, action);

    case "BANK":
      return bankReducer(state, action);

    case "END_TURN":
      return endTurnReducer(state, action);

    case "RESET":
      return resetReducer(state, action);

    default:
      return { state };
  }
}
