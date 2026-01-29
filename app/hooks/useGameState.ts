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
} from "../../src/game";
import type { GameEvent } from "../../src/messaging";
import { eventBus, gameEngine } from "../../src/messaging";
import type { Die, GameState, UpgradeType } from "../../src/types";

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sparkle_game_state");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved game state", e);
        }
      }
    }
    return {
      ...initialState,
      dice: createDice(6),
    };
  });

  const [uiState, setUIState] = useState<{
    rolling: boolean;
    displayDice: Die[];
    focusedPosition: number | null;
    focusedUpgradeIndex: number | null;
  }>({
    rolling: false,
    displayDice: gameState.dice,
    focusedPosition: 1,
    focusedUpgradeIndex: null,
  });

  // Persist game state
  useEffect(() => {
    localStorage.setItem("sparkle_game_state", JSON.stringify(gameState));
    if (gameState.highScore > 0) {
      localStorage.setItem("sparkle_high_score", gameState.highScore.toString());
    }
  }, [gameState]);

  // Sync high score from local storage on mount (if not in game state)
  useEffect(() => {
    const savedHighScore = localStorage.getItem("sparkle_high_score");
    if (savedHighScore) {
      const parsed = parseInt(savedHighScore, 10);
      if (parsed > gameState.highScore) {
        setGameState(prev => ({ ...prev, highScore: parsed }));
      }
    }
  }, []);

  const shuffleDiceValue = (die: Die): Die => {
    return die.banked
      ? die
      : {
          ...die,
          value: (Math.floor(Math.random() * 6) + 1) as Die["value"],
        };
  };

  const startRollAnimation = useCallback((finalDice: Die[], duration: number = 500) => {
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
  }, []);

  // Listen for delayed actions
  useEffect(() => {
    const unsubscribe = eventBus.subscribe((event: GameEvent) => {
      if (event.type === "DELAYED_ACTION") {
        setTimeout(() => {
          setGameState((currentState: GameState) => {
            const result = gameEngine.processCommand(currentState, event.action);
            if (event.action.type === "EXECUTE_AUTO_REROLL") {
              startRollAnimation(result.state.dice, 250);
            }
            return result.state;
          });
        }, event.delay);
      }
    });
    return () => unsubscribe();
  }, [startRollAnimation]);

  const toggleDie = useCallback((id: number) => {
    if (uiState.rolling) return;
    setGameState((prev) => {
      const result = gameEngine.processCommand(prev, { type: "TOGGLE_DIE", dieId: id });
      return result.state;
    });
  }, [uiState.rolling]);

  const selectUpgrade = useCallback((type: UpgradeType) => {
    setGameState((prev) => {
      const result = gameEngine.processCommand(prev, { type: "SELECT_UPGRADE", upgradeType: type });
      return result.state;
    });
    setUIState(prev => ({ ...prev, focusedUpgradeIndex: null }));
  }, []);

  const handleRoll = useCallback(() => {
    if (uiState.rolling || !canRoll(gameState)) return;

    let currentState = gameState;
    // Auto-bank staged
    const staged = getStagedDice(gameState);
    if (staged.length > 0) {
      const result = gameEngine.processCommand(gameState, { type: "BANK_DICE" });
      currentState = result.state;
    }

    const rollResult = gameEngine.processCommand(currentState, { type: "ROLL_DICE" });
    setGameState(rollResult.state);
    startRollAnimation(rollResult.state.dice);
  }, [gameState, uiState.rolling, startRollAnimation]);

  const handleReRoll = useCallback(() => {
    if (uiState.rolling || !canReRoll(gameState)) return;
    const result = gameEngine.processCommand(gameState, { type: "RE_ROLL" });
    setGameState(result.state);
    startRollAnimation(result.state.dice, 250);
  }, [gameState, uiState.rolling, startRollAnimation]);

  const handleEndTurn = useCallback(() => {
    if (uiState.rolling || !canEndTurn(gameState)) return;

    let currentState = gameState;
    const staged = getStagedDice(gameState);
    if (staged.length > 0) {
      const result = gameEngine.processCommand(gameState, { type: "BANK_DICE" });
      currentState = result.state;
    }

    const endTurnResult = gameEngine.processCommand(currentState, {
      type: "END_TURN",
      isSparkled: currentState.lastRollSparkled,
    });

    if (endTurnResult.state.turnNumber > gameState.turnNumber && !endTurnResult.state.gameOver) {
      setGameState(endTurnResult.state);
      startRollAnimation(endTurnResult.state.dice);
    } else {
      setGameState(endTurnResult.state);
    }
  }, [gameState, uiState.rolling, startRollAnimation]);

  const resetGame = useCallback(() => {
    const result = gameEngine.processCommand(gameState, { type: "RESET_GAME" });
    setGameState(result.state);
    startRollAnimation(result.state.dice);
  }, [gameState, startRollAnimation]);

  const selectAll = useCallback(() => {
    const result = gameEngine.processCommand(gameState, { type: "SELECT_ALL" });
    setGameState(result.state);
  }, [gameState]);

  const handleDiscardUnscored = useCallback(() => {
    if (uiState.rolling || !gameState.lastRollSparkled) return;
    const result = gameEngine.processCommand(gameState, { type: "DISCARD_UNSCORED" });
    setGameState(result.state);
  }, [gameState, uiState.rolling]);

  const handleAddExtraDie = useCallback(() => {
    if (uiState.rolling || gameState.extraDicePool <= 0 || gameState.dice.length >= 6) return;
    const result = gameEngine.processCommand(gameState, { type: "ADD_EXTRA_DIE" });
    setGameState(result.state);
  }, [gameState, uiState.rolling]);

  return {
    gameState,
    uiState,
    setUIState,
    toggleDie,
    selectUpgrade,
    handleRoll,
    handleReRoll,
    handleEndTurn,
    resetGame,
    selectAll,
    handleDiscardUnscored,
    handleAddExtraDie,
    stagedScore: getStagedScore(gameState),
  };
}
