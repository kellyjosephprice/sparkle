"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";

import { canEndTurn, canReRoll, canRoll } from "../src/game";
import { STRINGS } from "../src/strings";
import ActionButtons from "./components/ActionButtons";
import Dice, { DiceRef } from "./components/Dice";
import MessageBanner from "./components/MessageBanner";
import ScoreDisplay from "./components/ScoreDisplay";
import UpgradesMenu from "./components/UpgradesMenu";
import { useGameState } from "./hooks/useGameState";

export default function Home() {
  const {
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
    stagedScore,
    turnStats,
  } = useGameState();

  const diceRef = useRef<DiceRef>(null);

  const handleDieInteraction = useCallback(
    (id: number) => {
      toggleDie(id);
    },
    [toggleDie],
  );

  const setFocusedPosition = useCallback(
    (position: number | null) => {
      setUIState((prev) => ({ ...prev, focusedPosition: position }));
    },
    [setUIState],
  );

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isUpgrading = gameState.upgradeOptions.length > 0;

      // Prevent default behavior for our keys
      if (
        [
          "1",
          "2",
          "3",
          "4",
          "5",
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
        ].includes(event.key) &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey
      ) {
        event.preventDefault();
      }

      // Handle Upgrade Selection (1-2 keys)
      if (isUpgrading) {
        if (event.key === "1") {
          selectUpgrade(gameState.upgradeOptions[0].type);
          return;
        }
        if (event.key === "2" && gameState.upgradeOptions.length > 1) {
          selectUpgrade(gameState.upgradeOptions[1].type);
          return;
        }

        // Arrow navigation for upgrades
        if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
          setUIState((prev) => ({
            ...prev,
            focusedUpgradeIndex:
              prev.focusedUpgradeIndex === null ||
              prev.focusedUpgradeIndex === 0
                ? gameState.upgradeOptions.length - 1
                : 0,
          }));
        }
        if (
          event.key === "ArrowRight" ||
          (event.key.toLowerCase() === "d" && !gameState.lastRollFizzled)
        ) {
          setUIState((prev) => ({
            ...prev,
            focusedUpgradeIndex:
              prev.focusedUpgradeIndex === null ||
              prev.focusedUpgradeIndex === gameState.upgradeOptions.length - 1
                ? 0
                : prev.focusedUpgradeIndex + 1,
          }));
        }

        if (
          (event.key === "Enter" || event.key === " ") &&
          uiState.focusedUpgradeIndex !== null
        ) {
          selectUpgrade(
            gameState.upgradeOptions[uiState.focusedUpgradeIndex].type,
          );
        }

        return; // Disable other keys while upgrading
      }

      // Handle die selection (keys 1-5) - Also sets focus
      if (event.key >= "1" && event.key <= "5") {
        const position = parseInt(event.key);
        diceRef.current?.focusDie(position);

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
        let newPos = currentPos === 1 ? 5 : currentPos - 1;

        // Find next non-banked die (loop until found or back to start)
        let attempts = 0;
        while (attempts < 5) {
          const die = gameState.dice.find((d) => d.position === newPos);
          if (die && !die.banked) break;

          newPos = newPos === 1 ? 5 : newPos - 1;
          attempts++;
        }

        diceRef.current?.focusDie(newPos);
      }

      // Arrow Right / D: Move focus right with wraparound
      if (
        (event.key === "ArrowRight" ||
          (event.key.toLowerCase() === "d" && !gameState.lastRollFizzled)) &&
        !uiState.rolling
      ) {
        const currentPos = uiState.focusedPosition ?? 1;
        let newPos = currentPos === 5 ? 1 : currentPos + 1;

        // Find next non-banked die (loop until found or back to start)
        let attempts = 0;
        while (attempts < 5) {
          const die = gameState.dice.find((d) => d.position === newPos);
          if (die && !die.banked) break;

          newPos = newPos === 5 ? 1 : newPos + 1;
          attempts++;
        }

        diceRef.current?.focusDie(newPos);
      }

      // Arrow Down / S: Select focused die (move to banked)
      if (
        (event.key === "ArrowDown" || event.key.toLowerCase() === "s") &&
        uiState.focusedPosition &&
        !uiState.rolling
      ) {
        if (event.shiftKey) {
          selectAll();
        } else {
          const die = gameState.dice.find(
            (d) => d.position === uiState.focusedPosition,
          );
          if (die && !die.banked && !die.staged) {
            handleDieInteraction(die.id);
          }
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

      // Handle roll (spacebar)
      if (event.key === " " && !uiState.rolling) {
        if (canRoll(gameState)) {
          handleRoll();
        } else if (canReRoll(gameState) && gameState.lastRollFizzled) {
          handleReRoll();
        }
      }

      // Handle re-roll (R key)
      if (
        event.key.toLowerCase() === "r" &&
        canReRoll(gameState) &&
        !uiState.rolling
      ) {
        handleReRoll();
      }

      // Handle end turn (Enter)
      if (event.key === "Enter" && canEndTurn(gameState) && !uiState.rolling) {
        handleEndTurn();
      }

      // Handle new game (Backspace)
      if (event.key === "Backspace" && !uiState.rolling) {
        resetGame();
      }
    },
    [
      gameState,
      uiState.rolling,
      uiState.focusedPosition,
      uiState.focusedUpgradeIndex,
      handleDieInteraction,
      selectUpgrade,
      handleRoll,
      handleReRoll,
      handleEndTurn,
      resetGame,
      selectAll,
      setUIState,
    ],
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

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-baseline mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tighter">
            {STRINGS.game.title} ✨
          </h1>
          <Link
            href="/rules"
            className="text-amber-50/50 hover:text-amber-50 underline underline-offset-4 text-sm font-medium transition-colors"
          >
            {STRINGS.ui.rules}
          </Link>
        </div>

        <ScoreDisplay
          bankedScore={gameState.bankedScore}
          stagedScore={stagedScore}
          highScore={gameState.highScore}
          extraDicePool={gameState.extraDicePool}
          threshold={gameState.threshold}
          totalScore={gameState.totalScore}
          turnNumber={gameState.turnNumber}
          multiplier={turnStats.multiplier}
          bonus={turnStats.bonus}
        />

        <Dice
          ref={diceRef}
          dice={visualState.dice}
          onToggleDie={toggleDie}
          rolling={uiState.rolling}
          onFocusDie={setFocusedPosition}
          potentialUpgradePosition={gameState.potentialUpgradePosition}
          upgradeOptions={gameState.upgradeOptions}
          onSelectUpgrade={selectUpgrade}
          focusedUpgradeIndex={uiState.focusedUpgradeIndex}
        />

        {gameState.message && <MessageBanner message={gameState.message} />}

        <ActionButtons
          canRollAction={
            canRoll(gameState) && !gameState.potentialUpgradePosition
          }
          canEndTurnAction={
            canEndTurn(gameState) && !gameState.potentialUpgradePosition
          }
          canReRollAction={
            canReRoll(gameState) && !gameState.potentialUpgradePosition
          }
          onRoll={handleRoll}
          onEndTurn={handleEndTurn}
          onReset={resetGame}
          onReRoll={handleReRoll}
        />

        <UpgradesMenu dice={gameState.dice} />
      </div>
    </div>
  );
}
