"use client";

export default function Hotkeys() {
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
    <details className="text-sm mt-8" open>
      <summary className="cursor-pointer font-medium text-white mb-3">
        Keyboard Shortcuts
      </summary>
      <table className="w-full mt-2 border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 text-white font-medium">Action</th>
            <th className="text-right py-2 text-white font-medium">Key</th>
          </tr>
        </thead>
        <tbody className="text-gray-400">
          {hotkeys.map((hk) => (
            <tr key={hk.key} className="border-b border-gray-800">
              <td className="py-2">{hk.action}</td>
              <td className="text-right font-mono text-white">{hk.key}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
