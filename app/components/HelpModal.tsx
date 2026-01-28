"use client";

import type { RuleMap } from "../../src/types";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RuleMap;
}

export default function HelpModal({ isOpen, onClose, rules }: HelpModalProps) {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="bg-zinc-900 border-2 border-white p-8 max-w-2xl w-full shadow-[0_0_40px_rgba(255,255,255,0.1)] relative my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-2"
          aria-label="Close"
        >
          <span className="text-3xl leading-none">×</span>
        </button>

        <h2 className="text-3xl font-bold text-white mb-8">Sparkle Guide</h2>

        <div className="space-y-12">
          <section>
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/20 pb-2">Scoring Rules</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="py-2 text-white font-medium">Rule</th>
                  <th className="py-2 text-white font-medium text-right">Score</th>
                  <th className="py-2 text-white font-medium text-right pl-4">Times Scored</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                {Object.values(rules).map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-800">
                    <td className="py-2">{rule.description}</td>
                    <td className="py-2 text-right text-white">
                      {typeof rule.score === "number" ? rule.score.toLocaleString() : rule.score}
                    </td>
                    <td className="py-2 text-right tabular-nums pl-4">{rule.activationCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="text-xl font-bold text-white mb-4 border-b border-white/20 pb-2">Keyboard Shortcuts</h3>
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
        </div>

        <button
          onClick={onClose}
          className="mt-12 w-full py-4 border border-white hover:bg-white hover:text-black transition-all font-bold tracking-widest"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
}
