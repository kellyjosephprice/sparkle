import { DIE_UPGRADES } from "./die-upgrades";
import { calculateScore, DEFAULT_RULES } from "./scoring";
import { STRINGS } from "./strings";
import type { Die, DieValue, GameState } from "./types";

export const BASE_THRESHOLD = 100;

export const initialState: GameState = {
  bankedScore: 0,
  dice: [],
  gameOver: false,
  highScore: 0,
  lastRollSparkled: false,
  message: STRINGS.game.initialMessage,
  scoringRules: DEFAULT_RULES,
  threshold: calculateThreshold(1),
  totalScore: 0,
  turnNumber: 1,
  rollsInTurn: 0,
  isGuhkleAttempt: false,
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

let nextDieId = Date.now();

export function createDice(count: number, existingDice?: Die[]): Die[] {
  return Array.from({ length: count }, (_, i) => {
    // Find the original die if it exists to preserve position and upgrades
    // If existingDice is provided, we try to match by index but preserve position
    const existingDie = existingDice?.[i];

    return {
      id: nextDieId++,
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
        const config = DIE_UPGRADES[upgrade.type];
        if (!config || config.requiresBanked) return;

        // Apply score bonuses
        if (config.defaultValue) {
          groupScore += config.defaultValue;
        }
      });
    });

    group.dice.forEach((die) => {
      die.upgrades?.forEach((upgrade) => {
        const config = DIE_UPGRADES[upgrade.type];
        if (!config || config.requiresBanked) return;

        // Apply score multipliers
        if (config.multiplier) {
          // Check for limited uses
          if (config.uses !== undefined && (upgrade.remainingUses ?? 0) <= 0) {
            return;
          }
          groupScore *= config.multiplier;
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
      const config = DIE_UPGRADES[upgrade.type];
      if (!config || !config.requiresBanked) return;

      if (config.defaultValue) {
        totalTurnScore += config.defaultValue;
      }
    });
  });

  bankedDice.forEach((die) => {
    die.upgrades?.forEach((upgrade) => {
      const config = DIE_UPGRADES[upgrade.type];
      if (!config || !config.requiresBanked) return;

      if (config.multiplier) {
        totalTurnScore *= config.multiplier;
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
  if (state.gameOver || state.extraDicePool <= 0) return false;

  const activeDice = getActiveDice(state);
  if (activeDice.length === 0) return false;

  // Find unscored dice
  // Use calculateScore to find what is SCORING from the active dice
  // However, active dice might not be separated into scoring sets nicely if we just throw them all in.
  // Wait, calculateScore finds the BEST scoring combination.
  // The concept of "unscoring die" implies that AFTER scoring rules are applied, some are left over.
  // If last roll sparkled, ALL are unscoring.
  // If last roll didn't sparkle, but we have some leftovers?
  // Usually re-roll is only available if we have "junk" dice?
  // The prompt says: "The game randomly selects 5 die to re-roll, which saves the lone 4."
  // This implies re-roll applies to UNSCORED dice.
  
  // If we just rolled and it sparkled, all are unscored.
  // If we rolled, have some points, but want to re-roll the junk?
  // The original re-roll only worked on "last roll".
  // The new logic implies we can re-roll ANY time? "pressing the 'Re-Roll' button... will consume 'Extra Dice' equal to the number of unscoring die on the board."
  
  // Identifying unscored dice:
  // We need to exclude banked dice.
  // We need to exclude staged dice (since they are presumably scoring).
  // So we look at Active Non-Staged dice?
  // But wait, if I roll `1 2 2 3 4 6` (1 is scoring). If I stage 1, I have `2 2 3 4 6` left.
  // Are those "unscoring"? `2 2` isn't scoring. `3 4 6` aren't.
  // So yes, generally active (non-banked) dice that are NOT forming a scoring set.
  // But `calculateScore` on the set of remaining dice returns what CAN score.
  // If the remaining dice have NO score, they are all unscoring.
  
  const activeUnstagedDice = activeDice.filter(d => !d.staged);
  // Actually, simpler:
  // If last roll sparkled, all active dice are unscoring.
  // If not sparkled, user might have selected some dice to stage.
  // The "unscoring die" are the ones currently on the board that are NOT staged (and presumably the user doesn't want to stage them because they don't score).
  // Is it possible to re-roll dice that COULD score but user chose not to?
  // Example: Roll `1 5 2 3`. User stages `1`. Left `5 2 3`. `5` could score.
  // Does re-roll re-roll the `5` too?
  // "unscoring die on the board".
  // I will assume this means "active dice that are not staged".
  // NOTE: If the user hasn't staged anything yet, but there IS a score (e.g. rolled a 1), and they hit Re-Roll...
  // Should it re-roll everything? Or just the non-scoring ones?
  // "number of unscoring die". This implies dice that strictly DO NOT score.
  
  // Let's refine "unscoring":
  // It probably means dice that are NOT contributing to a score.
  // But `calculateScore` is greedy.
  // Let's stick to the simplest interpretation for `canReRoll`:
  // There must be active dice.
  // We check if there are any active dice.
  
  // Also, need to ensure we don't re-roll if EVERYTHING is scored/staged.
  return activeUnstagedDice.length > 0;
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

