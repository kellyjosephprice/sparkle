import { DIE_UPGRADES } from "./die-upgrades";
import { calculateScore, DEFAULT_RULES } from "./scoring";
import { STRINGS } from "./strings";
import type { Die, DieValue, GameState } from "./types";

export const BASE_THRESHOLD = 100;
export const STARTING_EXTRA_DICE = 6;

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
  turnNumber: 0,
  rollsInTurn: 0,
  isGuhkleAttempt: false,
  extraDicePool: STARTING_EXTRA_DICE,
  hotDiceCount: 0,
  permanentMultiplier: 1,
  upgradeOptions: [],
  pendingUpgradeDieSelection: null,
  potentialUpgradePosition: null,
};

// Utility/Selector Functions

export function calculateThreshold(turnNumber: number): number {
  const level = Math.floor(turnNumber / 3);

  return 10 ** (2 + level);
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
    value: calculateThreshold(nextThresholdTurn),
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

export function getTurnModifiers(state: GameState): {
  multiplier: number;
  bonus: number;
} {
  const stagedDice = getStagedDice(state);
  const bankedDice = getBankedDice(state);
  let bonus = 0;
  let multiplier = 1;

  // Calculate local multipliers and bonuses from staged dice groups
  // We need to group them to check set bonuses correctly
  // But wait, getStagedScore calculates local group bonuses.
  // The user asked for "Bonus" and "Multiplier" display.
  // Does "Bonus" include Local Group Bonuses? e.g. Single 1 = 100.
  // "as you select scoring dice the bonus will increase commensurately"
  // This implies if I select a Single 1, something increases.
  // If "Bonus" is just the point value, then `stagedScore` IS the bonus?
  // But they asked for Multiplier AND Bonus separate from Score.
  // "Below the score display".
  // Score Display shows "Banked Score" and "Staged Score".
  // If I have 100 staged. Bonus = 0. Multiplier = x1.
  // If I have a die with "+100 Bonus".
  // Staged Score = 200. Bonus = 100. Multiplier = x1.
  // This seems to be the intent.
  // So "Bonus" is the sum of `defaultValue` modifiers.
  // And "Multiplier" is the global multiplier.

  // 1. Bonuses from upgrades
  // We need to know which staged dice are scoring to apply their upgrades
  // (non-scoring staged dice shouldn't contribute, but `stagedDice` implies selected)
  // `areAllStagedDiceScoring` checks this.
  // We can assume user only selects scoring dice (or we only count scoring ones).
  // Let's use `calculateScore` to be safe for staged dice.

  const { scoredDice } = calculateScore(stagedDice, state.scoringRules);
  const effectiveStagedDice = scoredDice;

  // Process Bonuses (defaultValue)
  [...effectiveStagedDice, ...bankedDice].forEach((die) => {
    die.upgrades.forEach((u) => {
      const config = DIE_UPGRADES[u.type];
      if (!config) return;

      // If requiresBanked, only count if banked OR staged (as "potential")
      // User said "as you select scoring dice the bonus will increase"
      // So we count it for staged dice too.
      if (config.defaultValue) {
        bonus += config.defaultValue;
      }
    });
  });

  // Process Multipliers
  // Logic: Product of all multipliers + HotDiceCount
  let product = 1;
  [...effectiveStagedDice, ...bankedDice].forEach((die) => {
    die.upgrades.forEach((u) => {
      const config = DIE_UPGRADES[u.type];
      if (!config) return;

      if (config.multiplier) {
        // Check uses
        if (config.uses !== undefined && (u.remainingUses ?? 0) <= 0) return;
        product *= config.multiplier;
      }
    });
  });

  multiplier = product + (state.hotDiceCount ?? 0) * (state.permanentMultiplier ?? 1);
  
  return { multiplier, bonus };
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
  // AND apply pending upgrades from staged dice that require banking (since we are calculating value FOR banking)

  const bankedDice = getBankedDice(state);

  // Only consider staged dice that are actually SCORING
  // We already calculated this in `result`
  const scoringStagedDiceIds = new Set(result.scoredDice.map((d) => d.id));

  // Also include staged dice upgrades that require banking
  const stagedRequiringBank = stagedDice
    .filter((d) => scoringStagedDiceIds.has(d.id))
    .flatMap((d) =>
      d.upgrades
        .filter((u) => {
          const c = DIE_UPGRADES[u.type];
          return c && c.requiresBanked;
        })
        .map((u) => ({ die: d, upgrade: u })),
    );

  // Collect all upgrades that apply to Total Score (Global Modifiers)
  // 1. Banked dice upgrades
  // 2. Staged dice upgrades that require banking

  // Apply Bonuses first
  bankedDice.forEach((die) => {
    die.upgrades?.forEach((upgrade) => {
      const config = DIE_UPGRADES[upgrade.type];
      if (!config || !config.requiresBanked) return;

      if (config.defaultValue) {
        totalTurnScore += config.defaultValue;
      }
    });
  });

  stagedRequiringBank.forEach(({ upgrade }) => {
    const config = DIE_UPGRADES[upgrade.type];
    if (config.defaultValue) {
      totalTurnScore += config.defaultValue;
    }
  });

  // Apply Multipliers
  let multiplierProduct = 1;

  bankedDice.forEach((die) => {
    die.upgrades?.forEach((upgrade) => {
      const config = DIE_UPGRADES[upgrade.type];
      if (!config || !config.requiresBanked) return;

      if (config.multiplier) {
        multiplierProduct *= config.multiplier;
      }
    });
  });

  stagedRequiringBank.forEach(({ upgrade }) => {
    const config = DIE_UPGRADES[upgrade.type];
    if (config.multiplier) {
      // Check uses?
      if (config.uses !== undefined && (upgrade.remainingUses ?? 0) <= 0)
        return;
      multiplierProduct *= config.multiplier;
    }
  });

  // Apply Hot Dice Modifier to the Multiplier
  const totalMultiplier = (multiplierProduct + (state.hotDiceCount ?? 0)) * (state.permanentMultiplier ?? 1);
  
  totalTurnScore *= totalMultiplier;

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
  // 1. We have active dice to roll
  // 2. Game is not over
  // 3. Last roll wasn't a sparkle
  // 4. AND EITHER:
  //    a. We have staged dice that are scoring (standard play)
  //    b. We have banked score (user banked, now rolling remaining dice)
  return (
    activeDice.length > 0 &&
    !state.gameOver &&
    !state.lastRollSparkled &&
    ((stagedScore > 0 && areAllStagedDiceScoring(state)) ||
      state.bankedScore > 0)
  );
}

export function canReRoll(state: GameState): boolean {
  if (state.gameOver || state.extraDicePool <= 0) return false;

  const activeDice = getActiveDice(state);
  if (activeDice.length === 0) return false;

  const activeUnstagedDice = activeDice.filter((d) => !d.staged);
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
