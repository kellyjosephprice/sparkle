import type { GameState } from "../../types";
import type { CommandResult,GameCommand } from "../types";

export function handleToggleScoringRule(
  state: GameState,
  command: Extract<GameCommand, { type: "TOGGLE_SCORING_RULE" }>,
): CommandResult {
  const newRules = state.scoringRules.map((rule) =>
    rule.id === command.ruleId
      ? { ...rule, enabled: !rule.enabled }
      : rule,
  );

  return {
    state: {
      ...state,
      scoringRules: newRules,
    },
    events: [],
  };
}

export function handleResetScoringRuleCounts(
  state: GameState,
  _command: Extract<GameCommand, { type: "RESET_SCORING_RULE_COUNTS" }>,
): CommandResult {
  const newRules = state.scoringRules.map((rule) => ({
    ...rule,
    activationCount: 0,
  }));

  return {
    state: {
      ...state,
      scoringRules: newRules,
    },
    events: [],
  };
}
