# Sparkle

A dice scoring game - inspired heavily by [comsic wimpout](https://cosmicwimpout.com/).

## About

Sparkle is a dice game where players roll dice, select scoring combinations,
and accumulate as many points as possible before fizzling out.

## Game Rules

### Objective

Score as many points as possible before you fizzle out below the threshold.
Your total score must reach cumulative thresholds (100, 200, 400, 800...) to
end your turn. If you fizzle out but your total score is still above the
threshold, you lose the points from that turn but can continue playing. The
game ends when you fizzle out and your total score is below the current
threshold.

### Scoring Combinations

| Name   | Combination | Points                                    |
| ------ | ----------- | ----------------------------------------- |
| One    | 1           | 10                                        |
| Five   | 5           | 5                                         |
| Set    | nnn         | n \* 10 or 100 if n === 1                 |
| Heap   | nnnnn       | n \* 100 or 1000 if n === 1               |
| Fizzle | non-scoring | Lose turn; Game Over if total < threshold |

### Gameplay

The game is played with 5 6-sided dice, and one of the die has the Spark which
is wild and can count as any other value. The Spark's cube faces are 1, 2, 4, 5, Spark

The game is broken into turns. A turn is a series of rolls that ends when you
[fizzle](#fizzle) out or when you decide to stop rolling. When you roll the
dice you may set aside [bank](#bank) any scoring dice or [sets](#set) of dice.

If you roll a set, you must bank the set and certify it by rolling again and
scoring. If you fail to score on this roll, your turn ends and your score is
lost. When certifying a set, if any of the re-rolled dice have the same value
as the set, you must ignore that roll and re-roll.

At any point, if you score with all 5 dice, you must re-roll all five of them.

Each turn has a [threshold](#threshold), a cumulative minimum score that must
be beat. If you fizzle out or end your turn below the threshold, Game Over!

### Terms

#### Fizzle (out)

When you roll a die or dice and do not have any scoring dice. Your turn ends if
you have no ability to re-roll dice.

#### Bank

The action of setting aside a die or dice to use them as scoring dice. Dice
that are not banked are then available to re-roll. Banked dice will stay banked
until all 5 dice are scoring and must be re-rolled.

#### Set

A set is 3 of the same dice, eg 1-1-1. Or a set can be made with a pair of the
same dice and the Spark.

#### Heap

A heap is 5 of the same dice, eg 1-1-1-1-1. A set can also be made with the
wild Spark.

#### Spark

One of the die has a wild face, the Spark. It can be played as a scoring cube
as a 1 or 5. Or it can be used to complete a set or heap. If there is a
matching pair of faces, the Spark _must_ be used to complete the set. Similarly
for a heap, if there are 4 matching faces and the Spark, that _must_ be counted
as a heap.

### Keyboard Controls

Sparkle supports full keyboard control for faster gameplay:

**Die Selection**

- `1-5` - Toggle dice by position (shown in top-left corner of each die)
- `←/→` - Navigate focus between dice positions
- `↑/↓` - Move focused die between active and banked areas

**Game Actions**

- `Space` - Roll dice (auto-banks selected dice first, or re-roll if last roll fizzled)
- `R` - Re-roll last roll (uses 'Extra Dice')
- `Enter` - End turn (auto-banks selected dice first)
- `Backspace` - Start new game

**Tips**

- Dice maintain persistent positions (1-5) across rolls, selections, and banking
- All keyboard shortcuts work as alternatives to mouse clicks
- Shortcuts are disabled during rolling animations
- Hover over action buttons to see keyboard shortcuts

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
