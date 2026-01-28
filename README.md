# Sparkle

A dice scoring game - a farkle derivative built with Next.js, React, and TypeScript.

## About

Sparkle is a dice game where players roll dice, select scoring combinations, and accumulate as many points as possible before sparkling out. The game features a clean separation between game logic and UI, making it easy to extend for multiplayer or server-side gameplay.

## Game Rules

### Objective

Score as many points as possible before you sparkle below the threshold. Your total score must reach cumulative thresholds (100, 200, 400, 800...) to end your turn. If you sparkle but your total score is still above the threshold, you lose the points from that turn but can continue playing. The game ends when you sparkle and your total score is below the current threshold.

### Scoring Combinations

| Combination | Points                                    |
| ----------- | ----------------------------------------- |
| 1           | 100                                       |
| 5           | 50                                        |
| 111         | 1,000                                     |
| 222         | 200                                       |
| 333         | 300                                       |
| 444         | 400                                       |
| 555         | 500                                       |
| 666         | 600                                       |
| XXXX        | 1,000 (1,100 for four 1s)                 |
| XXXXX       | 2,000                                     |
| XXXXXX      | 3,000                                     |
| 1-2-3-4-5-6 | 2,500                                     |
| XXYYZZ      | 1,500                                     |
| Threshold   | 1,000 × 2^(level-1)                       |
| Sparkle     | Lose turn; Game Over if total < threshold |

### Gameplay

1. **Threshold**: Your total score must reach cumulative thresholds to end your turn. Thresholds increase exponentially: 1,00, 2,00, 4,00, 8,00, 16,00... Once you pass a threshold, the next one activates.
2. **Rolling**: Roll all 6 dice to start
3. **Banking**: Click dice (or press their position number 1-6) to select them and move them to the banked area. You must select scoring dice before rolling again.
4. **Hot dice**: If you bank all 6 dice, they clear and you roll 6 new dice
5. **Re-Rolls**: Start with 2 re-roll and earn an additional re-roll every 5 turns (turns 6, 11, 16, etc.). Use re-rolls to re-roll your most recent dice roll, even after a sparkle!
6. **Ending your turn**: You can only end your turn if your total score has reached or exceeded the current threshold
7. **Sparkle**: If you roll dice with no scoring combinations, you "sparkle" and lose all points from that turn
   - If your total score is still above the threshold, you can continue playing
   - If your total score is below the threshold, the game is over (you can't progress)
   - You can use a re-roll to recover from a sparkle (if available)
8. **Game Over**: The game ends when you sparkle with a total score below the current threshold

### Keyboard Controls

Sparkle supports full keyboard control for faster gameplay:

**Die Selection**

- `1-6` - Toggle dice by position (shown in top-left corner of each die)
- `←/→` - Navigate focus between dice positions
- `↑/↓` - Move focused die between active and banked areas

**Game Actions**

- `Space` - Roll dice (auto-banks selected dice first, or re-roll if last roll sparkled)
- `R` - Re-roll last roll (uses 1 re-roll)
- `Enter` - End turn (auto-banks selected dice first)
- `Backspace` - Start new game

**Tips**

- Dice maintain persistent positions (1-6) across rolls, selections, and banking
- All keyboard shortcuts work as alternatives to mouse clicks
- Shortcuts are disabled during rolling animations
- Hover over action buttons to see keyboard shortcuts

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
