export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface Die {
  id: number;
  value: DieValue;
  selected: boolean;
  banked: boolean;
}

export interface GameState {
  dice: Die[];
  currentScore: number;
  bankedScore: number;
  totalScore: number;
  isOnBoard: boolean;
  turnNumber: number;
  gameOver: boolean;
}

export type ScoringCombination =
  | { type: 'single_one'; dice: number[] }
  | { type: 'single_five'; dice: number[] }
  | { type: 'three_of_kind'; value: DieValue; dice: number[] }
  | { type: 'four_of_kind'; value: DieValue; dice: number[] }
  | { type: 'five_of_kind'; value: DieValue; dice: number[] }
  | { type: 'six_of_kind'; value: DieValue; dice: number[] }
  | { type: 'straight'; dice: number[] }
  | { type: 'three_pairs'; dice: number[] };
