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
  const dieWithIndex: [number, DieType][] = dice.map((die, index) => [
    index + 1,
    die,
  ]);

  console.log(dieWithIndex);

  return (
    <div className="mb-8">
      <div className="mb-6">
        <div className="grid grid-cols-6 justify-items-center">
          {dieWithIndex.map(
            ([index, die]) =>
              !die.selected &&
              !die.banked && (
                <Die
                  key={index}
                  die={die}
                  index={index}
                  onToggleDie={onToggleDie}
                  rolling={rolling}
                />
              ),
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-gray-800">
        <div className="grid grid-cols-6 justify-items-center">
          {dieWithIndex.map(
            ([index, die]) =>
              (die.selected || die.banked) && (
                <Die
                  key={index}
                  die={die}
                  index={index}
                  onToggleDie={onToggleDie}
                  rolling={rolling}
                />
              ),
          )}
        </div>
      </div>
    </div>
  );
}
