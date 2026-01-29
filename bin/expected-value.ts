import {
  calculateThreshold,
  createDice,
  getActiveDice,
  getStagedDice,
  getStagedScore,
  initialState,
} from "../src/game";
import { gameEngine } from "../src/messaging/gameEngine";
import { calculateScore } from "../src/scoring";
import { Die, GameState } from "../src/types";

const SIMULATIONS = 1000;
const MAX_TURNS = 50;

interface StrategyConfig {
  preferDiscardOverReroll: boolean;
  scoringStrategy: "all" | "minimal";
  reluctance: number;
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

  while (currentState.extraDicePool > 0 && currentState.dice.length < 6) {
    currentState = gameEngine.processCommand(currentState, {
      type: "ADD_EXTRA_DIE",
    }).state;
  }

  currentState = gameEngine.processCommand(currentState, {
    type: "ROLL_DICE",
  }).state;

  let iterations = 0;
  while (!currentState.gameOver) {
    iterations++;
    if (iterations > 500) return { ...currentState, gameOver: true };

    if (currentState.lastRollSparkled) {
      const activeCount = getActiveDice(currentState).length;
      if (
        strategy.preferDiscardOverReroll &&
        activeCount <= 2 &&
        activeCount > 0
      ) {
        currentState = gameEngine.processCommand(currentState, {
          type: "DISCARD_UNSCORED",
        }).state;
        continue;
      }

      if (currentState.rerollsAvailable > 0) {
        currentState = gameEngine.processCommand(currentState, {
          type: "RE_ROLL",
        }).state;
        continue;
      } else if (activeCount > 0) {
        currentState = gameEngine.processCommand(currentState, {
          type: "DISCARD_UNSCORED",
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
    let riskThreshold = 2;
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
        while (currentState.extraDicePool > 0 && currentState.dice.length < 6) {
          currentState = gameEngine.processCommand(currentState, {
            type: "ADD_EXTRA_DIE",
          }).state;
        }
        currentState = gameEngine.processCommand(currentState, {
          type: "ROLL_DICE",
        }).state;
      } else {
        // Must bank before ending turn if there are staged dice
        if (getStagedDice(currentState).length > 0) {
          currentState = gameEngine.processCommand(currentState, {
            type: "BANK_DICE",
          }).state;
        }
        return gameEngine.processCommand(currentState, { type: "END_TURN" })
          .state;
      }
    } else {
      currentState = gameEngine.processCommand(currentState, {
        type: "BANK_DICE",
      }).state;
      while (currentState.extraDicePool > 0 && currentState.dice.length < 6) {
        currentState = gameEngine.processCommand(currentState, {
          type: "ADD_EXTRA_DIE",
        }).state;
      }
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
    preferDiscardOverReroll: false,
    scoringStrategy: "all",
    reluctance: 0,
  },
  "Safe Minimal": {
    preferDiscardOverReroll: true,
    scoringStrategy: "minimal",
    reluctance: 0.8,
  },
  Balanced: {
    preferDiscardOverReroll: true,
    scoringStrategy: "all",
    reluctance: 0.3,
  },
};

console.log("# Sparkle Playthrough Analysis\n");

for (const [name, strategy] of Object.entries(strategies)) {
  console.log(`## Strategy: ${name}`);
  const results = Array.from({ length: MAX_TURNS + 2 }, () => ({
    total: 0,
    count: 0,
    gain: 0,
  }));

  for (let i = 0; i < SIMULATIONS; i++) {
    const history = runGame(strategy);
    for (let t = 1; t <= MAX_TURNS; t++) {
      const endState = history.find((s) => s.turnNumber === t + 1);
      if (endState) {
        results[t].count++;
        results[t].total += endState.totalScore;
        const startState = history.find((s) => s.turnNumber === t);
        if (startState)
          results[t].gain += endState.totalScore - startState.totalScore;
      }
    }
  }

  const table = [];
  for (let t = 1; t <= MAX_TURNS; t++) {
    if (results[t].count === 0) break;
    table.push({
      Turn: t,
      "Survive %": Math.floor((results[t].count / SIMULATIONS) * 100),
      "Avg Total": (results[t].total / results[t].count).toFixed(0),
      "Avg Gain": (results[t].gain / results[t].count).toFixed(0),
      Threshold: calculateThreshold(t),
    });
  }
  console.table(table);
}
