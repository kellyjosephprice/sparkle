export function calculateThreshold(turnNumber: number): number {
  if (turnNumber <= 1) return 50;

  const stage = Math.floor(turnNumber / 3);
  const value = 50 * Math.pow(2, stage);

  return roundToSigFigs(value, 2);
}

function roundToSigFigs(num: number, sigFigs: number): number {
  if (num === 0) return 0;
  return parseFloat(num.toPrecision(sigFigs));
}

export function getNextThresholdInfo(turnNumber: number): {
  turn: number;
  value: number;
} {
  const stage = Math.floor(turnNumber / 3);
  const nextTurn = stage * 3;
  return {
    turn: nextTurn,
    value: calculateThreshold(nextTurn),
  };
}
