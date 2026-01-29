# AGENTS.md - Sparkle Codebase Guide

## Project Overview

This is a Next.js 16 game application built with React 19, TypeScript, and Tailwind CSS 4. It implements a dice scoring game called "Sparkle" with a clean separation between game logic and UI.

---

## Essential Commands

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Code Quality

```bash
npm run lint         # Run ESLint (Next.js config + TypeScript rules)
```

### Testing

```bash
npm test             # Run tests in watch mode
npm run test:ui      # Run tests with Vitest UI
npm run test:run     # Run tests once (CI mode)

# Run single test by name
npm test -- -t "test name or description"

# Run tests in specific file
npm test -- src/game.test.ts
```

---

## Code Style Guidelines

### TypeScript

**Imports**

- Use `import type { ... }` for type-only imports
- Use relative imports: `import { foo } from "./game"` (src/) or `"../types"` (app/)
- Import hooks from `app/hooks/` for UI logic helpers

**Types**

- Always use strict TypeScript (strict: true in tsconfig)
- Use `Extract<>` for discriminated union narrowing
- Define type aliases for literals: `type DieValue = 1 | 2 | 3 | 4 | 5 | 6`
- Use discriminators on union types: `{ type: "ROLL_DICE" }` vs `{ type: "BANK_DICE" }`

**Interfaces vs Types**

- Use `interface` for object shapes with potential extension
- Use `type` for unions, literals, and utility types
- Export from central types file: `src/types.ts` or `app/types.ts`

### Naming Conventions

| Category            | Convention                                     | Example                                     |
| ------------------- | ---------------------------------------------- | ------------------------------------------- |
| Components          | PascalCase                                     | `ScoreDisplay`, `Dice`                      |
| Functions           | camelCase                                      | `createDice`, `handleRoll`, `canBank`       |
| Constants           | UPPER_SNAKE_CASE                               | `BASE_THRESHOLD`                            |
| Interfaces          | PascalCase                                     | `GameState`, `DiceProps`                    |
| Type aliases        | PascalCase                                     | `DieValue`, `RuleId`                        |
| Event/Command types | SCREAMING_SNAKE_CASE                           | `ROLL_DICE`, `END_TURN`, `TOGGLE_RULE`      |
| Hook functions      | camelCase                                      | `handleRoll`, `toggleDie`, `resetGame`      |
| File names          | PascalCase for components, camelCase for logic | `Dice.tsx`, `game.ts`, `useGameHandlers.ts` |

### File Organization

```
app/                          # Next.js app directory (UI layer)
├── components/               # React components (one per file)
│   ├── ActionButtons.tsx     # Roll/End Turn/New Game buttons
│   ├── Dice.tsx              # Container for die grid layout
│   ├── Die.tsx               # Individual die component
│   ├── MessageBanner.tsx     # Game messages display
│   ├── ScoreDisplay.tsx      # Score tracking display
│   └── Rules.tsx             # Scoring rules panel
├── hooks/                    # Custom hook functions
│   └── useGameHandlers.ts
├── layout.tsx               # Root layout
└── page.tsx                 # Main game page

src/                          # Game logic layer
├── messaging/                 # Command/event pattern
│   ├── handlers/             # Command handlers
│   │   ├── bank.ts           # Banking dice logic
│   │   ├── endTurn.ts        # End turn logic
│   │   ├── reset.ts          # Reset game logic
│   │   ├── roll.ts           # Dice rolling logic
│   │   ├── scoringRules.ts   # Toggle scoring rules
│   │   ├── toggleDie.ts      # Die selection logic
│   │   └── index.ts          # Handler exports
│   ├── gameEngine.ts         # Command dispatcher
│   ├── eventBus.ts          # Pub/sub for delayed actions
│   ├── index.ts             # Messaging exports
│   └── types.ts             # Messaging types
├── game.ts                   # Game logic utilities/selectors
├── scoring.ts                # Scoring logic with rules
├── types.ts                  # Shared types (Die, GameState, Rule)
├── game.test.ts             # Game logic tests
├── scoring.test.ts          # Scoring logic tests
└── activationCount.test.ts  # Activation count tests
```

### React Patterns

**Component Structure**

- Client components: Top of file with `"use client";`
- Define props interfaces above component: `interface ScoreDisplayProps { ... }`
- Export default functions: `export default function ComponentName() { ... }`
- One component per file in `app/components/`

**Hooks**

- Use `useEffect` for side effects with cleanup functions
- Always include dependency arrays
- Game handlers in `app/hooks/useGameHandlers.ts`

**State Management**

- Local state for UI (rolling animation): `const [rolling, setRolling] = useState(false)`
- Game state via game engine commands: `gameEngine.processCommand(state, command)`
- Use selectors for derived state: `getActiveDice(state)`

### Game Logic Patterns

**Command/Event Pattern**

- Commands: Intent from UI (`TOGGLE_DIE`, `ROLL_DICE`, `TOGGLE_RULE`)
- Events: What happened (`DICE_ROLLED`, `DIE_TOGGLED`)
- Handlers: Pure functions in `src/messaging/handlers/` returning `{ state, events }`
- Game Engine: Central dispatcher in `src/messaging/gameEngine.ts`

**Selectors**

- Name with `get` prefix: `getActiveDice`, `getBankedDice`
- Take state as argument, return derived value
- Located in `src/game.ts`

**Validators**

