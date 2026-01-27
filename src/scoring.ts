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

export function calculateScore(
  selectedDice: Die[],
  rules: RuleMap = DEFAULT_RULES,
): { score: number; scoringRuleIds: RuleId[] } {
  if (selectedDice.length === 0) return { score: 0, scoringRuleIds: [] };

  let totalScore = 0;
  const scoredDice = new Set<Die>(selectedDice);
  const scoringRuleIds: RuleId[] = [];
  let counts = countDice([...scoredDice.values()]);

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

      result.scoredDice.forEach((die) => scoredDice.delete(die));
      counts = countDice([...scoredDice.values()]);
    }
  }

  return { score: totalScore, scoringRuleIds };
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

const INDEPENDENT_PROBABILITIES: Record<number, Partial<Record<RuleId, number>>> = {
  1: {
    single_one: 0.16666666666666666,
    single_five: 0.16666666666666666,
  },
  2: {
    single_one: 0.3055555555555556,
    single_five: 0.3055555555555556,
  },
  3: {
    single_one: 0.4212962962962963,
    single_five: 0.4212962962962963,
    three_of_kind: 0.027777777777777776,
  },
  4: {
    single_one: 0.5177469135802469,
    single_five: 0.5177469135802469,
    three_of_kind: 0.09259259259259259,
    four_of_kind: 0.004629629629629629,
  },
  5: {
    single_one: 0.5981224279835391,
    single_five: 0.5981224279835391,
    three_of_kind: 0.19290123456790123,
    four_of_kind: 0.019290123456790122,
    five_of_kind: 0.0007716049382716049,
  },
  6: {
    single_one: 0.6651020233196159,
    single_five: 0.6651020233196159,
    three_of_kind: 0.3150720164609053,
    four_of_kind: 0.04822530864197531,
    five_of_kind: 0.0038580246913580245,
    six_of_kind: 0.0001286008230452675,
    straight: 0.015432098765432098,
    three_pairs: 0.038580246913580245,
  },
};

export function getRuleProbabilities(
  activeDiceCount: number,
): Partial<Record<RuleId, number>> {
  return INDEPENDENT_PROBABILITIES[activeDiceCount] || {};
}
