import { calculateScore, DEFAULT_RULES, isSparkle } from "../src/scoring";
import { Die, RuleId } from "../src/types";

const RULE_IDS: RuleId[] = [
  "single_one",
  "single_five",
  "three_of_kind",
  "four_of_kind",
  "five_of_kind",
  "six_of_kind",
  "straight",
  "three_pairs",
];

const round = (number) => Math.floor(number * 100) / 100;

function generateCombinations(numDice: number): number[][] {
  if (numDice === 0) return [[]];
  const combinations: number[][] = [];
  const subCombinations = generateCombinations(numDice - 1);
  for (let i = 1; i <= 6; i++) {
    for (const sub of subCombinations) {
      combinations.push([i, ...sub]);
    }
  }
  return combinations;
}

interface Stats {
  sparkle: number;
  [key: string]: number;
}

function calculateOdds() {
  const tableData = [];

  for (let diceCount = 1; diceCount <= 6; diceCount++) {
    const combinations = generateCombinations(diceCount);
    const totalCombinations = combinations.length;

    const stats: Stats = {
      sparkle: 0,
    };
    RULE_IDS.forEach((id) => (stats[id] = 0));

    for (const values of combinations) {
      const dice: Die[] = values.map((v, i) => ({
        id: i,
        value: v as any,
        staged: false,
        banked: false,
        position: i + 1,
        upgrades: [],
      }));

      const result = calculateScore(dice, DEFAULT_RULES);

      if (result.score === 0) {
        stats.sparkle++;
      } else {
        // Count occurrences of each rule
        // Note: result.scoringRuleIds might contain duplicates if multiple single ones, etc.
        // We probably want "percentage of rolls that contain at least one X"
        // OR "Average number of X per roll"?
        // Given the table format with % values, likely "Chance of getting X".
        // But multiple rules can trigger in one roll (e.g. Single 1 AND Single 5).
        // So the row percentages won't sum to 100% (except Sparkle + AnyScore = 100%)

        const uniqueRules = new Set(result.scoringRuleIds);
        uniqueRules.forEach((id) => {
          stats[id]++;
        });
      }
    }

    const row: any = { dice: diceCount };
    RULE_IDS.forEach((id) => {
      row[id] = round((stats[id] / totalCombinations) * 100);
    });
    row.sparkle = round((stats.sparkle / totalCombinations) * 100);

    tableData.push(row);
  }

  console.table(tableData);
}

calculateOdds();
