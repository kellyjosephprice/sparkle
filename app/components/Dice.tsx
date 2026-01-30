import { forwardRef,useImperativeHandle, useRef } from "react";

import type { Die as DieType, UpgradeOption, UpgradeType } from "../../src/types";
import Die from "./Die";
import UpgradeSelection from "./UpgradeSelection";

interface DiceSectionsProps {
  dice: DieType[];
  onToggleDie: (id: number) => void;
  rolling: boolean;
  onFocusDie: (position: number | null) => void;
  potentialUpgradePosition?: number | null;
  upgradeOptions?: UpgradeOption[];
  onSelectUpgrade?: (type: UpgradeType) => void;
  focusedUpgradeIndex?: number | null;
}

export interface DiceRef {
  focusDie: (position: number) => void;
}

const Dice = forwardRef<DiceRef, DiceSectionsProps>(({
  dice,
  onToggleDie,
  rolling,
  onFocusDie,
  potentialUpgradePosition,
  upgradeOptions = [],
  onSelectUpgrade,
  focusedUpgradeIndex = null,
}, ref) => {
  const dieRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    focusDie: (position: number) => {
      dieRefs.current[position - 1]?.focus();
    },
  }));

  // Sort dice by position for consistent rendering
  const sortedDice = [...dice].sort((a, b) => a.position - b.position);

  // Separate active (non-staged, non-banked) and staged/banked dice
  const activeDice = sortedDice.filter((die) => !die.staged && !die.banked);
  const stagedOrBankedDice = sortedDice.filter(
    (die) => die.staged || die.banked,
  );

  // Create arrays with placeholders for all 5 positions
  const activeDiceWithPlaceholders = Array.from({ length: 5 }, (_, index) => {
    const position = index + 1;
    const die = activeDice.find((d) => d.position === position);
    return die ? (
      <Die
        key={die.id}
        ref={(el) => { dieRefs.current[index] = el; }}
        die={die}
        onToggleDie={onToggleDie}
        rolling={rolling}
        onFocus={() => onFocusDie(die.position)}
        onBlur={() => onFocusDie(null)}
        isPotentialUpgrade={potentialUpgradePosition === die.position}
      />
    ) : (
      <div key={`active-empty-${index}`} className="w-16 h-16" />
    );
  });

  const hasUpgradeOptions = upgradeOptions.length > 0;

  const stagedOrBankedWithPlaceholders = Array.from(
    { length: 5 },
    (_, index) => {
      const position = index + 1;
      const die = stagedOrBankedDice.find((d) => d.position === position);
      return die ? (
        <Die
          key={die.id}
          ref={(el) => { dieRefs.current[index] = el; }}
          die={die}
          onToggleDie={onToggleDie}
          rolling={rolling}
          onFocus={() => onFocusDie(die.position)}
          onBlur={() => onFocusDie(null)}
          isPotentialUpgrade={potentialUpgradePosition === die.position}
        />
      ) : (
        <div key={`selected-empty-${index}`} className="w-16 h-16" />
      );
    },
  );

  return (
    <div className="mb-6 border-2 border-gray-900 rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="grid grid-cols-5 justify-items-center">
          {activeDiceWithPlaceholders}
        </div>
      </div>

      <div className="p-6 bg-gray-900 min-h-[112px] flex items-center justify-center">
        {hasUpgradeOptions ? (
          <UpgradeSelection
            options={upgradeOptions}
            onSelect={onSelectUpgrade!}
            focusedIndex={focusedUpgradeIndex}
          />
        ) : (
          <div className="grid grid-cols-5 justify-items-center w-full">
            {stagedOrBankedWithPlaceholders}
          </div>
        )}
      </div>
    </div>
  );
});

Dice.displayName = "Dice";

export default Dice;
