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
  message: string;
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

export type GameAction =
  | { type: 'ROLL' }
  | { type: 'TOGGLE_DIE'; dieId: number }
  | { type: 'BANK' }
  | { type: 'END_TURN'; isSparkled?: boolean }
  | { type: 'RESET' };

export interface GameReducerResult {
  state: GameState;
  delayedAction?: {
    type: 'END_TURN';
    delay: number;
    isSparkled: boolean;
  };
}

export const actions = {
  roll: (): GameAction => ({ type: 'ROLL' }),
  toggleDie: (dieId: number): GameAction => ({ type: 'TOGGLE_DIE', dieId }),
  bank: (): GameAction => ({ type: 'BANK' }),
  endTurn: (isSparkled?: boolean): GameAction => ({ type: 'END_TURN', isSparkled }),
  reset: (): GameAction => ({ type: 'RESET' }),
};
