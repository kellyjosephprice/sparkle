import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  gameReducer,
  createDice,
  getActiveDice,
  getBankedDice,
  getSelectedDice,
  getSelectedScore,
  canRoll,
  canBank,
  canEndTurn,
  calculateThreshold,
  BASE_THRESHOLD,
} from './game';
import { actions } from './types';
import type { GameState, Die } from './types';

// Helper to create a dice array with specific values
function createMockDice(values: number[]): Die[] {
  return values.map((value, i) => ({
    id: i,
    value: value as 1 | 2 | 3 | 4 | 5 | 6,
    selected: false,
    banked: false,
  }));
}

describe('Game Selectors', () => {
  let state: GameState;

  beforeEach(() => {
    state = {
      dice: [
        { id: 1, value: 1, selected: false, banked: false },
        { id: 2, value: 2, selected: true, banked: false },
        { id: 3, value: 3, selected: false, banked: true },
        { id: 4, value: 4, selected: true, banked: true },
      ],
      currentScore: 0,
      bankedScore: 0,
      totalScore: 0,
      threshold: calculateThreshold(1),
      turnNumber: 1,
      gameOver: false,
      message: "",
    };
  });

  describe('getActiveDice', () => {
    it('should return only non-banked dice', () => {
      const active = getActiveDice(state);
      expect(active).toHaveLength(2);
      expect(active.every(d => !d.banked)).toBe(true);
    });
  });

  describe('getBankedDice', () => {
    it('should return only banked dice', () => {
      const banked = getBankedDice(state);
      expect(banked).toHaveLength(2);
      expect(banked.every(d => d.banked)).toBe(true);
    });
  });

  describe('getSelectedDice', () => {
    it('should return only selected and non-banked dice', () => {
      const selected = getSelectedDice(state);
      expect(selected).toHaveLength(1);
      expect(selected[0].id).toBe(2);
      expect(selected[0].selected).toBe(true);
      expect(selected[0].banked).toBe(false);
    });
  });

  describe('getSelectedScore', () => {
    it('should calculate score for selected dice', () => {
      const stateWithScoring: GameState = {
        ...state,
        dice: [
          { id: 1, value: 1, selected: true, banked: false },
          { id: 2, value: 5, selected: true, banked: false },
        ],
      };
      const score = getSelectedScore(stateWithScoring);
      expect(score).toBe(150); // 1 = 100, 5 = 50
    });
  });
});

describe('Validation Functions', () => {
  describe('canRoll', () => {
    it('should return false when no dice are active', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: true }],
        currentScore: 0,
        bankedScore: 100,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canRoll(state)).toBe(false);
    });

    it('should return true when scoring dice are selected', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: true, banked: false }],
        currentScore: 0,
        bankedScore: 100,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canRoll(state)).toBe(true); // Selected dice will be auto-banked
    });

    it('should return false when selected dice do not score', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 2, selected: true, banked: false }],
        currentScore: 0,
        bankedScore: 100,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canRoll(state)).toBe(false); // Selected dice don't score
    });

    it('should return false when no dice are selected', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: false }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canRoll(state)).toBe(false);
    });

    it('should return false even with banked score if no dice selected', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: false }],
        currentScore: 0,
        bankedScore: 100,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canRoll(state)).toBe(false);
    });
  });

  describe('canBank', () => {
    it('should return false when no dice are selected', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: false }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canBank(state)).toBe(false);
    });

    it('should return false when selected dice do not score', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 2, selected: true, banked: false }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canBank(state)).toBe(false);
    });

    it('should return true when selected dice score', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: true, banked: false }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canBank(state)).toBe(true);
    });
  });

  describe('canEndTurn', () => {
    it('should return false when no points are banked', () => {
      const state: GameState = {
        dice: [],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canEndTurn(state)).toBe(false);
    });

    it('should return true when scoring dice are selected', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: true, banked: false }],
        currentScore: 0,
        bankedScore: 100,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canEndTurn(state)).toBe(true); // Selected dice will be auto-banked
    });

    it('should return false when selected dice do not score', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 2, selected: true, banked: false }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canEndTurn(state)).toBe(false); // Selected dice don't score
    });

    it('should return true when points are banked and no selection', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: true }],
        currentScore: 0,
        bankedScore: 100,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };
      expect(canEndTurn(state)).toBe(true);
    });
  });
});

