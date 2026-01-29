import { STRINGS } from "../../src/strings";

interface ActionButtonsProps {
  canRollAction: boolean;
  canEndTurnAction: boolean;
  canReRollAction: boolean;
  onRoll: () => void;
  onEndTurn: () => void;
  onReset: () => void;
  onReRoll: () => void;
  onAddExtraDie: () => void;
  onDiscardUnscored: () => void;
  extraDicePool: number;
  diceCount: number;
  canDiscardAction: boolean;
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
  onDiscardUnscored,
  extraDicePool,
  diceCount,
  canDiscardAction,
}: ActionButtonsProps) {
  const buttonClass = [
    "px-4",
    "py-2",
    "bg-green-500/80",
    "text-black",
    "rounded-lg",
    "hover:bg-green-400/80",
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
        title={STRINGS.ui.rollTooltip}
      >
        {STRINGS.ui.roll}
      </button>

      <button
        onClick={onReRoll}
        disabled={!canReRollAction}
        className={buttonClass}
        title={STRINGS.ui.rerollTooltip}
      >
        {STRINGS.ui.reroll}
      </button>

      <button
        onClick={onDiscardUnscored}
        disabled={!canDiscardAction}
        className={buttonClass}
        title={STRINGS.ui.discardTooltip}
      >
        {STRINGS.ui.discard}
      </button>

      <button
        onClick={onAddExtraDie}
        disabled={extraDicePool <= 0 || diceCount >= 6}
        className={buttonClass}
        title={STRINGS.ui.extraDieTooltip}
      >
        {STRINGS.ui.extraDie(extraDicePool)}
      </button>

      <button
        onClick={onEndTurn}
        disabled={!canEndTurnAction}
        className={buttonClass}
        title={STRINGS.ui.endTurnTooltip}
      >
        {STRINGS.ui.endTurn}
      </button>

      <button
        onClick={onReset}
        className={buttonClass + " ml-auto"}
        title={STRINGS.ui.newGameTooltip}
      >
        {STRINGS.ui.newGame}
      </button>
    </div>
  );
}
