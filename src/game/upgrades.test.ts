import { describe, expect, it } from "vitest";

import { getStagedScore, initialState } from "./index";
import type { Die, DieUpgrade, DieValue, GameState } from "./types";

describe("Upgrades Scoring Logic", () => {
  const createMockDie = (
    id: number,
    value: any,
    upgrades: DieUpgrade[] = [],
  ): Die => ({
    id,
    value: value as DieValue,
    staged: true,
    banked: false,
    position: id,
    upgrades,
    isSparkDie: value === "spark",
  });

  it("should apply BANKED_SCORE_BONUS to staged scoring dice (as pending upgrade)", () => {
    // Single 1 = 10 base + 500 bonus = 510
    const die1 = createMockDie(1, 1, [
      { type: "BANKED_SCORE_BONUS", id: "u1" },
    ]);
    const state: GameState = {
      ...initialState,
      dice: [die1],
    };

    expect(getStagedScore(state)).toBe(510);
  });

  it("should apply BANKED_SCORE_MULTIPLIER to staged scoring dice (as pending upgrade)", () => {
    // Single 1 = 10 base * 2 = 20
    const die1 = createMockDie(1, 1, [
      { type: "BANKED_SCORE_MULTIPLIER", id: "u1" },
    ]);
    const state: GameState = {
      ...initialState,
      dice: [die1],
    };

    expect(getStagedScore(state)).toBe(20);
  });

  it("should apply BANKED_SCORE_BONUS from already banked dice", () => {
    const die1 = createMockDie(1, 1); // 10 base
    const bankedDie = {
      ...createMockDie(2, 2, [{ type: "BANKED_SCORE_BONUS", id: "u2" }]),
      banked: true,
      staged: false,
    };
    const state: GameState = {
      ...initialState,
      dice: [die1, bankedDie],
    };

    expect(getStagedScore(state)).toBe(510); // 10 + 500
  });

  it("should apply BANKED_SCORE_MULTIPLIER from already banked dice", () => {
    const die1 = createMockDie(1, 1); // 10 base
    const bankedDie = {
      ...createMockDie(2, 2, [{ type: "BANKED_SCORE_MULTIPLIER", id: "u2" }]),
      banked: true,
      staged: false,
    };
    const state: GameState = {
      ...initialState,
      dice: [die1, bankedDie],
    };

    expect(getStagedScore(state)).toBe(20); // 10 * 2
  });

  it("should stack multiple multipliers", () => {
    const die1 = createMockDie(1, 1, [
      { type: "BANKED_SCORE_MULTIPLIER", id: "u1" },
    ]);
    const bankedDie = {
      ...createMockDie(2, 2, [{ type: "BANKED_SCORE_MULTIPLIER", id: "u2" }]),
      banked: true,
      staged: false,
    };
    const state: GameState = {
      ...initialState,
      dice: [die1, bankedDie],
    };

    expect(getStagedScore(state)).toBe(40); // 10 * 2 * 2
  });

  it("should apply SET_BONUS multiplier n^3 where n is number of dice with upgrade", () => {
    // 3 ones = 100 base.
    // Two dice have SET_BONUS -> 100 * 2^3 = 800
    const die1 = createMockDie(1, 1, [{ type: "SET_BONUS", id: "s1" }]);
    const die2 = createMockDie(2, 1, [{ type: "SET_BONUS", id: "s2" }]);
    const die3 = createMockDie(3, 1);

    const state: GameState = {
      ...initialState,
      dice: [die1, die2, die3],
    };

    expect(getStagedScore(state)).toBe(800);
  });
});
