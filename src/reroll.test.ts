import { beforeEach, describe, expect, it } from "vitest";

import { canReRoll } from "./game";
import { gameEngine } from "./messaging";
import type { GameState } from "./types";

describe("Re-Roll Mechanic", () => {
  let state: GameState;

  beforeEach(() => {
    const resetResult = gameEngine.processCommand({} as GameState, {
      type: "RESET_GAME",
    });
    state = resetResult.state;
  });

  it("should start with 1 re-roll available", () => {
    expect(state.rerollsAvailable).toBe(1);
  });

  it("should decrement re-roll count when used", () => {
    // Roll dice first to have active dice
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;

    // Use re-roll
    const result = gameEngine.processCommand(state, { type: "RE_ROLL" });
    expect(result.state.rerollsAvailable).toBe(0);
  });

  it("should not allow re-roll when count is 0", () => {
    // Roll and use the initial re-roll
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;
    state = gameEngine.processCommand(state, { type: "RE_ROLL" }).state;

    // Try to re-roll again
    const result = gameEngine.processCommand(state, { type: "RE_ROLL" });
    expect(result.state.message).toContain("No re-rolls available");
    expect(result.state.rerollsAvailable).toBe(0);
  });

  it("should preserve banked dice when re-rolling", () => {
    // Roll dice
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;

    // Find a scoring die and bank it
    const scoringDie = state.dice.find(
      (d) => (d.value === 1 || d.value === 5) && !d.banked,
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

  it("should allow re-roll after sparkle", () => {
    // Roll dice
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;

    // Manually simulate sparkle state
    state = { ...state, lastRollSparkled: true };

    // canReRoll should return true if re-rolls available
    expect(canReRoll(state)).toBe(true);

    // Should be able to use re-roll
    const result = gameEngine.processCommand(state, { type: "RE_ROLL" });
    expect(result.state.rerollsAvailable).toBe(0);
  });

  it("should reset re-roll count on new game", () => {
    // Use re-roll
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;
    state = gameEngine.processCommand(state, { type: "RE_ROLL" }).state;
    expect(state.rerollsAvailable).toBe(0);

    // Reset game
    const result = gameEngine.processCommand(state, { type: "RESET_GAME" });
    expect(result.state.rerollsAvailable).toBe(1);
  });

  it("canReRoll should return false when no re-rolls available", () => {
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;
    state = gameEngine.processCommand(state, { type: "RE_ROLL" }).state;

    expect(canReRoll(state)).toBe(false);
  });

  it("canReRoll should return false when game is over", () => {
    state = { ...state, gameOver: true };
    expect(canReRoll(state)).toBe(false);
  });

  it("should create new dice when re-rolling", () => {
    state = gameEngine.processCommand(state, { type: "ROLL_DICE" }).state;
    const activeDiceCount = state.dice.filter((d) => !d.banked).length;

    const result = gameEngine.processCommand(state, { type: "RE_ROLL" });
    const newActiveDiceCount = result.state.dice.filter((d) => !d.banked).length;

    // Should have same number of active dice
    expect(newActiveDiceCount).toBe(activeDiceCount);
    // Re-roll count should be decremented
    expect(result.state.rerollsAvailable).toBe(0);
  });
});
