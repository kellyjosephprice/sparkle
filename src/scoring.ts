import type { Die, DieValue, Rule, RuleId, RuleMap } from "./types";

type Counts = Map<DieValue, Die[]>;

type RuleChecker = (counts: Counts) => {
  match: boolean;
  score: number;
  scoredDice: Die[];
};

const singleOneChecker: RuleChecker = (counts) => {
  const ones = counts.get(1) || [];

  return {
    match: ones.length > 0,
    score: ones.length * 100,
    scoredDice: ones,
  };
};

const singleFiveChecker: RuleChecker = (counts) => {
  const fives = counts.get(5) || [];

  return {
    match: fives.length > 0,
    score: fives.length * 50,
    scoredDice: fives,
  };
};

const threeOfKindChecker: RuleChecker = (counts) => {
  let score = 0;
  let match = false;
  const scoredDice: Die[] = [];

  counts.forEach((set, value) => {
    if (set.length !== 3) return;

    score += value === 1 ? 1000 : value * 100;
    match = true;
    scoredDice.push(...set);
  });

  return { match, score, scoredDice };
};

const fourOfKindChecker: RuleChecker = (counts) => {
  let score = 0;
  let match = false;
  const scoredDice: Die[] = [];

  counts.forEach((set, value) => {
    if (set.length !== 4) return;

    score += value === 1 ? 1100 : 1000;
    match = true;
    scoredDice.push(...set);
  });

  return { match, score, scoredDice };
};

const fiveOfKindChecker: RuleChecker = (counts) => {
  let score = 0;
  let match = false;
  const scoredDice: Die[] = [];

  counts.forEach((set) => {
    if (set.length !== 5) return;

    score += 2000;
    match = true;
    scoredDice.push(...set);
  });

  return { match, score, scoredDice };
};

const sixOfKindChecker: RuleChecker = (counts) => {
  let score = 0;
  let match = false;
  const scoredDice: Die[] = [];

  counts.forEach((set) => {
    if (set.length !== 6) return;

    score += 3000;
    match = true;
    scoredDice.push(...set);
  });

  return { match, score, scoredDice };
};

const straightChecker: RuleChecker = (counts) => {
  const match = counts.size === 6;

  return {
    match,
    score: 2500,
    scoredDice: [...counts.values()].flatMap((s) => s),
  };
};

const threePairsChecker: RuleChecker = (counts) => {
  const pairs = Array.from(counts.values()).filter((set) => set.length === 2);
  const match = pairs.length === 3;

  return { match, score: 1500, scoredDice: pairs.flatMap((pair) => pair) };
};

const ruleCheckers: Record<RuleId, RuleChecker> = {
  single_one: singleOneChecker,
  single_five: singleFiveChecker,
  three_of_kind: threeOfKindChecker,
  four_of_kind: fourOfKindChecker,
  five_of_kind: fiveOfKindChecker,
  six_of_kind: sixOfKindChecker,
  straight: straightChecker,
  three_pairs: threePairsChecker,
};

export const DEFAULT_RULES: Record<RuleId, Rule> = {
  single_one: {
    id: "single_one",
    description: "1",
    score: 100,
    enabled: true,
    activationCount: 0,
  },
  single_five: {
    id: "single_five",
    description: "5",
    score: 50,
    enabled: true,
    activationCount: 0,
  },
  three_of_kind: {
    id: "three_of_kind",
    description: "Three of a kind",
    score: "1000 (111) or value×100",
    enabled: true,
    activationCount: 0,
  },
  four_of_kind: {
    id: "four_of_kind",
    description: "XXXX",
    score: "1000",
    enabled: true,
    activationCount: 0,
  },
  five_of_kind: {
    id: "five_of_kind",
    description: "XXXXX",
    score: "2000",
    enabled: true,
    activationCount: 0,
  },
  six_of_kind: {
    id: "six_of_kind",
    description: "XXXXXX",
    score: "3000",
    enabled: true,
    activationCount: 0,
  },
  straight: {
    id: "straight",
    description: "1-2-3-4-5-6",
    score: 2500,
    enabled: true,
    activationCount: 0,
  },
  three_pairs: {
    id: "three_pairs",
    description: "XXYYZZ",
    score: 1500,
    enabled: true,
    activationCount: 0,
  },
};

const countDice = (dice: Die[]): Counts => {
  return dice.reduce<Counts>((memo, die) => {
    const count = memo.get(die.value);

    if (count) {
      count.push(die);
    } else {
      memo.set(die.value, [die]);
    }

    return memo;
  }, new Map() as Counts);
};

export interface ScoringGroup {
  ruleId: RuleId;
  score: number;
  dice: Die[];
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
  const unscoredDice = new Set<Die>(selectedDice);
  const scoringRuleIds: RuleId[] = [];
  const groups: ScoringGroup[] = [];
  let counts = countDice([...unscoredDice.values()]);

  // Priority order: higher combinations first
  const priorityOrder: RuleId[] = [
    "six_of_kind",
    "five_of_kind",
    "four_of_kind",
    "straight",
    "three_pairs",
    "three_of_kind",
    "single_one",
    "single_five",
  ];

  for (const ruleId of priorityOrder) {
    const rule = rules[ruleId];
    if (!rule || !rule.enabled) continue;

    const checker = ruleCheckers[ruleId];
    const result = checker(counts);

    if (result.match && result.score > 0) {
      totalScore += result.score;
      scoringRuleIds.push(ruleId);
      groups.push({
        ruleId,
        score: result.score,
        dice: result.scoredDice,
      });

      result.scoredDice.forEach((die) => unscoredDice.delete(die));
      counts = countDice([...unscoredDice.values()]);
    }
  }

  return {
    score: totalScore,
    scoringRuleIds,
    scoredDice: selectedDice.filter((die) => !unscoredDice.has(die)),
    groups,
  };
}

export function hasAnyScore(
  dice: Die[],
  rules: RuleMap = DEFAULT_RULES,
): boolean {
  return calculateScore(dice, rules).score > 0;
}

export function isSparkle(
  dice: Die[],
  rules: RuleMap = DEFAULT_RULES,
): boolean {
  return !hasAnyScore(dice, rules);
}

export function resetRuleCounts(rules: RuleMap): RuleMap {
  return Object.values(rules).reduce<RuleMap>((memo, rule) => {
    memo[rule.id] = { ...rule, activationCount: 0 };

    return memo;
  }, {} as RuleMap);
}