- Name with `can` prefix: `canRoll`, `canEndTurn`, `canBank`, `canReRoll`
- Return boolean for button disabled states
- `canRoll` allows rolling after sparkle (enables re-roll button)
- `canReRoll` checks if re-rolls available and game not over

**Scoring Rules**

- Rules defined in `src/scoring.ts` as `DEFAULT_RULES: RuleMap`
- Structure: `Record<RuleId, Rule>` (object map, not array)
- Each rule has: `id`, `description`, `score`, `enabled`, `activationCount`
- Access: `state.scoringRules[ruleId]` or `Object.values(state.scoringRules)`
- Toggle via `TOGGLE_RULE` command

**Activation Counting**

- `calculateScore()` returns `{ score: number, scoringRuleIds: RuleId[] }`
- Activation counts increment ONLY when dice are actually banked
- Not incremented during score preview or validation checks
- Prevents duplicate counting on re-renders
- See `src/activationCount.test.ts` for test coverage

**Constants**

- `BASE_THRESHOLD = 1000` - Starting threshold
- Threshold formula: `1000 × 2^(turnNumber - 1)`
- Progression: 1000 → 2000 → 4000 → 8000 → 16000...

**Re-Roll Mechanic**

- Players start with 1 re-roll (`rerollsAvailable` in GameState)
- Earn +1 re-roll every 5 turns (turns 6, 11, 16, etc.)
- Use RE_ROLL command to re-roll most recent dice roll
- Works after sparkle (gives second chance)
- Decrements `rerollsAvailable` on use
- Re-rolls have faster animation (250ms vs 500ms)
- `lastRollSparkled` tracks if current roll sparkled (enables re-roll via Space)

### Styling (Tailwind CSS 4)

**Patterns**

- Black/white theme: `bg-black`, `text-white`, `border-white`
- Conditional classes: `${condition ? 'class-a' : 'class-b'}`
- Disabled states: `disabled:border-gray-700 disabled:text-gray-700`
- Transitions: `transition-colors`, `hover:bg-white hover:text-black`

**Organization**

- Inline className strings
- Group related utilities together
- Use standard spacing (p-4, p-8, gap-3, gap-8)

**CSS Modules**

- Custom animations in `app/globals.css`
- Use `@keyframes` for dice roll animation
- Reference with `animate-roll` class

**Layout**

- Dice use CSS Grid with `gridColumn: die.position` for positioning
- Two-row layout: active dice (top), selected/banked dice (bottom)
- Empty positions filled with placeholder `<div>` elements
- Maintains 6-column grid structure (`grid-cols-6`)
- Persistent positioning: dice keep positions across rolls/selections/banking

### Keyboard Controls

**Die Selection (Keys 1-6)**

- Number keys toggle dice by persistent position (1-6)
- Sets focus to pressed die position
- Only toggles non-banked dice
- Disabled during rolling animations
- Position indicators shown in top-left corner of each die

**Arrow Key Navigation**

- `←/→` - Move focus left/right through positions 1-6
- Wraps around (position 1 ← wraps to 6, position 6 → wraps to 1)
- Works across both active and banked rows
- Focus moves to adjacent die regardless of row

**Arrow Key Selection**

- `↓` - Select focused die (move to banked row if not selected)
- `↑` - Unselect focused die (move to active row if selected)
- Only works on non-banked dice
- Disabled during rolling

**Game Actions**

- `Space` - Roll dice (auto-banks selected dice, requires canRoll). After sparkle, triggers RE_ROLL if re-rolls available
- `R` - Re-roll last roll (uses 1 re-roll, requires canReRoll)
- `D` - Discard all unscored dice (after sparkle, allows continuing if extra dice available)
- `Enter` - End turn (auto-banks selected dice, requires canEndTurn)
- `Backspace` - Start new game (always available)

**Implementation**

- Global `keydown` listener in `app/page.tsx`
- Prevents default browser behavior for game keys
- Modifier keys (Shift/Ctrl/Alt) disable game shortcuts
- Focus state: `focusedPosition: number | null` in UI state
- Visual indicator: Drop-shadow on focused die
- Tooltips on action buttons show shortcuts

### Error Handling

**Validation**

- Return error messages in `state.message` string
- Keep state unchanged on errors
- Display errors via `<MessageBanner message={gameState.message} />`

**Game State Errors**

- "Select some dice first!"
- "Selected dice do not score!"
- "You must bank some points before ending your turn!"

### Testing (Vitest)

**Test Structure**

- Use `describe` blocks for grouping
- `beforeEach` for test setup
- Helper functions: `createMockDice(values)`
- Clear test names: "should return only non-banked dice"

**Assertions**

- `expect(actual).toBe(expected)` for primitives
- `expect(actual).toEqual(expected)` for objects
- `expect(array).toHaveLength(n)` for array length

**Running Tests**

- All: `npm test` (88 tests total)
- Single file: `npm test -- src/game.test.ts`
- Single test: `npm test -- -t "should toggle die selection"`

**Test Files**

- `src/game.test.ts` (19 tests) - Game selectors, validators, utilities
- `src/scoring.test.ts` (55 tests) - Scoring calculations and rules
- `src/activationCount.test.ts` (5 tests) - Activation count behavior
- `src/reroll.test.ts` (9 tests) - Re-roll mechanic behavior

### Linting

- ESLint with Next.js config (typescript + core-web-vitals)
- Auto-fix: `npx eslint --fix <file>`
- Run before committing: `npm run lint`
