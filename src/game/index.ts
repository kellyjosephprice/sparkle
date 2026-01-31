import { STRINGS } from "../strings";
import { DIE_UPGRADES } from "./die-upgrades";
import { calculateScore, DEFAULT_RULES } from "./scoring";
import type { Die, DieValue, GameState } from "./types";

export const STARTING_EXTRA_DICE = 5;

export const initialState: GameState = {
  bankedScore: 0,
  dice: [],
  gameOver: false,
  highScore: 0,
  lastRollFizzled: false,
  message: STRINGS.game.initialMessage,
  scoringRules: DEFAULT_RULES,
  threshold: 100,
  totalScore: 0,
  turnNumber: 0,
  rollsInTurn: 0,
  isGuhkleAttempt: false,
  extraDicePool: STARTING_EXTRA_DICE,
  hotDiceCount: 0,
  permanentMultiplier: 1,
  certificationNeededValue: null,
  upgradeOptions: [],
  pendingUpgradeDieSelection: null,
  potentialUpgradePosition: null,
};

// Utility/Selector Functions

export function calculateThreshold(turnNumber: number): number {
  if (turnNumber <= 1) return 100;
  const value = 100 * Math.pow(2, turnNumber - 1);

  return roundToSigFigs(value, 2);
}

function roundToSigFigs(num: number, sigFigs: number): number {
  if (num === 0) return 0;
  return parseFloat(num.toPrecision(sigFigs));
}

export function getNextThresholdInfo(turnNumber: number): {
  turn: number;
  value: number;
} {
  const nextTurn = turnNumber + 1;
  return {
    turn: nextTurn,
    value: calculateThreshold(nextTurn),
  };
}

let nextDieId = Date.now();

export function createDice(count: number, existingDice?: Die[]): Die[] {
  return Array.from({ length: count }, (_, i) => {
    const existingDie = existingDice?.[i];
    const isSparkDie = existingDie?.isSparkDie ?? (i === 0 && count === 5);

    let value: DieValue;
    if (isSparkDie) {
      const faces: DieValue[] = [1, 2, 4, 5, 6, "spark"];
      value = faces[Math.floor(Math.random() * faces.length)];
    } else {
      value = (Math.floor(Math.random() * 6) + 1) as DieValue;
    }

    return {
      id: nextDieId++,
      value,
      staged: false,
      banked: false,
      position: existingDie?.position ?? i + 1,
      upgrades: existingDie?.upgrades ?? [],
      isSparkDie,
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
  return {
    multiplier: state.permanentMultiplier ?? 1,
    bonus: 0,
  };
}

export function getStagedScore(state: GameState): number {
  const stagedDice = getStagedDice(state);
  const result = calculateScore(stagedDice, state.scoringRules);
  let totalTurnScore = 0;

  if (result.score === 0) return 0;

  // Process each scoring group (set or individual die)
  result.groups.forEach((group) => {
    let groupScore = group.score;
    const isSet = group.ruleId === "set";

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

  const bankedDice = getBankedDice(state);
  const scoringStagedDiceIds = new Set(result.scoredDice.map((d) => d.id));

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
      if (config.uses !== undefined && (upgrade.remainingUses ?? 0) <= 0)
        return;
      multiplierProduct *= config.multiplier;
    }
  });

  // Apply Global Multipliers
  const totalMultiplier = multiplierProduct * (state.permanentMultiplier ?? 1);

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
  // 3. Last roll wasn't a fizzle
  // 4. AND EITHER:
  //    a. We have staged dice that are scoring (standard play)
  //    b. We have banked score (user banked, now rolling remaining dice)
  return (
    activeDice.length > 0 &&
    !state.gameOver &&
    !state.lastRollFizzled &&
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

  if (state.gameOver) return false;

  // Cannot end turn if certification is needed
  if (state.certificationNeededValue) return false;

  // If fizzled, must be able to end turn (to bust)
  if (state.lastRollFizzled) return true;

  // Otherwise, must have points
  // AND all staged dice must be scoring
  return (
    (state.bankedScore > 0 || stagedScore > 0) && areAllStagedDiceScoring(state)
  );
}
