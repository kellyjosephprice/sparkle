import {
  calculateThreshold,
  createDice,
  getActiveDice,
  getStagedScore,
  initialState,
} from "../src/game";
import { gameEngine } from "../src/messaging/gameEngine";
import { calculateScore } from "../src/scoring";
import { Die, GameState } from "../src/types";

const SIMULATIONS = 1000;
const MAX_TURNS = 60;

interface StrategyConfig {
  scoringStrategy: "all" | "minimal";
  reluctance: number;
  mininumDieTolerance: number;
}

function getScoringDice(state: GameState, strategy: StrategyConfig): Die[] {
  const activeDice = getActiveDice(state);
  const result = calculateScore(activeDice, state.scoringRules);
  if (result.groups.length === 0) return [];

  if (strategy.scoringStrategy === "minimal") {
    const bestGroup = result.groups.reduce((prev, curr) =>
      curr.dice.length < prev.dice.length ? curr : prev,
    );
    return bestGroup.dice;
  } else {
    return result.scoredDice;
  }
}

function simulateTurn(state: GameState, strategy: StrategyConfig): GameState {
  let currentState = state;

  currentState = gameEngine.processCommand(currentState, {
    type: "ROLL_DICE",
  }).state;

  let iterations = 0;
  while (!currentState.gameOver) {
    iterations++;
    if (iterations > 500) return { ...currentState, gameOver: true };

    if (currentState.lastRollSparkled) {
      if (currentState.extraDicePool > 0) {
        currentState = gameEngine.processCommand(currentState, {
          type: "RE_ROLL",
        }).state;
        continue;
      } else {
        return gameEngine.processCommand(currentState, {
          type: "END_TURN",
          isSparkled: true,
        }).state;
      }
    }

    const toSelect = getScoringDice(currentState, strategy);
    if (toSelect.length === 0) {
      return gameEngine.processCommand(currentState, {
        type: "END_TURN",
        isSparkled: true,
      }).state;
    }
    for (const d of toSelect) {
      currentState = gameEngine.processCommand(currentState, {
        type: "TOGGLE_DIE",
        dieId: d.id,
      }).state;
    }

    const staged = getStagedScore(currentState);
    const potential =
      currentState.totalScore + currentState.bankedScore + staged;
    const remaining = getActiveDice(currentState).filter(
      (d) => !d.staged,
    ).length;

    const meetsThreshold = potential >= currentState.threshold;
    let riskThreshold = strategy.mininumDieTolerance;
    if (strategy.reluctance > 0) {
      riskThreshold += Math.floor(
        (currentState.bankedScore / 2000) * 10 * strategy.reluctance,
      );
      if (riskThreshold > 5) riskThreshold = 5;
    }

    if (meetsThreshold) {
      if (remaining === 0 || remaining > riskThreshold) {
        currentState = gameEngine.processCommand(currentState, {
          type: "BANK_DICE",
        }).state;
        currentState = gameEngine.processCommand(currentState, {
          type: "ROLL_DICE",
        }).state;
      } else {
        // Must bank before ending turn
        currentState = gameEngine.processCommand(currentState, {
          type: "BANK_DICE",
        }).state;
        return gameEngine.processCommand(currentState, { type: "END_TURN" })
          .state;
      }
    } else {
      currentState = gameEngine.processCommand(currentState, {
        type: "BANK_DICE",
      }).state;
      currentState = gameEngine.processCommand(currentState, {
        type: "ROLL_DICE",
      }).state;
    }
  }
  return currentState;
}

function runGame(strategy: StrategyConfig): GameState[] {
  let state = { ...initialState, dice: createDice(6) };
  const history: GameState[] = [state];
  while (!state.gameOver && state.turnNumber <= MAX_TURNS) {
    const turnBefore = state.turnNumber;
    state = simulateTurn(state, strategy);
    if (state.turnNumber > turnBefore && !state.gameOver) {
      if (state.upgradeOptions.length > 0) {
        state = gameEngine.processCommand(state, {
          type: "SELECT_UPGRADE",
          upgradeType: state.upgradeOptions[0].type,
        }).state;
      }
    }
    history.push(state);
  }
  return history;
}

const strategies: Record<string, StrategyConfig> = {
  Risky: {
    scoringStrategy: "all",
    reluctance: 0,
    mininumDieTolerance: 2,
  },
  "Safe Minimal": {
    scoringStrategy: "minimal",
    reluctance: 0.8,
    mininumDieTolerance: 2,
  },
  "Unsafe Minimal": {
    scoringStrategy: "minimal",
    reluctance: 0.8,
    mininumDieTolerance: 1,
  },
  Balanced: {
    scoringStrategy: "all",
    reluctance: 0.3,
    mininumDieTolerance: 2,
  },
};

console.log("# Sparkle Playthrough Analysis\n");

for (const [name, strategy] of Object.entries(strategies)) {
  console.log(`## Strategy: ${name}`);
  const results = Array.from({ length: MAX_TURNS + 2 }, () => ({
    total: 0,
    count: 0,
    gain: 0,
    maxScore: 0,
  }));

  for (let i = 0; i < SIMULATIONS; i++) {
    const history = runGame(strategy);
    for (let t = 1; t <= MAX_TURNS; t++) {
      const endOfTurn = history.find(
        (s) => s.turnNumber === t + 1 || (s.gameOver && s.turnNumber <= t + 1),
      );
      if (endOfTurn) {
        if (endOfTurn.turnNumber > t) {
          results[t].count++;
          results[t].total += endOfTurn.totalScore;
          results[t].maxScore = Math.max(
            results[t].maxScore,
            endOfTurn.totalScore,
          );
          const startOfTurn = history.find((s) => s.turnNumber === t);
          if (startOfTurn)
            results[t].gain += endOfTurn.totalScore - startOfTurn.totalScore;
        } else break;
      } else break;
    }
  }

  const table = [];
  for (let t = 1; t <= 40; t++) {
    if (results[t].count === 0) break;
    if (t % 3 !== 0) continue;

    table.push({
      Turn: t,
      "Survive %": Math.floor((results[t].count / SIMULATIONS) * 100),
      "Avg Total": (results[t].total / results[t].count).toFixed(0),
      "Max Score": results[t].maxScore,
      "Avg Gain": (results[t].gain / results[t].count).toFixed(0),
      Threshold: calculateThreshold(t),
    });
  }
  console.table(table);
}
