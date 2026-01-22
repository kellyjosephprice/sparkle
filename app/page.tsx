"use client";

import { useEffect,useState } from "react";

import ActionButtons from "./components/ActionButtons";
import DiceSections from "./components/DiceSections";
import MessageBanner from "./components/MessageBanner";
import RulesSection from "./components/RulesSection";
import ScoreDisplay from "./components/ScoreDisplay";
import {
  calculateThreshold,
  canEndTurn,
  canRoll,
  createDice,
  getActiveDice,
  getBankedDice,
  getSelectedScore,
} from "./game";
import {
  handleEndTurn,
  handleRoll,
  resetGame,
  toggleDie,
} from "./hooks/useGameHandlers";
import type { GameEvent } from "./messaging";
import { eventBus, gameEngine } from "./messaging";
import type { GameState } from "./types";

const initialState: GameState = {
  dice: [],
  currentScore: 0,
  bankedScore: 0,
  totalScore: 0,
  threshold: calculateThreshold(1),
  thresholdLevel: 1,
  turnNumber: 1,
  gameOver: false,
  message: "Roll the dice to start!",
};

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
          setGameState((currentState) => {
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

  const visualState = {
    ...gameState,
    dice: uiState.rolling ? uiState.displayDice : gameState.dice,
  };
  const activeDice = getActiveDice(visualState);
  const bankedDice = getBankedDice(visualState);
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

        {gameState.message && <MessageBanner message={gameState.message} />}

        <DiceSections
          activeDice={activeDice}
          bankedDice={bankedDice}
          selectedScore={selectedScore}
          onToggleDie={(id) => setGameState(toggleDie(gameState, id))}
          rolling={uiState.rolling}
        />

        <ActionButtons
          canRollAction={canRoll(gameState)}
          canEndTurnAction={canEndTurn(gameState)}
          onRoll={() => handleRoll(gameState, setGameState, setUIState)}
          onEndTurn={() => handleEndTurn(gameState, setGameState, setUIState)}
          onReset={() => resetGame(gameState, setGameState, setUIState)}
        />

        <RulesSection />
      </div>
    </div>
  );
}
