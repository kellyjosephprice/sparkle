interface ScoreDisplayProps {
  totalScore: number;
  currentTurnScore: number;
  turnNumber: number;
  threshold: number;
  rerollsAvailable: number;
}

export default function ScoreDisplay({
  totalScore,
  currentTurnScore,
  turnNumber,
  threshold,
  rerollsAvailable,
}: ScoreDisplayProps) {
  return (
    <div className="flex gap-8 mb-6 text-sm">
      <div>
        <div className="text-gray-400">Score</div>
        <div className="text-2xl font-bold text-white">{totalScore}</div>
      </div>
      <div>
        <div className="text-gray-400">This Turn</div>
        <div className="text-2xl font-bold text-white">
          {currentTurnScore}
        </div>
      </div>
      <div>
        <div className="text-gray-400">Re-Rolls</div>
        <div className="text-2xl font-bold text-white">{rerollsAvailable}</div>
      </div>
      <div>
        <div className="text-gray-400">Turn {turnNumber}</div>
        <div className="text-sm text-gray-300">
          Threshold: {threshold}
        </div>
      </div>
    </div>
  );
}
