import { beforeEach, describe, expect, it } from "vitest";

import { canEndTurn } from "./game";
import { gameEngine } from "./messaging";
import type { GameState } from "./types";

describe("End Turn Logic", () => {
  let state: GameState;

  beforeEach(() => {
    const result = gameEngine.processCommand({} as GameState, { type: "RESET_GAME" });
    state = result.state;
  });

  it("should disable end turn if potential score is below threshold", () => {
    state.totalScore = 0;
    state.bankedScore = 500;
    state.threshold = 1000;
    state.lastRollSparkled = false;

    expect(canEndTurn(state)).toBe(false);

    const result = gameEngine.processCommand(state, { type: "END_TURN" });
    expect(result.state.message).toContain("Need total score of 1000");
  });

  it("should allow end turn if potential score meets threshold", () => {
    state.totalScore = 0;
    state.bankedScore = 1000;
    state.threshold = 1000;
    state.lastRollSparkled = false;

    expect(canEndTurn(state)).toBe(true);

    const result = gameEngine.processCommand(state, { type: "END_TURN" });
    expect(result.state.totalScore).toBe(1000);
    expect(result.state.turnNumber).toBe(2);
  });

  it("should allow end turn on sparkle and lose turn points", () => {
    state.totalScore = 1500;
    state.bankedScore = 500;
    state.threshold = 1000;
    state.lastRollSparkled = true;

    expect(canEndTurn(state)).toBe(true);

    const result = gameEngine.processCommand(state, { 
      type: "END_TURN", 
      isSparkled: true 
    });

    expect(result.state.totalScore).toBe(1500); // Turn points lost
    expect(result.state.turnNumber).toBe(2);
    expect(result.state.gameOver).toBe(false); // Above threshold
    expect(result.state.message).toContain("Lost turn points");
  });

  it("should end game if sparkled and total score < threshold", () => {
    state.totalScore = 500;
    state.bankedScore = 500;
    state.threshold = 1000;
    state.lastRollSparkled = true;

    expect(canEndTurn(state)).toBe(true);

    const result = gameEngine.processCommand(state, { 
      type: "END_TURN", 
      isSparkled: true 
    });

    expect(result.state.totalScore).toBe(500);
    expect(result.state.gameOver).toBe(true);
    expect(result.state.message).toContain("Game Over");
  });
});
