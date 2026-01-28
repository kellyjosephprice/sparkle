import {
  calculateThreshold,
  createDice,
  getStagedScore,
} from "../../../src/game";
import type { GameState, UpgradeOption } from "../../../src/types";
import type { CommandResult, GameCommand, GameEvent } from "../types";

const ALL_UPGRADES: UpgradeOption[] = [
  {
    type: "SCORE_MULTIPLIER",
    description: "2x score multiplier when this die is scored",
  },
  {
    type: "SCORE_BONUS",
    description: "100+ score bonus when this die is scored",
  },
  {
    type: "BANKED_SCORE_MULTIPLIER",
    description: "2x banked score multiplier when this die is banked",
  },
  {
    type: "BANKED_SCORE_BONUS",
    description: "100+ banked score bonus when this die is banked",
  },
  {
    type: "AUTO_REROLL",
    description: "3x Auto re-roll on sparkle (if this die is rolled)",
  },
  {
    type: "TEN_X_MULTIPLIER",
    description: "3x 10x multiplier when this die is scored",
  },
  {
    type: "SET_BONUS",
    description: "2x multiplier for each die in a set with this upgrade",
  },
];

export function handleEndTurn(
  state: GameState,
  command: Extract<GameCommand, { type: "END_TURN" }>,
): CommandResult {
  const stagedScore = getStagedScore(state);
  const totalTurnScore = command.isSparkled
    ? 0
    : state.bankedScore + stagedScore;

  // Validation (only if not sparkled - sparkle auto-ends turn)
  if (!command.isSparkled) {
    if (state.bankedScore === 0 && stagedScore === 0) {
      return {
        state: {
          ...state,
          message: "You must bank some points before ending your turn!",
        },
        events: [
          {
            type: "ERROR",
            message: "You must bank some points before ending your turn!",
          },
        ],
      };
    }

    if (stagedScore > 0) {
      return {
        state: { ...state, message: "Bank your selected dice first!" },
        events: [{ type: "ERROR", message: "Bank your selected dice first!" }],
      };
    }

    // Check if new total score meets threshold
    const newTotalScore = state.totalScore + totalTurnScore;
    if (newTotalScore < state.threshold) {
      return {
        state: {
          ...state,
          message: `Need total score of ${state.threshold} to end turn. You have ${newTotalScore}. Keep rolling!`,
        },
        events: [
          {
            type: "ERROR",
            message: `Need total score of ${state.threshold} to end turn.`,
          },
        ],
      };
    }
  }

  const newTotalScore = state.totalScore + totalTurnScore;
  const nextTurnNumber = state.turnNumber + 1;

  // When sparkled, game only ends if total score is below threshold
  const gameOver =
    command.isSparkled === true && newTotalScore < state.threshold;

  // Increment threshold level if we've passed the current threshold
  const newThreshold = calculateThreshold(nextTurnNumber);

  const highScore = Math.max(state.highScore, newTotalScore);

  let message = "";
  if (command.isSparkled) {
    if (gameOver) {
      message = `✨ SPARKLE! Game Over! Final score: ${newTotalScore}`;
    } else {
      message = `✨ SPARKLE! Lost turn points, but you can continue! Total: ${newTotalScore}`;
    }
  } else {
    message = `Turn over! You scored ${totalTurnScore} points!`;
  }

  // Create new dice for next turn (if not game over)
  const newDice = gameOver ? state.dice : createDice(6, state.dice);

  const events: GameEvent[] = [
    {
      type: "TURN_ENDED",
      totalScore: newTotalScore,
      gameOver: gameOver,
      sparkled: command.isSparkled === true,
    },
  ];

  // Check for upgrade every 3 turns
  let upgradeOptions: UpgradeOption[] = [];
  let potentialUpgradePosition: number | null = null;
  let newRerollsAvailable = state.rerollsAvailable;

  if (!gameOver && state.turnNumber % 3 === 0) {
    // Automatically add a reroll
    newRerollsAvailable += 1;
    
    // Select 2 random options from ALL_UPGRADES
    const shuffled = [...ALL_UPGRADES].sort(() => 0.5 - Math.random());
    upgradeOptions = [shuffled[0], shuffled[1]];
    // Randomly select a position (1-6)
    potentialUpgradePosition = Math.floor(Math.random() * 6) + 1;
  }

  return {
    state: {
      bankedScore: 0,
      dice: newDice,
      gameOver: gameOver,
      highScore,
      lastRollSparkled: false,
      message: message,
      rerollsAvailable: newRerollsAvailable,
      scoringRules: state.scoringRules,
      threshold: newThreshold,
      totalScore: newTotalScore,
      turnNumber: nextTurnNumber,
      upgradeOptions,
      pendingUpgradeDieSelection: null,
      potentialUpgradePosition,
    },
    events,
  };
}
