import { describe, expect, it } from "vitest";
import { calculateScore, isFizzle } from "./scoring";
import type { Die } from "./types";

// Helper to create dice with specific values
function makeDice(values: (number | "spark")[]): Die[] {
  return values.map((value, i) => ({
    id: i,
    value: value as any,
    staged: false,
    banked: false,
    position: i + 1,
    upgrades: [],
    isSparkDie: value === "spark",
  }));
}

describe("calculateScore", () => {
  describe("Empty and non-scoring dice", () => {
    it("should return 0 for empty array", () => {
      expect(calculateScore([]).score).toBe(0);
    });

    it("should return 0 for non-scoring dice", () => {
      expect(calculateScore(makeDice([2, 4, 6])).score).toBe(0);
    });
  });

  describe("Single 1s and 5s", () => {
    it("should score single 1 as 10 points", () => {
      expect(calculateScore(makeDice([1])).score).toBe(10);
    });

    it("should score single 5 as 5 points", () => {
      expect(calculateScore(makeDice([5])).score).toBe(5);
    });

    it("should score Spark as 10 points", () => {
       expect(calculateScore(makeDice(["spark"])).score).toBe(10);
    });

    it("should score two 1s as 20 points", () => {
      expect(calculateScore(makeDice([1, 1])).score).toBe(20);
    });
  });

  describe("Sets (3 of a kind)", () => {
    it("should score three 1s as 100 points", () => {
      expect(calculateScore(makeDice([1, 1, 1])).score).toBe(100);
    });

    it("should score three 2s as 200 points", () => {
      // Wait, Set of 2s is 20 points. 2 * 10 = 20.
      expect(calculateScore(makeDice([2, 2, 2])).score).toBe(20);
    });

    it("should score three 6s as 60 points", () => {
      expect(calculateScore(makeDice([6, 6, 6])).score).toBe(60);
    });

    it("should score Set with Spark (2, 2, spark) as 20 points", () => {
       expect(calculateScore(makeDice([2, 2, "spark"])).score).toBe(20);
    });
  });

  describe("Heaps (5 of a kind)", () => {
    it("should score five 1s as 1000", () => {
      expect(calculateScore(makeDice([1, 1, 1, 1, 1])).score).toBe(1000);
    });

    it("should score five 2s as 200", () => {
      expect(calculateScore(makeDice([2, 2, 2, 2, 2])).score).toBe(200);
    });

    it("should score five with Spark (4, 4, 4, 4, spark) as 400", () => {
       expect(calculateScore(makeDice([4, 4, 4, 4, "spark"])).score).toBe(400);
    });
  });

  describe("Mixed combinations", () => {
    it("should score three 1s plus extra 1s correctly", () => {
      // Three 1s = 100, plus one 1 = 10. Total 110.
      expect(calculateScore(makeDice([1, 1, 1, 1, 2])).score).toBe(110);
    });

    it("should score three 2s plus single scoring dice", () => {
      // Three 2s = 20, one 1 = 10, one 5 = 5. Total 35.
      expect(calculateScore(makeDice([2, 2, 2, 1, 5])).score).toBe(35);
    });
  });
});

describe("isFizzle", () => {
  it("should return true for all non-scoring dice", () => {
    expect(isFizzle(makeDice([2, 4, 6]))).toBe(true);
  });

  it("should return false when dice contains a 1", () => {
    expect(isFizzle(makeDice([1, 2, 4]))).toBe(false);
  });

  it("should return false for three of a kind", () => {
    expect(isFizzle(makeDice([2, 2, 2]))).toBe(false);
  });

  it("should return false for Spark", () => {
    expect(isFizzle(makeDice(["spark"]))).toBe(false);
  });
});
