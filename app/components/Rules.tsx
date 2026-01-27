"use client";

import { getRuleProbabilities } from "../../src/scoring";
import type { RuleMap } from "../../src/types";

interface RulesProps {
  rules: RuleMap;
  activeDiceCount: number;
  onToggleRule: (ruleId: string) => void;
}

export default function Rules({
  rules,
  activeDiceCount,
  onToggleRule,
}: RulesProps) {
  const probabilities = getRuleProbabilities(activeDiceCount);

  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-medium text-white mb-3">
        Scoring Rules {activeDiceCount > 0 && `(Odds for ${activeDiceCount} dice)`}
      </summary>
      <table className="w-full mt-2 border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 text-white font-medium">Rule</th>
            <th className="text-right py-2 text-white font-medium">Score</th>
            <th className="text-right py-2 text-white font-medium">Odds</th>
            <th className="text-right py-2 text-white font-medium">Count</th>
            <th className="text-center py-2 text-white font-medium">On</th>
          </tr>
        </thead>
        <tbody className="text-gray-400">
          {Object.values(rules).map((rule) => {
            const prob = probabilities[rule.id] || 0;
            const oddsDisplay =
              prob === 0
                ? "-"
                : prob < 0.001
                  ? "< 0.1%"
                  : `${(prob * 100).toFixed(1)}%`;

            return (
              <tr key={rule.id} className="border-b border-gray-800">
                <td className="py-2">{rule.description}</td>
                <td className="text-right">
                  {typeof rule.score === "number"
                    ? rule.score.toLocaleString()
                    : rule.score}
                </td>
                <td className="text-right text-gray-500">{oddsDisplay}</td>
                <td className="text-right">{rule.activationCount}</td>
                <td className="text-center">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => onToggleRule(rule.id)}
                    className="accent-white cursor-pointer"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </details>
  );
}
