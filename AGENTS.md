# AGENTS.md - Sparkle Codebase Guide

## Project Overview
Next.js 16 game application (React 19, TypeScript, Tailwind 4). Implements "Sparkle" (dice scoring game).
Key architectural principle: **Strict separation between pure game logic (`src/`) and React UI (`app/`)**.

## Essential Commands
- `npm run dev` - Start development server.
- `npm run build` - Production build.
- `npm run lint` - Runs ESLint with Next.js and simple-import-sort.
- `npm run test:run` - Executes all tests once (Vitest).
- `npm test -- <path>` - Runs tests in a specific file.
- `npm test -- -t "<description>"` - Runs a single test by its name/description.

## File Organization

### UI Layer (`app/`)
- `app/context/GameContext.tsx` - Central state using React Context. Persists across route changes but NOT refreshes.
- `app/components/Dice.tsx` - Grid layout for dice using CSS Grid (`gridColumn: die.position`).
- `app/components/Die.tsx` - Individual die visual representation and animations.
- `app/components/ScoreDisplay.tsx` - Displays banked, staged, and high scores.
- `app/components/ActionButtons.tsx` - Main interaction buttons (Roll, Bank, End Turn).

### Logic Layer (`src/`)
- `src/messaging/` - Command/Event pattern implementation.
  - `handlers/` - Pure functions handling specific `GameCommand` types.
  - `gameEngine.ts` - Central dispatcher for commands.
- `src/game/` - Core game mechanics.
  - `scoring.ts` - Scoring rules and `calculateScore` implementation.
  - `types.ts` - Shared interfaces (`Die`, `GameState`, `Rule`).
  - `index.ts` - Shared utilities and selectors (`canRoll`, `getActiveDice`).

## Code Style & Conventions

### TypeScript & Naming
- **Strict Typing**: Use strict types. Prefer `DieValue` (1-6 | "spark"), `RuleId`, and `UpgradeType`.
- **Discriminated Unions**: Used for `GameCommand` and `GameEvent` to ensure type safety in handlers.
- **Naming Table**:
  | Category | Convention | Example |
  | :--- | :--- | :--- |
  | Components | PascalCase | `ScoreDisplay`, `Dice` |
  | Selectors | camelCase (`get*`) | `getActiveDice`, `getStagedScore` |
  | Validators | camelCase (`can*`) | `canRoll`, `canBank`, `canEndTurn` |
  | Constants | UPPER_SNAKE | `BASE_THRESHOLD`, `STARTING_EXTRA_DICE` |
  | Commands/Events | SCREAMING_SNAKE | `ROLL_DICE`, `DICE_ROLLED` |

### Architecture Patterns
- **Messaging System**: UI sends `GameCommand` -> `gameEngine` processes -> Handlers return `CommandResult` (new state + events).
- **Hooks**: Use `useGame()` from `GameContext` for state and actions. Do not use local state for game logic.
- **Scoring**: `calculateScore` returns `groups` of scoring dice. Activation counts update ONLY when dice are banked.
- **Persistence**: High score in `localStorage`. Game state in React `useState` (via Context) for session-only persistence.

### Imports & Formatting
- **Import Sorting**: Use `simple-import-sort`. Order: React, Next, Internal Libs, Local Files.
- **Absolute Paths**: Use `@/src/...` or `@/app/...` for cleaner imports.
- **Types**: Always use `import type` for type-only imports.

## Game Mechanics Reference

### Scoring Rules
- **Singles**: 1 (10 pts), 5 (5 pts), Spark (10 pts as wild 1).
- **Sets (3 of a kind)**: Value * 10 (except 1s which are 100).
- **Heaps (5 of a kind)**: Value * 100 (except 1s which are 1000).
- **Spark**: Wild die that can complete sets or heaps.

### Progression & Thresholds
- **Threshold**: Players must meet a minimum score to end their turn.
- **Multiplier**: Turn scores can be multiplied by specific die upgrades.
- **Extra Dice**: Players have a pool of extra dice for re-rolling.

## Testing (Vitest)
- **Coverage**: Logic in `src/` must be 100% covered. UI tests are optional but recommended for complex interactions.
- **Structure**: Use `describe` for units and `it` for behaviors.
- **Mocks**: Use `makeDice` (in tests) or `createDice` (in logic) to setup specific state scenarios.
- **Files**: `*.test.ts` files reside next to the logic they test.

## Styling (Tailwind 4)
- **Theme**: Monochromatic (black/white/cyan/amber).
- **Layout**: CSS Grid for dice positioning (`gridColumn: die.position`).
- **Animations**: CSS keyframes in `globals.css` (e.g., `animate-roll`).
- **Responsiveness**: Mobile-first approach using standard Tailwind breakpoints.

## Error Handling
- **UI Feedback**: Errors should be set in `GameState.message` and displayed via `MessageBanner`.
- **Validation**: Use validator functions (`canRoll`, etc.) to disable buttons and prevent illegal actions.
- **Messaging**: The `ERROR` event can be used to trigger transient UI alerts if needed.
