import type { Die } from "../types";
import Dice from "./Dice";

interface DiceSectionsProps {
  activeDice: Die[];
  bankedDice: Die[];
  selectedScore: number;
  onToggleDie: (id: number) => void;
  rolling: boolean;
}

export default function DiceSections({
  activeDice,
  bankedDice,
  selectedScore,
  onToggleDie,
  rolling,
}: DiceSectionsProps) {
  const selectedActiveDice = activeDice.filter((d) => d.selected);

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-white mb-3">
          Active Dice
        </h2>
        <Dice
          dice={activeDice.filter((d) => !d.selected)}
          onToggleDie={onToggleDie}
          rolling={rolling}
        />
      </div>

      <div className="pt-6 border-t border-gray-800">
        <h2 className="text-lg font-medium text-white mb-3">
          Banked Dice
          {selectedScore > 0 && (
            <span className="text-sm text-gray-400 font-normal ml-2">
              ({selectedScore} points staged)
            </span>
          )}
        </h2>
        <Dice
          dice={[...bankedDice, ...selectedActiveDice]}
          onToggleDie={onToggleDie}
          rolling={false}
        />
        {bankedDice.length === 0 && selectedActiveDice.length === 0 && (
          <div className="text-gray-600 text-sm italic">
            No dice banked yet
          </div>
        )}
      </div>
    </div>
  );
}
