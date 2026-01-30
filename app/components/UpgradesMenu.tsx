"use client";

import { STRINGS } from "../../src/strings";
import type { Die } from "../../src/types";

interface UpgradesMenuProps {
  dice: Die[];
}

const LABELS = STRINGS.upgrades.labels;

export default function UpgradesMenu({ dice }: UpgradesMenuProps) {
  // We want to show upgrades for each position 1-6
  const positions = [1, 2, 3, 4, 5, 6];

  return (
    <div className="mt-8 p-4 border border-white/10 rounded-lg bg-zinc-900/50">
      <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">
        {STRINGS.ui.dieUpgrades}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {positions.map((pos) => {
          const die = dice.find((d) => d.position === pos);
          const upgrades = die?.upgrades || [];

          return (
            <div key={pos} className="flex flex-col">
              <div className="text-xs text-white/30 mb-1">
                {STRINGS.ui.position(pos)}
              </div>
              <div className="flex flex-wrap gap-1 min-h-[24px]">
                {upgrades.length === 0 ? (
                  <span className="text-xs text-white/10 italic">
                    {STRINGS.ui.none}
                  </span>
                ) : (
                  upgrades.map((upgrade) => (
                    <span
                      key={upgrade.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold border border-black/20 ${
                        upgrade.type.includes("MULTIPLIER")
                          ? "bg-amber-400 text-black"
                          : "bg-blue-400 text-black"
                      }`}
                    >
                      {getUpgradeLabel(upgrade.type)}
                      {upgrade.remainingUses !== undefined && (
                        <span className="ml-1 opacity-50">
                          ({upgrade.remainingUses})
                        </span>
                      )}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
