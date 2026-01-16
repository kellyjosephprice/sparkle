"use client";

import { useState, useEffect } from "react";
import type { GameState } from "./types";
import { actions } from "./types";
import {
  gameReducer,
  createDice,
  getActiveDice,
  getBankedDice,
  getSelectedScore,
  canRoll,
  canBank,
  canEndTurn,
} from "./game";
import Dice from "./components/Dice";

const initialState: GameState = {
  dice: [],
  currentScore: 0,
  bankedScore: 0,
  totalScore: 0,
  isOnBoard: false,
  turnNumber: 1,
  gameOver: false,
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [message, setMessage] = useState("Roll the dice to start!");

  useEffect(() => {
    setGameState((prev) => ({ ...prev, dice: createDice(6) }));
  }, []);

  // Use selectors for derived values
  const activeDice = getActiveDice(gameState);
  const bankedDice = getBankedDice(gameState);
  const selectedScore = getSelectedScore(gameState);

  const toggleDie = (id: number) => {
    const result = gameReducer(gameState, actions.toggleDie(id));
    setGameState(result.state);
    if (result.message !== undefined) {
      setMessage(result.message);
    }
  };

  const handleRoll = () => {
    const result = gameReducer(gameState, actions.roll());
    setGameState(result.state);
    if (result.message) {
      setMessage(result.message);
    }

    // Handle delayed action (e.g., auto-end turn after sparkle)
    if (result.delayedAction) {
      setTimeout(() => {
        const endTurnResult = gameReducer(
          result.state,
          actions.endTurn(result.delayedAction!.isFarkled)
        );
        setGameState(endTurnResult.state);
        if (endTurnResult.message) {
          setMessage(endTurnResult.message);
        }
      }, result.delayedAction.delay);
    }
  };

  const handleBank = () => {
    const result = gameReducer(gameState, actions.bank());
    setGameState(result.state);
    if (result.message) {
      setMessage(result.message);
    }
  };

  const handleEndTurn = () => {
    if (!canEndTurn(gameState)) {
      if (gameState.bankedScore === 0 && selectedScore === 0) {
        setMessage("You must bank some points before ending your turn!");
      } else if (selectedScore > 0) {
        setMessage("Bank your selected dice first!");
      }
      return;
    }

    const result = gameReducer(gameState, actions.endTurn(false));
    setGameState(result.state);
    if (result.message) {
      setMessage(result.message);
    }
  };

  const resetGame = () => {
    const result = gameReducer(gameState, actions.reset());
    setGameState(result.state);
    if (result.message) {
      setMessage(result.message);
    }
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
              {gameState.isOnBoard ? "On Board" : "Not On Board"}
            </div>
          </div>
        </div>

        {message && (
          <div className="border-l-4 border-white bg-gray-900 p-3 mb-6 text-sm text-white">
            {message}
          </div>
        )}

        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-white mb-3">Active Dice</h2>
            <Dice dice={activeDice} onToggleDie={toggleDie} />

            {selectedScore > 0 && (
              <div className="text-center mt-4 text-sm text-gray-300">
                Selected:{" "}
                <span className="font-bold text-white">
                  {selectedScore} points
                </span>
              </div>
            )}
          </div>

          {bankedDice.length > 0 && (
            <div className="pt-6 border-t border-gray-800">
              <h2 className="text-lg font-medium text-white mb-3">
                Banked Dice
              </h2>
              <Dice dice={bankedDice} onToggleDie={toggleDie} />
            </div>
          )}
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
            onClick={handleBank}
            disabled={!canBank(gameState)}
            className="px-4 py-2 border-2 border-white text-white hover:bg-white hover:text-black
                     disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-transparent
                     disabled:cursor-not-allowed transition-colors font-medium"
          >
            Bank
          </button>

          <button
            onClick={handleEndTurn}
            disabled={gameState.gameOver}
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
                <td className="py-2">Single 1</td>
                <td className="text-right">100</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">Single 5</td>
                <td className="text-right">50</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">Three 1s</td>
                <td className="text-right">1,000</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">Three of any other</td>
                <td className="text-right">value × 100</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">Four of a kind</td>
                <td className="text-right">double</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">Five of a kind</td>
                <td className="text-right">quadruple</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">Six of a kind</td>
                <td className="text-right">8×</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">Straight (1-2-3-4-5-6)</td>
                <td className="text-right">1,500</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">Three pairs</td>
                <td className="text-right">1,500</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2">Get on board</td>
                <td className="text-right">500 minimum</td>
              </tr>
              <tr>
                <td className="py-2">Win</td>
                <td className="text-right">10,000</td>
              </tr>
            </tbody>
          </table>
        </details>
      </div>
    </div>
  );
}
