"use client";

import { useCallback, useEffect, useState } from "react";

import {
  canEndTurn,
  canRoll,
  createDice,
  getSelectedScore,
  initialState,
} from "../src/game";
import type { GameEvent } from "../src/messaging";
import { eventBus, gameEngine } from "../src/messaging";
import type { GameState, RuleId } from "../src/types";
import ActionButtons from "./components/ActionButtons";
import Dice from "./components/Dice";
import MessageBanner from "./components/MessageBanner";
import ScoreDisplay from "./components/ScoreDisplay";
import Rules from "./components/Rules";
import {
  handleEndTurn,
  handleRoll,
  resetGame,
  toggleDie,
} from "./hooks/useGameHandlers";

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(() => ({
    ...initialState,
    dice: createDice(6),
  }));
  const [uiState, setUIState] = useState<{
    rolling: boolean;
    displayDice: typeof initialState.dice;
  }>({
    rolling: false,
    displayDice: createDice(6),
  });

  useEffect(() => {
    const unsubscribe = eventBus.subscribe((event: GameEvent) => {
      if (event.type === "DELAYED_ACTION") {
        setTimeout(() => {
          setGameState((currentState: GameState) => {
            const result = gameEngine.processCommand(
              currentState,
              event.action,
            );
            return result.state;
          });
        }, event.delay);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Prevent default behavior for our keys
      if (
        ["1", "2", "3", "4", "5", "6", " ", "Enter", "Delete"].includes(
          event.key,
        ) &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
      }

      // Handle die selection (keys 1-6)
      if (event.key >= "1" && event.key <= "6") {
        const position = parseInt(event.key);
        const die = gameState.dice.find((d) => d.position === position);
        console.log(position, die);
        if (die && !die.banked && !uiState.rolling) {
          setGameState(toggleDie(gameState, die.id));
        }
      }

      // Handle roll (spacebar)
      if (event.key === " " && canRoll(gameState) && !uiState.rolling) {
        handleRoll(gameState, setGameState, setUIState);
      }

      // Handle end turn (Enter)
      if (event.key === "Enter" && canEndTurn(gameState) && !uiState.rolling) {
        handleEndTurn(gameState, setGameState, setUIState);
      }

      // Handle new game (Delete)
      if (event.key === "Delete" && !uiState.rolling) {
        resetGame(gameState, setGameState, setUIState);
      }
    },
    [gameState, uiState.rolling],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const visualState = {
    ...gameState,
    dice: uiState.rolling ? uiState.displayDice : gameState.dice,
  };
  const selectedScore = getSelectedScore(gameState);

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Sparkle</h1>

        <ScoreDisplay
          totalScore={gameState.totalScore}
          currentTurnScore={gameState.currentScore + selectedScore}
          turnNumber={gameState.turnNumber}
          threshold={gameState.threshold}
        />

        <Dice
          dice={visualState.dice}
          onToggleDie={(id) => setGameState(toggleDie(gameState, id))}
          rolling={uiState.rolling}
        />

        {gameState.message && <MessageBanner message={gameState.message} />}

        <ActionButtons
          canRollAction={canRoll(gameState)}
          canEndTurnAction={canEndTurn(gameState)}
          onRoll={() => handleRoll(gameState, setGameState, setUIState)}
          onEndTurn={() => handleEndTurn(gameState, setGameState, setUIState)}
          onReset={() => resetGame(gameState, setGameState, setUIState)}
        />

        <Rules
          rules={gameState.scoringRules}
          onToggleRule={(ruleId) => {
            const result = gameEngine.processCommand(gameState, {
              type: "TOGGLE_SCORING_RULE",
              ruleId: ruleId as RuleId,
            });
            setGameState(result.state);
          }}
        />
      </div>
    </div>
  );
}
