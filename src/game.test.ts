import { beforeEach, describe, expect, it } from "vitest";

import {
  calculateThreshold,
  canBank,
  canEndTurn,
  canRoll,
  createDice,
  getActiveDice,
  getBankedDice,
  getSelectedDice,
  getSelectedScore,
} from "./game";
import { DEFAULT_RULES } from "./scoring";
import type { GameState } from "./types";

describe("Game Selectors", () => {
  let state: GameState;

  beforeEach(() => {
    state = {
      dice: [
        { id: 1, value: 1, selected: false, banked: false, position: 1 },
        { id: 2, value: 2, selected: true, banked: false, position: 2 },
        { id: 3, value: 3, selected: false, banked: true, position: 3 },
        { id: 4, value: 4, selected: true, banked: true, position: 4 },
      ],
      currentScore: 0,
      bankedScore: 0,
      totalScore: 0,
      threshold: 1000,
      thresholdLevel: 1,
      turnNumber: 1,
      gameOver: false,
      message: "",
      scoringRules: DEFAULT_RULES,
    };
  });

  describe("getActiveDice", () => {
    it("should return only non-banked dice", () => {
      const active = getActiveDice(state);
      expect(active).toHaveLength(2);
      expect(active.every((d) => !d.banked)).toBe(true);
    });
  });

  describe("getBankedDice", () => {
    it("should return only banked dice", () => {
      const banked = getBankedDice(state);
      expect(banked).toHaveLength(2);
      expect(banked.every((d) => d.banked)).toBe(true);
    });
  });

  describe("getSelectedDice", () => {
    it("should return only selected and non-banked dice", () => {
      const selected = getSelectedDice(state);
      expect(selected).toHaveLength(1);
      expect(selected.every((d) => d.selected && !d.banked)).toBe(true);
    });
  });

  describe("getSelectedScore", () => {
    it("should calculate score for selected dice", () => {
      const score = getSelectedScore(state);
      expect(score).toBe(0); // Die with value 2 doesn't score by default
    });

    it("should calculate score for selected scoring dice", () => {
      state.dice = [
        { id: 1, value: 1, selected: true, banked: false, position: 1 },
        { id: 2, value: 5, selected: true, banked: false, position: 2 },
      ];
      const score = getSelectedScore(state);
      expect(score).toBe(150); // 100 (for 1) + 50 (for 5)
    });
  });

  describe("calculateThreshold", () => {
    it("should calculate threshold for turn 1", () => {
      expect(calculateThreshold(1)).toBe(200);
    });

    it("should calculate threshold for turn 2", () => {
      expect(calculateThreshold(2)).toBe(300);
    });

    it("should calculate threshold for turn 3", () => {
      expect(calculateThreshold(3)).toBe(500);
    });
  });

  describe("canRoll", () => {
    it("should return true when game is not over and selected dice score", () => {
      // Select a die that scores (value 1)
      state.dice[0].selected = true;
      expect(canRoll(state)).toBe(true);
    });

    it("should return false when game is over", () => {
      state.gameOver = true;
      expect(canRoll(state)).toBe(false);
    });
  });

  describe("canBank", () => {
    it("should return false when no dice selected", () => {
      state.dice = [
        { id: 1, value: 1, selected: false, banked: false, position: 1 },
        { id: 2, value: 2, selected: false, banked: false, position: 2 },
      ];
      expect(canBank(state)).toBe(false);
    });

    it("should return false when selected dice don't score", () => {
      state.dice = [
        { id: 1, value: 2, selected: true, banked: false, position: 1 },
        { id: 2, value: 3, selected: true, banked: false, position: 2 },
      ];
      expect(canBank(state)).toBe(false);
    });

    it("should return true when selected dice score", () => {
      state.dice = [
        { id: 1, value: 1, selected: true, banked: false, position: 1 },
        { id: 2, value: 5, selected: true, banked: false, position: 2 },
      ];
      expect(canBank(state)).toBe(true);
    });
  });

  describe("canEndTurn", () => {
    it("should return false when no dice banked", () => {
      state.currentScore = 0;
      expect(canEndTurn(state)).toBe(false);
    });

    it("should return true when there are points to bank", () => {
      state.currentScore = 100;
      state.bankedScore = 50;
      expect(canEndTurn(state)).toBe(true);
    });

    it("should return true when banked score meets threshold", () => {
      state.currentScore = 100;
      state.bankedScore = 900;
      expect(canEndTurn(state)).toBe(true);
    });
  });

  describe("createDice", () => {
    it("should create specified number of dice", () => {
      const dice = createDice(6);
      expect(dice).toHaveLength(6);
    });

    it("should create unselected and unbanked dice", () => {
      const dice = createDice(6);
      dice.forEach((die) => {
        expect(die.selected).toBe(false);
        expect(die.banked).toBe(false);
      });
    });

    it("should assign positions to dice", () => {
      const dice = createDice(6);
      dice.forEach((die, index) => {
        expect(die.position).toBe(index + 1);
      });
    });
  });
});

