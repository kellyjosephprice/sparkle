import {
  calculateThreshold,
  createDice,
  getSelectedScore,
} from "../../src/game";
import type { GameAction, GameReducerResult, GameState } from "../../src/types";

export function endTurnReducer(
  state: GameState,
  action: Extract<GameAction, { type: "END_TURN" }>,
): GameReducerResult {
  const selectedScore = getSelectedScore(state);
  const totalTurnScore = action.isSparkled
    ? 0
    : state.currentScore + selectedScore;

  // Validation (only if not sparkled - sparkle auto-ends turn)
  if (!action.isSparkled) {
    if (state.bankedScore === 0 && selectedScore === 0) {
      return {
        state: {
          ...state,
          message: "You must bank some points before ending your turn!",
        },
      };
    }

    if (selectedScore > 0) {
      return {
        state: {
          ...state,
          message: "Bank your selected dice first!",
        },
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
      };
    }
  }

  const newTotalScore = state.totalScore + totalTurnScore;
  const nextTurnNumber = state.turnNumber + 1;

  // When sparkled, game only ends if total score is below threshold
  // (you can't continue if you can't meet the threshold to end turn)
  const gameOver =
    action.isSparkled === true && newTotalScore < state.threshold;

  // Increment threshold level if we've passed the current threshold
  let newThresholdLevel = state.thresholdLevel;
  let newThreshold = state.threshold;
  if (newTotalScore >= state.threshold) {
    newThresholdLevel = state.thresholdLevel + 1;
    newThreshold = calculateThreshold(newThresholdLevel);
  }

  let message = "";
  if (action.isSparkled) {
    if (gameOver) {
      message = `💥 SPARKLE! Game Over! Final score: ${newTotalScore}`;
    } else {
      message = `💥 SPARKLE! Lost turn points, but you can continue! Total: ${newTotalScore}`;
    }
  } else {
    message = `Turn over! You scored ${totalTurnScore} points!`;
  }

  // Create new dice for next turn (if not game over)
  const newDice = gameOver ? state.dice : createDice(6, state.dice);

  return {
    state: {
      dice: newDice,
      currentScore: 0,
      bankedScore: 0,
      totalScore: newTotalScore,
      threshold: newThreshold,
      thresholdLevel: newThresholdLevel,
      turnNumber: nextTurnNumber,
      gameOver: gameOver,
      message: message,
      scoringRules: state.scoringRules,
      rerollsAvailable: state.rerollsAvailable,
      lastRollSparkled: false,
    },
  };
}
