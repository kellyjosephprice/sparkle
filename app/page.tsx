"use client";

import { useCallback, useEffect, useState } from "react";

import {
  canEndTurn,
  canReRoll,
  canRoll,
  createDice,
  getStagedDice,
  getStagedScore,
  initialState,
} from "../src/game";
import type { GameEvent } from "../src/messaging";
import { eventBus, gameEngine } from "../src/messaging";
import type { GameState } from "../src/types";
import ActionButtons from "./components/ActionButtons";
import Dice from "./components/Dice";
import HelpModal from "./components/HelpModal";
import MessageBanner from "./components/MessageBanner";
import ScoreDisplay from "./components/ScoreDisplay";
import UpgradeModal from "./components/UpgradeModal";
import UpgradesMenu from "./components/UpgradesMenu";
import {
  handleEndTurn,
  handleReRoll,
  handleRoll,
  resetGame,
  toggleDie,
} from "./hooks/useGameHandlers";

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("sparkle_high_score")
        : null;
    const highScore = saved ? parseInt(saved, 10) : 0;
    return {
      ...initialState,
      dice: createDice(6),
      highScore,
    };
  });
  const [uiState, setUIState] = useState<{
    rolling: boolean;
    displayDice: typeof initialState.dice;
    focusedPosition: number | null;
  }>({
    rolling: false,
    displayDice: createDice(6),
    focusedPosition: 1, // Start with position 1 focused
  });

  const [helpOpen, setHelpOpen] = useState(false);

  // Save high score to local storage
  useEffect(() => {
    if (gameState.highScore > 0) {
      localStorage.setItem(
        "sparkle_high_score",
        gameState.highScore.toString(),
      );
    }
  }, [gameState.highScore]);

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

  // Handle die interaction (either toggle selection or apply upgrade)
  const handleDieInteraction = useCallback(
    (id: number) => {
      if (uiState.rolling) return;

      if (gameState.pendingUpgradeDieSelection) {
        const die = gameState.dice.find((d) => d.id === id);
        if (die) {
          const result = gameEngine.processCommand(gameState, {
            type: "APPLY_UPGRADE",
            position: die.position,
          });
          setGameState(result.state);
        }
      } else {
        setGameState(toggleDie(gameState, id));
      }
    },
    [gameState, uiState.rolling],
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Prevent default behavior for our keys
      if (
        [
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          " ",
          "Enter",
          "Backspace",
          "r",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "w",
          "a",
          "s",
          "d",
          "W",
          "A",
          "S",
          "D",
        ].includes(event.key) &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
      }

      // Handle die selection (keys 1-6) - Also sets focus
      if (event.key >= "1" && event.key <= "6") {
        const position = parseInt(event.key);
        setUIState((prev) => ({ ...prev, focusedPosition: position }));
        const die = gameState.dice.find((d) => d.position === position);
        if (die && !die.banked && !uiState.rolling) {
          handleDieInteraction(die.id);
        }
      }

      // Arrow Left / A: Move focus left with wraparound
      if (
        (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") &&
        !uiState.rolling
      ) {
        const currentPos = uiState.focusedPosition ?? 1;
        const newPos = currentPos === 1 ? 6 : currentPos - 1;
        setUIState((prev) => ({ ...prev, focusedPosition: newPos }));
      }

      // Arrow Right / D: Move focus right with wraparound
      if (
        (event.key === "ArrowRight" || event.key.toLowerCase() === "d") &&
        !uiState.rolling
      ) {
        const currentPos = uiState.focusedPosition ?? 1;
        const newPos = currentPos === 6 ? 1 : currentPos + 1;
        setUIState((prev) => ({ ...prev, focusedPosition: newPos }));
      }

      // Arrow Down / S: Select focused die (move to banked)
      if (
        (event.key === "ArrowDown" || event.key.toLowerCase() === "s") &&
        uiState.focusedPosition &&
        !uiState.rolling
      ) {
        const die = gameState.dice.find(
          (d) => d.position === uiState.focusedPosition,
        );
        if (die && !die.banked && !die.staged) {
          handleDieInteraction(die.id);
        }
      }

      // Arrow Up / W: Unselect focused die (move to active)
      if (
        (event.key === "ArrowUp" || event.key.toLowerCase() === "w") &&
        uiState.focusedPosition &&
        !uiState.rolling
      ) {
        const die = gameState.dice.find(
          (d) => d.position === uiState.focusedPosition,
        );
        if (die && !die.banked && die.staged) {
          handleDieInteraction(die.id);
        }
      }

      // Disable other actions if upgrade modal is open
      if (gameState.upgradeModalOpen) return;

      // Handle roll (spacebar) - Use re-roll if last roll sparkled
      if (event.key === " " && !uiState.rolling) {
        if (gameState.lastRollSparkled && canReRoll(gameState)) {
          handleReRoll(gameState, setGameState, setUIState);
        } else if (canRoll(gameState)) {
          handleRoll(gameState, setGameState, setUIState);
        } else if (getStagedDice(gameState).length === 0) {
          const result = gameEngine.processCommand(gameState, {
            type: "SELECT_ALL",
          });
          setGameState(result.state);
        }
      }

      // Handle re-roll (R key)
      if (event.key === "r" && canReRoll(gameState) && !uiState.rolling) {
        handleReRoll(gameState, setGameState, setUIState);
      }

      // Handle end turn (Enter)
      if (event.key === "Enter" && canEndTurn(gameState) && !uiState.rolling) {
        handleEndTurn(gameState, setGameState, setUIState);
      }

      // Handle new game (Backspace)
      if (event.key === "Backspace" && !uiState.rolling) {
        resetGame(gameState, setGameState, setUIState);
      }
    },
    [gameState, uiState.rolling, uiState.focusedPosition, handleDieInteraction],
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

  const stagedScore = getStagedScore(gameState);

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-baseline mb-8">
          <h1 className="text-4xl font-bold text-white">Sparkle</h1>
          <button
            onClick={() => setHelpOpen(true)}
            className="text-white/50 hover:text-white underline underline-offset-4 text-sm font-medium transition-colors"
          >
            Rules
          </button>
        </div>

        <ScoreDisplay
          bankedScore={gameState.bankedScore}
          stagedScore={stagedScore}
          highScore={gameState.highScore}
          rerollsAvailable={gameState.rerollsAvailable}
          threshold={gameState.threshold}
          totalScore={gameState.totalScore}
          turnNumber={gameState.turnNumber}
        />

        <Dice
          dice={visualState.dice}
          onToggleDie={(id) => handleDieInteraction(id)}
          rolling={uiState.rolling}
          focusedPosition={uiState.focusedPosition}
          onFocusDie={(position) =>
            setUIState((prev) => ({ ...prev, focusedPosition: position }))
          }
        />

        {gameState.message && <MessageBanner message={gameState.message} />}

        <ActionButtons
          canRollAction={
            canRoll(gameState) && !gameState.pendingUpgradeDieSelection
          }
          canEndTurnAction={
            canEndTurn(gameState) && !gameState.pendingUpgradeDieSelection
          }
          canReRollAction={
            canReRoll(gameState) && !gameState.pendingUpgradeDieSelection
          }
          onRoll={() => handleRoll(gameState, setGameState, setUIState)}
          onEndTurn={() => handleEndTurn(gameState, setGameState, setUIState)}
          onReset={() => resetGame(gameState, setGameState, setUIState)}
          onReRoll={() => handleReRoll(gameState, setGameState, setUIState)}
        />

        <UpgradesMenu dice={gameState.dice} />

        {gameState.upgradeModalOpen && (
          <UpgradeModal
            options={gameState.upgradeOptions}
            onSelect={(type) => {
              const result = gameEngine.processCommand(gameState, {
                type: "SELECT_UPGRADE",
                upgradeType: type,
              });
              setGameState(result.state);
            }}
          />
        )}

        <HelpModal
          isOpen={helpOpen}
          onClose={() => setHelpOpen(false)}
          rules={gameState.scoringRules}
        />
      </div>
    </div>
  );
}
