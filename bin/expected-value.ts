import {
  calculateThreshold,
  createDice,
  getActiveDice,
  getStagedDice,
  getStagedScore,
  initialState,
} from "../src/game";
import { gameEngine } from "../src/messaging/gameEngine";
import { DieUpgrade, GameState } from "../src/types";

const SIMULATIONS = 2000; // Reduced for performance with full engine

function simulateTurn(initialStateForTurn: GameState): number {
  let state = {
    ...initialStateForTurn,
    dice: createDice(6, initialStateForTurn.dice),
  };
  // Start the turn by rolling the dice
  state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;

  while (!state.gameOver) {
    // 1. If sparkled, try re-roll
    if (state.lastRollSparkled) {
      if (state.rerollsAvailable > 0) {
        state = gameEngine.processCommand(state, { type: "RE_ROLL" }).state;
        continue;
      } else {
        // Sparkled and no rerolls, lost turn points
        return 0;
      }
    }

    // 2. Select all scoring dice
    state = gameEngine.processCommand(state, { type: "SELECT_ALL" }).state;

    const stagedScore = getStagedScore(state);
    const potentialTurnScore = state.bankedScore + stagedScore;
    const totalPotentialScore = state.totalScore + potentialTurnScore;

    const remainingActive = getActiveDice(state).filter(
      (d) => !d.staged,
    ).length;

    // Decision logic
    if (totalPotentialScore >= state.threshold) {
      if (remainingActive === 0) {
        // Hot dice! Bank and roll again
        state = gameEngine.processCommand(state, { type: "BANK_DICE" }).state;
        state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;
      } else if (remainingActive <= 2) {
        // Risky, end turn
        state = gameEngine.processCommand(state, { type: "END_TURN" }).state;
        return potentialTurnScore;
      } else {
        // Keep rolling
        state = gameEngine.processCommand(state, { type: "BANK_DICE" }).state;
        state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;
      }
    } else {
      // Must reach threshold
      if (stagedScore > 0) {
        state = gameEngine.processCommand(state, { type: "BANK_DICE" }).state;
        state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;
      } else {
        // This shouldn't happen if SELECT_ALL works and it wasn't a sparkle
        return 0;
      }
    }
  }

  return 0;
}

function runSimForTurn(turn: number) {
  // Setup state for this turn
  const state = { ...initialState };
  state.turnNumber = turn;
  state.threshold = calculateThreshold(turn);

  // Apply hypothetical upgrades (1 every 3 turns)
  const upgradeCount = Math.floor(turn / 3);
  state.rerollsAvailable = 1 + Math.floor(turn / 3); // 1 automatic per 3 turns + starting 1

  const pool: any[] = [
    "SCORE_MULTIPLIER",
    "SCORE_BONUS",
    "AUTO_REROLL",
    "TEN_X_MULTIPLIER",
    "SET_BONUS",
  ];
  state.dice = createDice(6);
  for (let i = 0; i < upgradeCount; i++) {
    const type = pool[i % pool.length];
    const pos = (i % 6) + 1;
    state.dice = state.dice.map((d) =>
      d.position === pos
        ? {
            ...d,
            upgrades: [
              ...d.upgrades,
              {
                type,
                id: `up-${i}`,
                remainingUses:
                  type === "AUTO_REROLL" || type === "TEN_X_MULTIPLIER"
                    ? 3
                    : undefined,
              },
            ],
          }
        : d,
    );
  }

  let totalScore = 0;
  let maxScore = 0;
  let sparkledCount = 0;

  for (let i = 0; i < SIMULATIONS; i++) {
    // Clone state to reset charges/dice for each sim
    const turnResult = simulateTurn(state);
    totalScore += turnResult;
    if (turnResult > maxScore) maxScore = turnResult;
    if (turnResult === 0) sparkledCount++;
  }

  return {
    avg: totalScore / SIMULATIONS,
    max: maxScore,
    sparkleRate: sparkledCount / SIMULATIONS,
  };
}

console.log("# Sparkle Game Balance Analysis (using GameEngine)");
console.log(`Simulations per turn: ${SIMULATIONS}\n`);

console.log("| Turn | Threshold | Avg Value | Max Value | Sparkle Rate |");
console.log("|------|-----------|-----------|-----------|--------------|");

for (let t = 1; t <= 10; t++) {
  const stats = runSimForTurn(t);
  const threshold = calculateThreshold(t);
  console.log(
    `| ${t.toString().padEnd(4)} | ${threshold.toLocaleString().padEnd(9)} | ${stats.avg.toFixed(0).toLocaleString().padEnd(9)} | ${stats.max.toLocaleString().padEnd(9)} | ${(stats.sparkleRate * 100).toFixed(1)}% |`,
  );
}
