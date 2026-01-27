interface ScoreDisplayProps {
  currentTurnScore: number;
  bankedScore: number;
  highScore: number;
  rerollsAvailable: number;
  threshold: number;
  totalScore: number;
  turnNumber: number;
}

export default function ScoreDisplay({
  currentTurnScore,
  bankedScore,
  highScore,
  rerollsAvailable,
  threshold,
  totalScore,
  turnNumber,
}: ScoreDisplayProps) {
  return (
    <>
      <div className="flex gap-8 mb-6 text-sm">
        <div>
          <div className="text-gray-400">Turn</div>
          <div className="text-2xl font-bold text-white">{turnNumber}</div>
        </div>
        <div>
          <div className="text-gray-400">Re-Rolls</div>
          <div className="text-2xl font-bold text-white">
            {rerollsAvailable}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-gray-400">High Score</div>
          <div className="text-2xl font-bold text-white">{highScore}</div>
        </div>
      </div>
      <div className="flex gap-8 mb-6 text-sm">
        <div>
          <div className="text-gray-400">Limit</div>
          <div className="text-2xl font-bold text-white">{threshold}</div>
        </div>
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
          <div className="text-gray-400">Banked Score</div>
          <div className="text-2xl font-bold text-white">{bankedScore}</div>
        </div>
      </div>
    </>
  );
}
