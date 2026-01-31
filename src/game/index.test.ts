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
} from "./index";
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
          isSparkDie: true,
        },
        {
          id: 2,
          value: 2,
          staged: false,
          banked: false,
          position: 2,
          upgrades: [],
          isSparkDie: false,
        },
        {
          id: 3,
          value: 4,
          staged: false,
          banked: true,
          position: 3,
          upgrades: [],
          isSparkDie: false,
        },
        {
          id: 4,
          value: 4,
          staged: false,
          banked: true,
          position: 4,
          upgrades: [],
          isSparkDie: false,
        },
      ],
      bankedScore: 0,
      totalScore: 0,
      threshold: 1000,
      turnNumber: 1,
      gameOver: false,
      message: "",
      scoringRules: DEFAULT_RULES,
      lastRollFizzled: false,
      highScore: 0,
      upgradeOptions: [],
      extraDicePool: 3,
      hotDiceCount: 0,
      permanentMultiplier: 1,
      certificationNeededValue: null,
      isGuhkleAttempt: false,
      rollsInTurn: 0,
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
          isSparkDie: true,
        },
        {
          id: 2,
          value: 5,
          staged: true,
          banked: false,
          position: 2,
          upgrades: [],
          isSparkDie: false,
        },
      ];
      const score = getStagedScore(state);
      expect(score).toBe(15); // 10 (for 1) + 5 (for 5)
    });
  });

  describe("calculateThreshold", () => {
    const tests = [
      [1, 100],
      [2, 200],
      [3, 400],
      [4, 800],
      [5, 1600],
      [6, 3200],
    ];

    it.each(tests)(
      "should calculate threshold for turn %i as %i",
      (level, threshold) => {
        expect(calculateThreshold(level)).toBe(threshold);
      },
    );
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

    it("should return true when banked score > 0 even if no staged dice", () => {
      state.bankedScore = 100;
      state.dice.forEach((d) => (d.staged = false));
      expect(canRoll(state)).toBe(true);
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
          isSparkDie: true,
        },
        {
          id: 2,
          value: 2,
          staged: false,
          banked: false,
          position: 2,
          upgrades: [],
          isSparkDie: false,
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
          isSparkDie: true,
        },
        {
          id: 2,
          value: 4,
          staged: true,
          banked: false,
          position: 2,
          upgrades: [],
          isSparkDie: false,
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
          isSparkDie: true,
        },
        {
          id: 2,
          value: 5,
          staged: true,
          banked: false,
          position: 2,
          upgrades: [],
          isSparkDie: false,
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

    it("should return false when certification is needed", () => {
      state.bankedScore = 1000;
      state.certificationNeededValue = 2;
      expect(canEndTurn(state)).toBe(false);
    });

    it("should return true when potential score meets threshold", () => {
      state.totalScore = 500;
      state.bankedScore = 500;
      state.threshold = 1000;
      expect(canEndTurn(state)).toBe(true);
    });

    it("should return true when fizzled", () => {
      state.lastRollFizzled = true;
      state.totalScore = 0;
      state.threshold = 1000;
      expect(canEndTurn(state)).toBe(true);
    });
  });

  describe("createDice", () => {
    it("should create specified number of dice", () => {
      const dice = createDice(5);
      expect(dice).toHaveLength(5);
    });

    it("should create unstaged and unbanked dice", () => {
      const dice = createDice(5);
      dice.forEach((die) => {
        expect(die.staged).toBe(false);
        expect(die.banked).toBe(false);
      });
    });

    it("should assign positions to dice", () => {
      const dice = createDice(5);
      dice.forEach((die, index) => {
        expect(die.position).toBe(index + 1);
      });
    });
  });
});
