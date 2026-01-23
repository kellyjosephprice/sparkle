import { calculateScore, DEFAULT_RULES } from "./scoring";
import type { Die, DieValue, GameState } from "./types";

export const BASE_THRESHOLD = 100;

export const initialState: GameState = {
  dice: [],
  currentScore: 0,
  bankedScore: 0,
  totalScore: 0,
  threshold: calculateThreshold(1),
  thresholdLevel: 1,
  turnNumber: 1,
  gameOver: false,
  message: "Roll the dice to start!",
  scoringRules: DEFAULT_RULES,
};

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
  return calculateScore(getSelectedDice(state), state.scoringRules);
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
