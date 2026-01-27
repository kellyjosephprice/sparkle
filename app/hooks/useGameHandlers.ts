import { getSelectedDice } from "../../src/game";
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
  }, 500);

  return interval;
}

function autoBankSelectedDice(state: GameState): GameState {
  const selectedDice = getSelectedDice(state);
  if (selectedDice.length === 0) return state;

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
  const bankedState = autoBankSelectedDice(state);
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
  const bankedState = autoBankSelectedDice(state);
  setGameState(bankedState);

  const result = gameEngine.processCommand(bankedState, {
    type: "END_TURN",
    isSparkled: false,
  });
  setGameState(result.state);

  if (!result.state.gameOver) {
    startRollAnimation(result.state.dice, setUIState);
  }
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
