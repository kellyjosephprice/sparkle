import { calculateScore } from "../src/scoring";
import { DEFAULT_RULES } from "../src/scoring";
import { Die, DieValue } from "../src/types";

const SIMULATIONS = 10000;

function createRandomDice(count: number): Die[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    value: (Math.floor(Math.random() * 6) + 1) as DieValue,
    staged: false,
    banked: false,
    position: i + 1,
    upgrades: [],
  }));
}

interface SimResult {
  score: number;
  hotDiceCount: number;
  sparkled: boolean;
}

function simulateTurn(
  rerolls: number,
  upgrades: any[] = [],
  threshold: number = 0,
): SimResult {
  let activeDiceCount = 6;
  let rerollsLeft = rerolls;
  let hotDiceCount = 0;
  let bankedThisTurn = 0;

  while (true) {
    const dice = createRandomDice(activeDiceCount);

    let { score, scoredDice } = calculateScore(dice, DEFAULT_RULES);

    if (score === 0) {
      // Check for auto-reroll upgrades
      const autoReroll = upgrades.find(
        (u) => u.type === "AUTO_REROLL" && u.charges > 0,
      );
      if (autoReroll) {
        autoReroll.charges--;
        continue; // Auto-reroll
      }
      if (rerollsLeft > 0) {
        rerollsLeft--;
        continue; // Manual re-roll
      }
      return { score: 0, hotDiceCount, sparkled: true };
    }

    // Apply upgrades to scoring dice
    scoredDice.forEach((d) => {
      const dieUpgrades = upgrades.filter((u) => u.position === d.position);
      dieUpgrades.forEach((u) => {
        if (u.type === "SCORE_BONUS") score += 100;
        if (u.type === "SCORE_MULTIPLIER") score *= 2;
        if (u.type === "TEN_X_MULTIPLIER" && u.charges > 0) {
          score *= 10;
          u.charges--;
        }
      });
    });

    bankedThisTurn += score;
    activeDiceCount -= scoredDice.length;

    if (activeDiceCount === 0) {
      hotDiceCount++;
      activeDiceCount = 6;
    } else {
      // Strategy: stop if we met threshold OR have high risk
      // For EV calculation, we should stop as soon as we meet threshold if risky
      if (bankedThisTurn >= threshold && activeDiceCount < 3) {
        break;
      }
      // If we are far from threshold, keep rolling even if risky
      if (
        bankedThisTurn < threshold &&
        activeDiceCount < 2 &&
        rerollsLeft === 0
      ) {
        // If we are at 1 die and no rerolls, it's very risky (2/3 chance to sparkle)
        // But if we haven't met threshold, we HAVE to roll.
      }
    }
  }

  return { score: bankedThisTurn, hotDiceCount, sparkled: false };
}

function runSimForTurn(turn: number) {
  // Threshold logic
  const level = Math.floor(turn / 3);
  const threshold = 100 * Math.pow(10, level);

  // Upgrades: 1 every 3 turns
  const upgradeCount = Math.floor(turn / 3);
  const rerolls = 1; // Base reroll

  // Create mock upgrades based on turn
  const upgrades: any[] = [];
  const pool = [
    "SCORE_MULTIPLIER",
    "SCORE_BONUS",
    "AUTO_REROLL",
    "TEN_X_MULTIPLIER",
  ];
  for (let i = 0; i < upgradeCount; i++) {
    const type = pool[i % pool.length];
    upgrades.push({
      type: type,
      position: (i % 6) + 1,
      charges: type === "AUTO_REROLL" || type === "TEN_X_MULTIPLIER" ? 3 : 999,
    });
  }

  let totalScore = 0;
  let maxScore = 0;
  let sparkledCount = 0;

  for (let i = 0; i < SIMULATIONS; i++) {
    const currentUpgrades = upgrades.map((u) => ({ ...u }));
    const result = simulateTurn(rerolls, currentUpgrades, threshold);
    totalScore += result.score;
    if (result.score > maxScore) maxScore = result.score;
    if (result.sparkled) sparkledCount++;
  }

  return {
    avg: totalScore / SIMULATIONS,
    max: maxScore,
    sparkleRate: sparkledCount / SIMULATIONS,
  };
}

console.log("# Sparkle Game Balance Analysis");
console.log(`Simulations per turn: ${SIMULATIONS}\n`);

console.log("| Turn | Threshold | Avg Value | Max Value | Sparkle Rate |");
console.log("|------|-----------|-----------|-----------|--------------|");

for (let t = 1; t <= 10; t++) {
  const stats = runSimForTurn(t);
  const level = Math.floor(t / 3);
  const threshold = 100 * Math.pow(10, level);
  console.log(
    `| ${t.toString().padEnd(4)} | ${threshold.toLocaleString().padEnd(9)} | ${stats.avg.toFixed(0).toLocaleString().padEnd(9)} | ${stats.max.toLocaleString().padEnd(9)} | ${(stats.sparkleRate * 100).toFixed(1)}% |`,
  );
}
