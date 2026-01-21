# Sparkle

A dice scoring game - a sparkle derivative built with Next.js, React, and TypeScript.

## About

Sparkle is a dice game where players roll dice, select scoring combinations, and accumulate as many points as possible before sparkling out. The game features a clean separation between game logic and UI, making it easy to extend for multiplayer or server-side gameplay.

## Game Rules

### Objective

Score as many points as possible before you sparkle below the threshold. Your total score must reach cumulative thresholds (100, 200, 400, 800...) to end your turn. If you sparkle but your total score is still above the threshold, you lose the points from that turn but can continue playing. The game ends when you sparkle and your total score is below the current threshold.

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
| Threshold    | 100 × 2^(level-1)      |
| Sparkle      | Lose turn; Game Over if total < threshold |

### Gameplay

1. **Threshold**: Your total score must reach cumulative thresholds to end your turn. Thresholds increase exponentially: 100, 200, 400, 800, 1600... Once you pass a threshold, the next one activates.
2. **Rolling**: Roll all 6 dice to start
3. **Banking**: Click dice to select them and move them to the banked area. You must select scoring dice before rolling again.
4. **Hot dice**: If you bank all 6 dice, they clear and you roll 6 new dice
5. **Ending your turn**: You can only end your turn if your total score has reached or exceeded the current threshold
6. **Sparkle**: If you roll dice with no scoring combinations, you "sparkle" and lose all points from that turn
   - If your total score is still above the threshold, you can continue playing
   - If your total score is below the threshold, the game is over (you can't progress)
7. **Game Over**: The game ends when you sparkle with a total score below the current threshold

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
