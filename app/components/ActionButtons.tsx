interface ActionButtonsProps {
  canRollAction: boolean;
  canEndTurnAction: boolean;
  canReRollAction: boolean;
  onRoll: () => void;
  onEndTurn: () => void;
  onReset: () => void;
  onReRoll: () => void;
}

export default function ActionButtons({
  canRollAction,
  canEndTurnAction,
  canReRollAction,
  onRoll,
  onEndTurn,
  onReset,
  onReRoll,
}: ActionButtonsProps) {
  const buttonClass =
    "px-4 py-2 bg-stone-600 text-black rounded-lg hover:bg-stone-500 " +
    "disabled:bg-stone-950 disabled:text-stone-800 disabled:hover:bg-stone-950 " +
    "disabled:cursor-not-allowed transition-colors";

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
        onClick={onEndTurn}
        disabled={!canEndTurnAction}
        className={buttonClass}
        title="End turn (Enter)"
      >
        End Turn
      </button>

      <button
        onClick={onReset}
        className="px-4 py-2 rounded-lg bg-stone-600 text-black hover:bg-stone-500 transition-colors ml-auto font-medium"
        title="New game (Backspace)"
      >
        New Game
      </button>
    </div>
  );
}
