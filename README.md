# Sparkle

A dice scoring game - a sparkle derivative built with Next.js, React, and TypeScript.

## About

Sparkle is a dice game where players roll dice, select scoring combinations, and try to reach 10,000 points. The game features a clean separation between game logic and UI, making it easy to extend for multiplayer or server-side gameplay.

## Game Rules

### Objective

Be the first player to reach 10,000 points.

### Scoring Combinations

| Combination            | Points                    |
| ---------------------- | ------------------------- |
| Single 1               | 100                       |
| Single 5               | 50                        |
| Three 1s               | 1,000                     |
| Three 2s               | 200                       |
| Three 3s               | 300                       |
| Three 4s               | 400                       |
| Three 5s               | 500                       |
| Three 6s               | 600                       |
| Four of a kind         | Double three of a kind    |
| Five of a kind         | Quadruple three of a kind |
| Six of a kind          | 8× three of a kind        |
| Straight (1-2-3-4-5-6) | 1,500                     |
| Three pairs            | 1,500                     |

### Gameplay

1. **Getting on the board**: Score at least 500 points in a single turn to start banking points
2. **Rolling**: Roll all 6 dice to start
3. **Banking**: Select scoring dice and bank them. You must bank at least once before rolling again
4. **Hot dice**: If you bank all 6 dice, they clear and you roll 6 new dice
5. **Sparkle**: If you roll dice with no scoring combinations, you "sparkle" and lose all points for that turn
6. **Winning**: First player to reach 10,000 points wins

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
