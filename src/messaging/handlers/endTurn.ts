import {
  calculateThreshold,
  createDice,
  getStagedScore,
} from "../../../src/game";
import type { GameState } from "../../../src/types";
import type { CommandResult, GameCommand, GameEvent } from "../types";

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

  // Award re-roll every 5 turns (turns 6, 11, 16, etc.)
  const shouldAwardReroll = nextTurnNumber % 5 === 1 && nextTurnNumber > 1;
  const newRerollsAvailable = shouldAwardReroll
    ? state.rerollsAvailable + 1
    : state.rerollsAvailable;

  // When sparkled, game only ends if total score is below threshold
  const gameOver =
    command.isSparkled === true && newTotalScore < state.threshold;

  // Increment threshold level if we've passed the current threshold
  let newThresholdLevel = state.thresholdLevel;
  let newThreshold = state.threshold;
  if (newTotalScore >= state.threshold) {
    newThresholdLevel = state.thresholdLevel + 1;
    newThreshold = calculateThreshold(newThresholdLevel);
  }

  const highScore = Math.max(state.highScore, newTotalScore);

  let message = "";
  if (command.isSparkled) {
    if (gameOver) {
      message = `💥 SPARKLE! Game Over! Final score: ${newTotalScore}`;
    } else {
      message = `💥 SPARKLE! Lost turn points, but you can continue! Total: ${newTotalScore}`;
    }
  } else {
    message = `Turn over! You scored ${totalTurnScore} points!`;
    if (shouldAwardReroll) {
      message += " 🎁 Earned a re-roll!";
    }
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
      thresholdLevel: newThresholdLevel,
      totalScore: newTotalScore,
      turnNumber: nextTurnNumber,
    },
    events,
  };
}
