import type { GameState } from "../../types";
import type { GameCommand, CommandResult, GameEvent } from "../types";
import { getSelectedScore, createDice, calculateThreshold } from "../../game";
import { isSparkle } from "../../scoring";

export function handleEndTurn(
  state: GameState,
  command: Extract<GameCommand, { type: "END_TURN" }>
): CommandResult {
  const selectedScore = getSelectedScore(state);
  const totalTurnScore = command.isSparkled ? 0 : state.currentScore + selectedScore;

  // Validation (only if not sparkled - sparkle auto-ends turn)
  if (!command.isSparkled) {
    if (state.bankedScore === 0 && selectedScore === 0) {
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

    if (selectedScore > 0) {
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
  let newThresholdLevel = state.thresholdLevel;
  let newThreshold = state.threshold;
  if (newTotalScore >= state.threshold) {
    newThresholdLevel = state.thresholdLevel + 1;
    newThreshold = calculateThreshold(newThresholdLevel);
  }

  let message = "";
  if (command.isSparkled) {
    if (gameOver) {
      message = `💥 SPARKLE! Game Over! Final score: ${newTotalScore}`;
    } else {
      message = `💥 SPARKLE! Lost turn points, but you can continue! Total: ${newTotalScore}`;
    }
  } else {
    message = `Turn over! You scored ${totalTurnScore} points!`;
  }

  // Create new dice for next turn (if not game over)
  const newDice = gameOver ? state.dice : createDice(6);

  const events: GameEvent[] = [
    {
      type: "TURN_ENDED",
      totalScore: newTotalScore,
      gameOver: gameOver,
      sparkled: command.isSparkled === true,
    },
  ];

  // Check if new turn dice sparkle
  if (!gameOver && isSparkle(newDice)) {
    events.push({
      type: "DELAYED_ACTION",
      action: { type: "END_TURN", isSparkled: true },
      delay: 2000,
    });
  }

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
    },
    events,
  };
}
