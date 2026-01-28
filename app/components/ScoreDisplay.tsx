import { getNextThresholdInfo } from "../../src/game";

interface ScoreDisplayProps {
  bankedScore: number;
  stagedScore: number;
  highScore: number;
  rerollsAvailable: number;
  threshold: number;
  totalScore: number;
  turnNumber: number;
}

export default function ScoreDisplay({
  bankedScore,
  stagedScore,
  highScore,
  rerollsAvailable,
  threshold,
  totalScore,
  turnNumber,
}: ScoreDisplayProps) {
  const potentialScore = totalScore + bankedScore + stagedScore;
  const temperature = potentialScore - threshold;
  const nextThreshold = getNextThresholdInfo(turnNumber);

  return (
    <>
      <div className="flex gap-8 mb-6 text-sm">
        <div className="flex flex-col">
          <div className="text-gray-400">Turn</div>
          <div className="text-2xl font-bold text-white">{turnNumber}</div>
          <div className="text-[10px] text-white/30 uppercase mt-1">
            Next Level: Turn {nextThreshold.turn}
          </div>
        </div>
        <div className="flex flex-col">
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
        <div className="flex flex-col">
          <div className="text-gray-400">Limit</div>
          <div
            className={`text-2xl font-bold ${temperature > 0 ? "text-green-500" : temperature < 0 ? "text-red-500" : "text-orange-500"}`}
          >
            {threshold}
          </div>
          <div className="text-[10px] text-white/30 uppercase mt-1">
            Next Limit: {nextThreshold.value.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Total Score</div>
          <div className="text-2xl font-bold text-white">{totalScore}</div>
        </div>
        <div>
          <div className="text-gray-400">Banked Score</div>
          <div className="text-2xl font-bold text-white">{bankedScore}</div>
        </div>
        <div>
          <div className="text-gray-400">Staged Score</div>
          <div className="text-2xl font-bold text-white">{stagedScore}</div>
        </div>
      </div>
    </>
  );
}
