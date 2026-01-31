import { STRINGS } from "../strings";
import type { Die, DieValue, Rule, RuleId, RuleMap } from "./types";

export const DEFAULT_RULES: Record<RuleId, Rule> = {
  single_one: {
    id: "single_one",
    description: STRINGS.rules.one,
    score: 10,
    enabled: true,
    activationCount: 0,
  },
  single_five: {
    id: "single_five",
    description: STRINGS.rules.five,
    score: 5,
    enabled: true,
    activationCount: 0,
  },
  set: {
    id: "set",
    description: "Three of a kind (or 2 + Spark)",
    score: "n*10 or 100",
    enabled: true,
    activationCount: 0,
  },
  heap: {
    id: "heap",
    description: "Five of a kind (or 4 + Spark)",
    score: "n*100 or 1000",
    enabled: true,
    activationCount: 0,
  },
  landslide: {
    id: "landslide",
    description: "All 5 dice score",
    score: 0,
    enabled: true,
    activationCount: 0,
  },
};

export interface ScoringGroup {
  ruleId: RuleId;
  score: number;
  dice: Die[];
  value: DieValue;
}

export function calculateScore(
  selectedDice: Die[],
  rules: RuleMap = DEFAULT_RULES,
): {
  score: number;
  scoringRuleIds: RuleId[];
  scoredDice: Die[];
  groups: ScoringGroup[];
} {
  if (selectedDice.length === 0)
    return { score: 0, scoringRuleIds: [], scoredDice: [], groups: [] };

  let totalScore = 0;
  const unscoredDice = [...selectedDice];
  const scoringRuleIds: RuleId[] = [];
  const groups: ScoringGroup[] = [];

  // Helper to find and remove dice
  const pullDice = (
    value: DieValue,
    count: number,
    includeSpark: boolean,
  ): Die[] | null => {
    const matches = unscoredDice.filter((d) => d.value === value);
    const spark = unscoredDice.find((d) => d.value === "spark");

    if (includeSpark && spark && matches.length >= count - 1) {
      const taken = matches.slice(0, count - 1);
      const result = [...taken, spark];
      result.forEach((d) => {
        const idx = unscoredDice.indexOf(d);
        if (idx > -1) unscoredDice.splice(idx, 1);
      });
      return result;
    } else if (matches.length >= count) {
      const taken = matches.slice(0, count);
      taken.forEach((d) => {
        const idx = unscoredDice.indexOf(d);
        if (idx > -1) unscoredDice.splice(idx, 1);
      });
      return taken;
    }
    return null;
  };

  const spark = unscoredDice.find((d) => d.value === "spark");

  // 1. Heaps (5 of a kind)
  const values: DieValue[] = [1, 2, 4, 5, 6];
  for (const v of values) {
    // If 4 matches + Spark, it MUST be a heap
    const heap = pullDice(v, 5, true);
    if (heap) {
      const score = v === 1 ? 1000 : (v as number) * 100;
      totalScore += score;
      scoringRuleIds.push("heap");
      groups.push({ ruleId: "heap", score, dice: heap, value: v });
      break; // Only one heap possible with 5 dice
    }
  }

  // 2. Sets (3 of a kind)
  // Re-check values for sets after possible heap
  for (const v of values) {
    // If 2 matches + Spark, it MUST be a set
    const set = pullDice(v, 3, true);
    if (set) {
      const score = v === 1 ? 100 : (v as number) * 10;
      totalScore += score;
      scoringRuleIds.push("set");
      groups.push({ ruleId: "set", score, dice: set, value: v });
    }
  }

  // 3. Singles (1, 5, or Spark as 1/5)
  // Spark can be 1 (10pts) or 5 (5pts). We'll take 1 if it's left.
  const remainingSpark = unscoredDice.find((d) => d.value === "spark");
  if (remainingSpark) {
    const idx = unscoredDice.indexOf(remainingSpark);
    unscoredDice.splice(idx, 1);
    totalScore += 10;
    scoringRuleIds.push("single_one");
    groups.push({
      ruleId: "single_one",
      score: 10,
      dice: [remainingSpark],
      value: 1,
    });
  }

  // Ones
  let one;
  while ((one = unscoredDice.find((d) => d.value === 1))) {
    const idx = unscoredDice.indexOf(one);
    unscoredDice.splice(idx, 1);
    totalScore += 10;
    scoringRuleIds.push("single_one");
    groups.push({ ruleId: "single_one", score: 10, dice: [one], value: 1 });
  }

  // Fives
  let five;
  while ((five = unscoredDice.find((d) => d.value === 5))) {
    const idx = unscoredDice.indexOf(five);
    unscoredDice.splice(idx, 1);
    totalScore += 5;
    scoringRuleIds.push("single_five");
    groups.push({ ruleId: "single_five", score: 5, dice: [five], value: 5 });
  }

  const scoredDice = selectedDice.filter((d) => !unscoredDice.includes(d));

  return {
    score: totalScore,
    scoringRuleIds,
    scoredDice,
    groups,
  };
}

export function hasAnyScore(
  dice: Die[],
  rules: RuleMap = DEFAULT_RULES,
): boolean {
  return calculateScore(dice, rules).score > 0;
}

export function isFizzle(dice: Die[], rules: RuleMap = DEFAULT_RULES): boolean {
  return !hasAnyScore(dice, rules);
}

export function resetRuleCounts(rules: RuleMap): RuleMap {
  return Object.values(rules).reduce<RuleMap>((memo, rule) => {
    memo[rule.id] = { ...rule, activationCount: 0 };

    return memo;
  }, {} as RuleMap);
}
