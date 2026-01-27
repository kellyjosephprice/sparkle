"use client";

import type { RuleMap } from "../../src/types";

interface RulesProps {
  rules: RuleMap;
  onToggleRule: (ruleId: string) => void;
}

export default function Rules({ rules, onToggleRule }: RulesProps) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer font-medium text-white mb-3">
        Scoring Rules
      </summary>
      <table className="w-full mt-2 border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 text-white font-medium">Rule</th>
            <th className="text-right py-2 text-white font-medium">Score</th>
            <th className="text-right py-2 text-white font-medium">Count</th>
            <th className="text-center py-2 text-white font-medium">On</th>
          </tr>
        </thead>
        <tbody className="text-gray-400">
          {Object.values(rules).map((rule) => (
            <tr key={rule.id} className="border-b border-gray-800">
              <td className="py-2">{rule.description}</td>
              <td className="text-right">
                {typeof rule.score === "number"
                  ? rule.score.toLocaleString()
                  : rule.score}
              </td>
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
          ))}
        </tbody>
      </table>
    </details>
  );
}
