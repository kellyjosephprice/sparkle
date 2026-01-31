import { beforeEach, describe, expect, it } from "vitest";

import { gameEngine } from "../messaging/gameEngine";
import { canEndTurn } from "./index";
import type { GameState } from "./types";

describe("End Turn Logic", () => {
  let state: GameState;

  beforeEach(() => {
    const result = gameEngine.processCommand({} as GameState, {
      type: "RESET_GAME",
    });
    state = result.state;
  });

  it("should allow end turn even if potential score is below threshold", () => {
    state.bankedScore = 10;
    state.threshold = 1000;
    state.lastRollFizzled = false;

    expect(canEndTurn(state)).toBe(true);
  });

  it("should allow end turn if potential score meets threshold", () => {
    state.bankedScore = 1000;
    state.threshold = 1000;
    state.lastRollFizzled = false;

    expect(canEndTurn(state)).toBe(true);
  });

  it("should allow end turn on fizzle and lose turn points", () => {
    state.bankedScore = 500;
    state.lastRollFizzled = true;

    const result = gameEngine.processCommand(state, {
      type: "END_TURN",
      isSparkled: true,
    });
    expect(result.state.bankedScore).toBe(0);
    expect(result.state.totalScore).toBe(0);
  });

  it("should end game if fizzled and total score < threshold", () => {
    state.totalScore = 100;
    state.threshold = 1000;

    const result = gameEngine.processCommand(state, {
      type: "END_TURN",
      isSparkled: true,
    });
    expect(result.state.gameOver).toBe(true);
  });
});
