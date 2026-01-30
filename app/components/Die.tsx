import { forwardRef } from "react";

import type { Die } from "../../src/types";

interface DiceProps {
  die: Die;
  onToggleDie: (id: number) => void;
  rolling?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const DiceFace = ({ value }: { value: number }) => {
  const dots =
    {
      1: ["center"],
      2: ["top-left", "bottom-right"],
      3: ["top-left", "center", "bottom-right"],
      4: ["top-left", "top-right", "bottom-left", "bottom-right"],
      5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
      6: [
        "top-left",
        "top-right",
        "middle-left",
        "middle-right",
        "bottom-left",
        "bottom-right",
      ],
    }[value] || [];

  const dotPositions: Record<string, string> = {
    "top-left": "top-[20%] left-[20%]",
    "top-right": "top-[20%] right-[20%]",
    "middle-left": "top-[50%] left-[20%] -translate-y-1/2",
    "middle-right": "top-[50%] right-[20%] -translate-y-1/2",
    "bottom-left": "bottom-[20%] left-[20%]",
    "bottom-right": "bottom-[20%] right-[20%]",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  };

  return (
    <div className="relative w-full h-full">
      {dots.map((position, idx) => (
        <div
          key={idx}
          className={`absolute w-2.5 h-2.5 rounded-full ${dotPositions[position]} bg-black`}
        />
      ))}
    </div>
  );
};

const DieComponent = forwardRef<HTMLButtonElement, DiceProps & { isPotentialUpgrade?: boolean }>(({
  die,
  onToggleDie,
  rolling = false,
  onFocus,
  onBlur,
  isPotentialUpgrade = false,
}, ref) => {
  const upgradeCount = die.upgrades?.length || 0;

  const getUpgradeColor = () => {
    if (upgradeCount === 0) return "bg-amber-50 border-amber-200 text-black";
    if (upgradeCount >= 1 && upgradeCount <= 2)
      return "bg-yellow-600 border-yellow-600 text-black";
    if (upgradeCount >= 3 && upgradeCount <= 5)
      return "bg-orange-600 border-orange-600 text-black";
    return "bg-red-700 border-red-700 text-white";
  };

  const upgradeColorClass = getUpgradeColor();
  const isDarkBackground = upgradeCount >= 6;

  return (
    <button
      ref={ref}
      key={die.id}
      onClick={() => {
        onToggleDie(die.id);
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      disabled={die.banked || rolling}
      className={`
            w-16 h-16 border-2 transition-all rounded-xl relative
            focus:outline-none focus:shadow-lg focus:shadow-amber-500/50
            ${rolling && !die.banked ? "animate-roll" : ""}
            ${isPotentialUpgrade ? "ring-4 ring-cyan-400 animate-pulse z-20" : ""}
            ${
              die.banked
                ? `opacity-20 ${upgradeColorClass.split(" ")[0]} border-gray-600`
                : die.staged
                  ? "border-white bg-white text-black"
                  : `${upgradeColorClass} hover:border-white bg-gradient-to-br from-white/10 to-transparent`
            }
          `}
      style={{ gridColumn: die.position }}
    >
      {/* Position Indicator */}
      <div
        className={`absolute top-0.5 left-1 text-[10px] font-bold ${
          die.staged || !isDarkBackground ? "text-black/30" : "text-white/30"
        }`}
      >
        {die.position}
      </div>

      <DiceFace
        value={die.value}
      />
    </button>
  );
});

DieComponent.displayName = "Die";

export default DieComponent;
