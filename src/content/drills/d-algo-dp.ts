// Writer D: dynamic programming template drills (algo-dp).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoDpDrills: SkillDrill[] = [
  {
    id: 'dp-tile-ways-table',
    version: 1,
    title: 'Write DP bottom-up: ways to tile a strip',
    skills: ['algo-dp', 'list-basics'],
    kind: 'write',
    prompt: 'A strip of length `n >= 0` is covered with tiles of length 1, 2 or 3 (order matters). Return the number of ways. Fill a table `dp[0..n]` bottom-up; the empty strip has 1 way.',
    signature: 'def tile_ways(n: int) -> int',
    starter: py`
      def tile_ways(n: int) -> int:
          return n
    `,
    solution: py`
      def tile_ways(n: int) -> int:
          dp = [0] * (n + 1)
          dp[0] = 1
          for i in range(1, n + 1):
              dp[i] = sum(dp[i - t] for t in (1, 2, 3) if t <= i)
          return dp[n]
    `,
    why: 'The last tile is 1, 2 or 3 long, so `dp[i] = dp[i-1] + dp[i-2] + dp[i-3]`; seeding `dp[0] = 1` (the empty tiling) makes the small cases fall out of the same rule.',
    hints: ['What was the last tile placed? That gives the recurrence.', 'Size the table `n + 1` and set `dp[0] = 1`.'],
    wrong: [
      // Seeds three base cases as 1, so dp[2] is wrong (it should be 2).
      py`
        def tile_ways(n: int) -> int:
            dp = [1] * (n + 1)
            for i in range(3, n + 1):
                dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3]
            return dp[n]
      `,
      // Hand-seeded base cases that forget the single 3-tile (dp[3] should be 4).
      py`
        def tile_ways(n: int) -> int:
            dp = [1, 1, 2, 3] + [0] * max(0, n - 3)
            for i in range(4, n + 1):
                dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3]
            return dp[n]
      `,
    ],
    grading: { entry: 'tile_ways', kind: 'function', compare: 'exact' },
    cases: [
      { args: '0', expected: '1' },
      { args: '1', expected: '1' },
      { args: '2', expected: '2' },
      { args: '3', expected: '4' },
      { args: '4', expected: '7' },
      { args: '10', expected: '274' },
      { args: '40', expected: '23837527729' },
    ],
    provenance: 'original',
  },
  {
    id: 'dp-fewest-coins-base-fix',
    version: 1,
    title: 'Fix the fewest-coins table',
    skills: ['algo-dp', 'infinity'],
    kind: 'fix',
    prompt: '`fewest_coins(coins, amount)` should return the fewest coins (unlimited supply) that add up to `amount`, or -1 if impossible. It always answers -1. Fix the table.',
    signature: 'def fewest_coins(coins: list[int], amount: int) -> int',
    starter: py`
      import math

      def fewest_coins(coins: list[int], amount: int) -> int:
          dp = [math.inf] * (amount + 1)
          for a in range(1, amount + 1):
              for c in coins:
                  if c <= a:
                      dp[a] = min(dp[a], dp[a - c] + 1)
          return -1 if dp[amount] == math.inf else dp[amount]
    `,
    solution: py`
      import math

      def fewest_coins(coins: list[int], amount: int) -> int:
          dp = [math.inf] * (amount + 1)
          dp[0] = 0
          for a in range(1, amount + 1):
              for c in coins:
                  if c <= a:
                      dp[a] = min(dp[a], dp[a - c] + 1)
          return -1 if dp[amount] == math.inf else dp[amount]
    `,
    why: 'Every entry is built from smaller ones, so the base case `dp[0] = 0` (zero coins make 0) is what lets any finite value appear at all.',
    hints: ['Which entry does every chain of `dp[a - c] + 1` eventually reach?', 'How many coins make an amount of 0?'],
    wrong: [
      // Greedy: largest coin first is not always optimal.
      py`
        def fewest_coins(coins: list[int], amount: int) -> int:
            used = 0
            for c in sorted(coins, reverse=True):
                used += amount // c
                amount %= c
            return used if amount == 0 else -1
      `,
      // Fixes the base case but returns inf instead of -1 when impossible.
      py`
        import math

        def fewest_coins(coins: list[int], amount: int) -> int:
            dp = [math.inf] * (amount + 1)
            dp[0] = 0
            for a in range(1, amount + 1):
                for c in coins:
                    if c <= a:
                        dp[a] = min(dp[a], dp[a - c] + 1)
            return dp[amount]
      `,
    ],
    grading: { entry: 'fewest_coins', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 3, 4], 6', expected: '2' },
      { args: '[2, 5], 11', expected: '4' },
      { args: '[1], 7', expected: '7' },
      { args: '[5], 0', expected: '0' },
      { args: '[2], 3', expected: '-1' },
      { args: '[3, 7], 1', expected: '-1' },
    ],
    provenance: 'original',
  },
  {
    id: 'dp-common-subsequence-2d',
    version: 1,
    title: 'Write a 2-D DP table: longest common subsequence',
    skills: ['algo-dp', 'grids-2d', 'trap-mutability'],
    kind: 'write',
    prompt: 'Return the length of the longest sequence of characters that appears, in order but not necessarily adjacent, in both `a` and `b`. Use a `(len(a) + 1) x (len(b) + 1)` table.',
    signature: 'def lcs_length(a: str, b: str) -> int',
    starter: py`
      def lcs_length(a: str, b: str) -> int:
          return len(set(a) & set(b))
    `,
    solution: py`
      def lcs_length(a: str, b: str) -> int:
          dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
          for i in range(1, len(a) + 1):
              for j in range(1, len(b) + 1):
                  if a[i - 1] == b[j - 1]:
                      dp[i][j] = dp[i - 1][j - 1] + 1
                  else:
                      dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
          return dp[len(a)][len(b)]
    `,
    why: '`dp[i][j]` answers the question for the prefixes `a[:i]` and `b[:j]`; row and column 0 are the empty prefixes, which is why the table is one bigger in each direction.',
    hints: ['If the last characters match, extend `dp[i-1][j-1]`; otherwise drop one of them.', 'Build rows with a comprehension, not `[[0] * m] * n`.'],
    wrong: [
      // [[0] * m] * n: every row is the same list, so rows overwrite each other.
      py`
        def lcs_length(a: str, b: str) -> int:
            dp = [[0] * (len(b) + 1)] * (len(a) + 1)
            for i in range(1, len(a) + 1):
                for j in range(1, len(b) + 1):
                    if a[i - 1] == b[j - 1]:
                        dp[i][j] = dp[i - 1][j - 1] + 1
                    else:
                        dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
            return dp[len(a)][len(b)]
      `,
      // On a mismatch takes the diagonal, forgetting the better of the two neighbours.
      py`
        def lcs_length(a: str, b: str) -> int:
            dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]
            for i in range(1, len(a) + 1):
                for j in range(1, len(b) + 1):
                    if a[i - 1] == b[j - 1]:
                        dp[i][j] = dp[i - 1][j - 1] + 1
                    else:
                        dp[i][j] = dp[i - 1][j - 1]
            return dp[len(a)][len(b)]
      `,
    ],
    grading: { entry: 'lcs_length', kind: 'function', compare: 'exact' },
    cases: [
      { args: "'kitten', 'sitting'", expected: '4' },
      { args: "'banana', 'atana'", expected: '4' },
      { args: "'xyz', 'zyx'", expected: '1' },
      { args: "'abc', 'aac'", expected: '2' },
      { args: "'a', 'aa'", expected: '1' },
      { args: "'abc', 'abc'", expected: '3' },
      { args: "'abc', 'def'", expected: '0' },
      { args: "'', 'abc'", expected: '0' },
    ],
    provenance: 'original',
  },
  {
    id: 'dp-cheapest-climb',
    version: 1,
    title: 'Apply 1-D DP: the cheapest climb',
    skills: ['algo-dp', 'builtins-aggregate'],
    kind: 'write',
    prompt: 'Leaving step `i` costs `cost[i]`; from it you climb 1 or 2 steps. You may start on step 0 or step 1, and the goal is to get past the last step. Return the cheapest total.',
    signature: 'def min_climb_cost(cost: list[int]) -> int',
    starter: py`
      def min_climb_cost(cost: list[int]) -> int:
          return sum(cost)
    `,
    solution: py`
      def min_climb_cost(cost: list[int]) -> int:
          n = len(cost)
          dp = [0] * (n + 1)
          for i in range(2, n + 1):
              dp[i] = min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2])
          return dp[n]
    `,
    why: '`dp[i]` is the cheapest way to stand on step `i`; steps 0 and 1 are free starts (`dp[0] = dp[1] = 0`) and the top is position `n`.',
    hints: ['Let `dp[i]` be the cost to arrive at step `i`; the top is `i = n`.', 'You arrive from `i - 1` or `i - 2`, paying that step\'s cost.'],
    wrong: [
      // Must start on step 0.
      py`
        def min_climb_cost(cost: list[int]) -> int:
            n = len(cost)
            if n == 0:
                return 0
            dp = [0] * (n + 1)
            dp[1] = cost[0]
            for i in range(2, n + 1):
                dp[i] = min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2])
            return dp[n]
      `,
      // Treats the last step as the goal instead of getting past it.
      py`
        def min_climb_cost(cost: list[int]) -> int:
            n = len(cost)
            dp = [0] * (n + 1)
            for i in range(2, n + 1):
                dp[i] = min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2])
            return dp[n - 1] if n else 0
      `,
    ],
    grading: { entry: 'min_climb_cost', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[5, 1, 5]', expected: '1' },
      { args: '[1, 2, 3, 4]', expected: '4' },
      { args: '[2, 9, 2, 9, 2]', expected: '6' },
      { args: '[3, 3]', expected: '3' },
      { args: '[7]', expected: '0' },
      { args: '[]', expected: '0' },
    ],
    provenance: 'original',
  },
];
