import { calculateScore, DEFAULT_RULES } from "./scoring";
import type { Die, DieValue, GameState } from "./types";

export const BASE_THRESHOLD = 100;

export const initialState: GameState = {
  bankedScore: 0,
  dice: [],
  gameOver: false,
  highScore: 0,
  lastRollSparkled: false,
  message: "Roll the dice to start!",
  rerollsAvailable: 1,
  scoringRules: DEFAULT_RULES,
  threshold: calculateThreshold(1),
  thresholdLevel: 1,
  totalScore: 0,
  turnNumber: 1,
};

// Utility/Selector Functions

export function calculateThreshold(turnNumber: number): number {
  return (
    BASE_THRESHOLD +
    100 * turnNumber +
    100 * Math.pow(Math.floor(turnNumber / 5), 2)
  );
}

export function createDice(count: number, existingDice?: Die[]): Die[] {
  return Array.from({ length: count }, (_, i) => {
    const existingDie = existingDice?.[i];
    return {
      id: Date.now() + i,
      value: (Math.floor(Math.random() * 6) + 1) as DieValue,
      staged: false,
      banked: false,
      position: existingDie?.position ?? i + 1, // Use existing position or assign new one
    };
  });
}

export function getActiveDice(state: GameState): Die[] {
  return state.dice.filter((d) => !d.banked);
}

export function getBankedDice(state: GameState): Die[] {
  return state.dice.filter((d) => d.banked);
}

export function getStagedDice(state: GameState): Die[] {
  return state.dice.filter((d) => d.staged && !d.banked);
}

export function getStagedScore(state: GameState): number {
  return calculateScore(getStagedDice(state), state.scoringRules).score;
}

// Validation Functions

export function canRoll(state: GameState): boolean {
  const activeDice = getActiveDice(state);
  const stagedScore = getStagedScore(state);

  // Can roll if:
  // 1. Normal roll: Have staged dice that score (will be auto-banked)
  return (
    activeDice.length > 0 &&
    !state.gameOver &&
    !state.lastRollSparkled &&
    stagedScore > 0
  );
}

export function canReRoll(state: GameState): boolean {
  return (
    !state.gameOver &&
    state.rerollsAvailable > 0 &&
    getActiveDice(state).length > 0
  );
}

export function canBank(state: GameState): boolean {
  const stagedDice = getStagedDice(state);
  const stagedScore = getStagedScore(state);

  return stagedDice.length > 0 && stagedScore > 0 && !state.gameOver;
}

export function canEndTurn(state: GameState): boolean {
  const stagedScore = getStagedScore(state);
  const potentialTotalScore =
    state.totalScore + state.bankedScore + stagedScore;

  if (state.gameOver) return false;

  // If sparkled, must be able to end turn (to bust)
  if (state.lastRollSparkled) return true;

  // Otherwise, must have points AND meet threshold
  return (
    (state.bankedScore > 0 || stagedScore > 0) &&
    potentialTotalScore >= state.threshold
  );
}
