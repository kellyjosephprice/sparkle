import { getNextThresholdInfo } from "../../src/game";
import { STRINGS } from "../../src/strings";

interface ScoreDisplayProps {
  bankedScore: number;
  stagedScore: number;
  highScore: number;
  rerollsAvailable: number;
  extraDicePool: number;
  threshold: number;
  totalScore: number;
  turnNumber: number;
}

export default function ScoreDisplay({
  bankedScore,
  stagedScore,
  highScore,
  rerollsAvailable,
  extraDicePool,
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
          <div className="text-amber-50/40">{STRINGS.ui.turn}</div>
          <div className="text-2xl font-bold text-amber-50">{turnNumber}</div>
          <div className="text-[10px] text-amber-50/20 uppercase mt-1">
            {STRINGS.ui.nextLevel(nextThreshold.turn)}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-amber-50/40">{STRINGS.ui.rerolls}</div>
          <div className="text-2xl font-bold text-amber-50">
            {rerollsAvailable}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-amber-50/40">{STRINGS.ui.extraDice}</div>
          <div className="text-2xl font-bold text-amber-50">
            {extraDicePool}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-amber-50/40">{STRINGS.ui.highScore}</div>
          <div className="text-2xl font-bold text-amber-50">{highScore}</div>
        </div>
      </div>
      <div className="flex gap-8 mb-6 text-sm">
        <div className="flex flex-col">
          <div className="text-amber-50/40">{STRINGS.ui.limit}</div>
          <div
            className={`text-2xl font-bold ${temperature > 0 ? "text-green-500" : temperature < 0 ? "text-red-500" : "text-orange-500"}`}
          >
            {threshold}
          </div>
          <div className="text-[10px] text-amber-50/20 uppercase mt-1">
            {STRINGS.ui.nextLimit(nextThreshold.value)}
          </div>
        </div>
        <div>
          <div className="text-amber-50/40">{STRINGS.ui.totalScore}</div>
          <div className="text-2xl font-bold text-amber-50">{totalScore}</div>
        </div>
        <div>
          <div className="text-amber-50/40">{STRINGS.ui.bankedScore}</div>
          <div className="text-2xl font-bold text-amber-50">{bankedScore}</div>
        </div>
        <div>
          <div className="text-amber-50/40">{STRINGS.ui.stagedScore}</div>
          <div className="text-2xl font-bold text-amber-50">{stagedScore}</div>
        </div>
      </div>
    </>
  );
}
