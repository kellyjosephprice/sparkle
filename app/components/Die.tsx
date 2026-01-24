import type { Die } from "../../src/types";

interface DiceProps {
  die: Die;
  onToggleDie: (id: number) => void;
  rolling?: boolean;
}

const DiceFace = ({
  value,
  selected,
}: {
  value: number;
  selected: boolean;
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
            selected ? "bg-black" : "bg-white"
          }`}
        />
      ))}
    </div>
  );
};

export default function Die({ die, onToggleDie, rolling = false }: DiceProps) {
  return (
    <button
      key={die.id}
      onClick={() => onToggleDie(die.id)}
      disabled={die.banked || rolling}
      className={`
            w-16 h-16 border-2 transition-colors rounded-xl relative
            ${rolling && !die.banked ? "animate-roll" : ""}
            ${
              die.banked
                ? "opacity-20 border-gray-600 bg-gray-600"
                : die.selected
                  ? "border-white bg-white"
                  : "border-gray-600 bg-gray-600 hover:border-white"
            }
          `}
      style={{ gridColumn: die.position }}
    >
      <DiceFace value={die.value} selected={die.selected} />
    </button>
  );
}
