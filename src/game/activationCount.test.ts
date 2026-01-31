import { beforeEach, describe, expect, it } from "vitest";

import { gameEngine } from "../messaging";
import type { GameState } from "./types";

describe("Scoring Activation Counts", () => {
  let state: GameState;

  beforeEach(() => {
    // Start with a fresh game state
    const resetResult = gameEngine.processCommand({} as GameState, {
      type: "RESET_GAME",
    });
    state = resetResult.state;
  });

  it("should not increment activation count when just selecting dice", () => {
    // Set up dice with a 5
    state.dice = state.dice.map((die, index) =>
      index === 0 ? { ...die, value: 5, position: 1 } : die,
    );

    // Select the die with value 5
    const toggleResult = gameEngine.processCommand(state, {
      type: "TOGGLE_DIE",
      dieId: state.dice[0].id,
    });

    // Activation count should still be 0 (not incremented on selection)
    const singleFiveRule = toggleResult.state.scoringRules["single_five"];
    expect(singleFiveRule?.activationCount).toBe(0);
  });

  it("should increment activation count only when banking dice", () => {
    // Set up dice with a 5
    state.dice = state.dice.map((die, index) =>
      index === 0 ? { ...die, value: 5, position: 1 } : die,
    );

    // Select the die
    let result = gameEngine.processCommand(state, {
      type: "TOGGLE_DIE",
      dieId: state.dice[0].id,
    });

    let singleFiveRule = result.state.scoringRules.single_five;
    expect(singleFiveRule?.activationCount).toBe(0);

    // Bank the dice
    result = gameEngine.processCommand(result.state, {
      type: "BANK_DICE",
    });

    // Now activation count should be 1
    singleFiveRule = result.state.scoringRules.single_five;
    expect(singleFiveRule?.activationCount).toBe(1);
  });

  it("should increment activation count each time dice are banked", () => {
    // Set up dice with multiple 5s
    state.dice = state.dice.map((die, index) => ({
      ...die,
      value: 5,
      position: index + 1,
    }));

    // Select and bank first 5
    let result = gameEngine.processCommand(state, {
      type: "TOGGLE_DIE",
      dieId: state.dice[0].id,
    });
    result = gameEngine.processCommand(result.state, {
      type: "BANK_DICE",
    });

    let singleFiveRule = result.state.scoringRules.single_five;
    expect(singleFiveRule?.activationCount).toBe(1);

    // Select and bank second 5
    result = gameEngine.processCommand(result.state, {
      type: "TOGGLE_DIE",
      dieId: state.dice[1].id,
    });
    result = gameEngine.processCommand(result.state, {
      type: "BANK_DICE",
    });

    singleFiveRule = result.state.scoringRules.single_five;
    expect(singleFiveRule?.activationCount).toBe(2);
  });

  it("should handle multiple different rules being activated", () => {
    // Set up dice: three 2s and a 5
    state.dice = state.dice.map((die, index) => {
      if (index < 3) return { ...die, value: 2, position: index + 1 };
      if (index === 3) return { ...die, value: 5, position: index + 1 };
      return die;
    });

    // Select three 2s and the 5
    for (let i = 0; i < 4; i++) {
      state = gameEngine.processCommand(state, {
        type: "TOGGLE_DIE",
        dieId: state.dice[i].id,
      }).state;
    }

    // Bank them
    const result = gameEngine.processCommand(state, {
      type: "BANK_DICE",
    });

    // Check that both rules were activated once
    const threeOfKindRule = result.state.scoringRules.single_five;
    const singleFiveRule = result.state.scoringRules.single_five;

    expect(threeOfKindRule?.activationCount).toBe(1);
    expect(singleFiveRule?.activationCount).toBe(1);
  });

  it("should reset activation counts when starting a new game", () => {
    // Set up and bank some dice first
    state.dice = state.dice.map((die, index) =>
      index === 0 ? { ...die, value: 5, position: 1 } : die,
    );

    state = gameEngine.processCommand(state, {
      type: "TOGGLE_DIE",
      dieId: state.dice[0].id,
    }).state;

    state = gameEngine.processCommand(state, {
      type: "BANK_DICE",
    }).state;

    // Verify count is 1
    let singleFiveRule = state.scoringRules.single_five;
    expect(singleFiveRule?.activationCount).toBe(1);

    // Reset game
    const result = gameEngine.processCommand(state, {
      type: "RESET_GAME",
    });

    // Count should be back to 0
    singleFiveRule = result.state.scoringRules.single_five;
    expect(singleFiveRule?.activationCount).toBe(0);
  });
});
