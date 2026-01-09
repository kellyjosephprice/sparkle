import type { Die, DieValue } from './types';

export function calculateScore(selectedDice: Die[]): number {
  if (selectedDice.length === 0) return 0;

  const values = selectedDice.map(d => d.value);
  const counts = new Map<DieValue, number>();

  values.forEach(val => {
    counts.set(val, (counts.get(val) || 0) + 1);
  });

  // Check for straight (1-2-3-4-5-6)
  if (values.length === 6 && new Set(values).size === 6) {
    return 1500;
  }

  // Check for three pairs
  const pairs = Array.from(counts.values()).filter(count => count === 2);
  if (pairs.length === 3) {
    return 1500;
  }

  let score = 0;

  // Process each unique value
  counts.forEach((count, value) => {
    if (count >= 3) {
      // Three or more of a kind
      let baseScore = value === 1 ? 1000 : value * 100;

      if (count === 3) {
        score += baseScore;
      } else if (count === 4) {
        score += baseScore * 2;
      } else if (count === 5) {
        score += baseScore * 4;
      } else if (count === 6) {
        score += baseScore * 8;
      }
    } else {
      // Single 1s and 5s
      if (value === 1) {
        score += count * 100;
      } else if (value === 5) {
        score += count * 50;
      }
    }
  });

  return score;
}

export function hasAnyScore(dice: Die[]): boolean {
  return calculateScore(dice) > 0;
}

export function isFarkle(dice: Die[]): boolean {
  // Check if any single die or combination can score
  const values = dice.map(d => d.value);
  const counts = new Map<DieValue, number>();

  values.forEach(val => {
    counts.set(val, (counts.get(val) || 0) + 1);
  });

  // Check for straight
  if (values.length === 6 && new Set(values).size === 6) {
    return false;
  }

  // Check for three pairs
  const pairs = Array.from(counts.values()).filter(count => count === 2);
  if (pairs.length === 3) {
    return false;
  }

  // Check if any value has 3+ or is a 1 or 5
  for (const [value, count] of counts) {
    if (count >= 3 || value === 1 || value === 5) {
      return false;
    }
  }

  return true;
}
