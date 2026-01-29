interface ActionButtonsProps {
  canRollAction: boolean;
  canEndTurnAction: boolean;
  canReRollAction: boolean;
  onRoll: () => void;
  onEndTurn: () => void;
  onReset: () => void;
  onReRoll: () => void;
  onAddExtraDie: () => void;
  extraDicePool: number;
  diceCount: number;
}

export default function ActionButtons({
  canRollAction,
  canEndTurnAction,
  canReRollAction,
  onRoll,
  onEndTurn,
  onReset,
  onReRoll,
  onAddExtraDie,
  extraDicePool,
  diceCount,
}: ActionButtonsProps) {
  const buttonClass = [
    "px-4",
    "py-2",
    "bg-amber-500/80",
    "text-black",
    "rounded-lg",
    "hover:bg-amber-400/80",
    "hover:shadow-md",
    "hover:shadow-amber-500/80",
    "disabled:bg-stone-950",
    "disabled:text-stone-800",
    "disabled:hover:bg-stone-950",
    "disabled:cursor-not-allowed",
    "transition-colors",
  ].join(" ");

  return (
    <div className="flex gap-3 mb-8">
      <button
        onClick={onRoll}
        disabled={!canRollAction}
        className={buttonClass}
        title="Roll dice (Space)"
      >
        Roll
      </button>

      <button
        onClick={onReRoll}
        disabled={!canReRollAction}
        className={buttonClass}
        title="Re-roll last roll (R)"
      >
        Re-Roll
      </button>

      <button
        onClick={onAddExtraDie}
        disabled={extraDicePool <= 0 || diceCount >= 6}
        className={buttonClass}
        title="Add an extra die to the board"
      >
        + Die ({extraDicePool})
      </button>

      <button
        onClick={onEndTurn}
        disabled={!canEndTurnAction}
        className={buttonClass}
        title="End turn (Enter)"
      >
        End Turn
      </button>

      <button
        onClick={onReset}
        className={buttonClass + " ml-auto"}
        title="New game (Backspace)"
      >
        New Game
      </button>
    </div>
  );
}
