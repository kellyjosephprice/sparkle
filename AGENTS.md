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

| Category            | Convention                                     | Example                                        |
| ------------------- | ---------------------------------------------- | ---------------------------------------------- |
| Components          | PascalCase                                     | `ScoreDisplay`, `Dice`                         |
| Functions           | camelCase                                      | `createDice`, `handleRoll`, `canBank`          |
| Constants           | UPPER_SNAKE_CASE                               | `BASE_THRESHOLD`                               |
| Interfaces          | PascalCase                                     | `GameState`, `DiceProps`                       |
| Type aliases        | PascalCase                                     | `DieValue`, `ScoringRuleId`                    |
| Event/Command types | SCREAMING_SNAKE_CASE                           | `ROLL_DICE`, `END_TURN`, `TOGGLE_SCORING_RULE` |
| Hook functions      | camelCase                                      | `handleRoll`, `toggleDie`, `resetGame`         |
| File names          | PascalCase for components, camelCase for logic | `Dice.tsx`, `game.ts`, `useGameHandlers.ts`    |

### File Organization

```
app/                          # Next.js app directory (UI layer)
├── components/               # React components (one per file)
│   ├── ActionButtons.tsx
│   ├── Dice.tsx
│   ├── DiceSections.tsx
│   ├── MessageBanner.tsx
│   ├── ScoreDisplay.tsx
│   └── Rules.tsx
├── hooks/                    # Custom hook functions
│   └── useGameHandlers.ts
├── types.ts                  # UI layer type definitions
├── layout.tsx               # Root layout
└── page.tsx                 # Main game page

src/                          # Game logic layer
├── messaging/                 # Command/event pattern
│   ├── handlers/             # Command handlers
│   ├── gameEngine.ts         # Command dispatcher
│   ├── eventBus.ts          # Pub/sub for delayed actions
│   ├── index.ts             # Messaging exports
│   └── types.ts             # Messaging types
├── game.ts                   # Game logic utilities/selectors
├── scoring.ts                # Scoring logic with rules
├── types.ts                  # Shared types (Die, GameState, ScoringRule)
└── *.test.ts                # Vitest test files
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

- Commands: Intent from UI (`TOGGLE_DIE`, `ROLL_DICE`, `TOGGLE_SCORING_RULE`)
- Events: What happened (`DICE_ROLLED`, `DIE_TOGGLED`)
- Handlers: Pure functions in `src/messaging/handlers/` returning `{ state, events }`
- Game Engine: Central dispatcher in `src/messaging/gameEngine.ts`

**Selectors**

- Name with `get` prefix: `getActiveDice`, `getBankedDice`
- Take state as argument, return derived value
- Located in `src/game.ts`

**Validators**

- Name with `can` prefix: `canRoll`, `canEndTurn`, `canBank`
- Return boolean for button disabled states

**Scoring Rules**

- Rules defined in `src/scoring.ts` with `DEFAULT_RULES`
- Each rule has: `id`, `description`, `score`, `enabled`, `activationCount`
- Toggle rules via `TOGGLE_SCORING_RULE` command
- Rules tracked in `GameState.scoringRules`

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

- Dice use absolute positioning with fixed horizontal slots
- No flex-wrap/justify-center for dice containers

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

- All: `npm test`
- Single file: `npm test -- src/game.test.ts`
- Single test: `npm test -- -t "should toggle die selection"`

### Linting

- ESLint with Next.js config (typescript + core-web-vitals)
- Auto-fix: `npx eslint --fix <file>`
- Run before committing: `npm run lint`
