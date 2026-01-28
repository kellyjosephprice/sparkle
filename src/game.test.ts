import { beforeEach, describe, expect, it } from "vitest";

import {
  calculateThreshold,
  canBank,
  canEndTurn,
  canRoll,
  createDice,
  getActiveDice,
  getBankedDice,
  getStagedDice,
  getStagedScore,
} from "./game";
import { DEFAULT_RULES } from "./scoring";
import type { GameState } from "./types";

describe("Game Selectors", () => {
  let state: GameState;

  beforeEach(() => {
    state = {
      dice: [
        {
          id: 1,
          value: 1,
          staged: false,
          banked: false,
          position: 1,
          upgrades: [],
        },
        {
          id: 2,
          value: 2,
          staged: false,
          banked: false,
          position: 2,
          upgrades: [],
        },
        {
          id: 3,
          value: 3,
          staged: false,
          banked: true,
          position: 3,
          upgrades: [],
        },
        {
          id: 4,
          value: 4,
          staged: false,
          banked: true,
          position: 4,
          upgrades: [],
        },
      ],
      bankedScore: 0,
      totalScore: 0,
      threshold: 1000,
      turnNumber: 1,
      gameOver: false,
      message: "",
      scoringRules: DEFAULT_RULES,
      rerollsAvailable: 2,
      lastRollSparkled: false,
      highScore: 0,
      upgradeOptions: [],
      pendingUpgradeDieSelection: null,
      potentialUpgradePosition: null,
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

  describe("getStagedDice", () => {
    it("should return only staged and non-banked dice", () => {
      state.dice[1].staged = true;
      const staged = getStagedDice(state);
      expect(staged).toHaveLength(1);
      expect(staged.every((d) => d.staged && !d.banked)).toBe(true);
    });
  });

  describe("getStagedScore", () => {
    it("should calculate score for staged dice", () => {
      state.dice[1].staged = true; // value 2
      const score = getStagedScore(state);
      expect(score).toBe(0); // Die with value 2 doesn't score by default
    });

    it("should calculate score for staged scoring dice", () => {
      state.dice = [
        {
          id: 1,
          value: 1,
          staged: true,
          banked: false,
          position: 1,
          upgrades: [],
        },
        {
          id: 2,
          value: 5,
          staged: true,
          banked: false,
          position: 2,
          upgrades: [],
        },
      ];
      const score = getStagedScore(state);
      expect(score).toBe(150); // 100 (for 1) + 50 (for 5)
    });
  });

  describe("calculateThreshold", () => {
    it("should calculate threshold for turn 1", () => {
      expect(calculateThreshold(1)).toBe(100);
    });

    it("should calculate threshold for turn 2", () => {
      expect(calculateThreshold(2)).toBe(100);
    });

    it("should calculate threshold for turn 3", () => {
      expect(calculateThreshold(3)).toBe(1000);
    });
  });

  describe("canRoll", () => {
    it("should return true when game is not over and staged dice score", () => {
      // Stage a die that scores (value 1)
      state.dice[0].staged = true;
      expect(canRoll(state)).toBe(true);
    });

    it("should return false when game is over", () => {
      state.gameOver = true;
      expect(canRoll(state)).toBe(false);
    });
  });

  describe("canBank", () => {
    it("should return false when no dice staged", () => {
      state.dice = [
        {
          id: 1,
          value: 1,
          staged: false,
          banked: false,
          position: 1,
          upgrades: [],
        },
        {
          id: 2,
          value: 2,
          staged: false,
          banked: false,
          position: 2,
          upgrades: [],
        },
      ];
      expect(canBank(state)).toBe(false);
    });

    it("should return false when staged dice don't score", () => {
      state.dice = [
        {
          id: 1,
          value: 2,
          staged: true,
          banked: false,
          position: 1,
          upgrades: [],
        },
        {
          id: 2,
          value: 3,
          staged: true,
          banked: false,
          position: 2,
          upgrades: [],
        },
      ];
      expect(canBank(state)).toBe(false);
    });

    it("should return true when staged dice score", () => {
      state.dice = [
        {
          id: 1,
          value: 1,
          staged: true,
          banked: false,
          position: 1,
          upgrades: [],
        },
        {
          id: 2,
          value: 5,
          staged: true,
          banked: false,
          position: 2,
          upgrades: [],
        },
      ];
      expect(canBank(state)).toBe(true);
    });
  });

  describe("canEndTurn", () => {
    it("should return false when no dice banked and no staged score", () => {
      state.bankedScore = 0;
      expect(canEndTurn(state)).toBe(false);
    });

    it("should return false when points don't meet threshold", () => {
      state.bankedScore = 1000;
      state.threshold = 2000;
      expect(canEndTurn(state)).toBe(false);
    });

    it("should return true when potential score meets threshold", () => {
      state.totalScore = 500;
      state.bankedScore = 500;
      state.threshold = 1000;
      expect(canEndTurn(state)).toBe(true);
    });

    it("should return true when sparkled regardless of threshold", () => {
      state.lastRollSparkled = true;
      state.totalScore = 0;
      state.threshold = 1000;
      expect(canEndTurn(state)).toBe(true);
    });
  });

  describe("createDice", () => {
    it("should create specified number of dice", () => {
      const dice = createDice(6);
      expect(dice).toHaveLength(6);
    });

    it("should create unstaged and unbanked dice", () => {
      const dice = createDice(6);
      dice.forEach((die) => {
        expect(die.staged).toBe(false);
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
