"use client";

import React, { createContext, ReactNode,useCallback, useContext, useEffect, useState } from "react";

import { canEndTurn, canReRoll, canRoll, createDice, getStagedDice, getStagedScore, getTurnModifiers,initialState } from "@/src/game";
import { Die, GameState, UpgradeType } from "@/src/game/types";
import { eventBus, gameEngine, GameEvent } from "@/src/messaging";

interface UIState {
  rolling: boolean;
  displayDice: Die[];
  focusedPosition: number | null;
  focusedUpgradeIndex: number | null;
}

interface GameContextType {
  gameState: GameState;
  uiState: UIState;
  setUIState: React.Dispatch<React.SetStateAction<UIState>>;
  toggleDie: (id: number) => void;
  selectUpgrade: (type: UpgradeType) => void;
  handleRoll: () => void;
  handleReRoll: () => void;
  handleEndTurn: () => void;
  resetGame: () => void;
  selectAll: () => void;
  stagedScore: number;
  turnStats: { multiplier: number; bonus: number };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(() => ({
    ...initialState,
    dice: createDice(6),
  }));

  const [uiState, setUIState] = useState<UIState>({
    rolling: false,
    displayDice: gameState.dice,
    focusedPosition: null,
    focusedUpgradeIndex: null,
  });

  // Load high score from local storage
  useEffect(() => {
    const savedHighScore = localStorage.getItem("sparkle_high_score");
    if (savedHighScore) {
      const parsed = parseInt(savedHighScore, 10);
      if (!isNaN(parsed)) {
        setGameState(prev => {
          if (parsed > prev.highScore) {
            return { ...prev, highScore: parsed };
          }
          return prev;
        });
      }
    }
  }, []);

  // Persist high score
  useEffect(() => {
    if (gameState.highScore > 0) {
      localStorage.setItem("sparkle_high_score", gameState.highScore.toString());
    }
  }, [gameState.highScore]);

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
            if (event.action.type === "EXECUTE_AUTO_REROLL" || event.action.type === "EXECUTE_GUHKLE_REROLL") {
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

  const value = {
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
    stagedScore: getStagedScore(gameState),
    turnStats: getTurnModifiers(gameState),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
