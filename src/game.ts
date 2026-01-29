import { calculateScore, DEFAULT_RULES } from "./scoring";
import type { Die, DieValue, GameState } from "./types";

export const BASE_THRESHOLD = 100;
export const STARTING_REROLLS = 2;

export const initialState: GameState = {
  bankedScore: 0,
  dice: [],
  gameOver: false,
  highScore: 0,
  lastRollSparkled: false,
  message: "Roll the dice to start!",
  rerollsAvailable: STARTING_REROLLS,
  scoringRules: DEFAULT_RULES,
  threshold: calculateThreshold(1),
  totalScore: 0,
  turnNumber: 1,
  extraDicePool: 3,
  upgradeOptions: [],
  pendingUpgradeDieSelection: null,
  potentialUpgradePosition: null,
};

// Utility/Selector Functions

export function calculateThreshold(turnNumber: number): number {
  const level = Math.floor(turnNumber / 3);
  if (level === 0) return 100;
  if (level <= 3) return 1000 * level;
  return 10000 * (level - 3);
}

export function getNextThresholdInfo(turnNumber: number): {
  turn: number;
  value: number;
} {
  const currentLevel = Math.floor(turnNumber / 3);
  const nextLevel = currentLevel + 1;
  const nextThresholdTurn = nextLevel * 3;
  return {
    turn: nextThresholdTurn,
    value: 100 * Math.pow(10, nextLevel),
  };
}

export function createDice(count: number, existingDice?: Die[]): Die[] {
  return Array.from({ length: count }, (_, i) => {
    // Find the original die if it exists to preserve position and upgrades
    // If existingDice is provided, we try to match by index but preserve position
    const existingDie = existingDice?.[i];

    return {
      id: Date.now() + i,
      value: (Math.floor(Math.random() * 6) + 1) as DieValue,
      staged: false,
      banked: false,
      position: existingDie?.position ?? i + 1, // Use existing position or assign new one
      upgrades: existingDie?.upgrades ?? [],
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
  const stagedDice = getStagedDice(state);
  const result = calculateScore(stagedDice, state.scoringRules);
  let totalTurnScore = 0;

  if (result.score === 0) return 0;

  // Process each scoring group (set or individual die)
  result.groups.forEach((group) => {
    let groupScore = group.score;
    const isSet = !["single_one", "single_five"].includes(group.ruleId);

    // Apply upgrades from dice in this group
    group.dice.forEach((die) => {
      die.upgrades?.forEach((upgrade) => {
        if (upgrade.type === "SCORE_BONUS") {
          groupScore += 100;
        }
      });
    });

    group.dice.forEach((die) => {
      die.upgrades?.forEach((upgrade) => {
        if (upgrade.type === "SCORE_MULTIPLIER") {
          groupScore *= 2;
        }
        if (
          upgrade.type === "TEN_X_MULTIPLIER" &&
          (upgrade.remainingUses ?? 0) > 0
        ) {
          groupScore *= 10;
        }
      });
    });

    // Apply Set Bonus if it's a set
    if (isSet) {
      let setBonusCount = 0;
      group.dice.forEach((die) => {
        if (die.upgrades?.some((u) => u.type === "SET_BONUS")) {
          setBonusCount++;
        }
      });

      if (setBonusCount > 0) {
        groupScore *= Math.pow(setBonusCount, 3);
      }
    }

    totalTurnScore += groupScore;
  });

  // Apply upgrades from dice already banked this turn to the TOTAL turn score
  const bankedDice = getBankedDice(state);

  bankedDice.forEach((die) => {
    die.upgrades?.forEach((upgrade) => {
      if (upgrade.type === "BANKED_SCORE_BONUS") {
        totalTurnScore += 100;
      }
    });
  });

  bankedDice.forEach((die) => {
    die.upgrades?.forEach((upgrade) => {
      if (upgrade.type === "BANKED_SCORE_MULTIPLIER") {
        totalTurnScore *= 2;
      }
    });
  });

  return totalTurnScore;
}

export function areAllStagedDiceScoring(state: GameState): boolean {
  const stagedDice = getStagedDice(state);
  if (stagedDice.length === 0) return true;
  const { scoredDice } = calculateScore(stagedDice, state.scoringRules);
  return scoredDice.length === stagedDice.length;
}

// Validation Functions

export function canRoll(state: GameState): boolean {
  const activeDice = getActiveDice(state);
  const stagedScore = getStagedScore(state);

  // Can roll if:
  // 1. Normal roll: Have staged dice that score (will be auto-banked)
  // 2. All staged dice must be scoring
  return (
    activeDice.length > 0 &&
    !state.gameOver &&
    !state.lastRollSparkled &&
    stagedScore > 0 &&
    areAllStagedDiceScoring(state)
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

  return (
    stagedDice.length > 0 &&
    stagedScore > 0 &&
    !state.gameOver &&
    areAllStagedDiceScoring(state)
  );
}

export function canEndTurn(state: GameState): boolean {
  const stagedScore = getStagedScore(state);
  const potentialTotalScore =
    state.totalScore + state.bankedScore + stagedScore;

  if (state.gameOver) return false;

  // If sparkled, must be able to end turn (to bust)
  if (state.lastRollSparkled) return true;

  // Otherwise, must have points AND meet threshold
  // AND all staged dice must be scoring
  return (
    (state.bankedScore > 0 || stagedScore > 0) &&
    potentialTotalScore >= state.threshold &&
    areAllStagedDiceScoring(state)
  );
}
