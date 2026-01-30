import { DieUpgrade, UpgradeOption, UpgradeType } from "./die-upgrades";

export type { DieUpgrade, UpgradeOption, UpgradeType };

export type DieValue = 1 | 2 | 4 | 5 | 6 | "spark";

export interface Die {
  id: number;
  value: DieValue;
  staged: boolean;
  banked: boolean;
  position: number; // Persistent position (1-5)
  upgrades: DieUpgrade[];
  isSparkDie: boolean;
}

export type RuleId =
  | "single_one"
  | "single_five"
  | "set"
  | "heap"
  | "landslide";

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
  lastRollFizzled: boolean;
  message: string;
  scoringRules: RuleMap;
  threshold: number;
  totalScore: number;
  turnNumber: number;
  rollsInTurn: number;
  isGuhkleAttempt: boolean;
  extraDicePool: number;
  hotDiceCount: number;
  permanentMultiplier: number;
  // Certification logic
  certificationNeededValue: DieValue | null;
  // Upgrade related state
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
