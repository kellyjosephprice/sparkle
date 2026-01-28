import type { Die } from "../../src/types";

interface DiceProps {
  die: Die;
  onToggleDie: (id: number) => void;
  rolling?: boolean;
  focused?: boolean;
  onFocus?: () => void;
}

const DiceFace = ({
  value,
  staged,
}: {
  value: number;
  staged: boolean;
}) => {
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
          className={`absolute w-2.5 h-2.5 rounded-full ${dotPositions[position]} ${
            staged ? "bg-black" : "bg-white"
          }`}
        />
      ))}
    </div>
  );
};

export default function Die({
  die,
  onToggleDie,
  rolling = false,
  focused = false,
  onFocus,
}: DiceProps) {
  return (
    <button
      key={die.id}
      onClick={() => {
        onFocus?.(); // Set focus on click
        onToggleDie(die.id);
      }}
      disabled={die.banked || rolling}
      className={`
            w-16 h-16 border-2 transition-colors rounded-xl relative
            ${focused ? "shadow-lg shadow-amber-500/50" : ""}
            ${rolling && !die.banked ? "animate-roll" : ""}
            ${
              die.banked
                ? "opacity-20 border-gray-600 bg-gray-600"
                : die.staged
                  ? "border-white bg-white"
                  : "border-gray-600 bg-gray-600 hover:border-white"
            }
          `}
      style={{ gridColumn: die.position }}
    >
      {/* Position Indicator */}
      <div
        className={`absolute top-0.5 left-1 text-[10px] font-bold ${
          die.staged ? "text-black/30" : "text-white/30"
        }`}
      >
        {die.position}
      </div>

      {/* Upgrades indicators */}
      <div className="absolute -top-2 -right-2 flex flex-row-reverse flex-wrap gap-0.5 max-w-[120%] pointer-events-none z-10">
        {die.upgrades.map((upgrade) => (
          <div
            key={upgrade.id}
            title={upgrade.type}
            className={`
              h-4 px-1 rounded-full border border-black text-[8px] flex items-center justify-center font-bold shadow-sm min-w-[1rem]
              ${
                upgrade.type.includes("MULTIPLIER")
                  ? "bg-amber-400 text-black"
                  : "bg-blue-400 text-black"
              }
            `}
          >
            {upgrade.type.includes("MULTIPLIER") ? "2x" : "+100"}
          </div>
        ))}
      </div>

      <DiceFace value={die.value} staged={die.staged} />
    </button>
  );
}
