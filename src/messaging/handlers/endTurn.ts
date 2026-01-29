import {
  calculateThreshold,
  createDice,
  getStagedScore,
} from "../../../src/game";
import { STRINGS } from "../../strings";
import type { GameState, UpgradeOption } from "../../../src/types";
import type { CommandResult, GameCommand, GameEvent } from "../types";

const ALL_UPGRADES: UpgradeOption[] = [
  {
    type: "SCORE_MULTIPLIER",
    description: STRINGS.upgrades.scoreMultiplier,
  },
  {
    type: "SCORE_BONUS",
    description: STRINGS.upgrades.scoreBonus,
  },
  {
    type: "BANKED_SCORE_MULTIPLIER",
    description: STRINGS.upgrades.bankedMultiplier,
  },
  {
    type: "BANKED_SCORE_BONUS",
    description: STRINGS.upgrades.bankedBonus,
  },
  {
    type: "AUTO_REROLL",
    description: STRINGS.upgrades.autoReroll,
  },
  {
    type: "TEN_X_MULTIPLIER",
    description: STRINGS.upgrades.tenXMultiplier,
  },
  {
    type: "SET_BONUS",
    description: STRINGS.upgrades.setBonus,
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
          message: STRINGS.errors.mustBank,
        },
        events: [
          {
            type: "ERROR",
            message: STRINGS.errors.mustBank,
          },
        ],
      };
    }

    if (stagedScore > 0) {
      return {
        state: { ...state, message: STRINGS.errors.bankFirst },
        events: [{ type: "ERROR", message: STRINGS.errors.bankFirst }],
      };
    }

    // Check if new total score meets threshold
    const newTotalScore = state.totalScore + totalTurnScore;
    if (newTotalScore < state.threshold) {
      return {
        state: {
          ...state,
          message: STRINGS.errors.thresholdNotMet(state.threshold, newTotalScore),
        },
        events: [
          {
            type: "ERROR",
            message: STRINGS.errors.thresholdNotMet(state.threshold, newTotalScore),
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
      message = STRINGS.game.gameOver(newTotalScore);
    } else {
      message = STRINGS.game.sparkleContinue(newTotalScore);
    }
  } else {
    message = STRINGS.game.turnOver(totalTurnScore);
  }

  // Create new dice for next turn (if not game over)
  const newDice = gameOver ? state.dice : createDice(state.dice.length, state.dice);

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
  let newExtraDicePool = state.extraDicePool;

  if (!gameOver && state.turnNumber % 3 === 0) {
    // Automatically add a reroll and an extra die
    newRerollsAvailable += 1;
    newExtraDicePool += 1;

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
      extraDicePool: newExtraDicePool,
      upgradeOptions,
      pendingUpgradeDieSelection: null,
      potentialUpgradePosition,
    },
    events,
  };
}
