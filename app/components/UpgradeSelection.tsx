"use client";

import { STRINGS } from "../../src/strings";
import type { UpgradeOption, UpgradeType } from "../../src/types";

interface UpgradeSelectionProps {
  options: UpgradeOption[];
  onSelect: (type: UpgradeType) => void;
  focusedIndex: number | null;
}

export default function UpgradeSelection({
  options,
  onSelect,
  focusedIndex,
}: UpgradeSelectionProps) {
  if (options.length === 0) return null;

  return (
    <div className="flex gap-4 w-full max-w-lg">
      {options.map((option, idx) => {
        const isFocused = focusedIndex === idx;
        const label = option.type === "ADDITIONAL_REROLL" ? STRINGS.ui.reroll : STRINGS.ui.upgrades;

        return (
          <button
            key={`${option.type}-${idx}`}
            onClick={() => onSelect(option.type)}
            className={`
              flex-1 p-3 border-2 transition-all rounded-lg text-center group
              ${
                isFocused
                  ? "border-white bg-cyan-500 text-black scale-105 shadow-lg shadow-cyan-500/20"
                  : "border-cyan-500 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20"
              }
            `}
          >
            <div className={`font-bold text-sm mb-1 uppercase tracking-tight ${isFocused ? "text-black" : "text-cyan-500"}`}>
              {label}
            </div>
            <div className={`text-[10px] leading-tight font-medium ${isFocused ? "text-black/80" : "opacity-70 group-hover:opacity-100"}`}>
              {option.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}
