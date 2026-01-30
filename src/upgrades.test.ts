import { describe, expect, it } from "vitest";

import { getStagedScore, initialState } from "./game";
import type { Die, DieUpgrade, DieValue, GameState } from "./types";

describe("Upgrades Scoring Logic", () => {
  const createMockDie = (
    id: number,
    value: number,
    upgrades: DieUpgrade[] = [],
  ): Die => ({
    id,
    value: value as DieValue,
    staged: true,
    banked: false,
    position: id,
    upgrades,
  });

  it("should apply BANKED_SCORE_BONUS to staged scoring dice (as pending upgrade)", () => {
    const die1 = createMockDie(1, 1, [{ type: "BANKED_SCORE_BONUS", id: "u1" }]); // 100 base + 500 bonus
    const state: GameState = {
      ...initialState,
      dice: [die1],
    };

    expect(getStagedScore(state)).toBe(600);
  });

  it("should apply BANKED_SCORE_MULTIPLIER to staged scoring dice (as pending upgrade)", () => {
    const die1 = createMockDie(1, 1, [{ type: "BANKED_SCORE_MULTIPLIER", id: "u1" }]); // 100 base * 2
    const state: GameState = {
      ...initialState,
      dice: [die1],
    };

    expect(getStagedScore(state)).toBe(200);
  });

  it("should apply BANKED_SCORE_BONUS from already banked dice", () => {
    const die1 = createMockDie(1, 1); // 100 base
    const bankedDie = {
      ...createMockDie(2, 2, [{ type: "BANKED_SCORE_BONUS", id: "u2" }]),
      banked: true,
      staged: false,
    };
    const state: GameState = {
      ...initialState,
      dice: [die1, bankedDie],
    };

    expect(getStagedScore(state)).toBe(600); // 100 + 500
  });

  it("should apply BANKED_SCORE_MULTIPLIER from already banked dice", () => {
    const die1 = createMockDie(1, 1); // 100 base
    const bankedDie = {
      ...createMockDie(2, 2, [{ type: "BANKED_SCORE_MULTIPLIER", id: "u2" }]),
      banked: true,
      staged: false,
    };
    const state: GameState = {
      ...initialState,
      dice: [die1, bankedDie],
    };

    expect(getStagedScore(state)).toBe(200); // 100 * 2
  });

  it("should stack bonuses and multipliers correctly (bonuses first)", () => {
    const die1 = createMockDie(1, 1, [
      { type: "BANKED_SCORE_BONUS", id: "u1" },
      { type: "BANKED_SCORE_MULTIPLIER", id: "u2" },
    ]); // (100 base + 500 bonus) * 2 = 1200
    const state: GameState = {
      ...initialState,
      dice: [die1],
    };

    expect(getStagedScore(state)).toBe(1200);
  });

  it("should stack multiple multipliers", () => {
    const die1 = createMockDie(1, 1, [{ type: "BANKED_SCORE_MULTIPLIER", id: "u1" }]);
    const bankedDie = {
      ...createMockDie(2, 2, [{ type: "BANKED_SCORE_MULTIPLIER", id: "u2" }]),
      banked: true,
      staged: false,
    };
    const state: GameState = {
      ...initialState,
      dice: [die1, bankedDie],
    };

    expect(getStagedScore(state)).toBe(400); // 100 * 2 * 2
  });

  it("should NOT apply upgrades from non-scoring staged dice", () => {
    const die1 = createMockDie(1, 1); // 100 base
    const die2 = createMockDie(2, 2, [{ type: "BANKED_SCORE_BONUS", id: "u1" }]); // 2 is not scoring unless part of combination
    const state: GameState = {
      ...initialState,
      dice: [die1, die2],
    };

    expect(getStagedScore(state)).toBe(100); // Only die1 scores
  });

  it("should apply TEN_X_MULTIPLIER to staged scoring dice", () => {
    const die1 = createMockDie(1, 1, [
      { type: "TEN_X_MULTIPLIER", id: "u1", remainingUses: 3 },
    ]); // 100 base * 10
    const state: GameState = {
      ...initialState,
      dice: [die1],
    };

    expect(getStagedScore(state)).toBe(1000);
  });

  it("should NOT apply TEN_X_MULTIPLIER if no uses left", () => {
    const die1 = createMockDie(1, 1, [
      { type: "TEN_X_MULTIPLIER", id: "u1", remainingUses: 0 },
    ]);
    const state: GameState = {
      ...initialState,
      dice: [die1],
    };

    expect(getStagedScore(state)).toBe(100);
  });

  it("should apply SET_BONUS to a scoring set", () => {
    // 3 ones = 1000 base. 
    // One die has SET_BONUS -> 1000 * 1^3 = 1000
    const die1 = createMockDie(1, 1, [{ type: "SET_BONUS", id: "s1" }]);
    const die2 = createMockDie(2, 1);
    const die3 = createMockDie(3, 1);
    
    const state: GameState = {
      ...initialState,
      dice: [die1, die2, die3],
    };

    expect(getStagedScore(state)).toBe(1000);
  });

  it("should apply SET_BONUS multiplier n^3 where n is number of dice with upgrade", () => {
    // 3 ones = 1000 base.
    // Two dice have SET_BONUS -> 1000 * 2^3 = 8000
    const die1 = createMockDie(1, 1, [{ type: "SET_BONUS", id: "s1" }]);
    const die2 = createMockDie(2, 1, [{ type: "SET_BONUS", id: "s2" }]);
    const die3 = createMockDie(3, 1);
    
    const state: GameState = {
      ...initialState,
      dice: [die1, die2, die3],
    };

    expect(getStagedScore(state)).toBe(8000);
  });

  it("should NOT apply SET_BONUS to individual scoring dice", () => {
    // Single one = 100 base. 
    // Has SET_BONUS but it's not a set -> 100
    const die1 = createMockDie(1, 1, [{ type: "SET_BONUS", id: "s1" }]);
    
    const state: GameState = {
      ...initialState,
      dice: [die1],
    };

    expect(getStagedScore(state)).toBe(100);
  });
});
