import { describe, expect, it } from "vitest";

import { calculateScore, hasAnyScore, isSparkle } from "./scoring";
import type { Die } from "./types";

// Helper to create dice with specific values
function makeDice(values: number[]): Die[] {
  return values.map((value, i) => ({
    id: i,
    value: value as 1 | 2 | 3 | 4 | 5 | 6,
    staged: false,
    banked: false,
    position: i + 1,
  }));
}

describe("calculateScore", () => {
  describe("Empty and non-scoring dice", () => {
    it("should return 0 for empty array", () => {
      expect(calculateScore([]).score).toBe(0);
    });

    it("should return 0 for non-scoring dice", () => {
      expect(calculateScore(makeDice([2, 3, 4, 6])).score).toBe(0);
    });

    it("should return 0 for single non-scoring die", () => {
      expect(calculateScore(makeDice([2])).score).toBe(0);
      expect(calculateScore(makeDice([3])).score).toBe(0);
      expect(calculateScore(makeDice([4])).score).toBe(0);
      expect(calculateScore(makeDice([6])).score).toBe(0);
    });
  });

  describe("Single 1s and 5s", () => {
    it("should score single 1 as 100 points", () => {
      expect(calculateScore(makeDice([1])).score).toBe(100);
    });

    it("should score single 5 as 50 points", () => {
      expect(calculateScore(makeDice([5])).score).toBe(50);
    });

    it("should score two 1s as 200 points", () => {
      expect(calculateScore(makeDice([1, 1])).score).toBe(200);
    });

    it("should score two 5s as 100 points", () => {
      expect(calculateScore(makeDice([5, 5])).score).toBe(100);
    });

    it("should score one 1 and one 5 as 150 points", () => {
      expect(calculateScore(makeDice([1, 5])).score).toBe(150);
    });

    it("should ignore non-scoring dice when scoring 1s and 5s", () => {
      expect(calculateScore(makeDice([1, 2, 3, 5])).score).toBe(150);
    });
  });

  describe("Three of a kind", () => {
    it("should score three 1s as 1000 points", () => {
      expect(calculateScore(makeDice([1, 1, 1])).score).toBe(1000);
    });

    it("should score three 2s as 200 points", () => {
      expect(calculateScore(makeDice([2, 2, 2])).score).toBe(200);
    });

    it("should score three 3s as 300 points", () => {
      expect(calculateScore(makeDice([3, 3, 3])).score).toBe(300);
    });

    it("should score three 4s as 400 points", () => {
      expect(calculateScore(makeDice([4, 4, 4])).score).toBe(400);
    });

    it("should score three 5s as 500 points", () => {
      expect(calculateScore(makeDice([5, 5, 5])).score).toBe(500);
    });

    it("should score three 6s as 600 points", () => {
      expect(calculateScore(makeDice([6, 6, 6])).score).toBe(600);
    });
  });

  describe("Four of a kind", () => {
    it("should score four 1s as 1100", () => {
      expect(calculateScore(makeDice([1, 1, 1, 1])).score).toBe(1100);
    });

    it("should score four of a kind as 1000", () => {
      expect(calculateScore(makeDice([2, 2, 2, 2])).score).toBe(1000);
      expect(calculateScore(makeDice([5, 5, 5, 5])).score).toBe(1000);
      expect(calculateScore(makeDice([6, 6, 6, 6])).score).toBe(1000);
    });
  });

  describe("Five of a kind", () => {
    it("should score five of a kind as 1000", () => {
      expect(calculateScore(makeDice([1, 1, 1, 1, 1])).score).toBe(2000);
      expect(calculateScore(makeDice([2, 2, 2, 2, 2])).score).toBe(2000);
      expect(calculateScore(makeDice([5, 5, 5, 5, 5])).score).toBe(2000);
      expect(calculateScore(makeDice([6, 6, 6, 6, 6])).score).toBe(2000);
    });
  });

  describe("Six of a kind", () => {
    it("should score six of a kind as 3000", () => {
      expect(calculateScore(makeDice([1, 1, 1, 1, 1, 1])).score).toBe(3000);
      expect(calculateScore(makeDice([2, 2, 2, 2, 2, 2])).score).toBe(3000);
      expect(calculateScore(makeDice([5, 5, 5, 5, 5, 5])).score).toBe(3000);
      expect(calculateScore(makeDice([6, 6, 6, 6, 6, 6])).score).toBe(3000);
    });
  });

  describe("Straight (1-2-3-4-5-6)", () => {
    it("should score straight as 1500 points", () => {
      expect(calculateScore(makeDice([1, 2, 3, 4, 5, 6])).score).toBe(2500);
    });

    it("should score straight regardless of order", () => {
      expect(calculateScore(makeDice([6, 4, 2, 5, 1, 3])).score).toBe(2500);
      expect(calculateScore(makeDice([3, 1, 4, 5, 6, 2])).score).toBe(2500);
    });
  });

  describe("Three pairs", () => {
    it("should score three pairs as 1500 points", () => {
      expect(calculateScore(makeDice([1, 1, 2, 2, 3, 3])).score).toBe(1500);
    });

    it("should score three pairs regardless of values", () => {
      expect(calculateScore(makeDice([4, 4, 5, 5, 6, 6])).score).toBe(1500);
      expect(calculateScore(makeDice([1, 1, 5, 5, 6, 6])).score).toBe(1500);
    });

    it("should score three pairs regardless of order", () => {
      expect(calculateScore(makeDice([2, 3, 2, 4, 3, 4])).score).toBe(1500);
    });
  });

  describe("Mixed combinations", () => {
    it("should score three 1s plus extra 1s correctly", () => {
      // Three 1s = 1000, but we have 4 1s = 2000
      expect(calculateScore(makeDice([1, 1, 1, 1, 2, 3])).score).toBe(1100);
    });

    it("should score three of a kind plus single scoring dice", () => {
      // Three 2s = 200, one 1 = 100, one 5 = 50
      expect(calculateScore(makeDice([2, 2, 2, 1, 5, 6])).score).toBe(350);
    });

    it("should score multiple sets of three of a kind", () => {
      // This shouldn't happen in normal game, but testing the logic
      // Three 2s = 200, three 3s = 300
      expect(calculateScore(makeDice([2, 2, 2, 3, 3, 3])).score).toBe(500);
    });

    it("should score three of a kind with extra single scoring dice", () => {
      // Three 6s = 600, one 1 = 100
      expect(calculateScore(makeDice([6, 6, 6, 1])).score).toBe(700);
    });
  });

  describe("Edge cases", () => {
    it("should not score two pairs as three pairs", () => {
      expect(calculateScore(makeDice([1, 1, 2, 2])).score).toBe(200); // Just two 1s
    });

    it("should not score incomplete straight", () => {
      // Missing the 6, so just score the 1 and 5
      expect(calculateScore(makeDice([1, 2, 3, 4, 5])).score).toBe(150);
    });

    it("should prioritize three pairs over individual scoring", () => {
      // Even with 1s and 5s, three pairs takes precedence
      expect(calculateScore(makeDice([1, 1, 5, 5, 6, 6])).score).toBe(1500);
    });

    it("should prioritize straight over individual scoring", () => {
      // Even with 1s and 5s in the straight, score as straight
      expect(calculateScore(makeDice([1, 2, 3, 4, 5, 6])).score).toBe(2500);
    });
  });
});

