import type { Die as DieType } from "../../src/types";
import Die from "./Die";

interface DiceSectionsProps {
  dice: DieType[];
  onToggleDie: (id: number) => void;
  rolling: boolean;
}

export default function Dice({
  dice,
  onToggleDie,
  rolling,
}: DiceSectionsProps) {
  // Sort dice by position for consistent rendering
  const sortedDice = [...dice].sort((a, b) => a.position - b.position);

  // Separate active (non-selected, non-banked) and selected/banked dice
  const activeDice = sortedDice.filter((die) => !die.selected && !die.banked);
  const selectedOrBankedDice = sortedDice.filter(
    (die) => die.selected || die.banked,
  );

  // Create arrays with placeholders for all 6 positions
  const activeDiceWithPlaceholders = Array.from({ length: 6 }, (_, index) => {
    const die = activeDice.find((d) => d.position === index + 1);
    return die ? (
      <Die key={die.id} die={die} onToggleDie={onToggleDie} rolling={rolling} />
    ) : (
      <div key={`active-empty-${index}`} className="w-16 h-16" />
    );
  });

  const selectedOrBankedWithPlaceholders = Array.from(
    { length: 6 },
    (_, index) => {
      const die = selectedOrBankedDice.find((d) => d.position === index + 1);
      return die ? (
        <Die
          key={die.id}
          die={die}
          onToggleDie={onToggleDie}
          rolling={rolling}
        />
      ) : (
        <div key={`selected-empty-${index}`} className="w-16 h-16" />
      );
    },
  );

  return (
    <div className="mb-6 border-2 border-gray-900 rounded-xl">
      <div className="p-6">
        <div className="grid grid-cols-6 justify-items-center">
          {activeDiceWithPlaceholders}
        </div>
      </div>

      <div className="p-6 bg-gray-900">
        <div className="grid grid-cols-6 justify-items-center">
          {selectedOrBankedWithPlaceholders}
        </div>
      </div>
    </div>
  );
}
