"use client";

import Link from "next/link";

import { DEFAULT_RULES } from "../../src/scoring";

export default function RulesPage() {
  const hotkeys = [
    { key: "1-6", action: "Toggle Die" },
    { key: "Space", action: "Roll / Stage All / Re-Roll (Sparkle)" },
    { key: "Enter", action: "End Turn" },
    { key: "R", action: "Re-Roll" },
    { key: "Backspace", action: "New Game" },
    { key: "←/→ or A/D", action: "Move Focus" },
    { key: "↓/↑ or S/W", action: "Stage/Unstage Focused" },
  ];

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-baseline mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tighter">Sparkle Rules</h1>
          <Link
            href="/"
            className="text-cyan-500 hover:text-cyan-400 underline underline-offset-4 text-sm font-medium transition-colors"
          >
            Back to Game
          </Link>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/20 pb-2">Scoring Rules</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="py-2 text-white font-medium">Rule</th>
                  <th className="py-2 text-white font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                {Object.values(DEFAULT_RULES).map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-800">
                    <td className="py-2">{rule.description}</td>
                    <td className="py-2 text-right text-white tabular-nums">
                      {typeof rule.score === "number" ? rule.score.toLocaleString() : rule.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/20 pb-2">Keyboard Shortcuts</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="py-2 text-white font-medium">Action</th>
                  <th className="py-2 text-white font-medium text-right">Key</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                {hotkeys.map((hk) => (
                  <tr key={hk.key} className="border-b border-gray-800">
                    <td className="py-2">{hk.action}</td>
                    <td className="py-2 text-right font-mono text-white">{hk.key}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4 border-b border-white/20 pb-2">Upgrades</h2>
            <p className="text-gray-400 leading-relaxed">
              Every 5 turns, you get to choose an upgrade. Upgrades can be applied to individual dice positions or grant extra re-rolls.
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-2 space-y-1">
              <li><span className="text-white">Score Multiplier:</span> 2x score when the die is scored.</li>
              <li><span className="text-white">Score Bonus:</span> +100 score when the die is scored.</li>
              <li><span className="text-white">Banked Multiplier:</span> 2x banked score when any dice are banked if this die is already banked.</li>
              <li><span className="text-white">Banked Bonus:</span> +100 banked score when any dice are banked if this die is already banked.</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link
            href="/"
            className="block w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black text-center font-bold tracking-widest transition-all rounded-lg"
          >
            PLAY GAME
          </Link>
        </div>
      </div>
    </div>
  );
}