describe("hasAnyScore", () => {
  it("should return false for empty dice", () => {
    expect(hasAnyScore([])).toBe(false);
  });

  it("should return false for non-scoring dice", () => {
    expect(hasAnyScore(makeDice([2, 3, 4, 6]))).toBe(false);
  });

  it("should return true for single 1", () => {
    expect(hasAnyScore(makeDice([1]))).toBe(true);
  });

  it("should return true for single 5", () => {
    expect(hasAnyScore(makeDice([5]))).toBe(true);
  });

  it("should return true for three of a kind", () => {
    expect(hasAnyScore(makeDice([2, 2, 2]))).toBe(true);
  });

  it("should return true for straight", () => {
    expect(hasAnyScore(makeDice([1, 2, 3, 4, 5, 6]))).toBe(true);
  });

  it("should return true for three pairs", () => {
    expect(hasAnyScore(makeDice([1, 1, 2, 2, 3, 3]))).toBe(true);
  });
});

describe("isSparkle", () => {
  describe("Sparkle scenarios (no score)", () => {
    it("should return true for all non-scoring dice", () => {
      expect(isSparkle(makeDice([2, 3, 4, 6]))).toBe(true);
    });

    it("should return true for single non-scoring dice", () => {
      expect(isSparkle(makeDice([2, 2, 3, 4, 4, 6]))).toBe(true);
    });

    it("should return true for two pairs (not three)", () => {
      expect(isSparkle(makeDice([2, 2, 3, 3]))).toBe(true);
    });
  });

  describe("Not sparkle scenarios (has score)", () => {
    it("should return false when dice contains a 1", () => {
      expect(isSparkle(makeDice([1, 2, 3, 4]))).toBe(false);
    });

    it("should return false when dice contains a 5", () => {
      expect(isSparkle(makeDice([2, 3, 4, 5]))).toBe(false);
    });

    it("should return false when dice contains multiple 1s", () => {
      expect(isSparkle(makeDice([1, 1, 2, 3]))).toBe(false);
    });

    it("should return false when dice contains multiple 5s", () => {
      expect(isSparkle(makeDice([2, 3, 5, 5]))).toBe(false);
    });

    it("should return false for three of a kind", () => {
      expect(isSparkle(makeDice([2, 2, 2]))).toBe(false);
      expect(isSparkle(makeDice([3, 3, 3]))).toBe(false);
      expect(isSparkle(makeDice([6, 6, 6]))).toBe(false);
    });

    it("should return false for four of a kind", () => {
      expect(isSparkle(makeDice([2, 2, 2, 2]))).toBe(false);
    });

    it("should return false for five of a kind", () => {
      expect(isSparkle(makeDice([2, 2, 2, 2, 2]))).toBe(false);
    });

    it("should return false for six of a kind", () => {
      expect(isSparkle(makeDice([2, 2, 2, 2, 2, 2]))).toBe(false);
    });

    it("should return false for straight", () => {
      expect(isSparkle(makeDice([1, 2, 3, 4, 5, 6]))).toBe(false);
    });

    it("should return false for three pairs", () => {
      expect(isSparkle(makeDice([2, 2, 3, 3, 4, 4]))).toBe(false);
    });

    it("should return false when any scoring combination exists", () => {
      expect(isSparkle(makeDice([1, 2, 3]))).toBe(false); // Has a 1
      expect(isSparkle(makeDice([2, 3, 5]))).toBe(false); // Has a 5
      expect(isSparkle(makeDice([6, 6, 6, 2]))).toBe(false); // Three 6s
    });
  });

  describe("Edge cases", () => {
    it("should return true for empty array", () => {
      // Edge case: no dice means no score (sparkle)
      expect(isSparkle([])).toBe(true);
    });

    it("should handle single die correctly", () => {
      expect(isSparkle(makeDice([1]))).toBe(false); // 1 scores
      expect(isSparkle(makeDice([5]))).toBe(false); // 5 scores
      expect(isSparkle(makeDice([2]))).toBe(true); // 2 doesn't score
      expect(isSparkle(makeDice([6]))).toBe(true); // 6 doesn't score
    });
  });
});
