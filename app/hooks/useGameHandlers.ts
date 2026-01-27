import { getStagedDice } from "../../src/game";
import { gameEngine } from "../../src/messaging";
import type { Die, GameState } from "../../src/types";

export type SetGameState = React.Dispatch<React.SetStateAction<GameState>>;
export type SetUIState = React.Dispatch<
  React.SetStateAction<{
    rolling: boolean;
    displayDice: Die[];
    focusedPosition: number | null;
  }>
>;

function shuffleDiceValue(die: Die): Die {
  return die.banked
    ? die
    : {
        ...die,
        value: (Math.floor(Math.random() * 6) + 1) as Die["value"],
      };
}

function startRollAnimation(
  finalDice: Die[],
  setUIState: SetUIState,
  duration: number = 500,
): NodeJS.Timeout {
  setUIState((prev) => ({
    ...prev,
    rolling: true,
    displayDice: finalDice,
  }));

  const interval = setInterval(() => {
    setUIState((prev) => ({
      ...prev,
      displayDice: prev.displayDice.map(shuffleDiceValue),
    }));
  }, 50);

  setTimeout(() => {
    clearInterval(interval);
    setUIState((prev) => ({
      ...prev,
      rolling: false,
      displayDice: finalDice,
    }));
  }, duration);

  return interval;
}

function autoBankStagedDice(state: GameState): GameState {
  const stagedDice = getStagedDice(state);
  if (stagedDice.length === 0) return state;

  const result = gameEngine.processCommand(state, {
    type: "BANK_DICE",
  });
  return result.state;
}

export function toggleDie(state: GameState, id: number): GameState {
  const result = gameEngine.processCommand(state, {
    type: "TOGGLE_DIE",
    dieId: id,
  });
  return result.state;
}

export function handleRoll(
  state: GameState,
  setGameState: SetGameState,
  setUIState: SetUIState,
): void {
  const bankedState = autoBankStagedDice(state);
  setGameState(bankedState);

  const result = gameEngine.processCommand(bankedState, {
    type: "ROLL_DICE",
  });
  setGameState(result.state);

  startRollAnimation(result.state.dice, setUIState);
}

export function handleEndTurn(
  state: GameState,
  setGameState: SetGameState,
  setUIState: SetUIState,
): void {
  const bankedState = autoBankStagedDice(state);
  // Don't update state if auto-banking failed or returned the same state
  // But usually handleEndTurn expects to process through the engine
  const result = gameEngine.processCommand(bankedState, {
    type: "END_TURN",
    isSparkled: bankedState.lastRollSparkled,
  });

  // Only trigger animation if the turn actually changed
  if (result.state.turnNumber > state.turnNumber && !result.state.gameOver) {
    setGameState(result.state);
    startRollAnimation(result.state.dice, setUIState);
  } else {
    // Just update the state (likely an error message or threshold not met)
    setGameState(result.state);
  }
}

export function handleReRoll(
  state: GameState,
  setGameState: SetGameState,
  setUIState: SetUIState,
): void {
  const result = gameEngine.processCommand(state, {
    type: "RE_ROLL",
  });
  setGameState(result.state);

  // Use faster animation for re-rolls (250ms instead of 500ms)
  startRollAnimation(result.state.dice, setUIState, 250);
}

export function resetGame(
  state: GameState,
  setGameState: SetGameState,
  setUIState: SetUIState,
): void {
  const result = gameEngine.processCommand(state, {
    type: "RESET_GAME",
  });
  setGameState(result.state);

  startRollAnimation(result.state.dice, setUIState);
}
