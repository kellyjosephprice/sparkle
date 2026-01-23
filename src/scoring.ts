import type { Die, DieValue, ScoringRule, ScoringRuleId } from "./types";

type RuleChecker = (
  values: DieValue[],
  counts: Map<DieValue, number>,
) => { match: boolean; score: number; activatedRules: ScoringRuleId[] };

const singleOneChecker: RuleChecker = (values, counts) => {
  const count = counts.get(1) || 0;
  return { match: count > 0, score: count * 100, activatedRules: ["single_one"] };
};

const singleFiveChecker: RuleChecker = (values, counts) => {
  const count = counts.get(5) || 0;
  return { match: count > 0, score: count * 50, activatedRules: ["single_five"] };
};

const threeOfKindChecker: RuleChecker = (values, counts) => {
  let score = 0;
  let match = false;
  const activatedRules: ScoringRuleId[] = [];

  counts.forEach((count, value) => {
    if (count === 3) {
      match = true;
      const baseScore = value === 1 ? 1000 : value * 100;
      score += baseScore;
      activatedRules.push("three_of_kind");
    }
  });

  return { match, score, activatedRules };
};

const fourOfKindChecker: RuleChecker = (values, counts) => {
  let score = 0;
  let match = false;
  const activatedRules: ScoringRuleId[] = [];

  counts.forEach((count, value) => {
    if (count === 4) {
      match = true;
      const baseScore = value === 1 ? 1000 : value * 100;
      score += baseScore * 2;
      activatedRules.push("four_of_kind");
    }
  });

  return { match, score, activatedRules };
};

const fiveOfKindChecker: RuleChecker = (values, counts) => {
  let score = 0;
  let match = false;
  const activatedRules: ScoringRuleId[] = [];

  counts.forEach((count, value) => {
    if (count === 5) {
      match = true;
      const baseScore = value === 1 ? 1000 : value * 100;
      score += baseScore * 4;
      activatedRules.push("five_of_kind");
    }
  });

  return { match, score, activatedRules };
};

const sixOfKindChecker: RuleChecker = (values, counts) => {
  let score = 0;
  let match = false;
  const activatedRules: ScoringRuleId[] = [];

  counts.forEach((count, value) => {
    if (count === 6) {
      match = true;
      const baseScore = value === 1 ? 1000 : value * 100;
      score += baseScore * 8;
      activatedRules.push("six_of_kind");
    }
  });

  return { match, score, activatedRules };
};

const straightChecker: RuleChecker = (values) => {
  const match = values.length === 6 && new Set(values).size === 6;
  return { match, score: 1500, activatedRules: match ? ["straight"] : [] };
};

const threePairsChecker: RuleChecker = (values, counts) => {
  const pairs = Array.from(counts.values()).filter((count) => count === 2);
  const match = pairs.length === 3;
  return { match, score: 1500, activatedRules: match ? ["three_pairs"] : [] };
};

const ruleCheckers: Record<ScoringRuleId, RuleChecker> = {
  single_one: singleOneChecker,
  single_five: singleFiveChecker,
  three_of_kind: threeOfKindChecker,
  four_of_kind: fourOfKindChecker,
  five_of_kind: fiveOfKindChecker,
  six_of_kind: sixOfKindChecker,
  straight: straightChecker,
  three_pairs: threePairsChecker,
};

export const DEFAULT_RULES: ScoringRule[] = [
  {
    id: "single_one",
    description: "1",
    score: 100,
    enabled: true,
    activationCount: 0,
  },
  {
    id: "single_five",
    description: "5",
    score: 50,
    enabled: true,
    activationCount: 0,
  },
  {
    id: "three_of_kind",
    description: "111",
    score: 1000,
    enabled: true,
    activationCount: 0,
  },
  {
    id: "three_of_kind",
    description: "222/333/444/555/666",
    score: "value × 100",
    enabled: true,
    activationCount: 0,
  },
  {
    id: "four_of_kind",
    description: "XXXX",
    score: "double",
    enabled: true,
    activationCount: 0,
  },
  {
    id: "five_of_kind",
    description: "XXXXX",
    score: "4×",
    enabled: true,
    activationCount: 0,
  },
  {
    id: "six_of_kind",
    description: "XXXXXX",
    score: "8×",
    enabled: true,
    activationCount: 0,
  },
  {
    id: "straight",
    description: "1-2-3-4-5-6",
    score: 1500,
    enabled: true,
    activationCount: 0,
  },
  {
    id: "three_pairs",
    description: "XXYYZZ",
    score: 1500,
    enabled: true,
    activationCount: 0,
  },
];

export function calculateScore(
  selectedDice: Die[],
  rules: ScoringRule[] = DEFAULT_RULES,
): number {
  if (selectedDice.length === 0) return 0;

  const values = selectedDice.map((d) => d.value);
  const counts = new Map<DieValue, number>();

  values.forEach((val) => {
    counts.set(val, (counts.get(val) || 0) + 1);
  });

  let totalScore = 0;
  const checkedRuleIds = new Set<ScoringRuleId>();

  const enabledRules = rules.filter((r) => r.enabled);

  for (const rule of enabledRules) {
    if (checkedRuleIds.has(rule.id)) continue;

    const checker = ruleCheckers[rule.id];
    const result = checker(values, counts);

    if (result.match && result.score > 0) {
      totalScore += result.score;
      rule.activationCount += 1;
      result.activatedRules.forEach((id) => checkedRuleIds.add(id));
    }
  }

  return totalScore;
}

export function hasAnyScore(
  dice: Die[],
  rules: ScoringRule[] = DEFAULT_RULES,
): boolean {
  return calculateScore(dice, rules) > 0;
}

export function isSparkle(
  dice: Die[],
  rules: ScoringRule[] = DEFAULT_RULES,
): boolean {
  return !hasAnyScore(dice, rules);
}

export function resetRuleCounts(rules: ScoringRule[]): ScoringRule[] {
  return rules.map((rule) => ({ ...rule, activationCount: 0 }));
}
