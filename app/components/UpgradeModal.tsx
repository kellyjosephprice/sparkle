"use client";

import type { UpgradeOption, UpgradeType } from "../../src/types";

interface UpgradeModalProps {
  options: UpgradeOption[];
  onSelect: (type: UpgradeType) => void;
}

export default function UpgradeModal({ options, onSelect }: UpgradeModalProps) {
  if (options.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border-2 border-white p-8 max-w-md w-full shadow-[0_0_20px_rgba(255,255,255,0.2)]">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Choose an Upgrade
        </h2>
        <div className="space-y-4">
          {options.map((option, index) => (
            <button
              key={`${option.type}-${index}`}
              onClick={() => onSelect(option.type)}
              className="w-full p-4 border border-white/20 hover:border-white hover:bg-white hover:text-black transition-all text-left group"
            >
              <div className="font-bold text-lg mb-1">{option.type.replace(/_/g, " ")}</div>
              <div className="text-sm opacity-70 group-hover:opacity-100">
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