describe('Game Reducer', () => {
  describe('TOGGLE_DIE', () => {
    it('should toggle die selection', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: false }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.toggleDie(1));
      expect(result.state.dice[0].selected).toBe(true);
    });

    it('should not toggle banked dice', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: true }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.toggleDie(1));
      expect(result.state.dice[0].selected).toBe(false);
    });

    it('should clear message', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: false }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.toggleDie(1));
      expect(result.state.message).toBe('');
    });
  });

  describe('ROLL', () => {
    it('should roll new dice and preserve banked dice', () => {
      const state: GameState = {
        dice: [
          { id: 1, value: 1, selected: false, banked: true },
          { id: 2, value: 2, selected: false, banked: false },
        ],
        currentScore: 0,
        bankedScore: 100,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.roll());
      const bankedDice = result.state.dice.filter(d => d.banked);
      expect(bankedDice).toHaveLength(1);
      expect(bankedDice[0].id).toBe(1);
    });

    it('should set message for successful roll', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: false }],
        currentScore: 0,
        bankedScore: 100,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.roll());
      // Message will vary based on if it's a sparkle or not
      expect(result.state.message).toBeDefined();
    });
  });

  describe('BANK', () => {
    it('should return error when no dice selected', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: false }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.bank());
      expect(result.state.message).toBe('Select some dice first!');
      // State is updated with error message
      expect(result.state.dice).toEqual(state.dice);
      expect(result.state.currentScore).toBe(state.currentScore);
    });

    it('should return error when selected dice do not score', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 2, selected: true, banked: false }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.bank());
      expect(result.state.message).toBe('Selected dice do not score!');
    });

    it('should bank selected dice and update scores', () => {
      const state: GameState = {
        dice: [
          { id: 1, value: 1, selected: true, banked: false },
          { id: 2, value: 2, selected: false, banked: false },
        ],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.bank());
      expect(result.state.dice[0].banked).toBe(true);
      expect(result.state.dice[0].selected).toBe(false);
      expect(result.state.bankedScore).toBe(100);
      expect(result.state.currentScore).toBe(100);
    });

    it('should trigger hot dice when all active dice are banked', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: true, banked: false }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.bank());
      expect(result.state.dice).toHaveLength(6); // Rolled 6 new dice
      expect(result.state.message).toContain('Hot dice');
      expect(result.state.dice.every(d => !d.banked)).toBe(true); // All dice are active
    });
  });

  describe('END_TURN', () => {
    it('should return error when no points are banked', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: false }],
        currentScore: 0,
        bankedScore: 0,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.endTurn(false));
      expect(result.state.message).toBe("You must bank some points before ending your turn!");
      expect(result.state.turnNumber).toBe(1); // Turn not ended
    });

    it('should return error when dice are still selected', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: true, banked: false }],
        currentScore: 0,
        bankedScore: 100,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.endTurn(false));
      expect(result.state.message).toBe("Bank your selected dice first!");
      expect(result.state.turnNumber).toBe(1); // Turn not ended
    });

    it('should reset dice and increment turn number', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: false, banked: true }],
        currentScore: 100,
        bankedScore: 100,
        totalScore: 0,
        threshold: calculateThreshold(1),
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.endTurn(false));
      expect(result.state.dice).toHaveLength(6);
      expect(result.state.turnNumber).toBe(2);
      expect(result.state.currentScore).toBe(0);
      expect(result.state.bankedScore).toBe(0);
    });

    it('should end turn when meeting the threshold', () => {
      const state: GameState = {
        dice: [],
        currentScore: 100,
        bankedScore: 100,
        totalScore: 0,
        threshold: calculateThreshold(1), // 100 for level 1
        thresholdLevel: 1,
        turnNumber: 1,
        gameOver: false,
        message: "",
      };

      const result = gameReducer(state, actions.endTurn(false));
      expect(result.state.totalScore).toBe(100);
      expect(result.state.turnNumber).toBe(2);
      expect(result.state.threshold).toBe(calculateThreshold(2)); // 200 for level 2
      expect(result.state.thresholdLevel).toBe(2);
      expect(result.state.message).toContain('Turn over');
    });

    it('should not end turn when below threshold', () => {
      const state: GameState = {
        dice: [],
        currentScore: 50,
        bankedScore: 50,
        totalScore: 0,
        threshold: calculateThreshold(1), // 100 for level 1
        thresholdLevel: 1,
        turnNumber: 1,
        gameOver: false,
        message: "",
      };

      const result = gameReducer(state, actions.endTurn(false));
      expect(result.state.totalScore).toBe(0); // No score added
      expect(result.state.turnNumber).toBe(1); // Turn not incremented
      expect(result.state.message).toContain('Need');
      expect(result.state.message).toContain('total score of 100'); // Mentions cumulative threshold
    });

    it('should continue game regardless of score', () => {
      const state: GameState = {
        dice: [],
        currentScore: 1000,
        bankedScore: 1000,
        totalScore: 9000,
        threshold: calculateThreshold(1),
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.endTurn(false));
      expect(result.state.gameOver).toBe(false); // No win condition
      expect(result.state.totalScore).toBe(10000); // Score continues to accumulate
      expect(result.state.message).toContain('Turn over');
    });

    it('should continue game when sparkled but total score is above threshold', () => {
      const state: GameState = {
        dice: [],
        currentScore: 500,
        bankedScore: 500,
        totalScore: 1000,
        threshold: calculateThreshold(1), // 100
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.endTurn(true));
      expect(result.state.gameOver).toBe(false); // Game continues (1000 >= 100)
      expect(result.state.totalScore).toBe(1000); // No change, lost turn points
      expect(result.state.currentScore).toBe(0);
      expect(result.state.message).toContain('SPARKLE');
      expect(result.state.message).toContain('continue');
    });

    it('should end game when sparkled and total score is below threshold', () => {
      const state: GameState = {
        dice: [],
        currentScore: 50,
        bankedScore: 50,
        totalScore: 50,
        threshold: calculateThreshold(1), // 100
        thresholdLevel: 1,
        message: "",
        turnNumber: 1,
        gameOver: false,
      };

      const result = gameReducer(state, actions.endTurn(true));
      expect(result.state.gameOver).toBe(true); // Game ends (50 < 100)
      expect(result.state.totalScore).toBe(50); // No change, lost turn points
      expect(result.state.currentScore).toBe(0);
      expect(result.state.message).toContain('SPARKLE');
      expect(result.state.message).toContain('Game Over');
      expect(result.state.message).toContain('50'); // Shows final score
    });
  });

  describe('RESET', () => {
    it('should reset game to initial state', () => {
      const state: GameState = {
        dice: [{ id: 1, value: 1, selected: true, banked: true }],
        currentScore: 500,
        bankedScore: 300,
        totalScore: 5000,
        threshold: calculateThreshold(10),
        turnNumber: 10,
        gameOver: true,
        message: "Game over!",
      };

      const result = gameReducer(state, actions.reset());
      expect(result.state.dice).toHaveLength(6);
      expect(result.state.currentScore).toBe(0);
      expect(result.state.bankedScore).toBe(0);
      expect(result.state.totalScore).toBe(0);
      expect(result.state.threshold).toBe(calculateThreshold(1));
      expect(result.state.turnNumber).toBe(1);
      expect(result.state.gameOver).toBe(false);
      expect(result.state.message).toContain('New game');
    });
  });
});

describe('createDice', () => {
  it('should create specified number of dice', () => {
    const dice = createDice(6);
    expect(dice).toHaveLength(6);
  });

  it('should create dice with valid values', () => {
    const dice = createDice(10);
    dice.forEach(die => {
      expect(die.value).toBeGreaterThanOrEqual(1);
      expect(die.value).toBeLessThanOrEqual(6);
    });
  });

  it('should create dice with unique IDs', () => {
    const dice = createDice(6);
    const ids = dice.map(d => d.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(6);
  });

  it('should create unselected and unbanked dice', () => {
    const dice = createDice(6);
    dice.forEach(die => {
      expect(die.selected).toBe(false);
      expect(die.banked).toBe(false);
    });
  });
});
