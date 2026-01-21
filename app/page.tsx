"use client";

import { useState, useEffect } from "react";
import type { GameState } from "./types";
import { actions } from "./types";
import {
  gameReducer,
  createDice,
  getActiveDice,
  getBankedDice,
  getSelectedDice,
  getSelectedScore,
  canRoll,
  canEndTurn,
  calculateThreshold,
} from "./game";
import Dice from "./components/Dice";

const initialState: GameState = {
  dice: [],
  currentScore: 0,
  bankedScore: 0,
  totalScore: 0,
  threshold: calculateThreshold(1),
  turnNumber: 1,
  gameOver: false,
  message: "Roll the dice to start!",
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [rolling, setRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState<typeof initialState.dice>([]);

  useEffect(() => {
    setGameState((prev) => ({ ...prev, dice: createDice(6) }));
  }, []);

  // Update display dice when game state changes (and not rolling)
  useEffect(() => {
    if (!rolling) {
      setDisplayDice(gameState.dice);
    }
  }, [gameState.dice, rolling]);

  // Use selectors for derived values (use displayDice for visual, gameState for logic)
  const activeDice = getActiveDice({ ...gameState, dice: displayDice });
  const bankedDice = getBankedDice({ ...gameState, dice: displayDice });
  const selectedScore = getSelectedScore(gameState);

  // Helper to shuffle dice values during animation (only active dice)
  const shuffleDiceValues = () => {
    setDisplayDice(prev => prev.map(die =>
      die.banked ? die : {
        ...die,
        value: (Math.floor(Math.random() * 6) + 1) as typeof die.value,
      }
    ));
  };

  const toggleDie = (id: number) => {
    const result = gameReducer(gameState, actions.toggleDie(id));
    setGameState(result.state);
  };

  const handleRoll = () => {
    let currentState = gameState;

    // Auto-bank selected dice first if any
    const selectedDice = getSelectedDice(currentState);
    if (selectedDice.length > 0) {
      const bankResult = gameReducer(currentState, actions.bank());
      currentState = bankResult.state;
      setGameState(currentState);
    }

    // Then roll
    const result = gameReducer(currentState, actions.roll());
    setGameState(result.state);

    // Immediately update display dice to show new state (with banked dice in place)
    setDisplayDice(result.state.dice);

    // Trigger roll animation
    setRolling(true);

    // Shuffle only active dice values during animation
    const shuffleInterval = setInterval(shuffleDiceValues, 50);

    // End animation after 500ms
    setTimeout(() => {
      clearInterval(shuffleInterval);
      setRolling(false);
      setDisplayDice(result.state.dice);
    }, 500);

    // Handle delayed action (e.g., auto-end turn after sparkle)
    if (result.delayedAction) {
      setTimeout(() => {
        const endTurnResult = gameReducer(
          result.state,
          actions.endTurn(result.delayedAction!.isSparkled)
        );
        setGameState(endTurnResult.state);
      }, result.delayedAction.delay);
    }
  };

  const handleEndTurn = () => {
    let currentState = gameState;

    // Auto-bank selected dice first if any
    const selectedDice = getSelectedDice(currentState);
    if (selectedDice.length > 0) {
      const bankResult = gameReducer(currentState, actions.bank());
      currentState = bankResult.state;
      setGameState(currentState);
    }

    // Then end turn
    const result = gameReducer(currentState, actions.endTurn(false));
    setGameState(result.state);

    // Trigger roll animation for new turn dice
    if (!result.state.gameOver) {
      // Immediately update display dice to show new state
      setDisplayDice(result.state.dice);

      setRolling(true);

      // Shuffle dice values during animation
      const shuffleInterval = setInterval(shuffleDiceValues, 50);

      setTimeout(() => {
        clearInterval(shuffleInterval);
        setRolling(false);
        setDisplayDice(result.state.dice);
      }, 500);
    }

    // Handle delayed action (e.g., auto-end turn after sparkle on new turn)
    if (result.delayedAction) {
      setTimeout(() => {
        const endTurnResult = gameReducer(
          result.state,
          actions.endTurn(result.delayedAction!.isSparkled)
        );
        setGameState(endTurnResult.state);
      }, result.delayedAction.delay);
    }
  };

  const resetGame = () => {
    const result = gameReducer(gameState, actions.reset());
    setGameState(result.state);

    // Immediately update display dice to show new state
    setDisplayDice(result.state.dice);

    // Trigger roll animation for new game dice
    setRolling(true);

    // Shuffle dice values during animation
    const shuffleInterval = setInterval(shuffleDiceValues, 50);

    setTimeout(() => {
      clearInterval(shuffleInterval);
      setRolling(false);
      setDisplayDice(result.state.dice);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Sparkle</h1>

        <div className="flex gap-8 mb-6 text-sm">
          <div>
            <div className="text-gray-400">Score</div>
            <div className="text-2xl font-bold text-white">
              {gameState.totalScore}
            </div>
          </div>
          <div>
            <div className="text-gray-400">This Turn</div>
            <div className="text-2xl font-bold text-white">
              {gameState.currentScore + selectedScore}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Turn {gameState.turnNumber}</div>
            <div className="text-sm text-gray-300">
              Threshold: {gameState.threshold}
            </div>
          </div>
        </div>

        {gameState.message && (
          <div className="border-l-4 border-white bg-gray-900 p-3 mb-6 text-sm text-white">
            {gameState.message}
          </div>
        )}

        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-white mb-3">Active Dice</h2>
            <Dice
              dice={activeDice.filter(d => !d.selected)}
              onToggleDie={toggleDie}
              rolling={rolling}
            />
          </div>

          <div className="pt-6 border-t border-gray-800">
            <h2 className="text-lg font-medium text-white mb-3">
              Banked Dice
              {selectedScore > 0 && (
                <span className="text-sm text-gray-400 font-normal ml-2">
                  ({selectedScore} points staged)
                </span>
              )}
            </h2>
            <Dice
              dice={[...bankedDice, ...activeDice.filter(d => d.selected)]}
              onToggleDie={toggleDie}
              rolling={false}
            />
            {bankedDice.length === 0 && activeDice.filter(d => d.selected).length === 0 && (
              <div className="text-gray-600 text-sm italic">No dice banked yet</div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={handleRoll}
            disabled={!canRoll(gameState)}
            className="px-4 py-2 border-2 border-white text-white hover:bg-white hover:text-black
                     disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-transparent
                     disabled:cursor-not-allowed transition-colors font-medium"
          >
            Roll
          </button>

          <button
            onClick={handleEndTurn}
            disabled={!canEndTurn(gameState)}
            className="px-4 py-2 border-2 border-white text-white hover:bg-white hover:text-black
                     disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-transparent
                     disabled:cursor-not-allowed transition-colors font-medium"
          >
            End Turn
          </button>

          <button
            onClick={resetGame}
            className="px-4 py-2 border-2 border-gray-600 text-gray-300 hover:border-white hover:text-white transition-colors ml-auto font-medium"
          >
            New Game
          </button>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-white mb-3">
            Rules
          </summary>
          <table className="w-full mt-2 border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-white font-medium">
                  Combination
                </th>
                <th className="text-right py-2 text-white font-medium">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              <tr className="border-b border-gray-800">
                <td className="py-2">1</td>
                <td className="text-right">100</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">5</td>
                <td className="text-right">50</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">111</td>
                <td className="text-right">1,000</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">222/333/444/555/666</td>
                <td className="text-right">value × 100</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">XXXX</td>
                <td className="text-right">double</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">XXXXX</td>
                <td className="text-right">4×</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">XXXXXX</td>
                <td className="text-right">8×</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">1-2-3-4-5-6</td>
                <td className="text-right">1,500</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">XXYYZZ</td>
                <td className="text-right">1,500</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">Threshold</td>
                <td className="text-right">100 × 2^(turn-1)</td>
              </tr>
              <tr>
                <td className="py-2">Sparkle</td>
                <td className="text-right">Game Over</td>
              </tr>
            </tbody>
          </table>
        </details>
      </div>
    </div>
  );
}
