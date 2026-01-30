import { beforeEach, describe, expect, it } from "vitest";

import { canReRoll } from "./game";
import { gameEngine } from "./messaging";
import { STRINGS } from "./strings";
import type { GameState } from "./types";

describe("Re-Roll Mechanic", () => {
  let state: GameState;

  beforeEach(() => {
    const resetResult = gameEngine.processCommand({} as GameState, {
      type: "RESET_GAME",
    });
    state = resetResult.state;
  });

  it("should start with 5 extra dice available", () => {
    expect(state.extraDicePool).toBe(5);
  });

  it("should consume extra dice when re-rolling", () => {
    // Roll dice first to have active dice
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;

    const result = gameEngine.processCommand(state, { type: "RE_ROLL" });
    // Cost is 5 (all active dice)
    expect(result.state.extraDicePool).toBe(0);
  });

  it("should not allow re-roll when extra dice pool is 0", () => {
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;
    state.extraDicePool = 0;

    const result = gameEngine.processCommand(state, { type: "RE_ROLL" });
    expect(result.state.message).toBe(STRINGS.errors.noExtraDice);
  });

  it("should preserve banked dice when re-rolling", () => {
    // Roll dice
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;

    // Find a scoring die and bank it
    const scoringDie = state.dice.find(
      (d) => (d.value === 1 || d.value === 5 || d.value === "spark") && !d.banked,
    );

    if (scoringDie) {
      state = gameEngine.processCommand(state, {
        type: "TOGGLE_DIE",
        dieId: scoringDie.id,
      }).state;
      state = gameEngine.processCommand(state, { type: "BANK_DICE" }).state;

      const bankedCount = state.dice.filter((d) => d.banked).length;

      // Re-roll active dice
      const result = gameEngine.processCommand(state, { type: "RE_ROLL" });

      // Banked dice should remain
      const newBankedCount = result.state.dice.filter((d) => d.banked).length;
      expect(newBankedCount).toBe(bankedCount);
    }
  });

  it("should allow re-roll after fizzle", () => {
    // Roll dice
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;

    // Manually simulate fizzle state
    state = { ...state, lastRollFizzled: true, extraDicePool: 5 };

    // canReRoll should return true if extra dice available
    expect(canReRoll(state)).toBe(true);

    // Should be able to use re-roll
    const result = gameEngine.processCommand(state, { type: "RE_ROLL" });
    expect(result.state.extraDicePool).toBe(0);
  });

  it("should reset extra dice count on new game", () => {
    // Use extra dice
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;
    state = gameEngine.processCommand(state, { type: "RE_ROLL" }).state;
    expect(state.extraDicePool).toBe(0);

    // Reset game
    const result = gameEngine.processCommand(state, { type: "RESET_GAME" });
    expect(result.state.extraDicePool).toBe(5);
  });

  it("canReRoll should return false when no extra dice available", () => {
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;
    state.extraDicePool = 0;

    expect(canReRoll(state)).toBe(false);
  });

  it("canReRoll should return false when game is over", () => {
    state = { ...state, gameOver: true };
    expect(canReRoll(state)).toBe(false);
  });

  it("should create new dice when re-rolling", () => {
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;
    const result = gameEngine.processCommand(state, { type: "RE_ROLL" });
    expect(result.state.dice.length).toBe(5);
  });
});
