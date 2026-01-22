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
npm test -- app/game.test.ts
```

---

## Code Style Guidelines

### TypeScript

**Imports**

- Use `import type { ... }` for type-only imports
- Use relative imports from app directory: `import { foo } from "./types"`
- Import functions/constants first, types second

**Types**

- Always use strict TypeScript (strict: true in tsconfig)
- Use `Extract<>` for discriminated union narrowing: `Extract<GameCommand, { type: "ROLL_DICE" }>`
- Define type aliases for literals: `type DieValue = 1 | 2 | 3 | 4 | 5 | 6`
- Use discriminators on union types: `{ type: "ROLL" }` vs `{ type: "BANK" }`

**Interfaces vs Types**

- Use `interface` for object shapes with potential extension
- Use `type` for unions, literals, and utility types
- Export both as needed from central types file

### Naming Conventions

| Category     | Convention                                     | Example                               |
| ------------ | ---------------------------------------------- | ------------------------------------- |
| Components   | PascalCase                                     | `DiceFace`, `Dice`                    |
| Functions    | camelCase                                      | `createDice`, `handleRoll`, `canBank` |
| Constants    | UPPER_SNAKE_CASE                               | `BASE_THRESHOLD`                      |
| Interfaces   | PascalCase                                     | `GameState`, `DiceProps`              |
| Type aliases | PascalCase                                     | `DieValue`, `GameCommand`             |
| Event types  | SCREAMING_SNAKE_CASE                           | `ROLL_DICE`, `END_TURN`               |
| File names   | PascalCase for components, camelCase for logic | `Dice.tsx`, `game.ts`                 |

### File Organization

```
app/
├── components/      # React components
├── messaging/       # Command/event pattern
│   ├── handlers/    # Command handlers
│   └── types.ts     # Messaging types
├── reducers/        # State reducers (legacy, being replaced)
├── types.ts         # Central type definitions
├── game.ts          # Game logic utilities/selectors
├── scoring.ts       # Scoring logic
└── *.test.ts        # Vitest test files
```

### React Patterns

**Component Structure**

- Client components: Top of file with `"use client";`
- Use explicit interfaces for props: `interface DiceProps { ... }`
- Export default functions: `export default function Home() { ... }`
- One component per file

**Hooks**

- Prefer `useEffect` for side effects
- Always include dependency arrays
- Return cleanup functions for subscriptions

**State Management**

- Use local state for UI state (rolling animation)
- Use game engine for game state via commands
- Separate derived state (selectors) from source of truth

### Game Logic Patterns

**Command/Event Pattern**

- Commands: Intent from UI (`TOGGLE_DIE`, `ROLL_DICE`)
- Events: What happened (`DICE_ROLLED`, `DIE_TOGGLED`)
- Handlers: Pure functions returning `{ state, events }`
- Event bus: Centralized pub/sub for delayed actions

**Selectors**

- Name with `get` prefix: `getActiveDice`, `getBankedDice`
- Take state as argument, return derived value
- Used in UI to avoid prop drilling

**Validators**

- Name with `can` prefix: `canRoll`, `canEndTurn`, `canBank`
- Return boolean, used for button disabled states

### Styling (Tailwind CSS 4)

**Patterns**

- Black/white theme: `bg-black`, `text-white`, `border-white`
- Conditional classes: `${condition ? 'class-a' : 'class-b'}`
- Disabled states: `disabled:border-gray-700 disabled:text-gray-700`
- Transitions: `transition-colors`, `hover:bg-white hover:text-black`

**Organization**

- Inline className strings
- Group related utilities together
- Use standard spacing (p-4, p-8, gap-4, gap-8)

**CSS Modules**

- Custom animations in `app/globals.css`
- Use `@keyframes` for dice roll animation
- Reference with `animate-roll` class

### Error Handling

**Validation**

- Return error messages in state.message string
- Keep state unchanged on errors
- Display errors to user via message banner

**Game State Errors**

- "Select some dice first!"
- "Selected dice do not score!"
- "You must bank some points before ending your turn!"

### Testing (Vitest)

**Test Structure**

- Use `describe` blocks for grouping
- `beforeEach` for test setup
- Helper functions for test data: `createMockDice(values)`
- Clear test names: "should return only non-banked dice"

**Assertions**

- Prefer `expect(actual).toBe(expected)` for primitives
- Use `expect(actual).toEqual(expected)` for objects
- Use `expect(array).toHaveLength(n)` for array length

**Running Tests**

- Run all: `npm test`
- Single file: `npm test -- app/game.test.ts`
- Single test: `npm test -- -t "should toggle die selection"`

### Linting

- ESLint with Next.js config (typescript + core-web-vitals)
- Fix automatically: ESLint auto-fix in your IDE
- Run before committing: `npm run lint`
