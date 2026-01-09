'use client';

import { useState, useEffect } from 'react';
import type { Die, DieValue, GameState } from './types';
import { calculateScore, isFarkle } from './scoring';
import Dice from './components/Dice';

const WINNING_SCORE = 10000;
const MIN_SCORE_TO_GET_ON_BOARD = 500;

function rollDice(count: number): Die[] {
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    value: (Math.floor(Math.random() * 6) + 1) as DieValue,
    selected: false,
    banked: false,
  }));
}

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
  const [message, setMessage] = useState('Roll the dice to start!');

  useEffect(() => {
    setGameState(prev => ({ ...prev, dice: rollDice(6) }));
  }, []);

  const selectedDice = gameState.dice.filter(d => d.selected && !d.banked);
  const activeDice = gameState.dice.filter(d => !d.banked);
  const selectedScore = calculateScore(selectedDice);

  const toggleDie = (id: number) => {
    if (gameState.gameOver) return;

    setGameState(prev => ({
      ...prev,
      dice: prev.dice.map(die =>
        die.id === id && !die.banked
          ? { ...die, selected: !die.selected }
          : die
      ),
    }));
    setMessage('');
  };

  const handleRoll = () => {
    if (gameState.gameOver) return;

    const newDice = rollDice(activeDice.length);

    setGameState(prev => ({
      ...prev,
      dice: newDice,
    }));

    // Check for farkle
    if (isFarkle(newDice)) {
      setMessage('💥 FARKLE! You lost all points this turn!');
      setTimeout(() => {
        endTurn(true);
      }, 2000);
    } else {
      setMessage('Select scoring dice and bank them, or roll again!');
    }
  };

  const handleBank = () => {
    if (selectedDice.length === 0) {
      setMessage('Select some dice first!');
      return;
    }

    if (selectedScore === 0) {
      setMessage('Selected dice do not score!');
      return;
    }

    const newBankedScore = gameState.bankedScore + selectedScore;
    const allDiceUsed = activeDice.length === selectedDice.length;

    setGameState(prev => ({
      ...prev,
      dice: allDiceUsed ? rollDice(6) : prev.dice.map(die =>
        die.selected ? { ...die, selected: false, banked: true } : die
      ),
      bankedScore: newBankedScore,
      currentScore: prev.currentScore + selectedScore,
    }));

    if (allDiceUsed) {
      setMessage(`Banked ${selectedScore} points! Hot dice! Rolling all 6 dice again...`);
    } else {
      setMessage(`Banked ${selectedScore} points! Roll again or end turn.`);
    }
  };

  const endTurn = (isFarkled: boolean = false) => {
    const totalTurnScore = isFarkled ? 0 : gameState.currentScore + selectedScore;
    const newTotalScore = gameState.totalScore + totalTurnScore;
    const canGetOnBoard = !gameState.isOnBoard && totalTurnScore >= MIN_SCORE_TO_GET_ON_BOARD;
    const nowOnBoard = gameState.isOnBoard || canGetOnBoard;

    if (!gameState.isOnBoard && !canGetOnBoard && totalTurnScore > 0) {
      setMessage(`Need ${MIN_SCORE_TO_GET_ON_BOARD} points to get on the board. You only scored ${totalTurnScore}. Try again!`);
    }

    const finalScore = nowOnBoard ? newTotalScore : gameState.totalScore;
    const gameOver = finalScore >= WINNING_SCORE;

    setGameState({
      dice: rollDice(6),
      currentScore: 0,
      bankedScore: 0,
      totalScore: finalScore,
      isOnBoard: nowOnBoard,
      turnNumber: gameState.turnNumber + 1,
      gameOver,
    });

    if (gameOver) {
      setMessage(`🎉 You win! Final score: ${finalScore}`);
    } else if (!isFarkled) {
      if (canGetOnBoard) {
        setMessage(`You're on the board! Scored ${totalTurnScore} points!`);
      } else if (nowOnBoard) {
        setMessage(`Turn over! You scored ${totalTurnScore} points!`);
      }
    }
  };

  const handleEndTurn = () => {
    if (gameState.bankedScore === 0 && selectedScore === 0) {
      setMessage('You must bank some points before ending your turn!');
      return;
    }

    if (selectedScore > 0) {
      setMessage('Bank your selected dice first!');
      return;
    }

    endTurn(false);
  };

  const resetGame = () => {
    setGameState({
      dice: rollDice(6),
      currentScore: 0,
      bankedScore: 0,
      totalScore: 0,
      isOnBoard: false,
      turnNumber: 1,
      gameOver: false,
    });
    setMessage('New game started! Roll the dice!');
  };

  const canRoll = activeDice.length > 0 &&
                 selectedDice.length === 0 &&
                 !gameState.gameOver;

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Farkle</h1>

        <div className="flex gap-8 mb-6 text-sm">
          <div>
            <div className="text-gray-400">Score</div>
            <div className="text-2xl font-bold text-white">{gameState.totalScore}</div>
          </div>
          <div>
            <div className="text-gray-400">This Turn</div>
            <div className="text-2xl font-bold text-white">{gameState.currentScore + selectedScore}</div>
          </div>
          <div>
            <div className="text-gray-400">Turn {gameState.turnNumber}</div>
            <div className="text-sm text-gray-300">
              {gameState.isOnBoard ? 'On Board' : 'Not On Board'}
            </div>
          </div>
        </div>

        {message && (
          <div className="border-l-4 border-white bg-gray-900 p-3 mb-6 text-sm text-white">
            {message}
          </div>
        )}

        <div className="mb-8">
          <Dice dice={gameState.dice} onToggleDie={toggleDie} />

          {selectedScore > 0 && (
            <div className="text-center mt-4 text-sm text-gray-300">
              Selected: <span className="font-bold text-white">{selectedScore} points</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={handleRoll}
            disabled={!canRoll}
            className="px-4 py-2 border-2 border-white text-white hover:bg-white hover:text-black
                     disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-transparent
                     disabled:cursor-not-allowed transition-colors font-medium"
          >
            Roll
          </button>

          <button
            onClick={handleBank}
            disabled={selectedDice.length === 0 || gameState.gameOver}
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
          <summary className="cursor-pointer font-medium text-white mb-3">Rules</summary>
          <table className="w-full mt-2 border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-white font-medium">Combination</th>
                <th className="text-right py-2 text-white font-medium">Points</th>
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
