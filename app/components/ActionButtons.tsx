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
    "px-4 py-2 border-2 border-white rounded-lg text-white hover:bg-white hover:text-black " +
    "disabled:border-gray-700 disabled:text-gray-700 disabled:hover:bg-transparent " +
    "disabled:cursor-not-allowed transition-colors font-medium";

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
        className="px-4 py-2 border-2 rounded-lg border-gray-600 text-gray-300 hover:border-white hover:text-white transition-colors ml-auto font-medium"
        title="New game (Backspace)"
      >
        New Game
      </button>
    </div>
  );
}
