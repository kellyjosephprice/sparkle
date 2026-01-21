# Sparkle

A dice scoring game - a sparkle derivative built with Next.js, React, and TypeScript.

## About

Sparkle is a dice game where players roll dice, select scoring combinations, and accumulate as many points as possible before sparkling out. The game features a clean separation between game logic and UI, making it easy to extend for multiplayer or server-side gameplay.

## Game Rules

### Objective

Score as many points as possible before you sparkle (roll dice with no scoring combinations). Each turn has an increasing threshold that must be met to end your turn. The game continues until you sparkle, at which point the game is over.

### Scoring Combinations

| Combination  | Points                 |
| ------------ | ---------------------- |
| 1            | 100                    |
| 5            | 50                     |
| 111          | 1,000                  |
| 222          | 200                    |
| 333          | 300                    |
| 444          | 400                    |
| 555          | 500                    |
| 666          | 600                    |
| XXXX         | Double three of a kind |
| XXXXX        | 4× three of a kind     |
| XXXXXX       | 8× three of a kind     |
| 1-2-3-4-5-6  | 1,500                  |
| XXYYZZ       | 1,500                  |
| Threshold    | 100 × 2^(turn-1)       |
| Sparkle      | Game Over              |

### Gameplay

1. **Threshold**: Each turn has a minimum threshold you must meet to end your turn. The threshold starts at 100 points and doubles each turn (100, 200, 400, 800, 1600...)
2. **Rolling**: Roll all 6 dice to start
3. **Banking**: Select scoring dice and bank them. You must bank at least once before rolling again
4. **Hot dice**: If you bank all 6 dice, they clear and you roll 6 new dice
5. **Ending your turn**: You can only end your turn if you've met or exceeded the threshold for that turn
6. **Sparkle**: If you roll dice with no scoring combinations, you "sparkle" and the game is over
7. **Game Over**: The game ends when you sparkle. Your final score is displayed

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
