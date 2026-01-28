export type DieValue = 1 | 2 | 3 | 4 | 5 | 6;

export type UpgradeType =
  | "SCORE_MULTIPLIER" // 2x when this die is scored
  | "SCORE_BONUS" // 100+ when this die is scored
  | "BANKED_SCORE_MULTIPLIER" // 2x when banked and more are banked
  | "BANKED_SCORE_BONUS" // 100+ when banked and more are banked
  | "ADDITIONAL_REROLL"; // Special case for modal

export interface DieUpgrade {
  type: UpgradeType;
  id: string;
}

export interface UpgradeOption {
  type: UpgradeType;
  description: string;
}

export interface Die {
  id: number;
  value: DieValue;
  staged: boolean;
  banked: boolean;
  position: number; // Persistent position (1-6)
  upgrades: DieUpgrade[];
}

export type RuleId =
  | "single_one"
  | "single_five"
  | "three_of_kind"
  | "four_of_kind"
  | "five_of_kind"
  | "six_of_kind"
  | "straight"
  | "three_pairs";

export interface Rule {
  id: RuleId;
  description: string;
  score: string | number;
  enabled: boolean;
  activationCount: number;
}

export type RuleMap = Record<RuleId, Rule>;

export interface GameState {
  bankedScore: number; // Score collected for this turn
  dice: Die[];
  gameOver: boolean;
  highScore: number;
  lastRollSparkled: boolean;
  message: string;
  rerollsAvailable: number;
  scoringRules: RuleMap;
  threshold: number;
  thresholdLevel: number;
  totalScore: number;
  turnNumber: number;
  // Upgrade related state
  upgradeModalOpen: boolean;
  upgradeOptions: UpgradeOption[];
  pendingUpgradeDieSelection: UpgradeType | null;
  potentialUpgradePosition: number | null;
}

export type ScoringCombination =
  | { type: "single_one"; dice: number[] }
  | { type: "single_five"; dice: number[] }
  | { type: "three_of_kind"; value: DieValue; dice: number[] }
  | { type: "four_of_kind"; value: DieValue; dice: number[] }
  | { type: "five_of_kind"; value: DieValue; dice: number[] }
  | { type: "six_of_kind"; value: DieValue; dice: number[] }
  | { type: "straight"; dice: number[] }
  | { type: "three_pairs"; dice: number[] };

export type GameAction =
  | { type: "ROLL" }
  | { type: "TOGGLE_DIE"; dieId: number }
  | { type: "BANK" }
  | { type: "END_TURN"; isSparkled?: boolean }
  | { type: "RESET" };

export interface GameReducerResult {
  state: GameState;
  delayedAction?: {
    type: "END_TURN";
    delay: number;
    isSparkled: boolean;
  };
}

export const actions = {
  roll: (): GameAction => ({ type: "ROLL" }),
  toggleDie: (dieId: number): GameAction => ({ type: "TOGGLE_DIE", dieId }),
  bank: (): GameAction => ({ type: "BANK" }),
  endTurn: (isSparkled?: boolean): GameAction => ({
    type: "END_TURN",
    isSparkled,
  }),
  reset: (): GameAction => ({ type: "RESET" }),
};
