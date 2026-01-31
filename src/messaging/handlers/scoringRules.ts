import type { GameState, RuleMap } from "@/src/game/types";
import { Rule } from "@/src/game/types";

import type { CommandResult, GameCommand } from "../types";

export function handleToggleRule(
  state: GameState,
  command: Extract<GameCommand, { type: "TOGGLE_SCORING_RULE" }>,
): CommandResult {
  const currentRule = state.scoringRules[command.ruleId];
  const newRules: RuleMap = {
    ...state.scoringRules,
    [command.ruleId]: { ...currentRule, enabled: !currentRule.enabled },
  };

  return {
    state: {
      ...state,
      scoringRules: newRules,
    },
    events: [],
  };
}

export function handleResetRuleCounts(state: GameState): CommandResult {
  const newRules: RuleMap = Object.values<Rule>(
    state.scoringRules,
  ).reduce<RuleMap>((acc, rule: Rule) => {
    acc[rule.id] = { ...rule, activationCount: 0 };
    return acc;
  }, {} as RuleMap);

  return {
    state: {
      ...state,
      scoringRules: newRules,
    },
    events: [],
  };
}
