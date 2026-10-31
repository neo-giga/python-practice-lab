import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const cDp2dProblems: CodingProblem[] = [
  {
    id: "corner-balance-table",
    version: 1,
    title: "Build a corner balance table",
    pattern: "dp-2d",
    subPatterns: ["table recurrence","2-D prefix sums"],
    difficulty: "easy",
    priority: 1,
    estMinutes: 18,
    statement: "A rectangular board records signed stock changes. Produce a matrix of the same shape where entry `[r][c]` totals the rectangle from the top-left corner `(0, 0)` through `(r, c)`, including both boundaries. Negative entries are withdrawals and must contribute normally. An empty board returns `[]`. This is a table-building exercise; no follow-up rectangle queries are given.",
    examples: [
      {
        input: "[[3, -2, 5], [4, 1, -6]]",
        output: "[[3, 1, 6], [7, 6, 5]]",
        explanation: "The bottom-middle rectangle totals 3 - 2 + 4 + 1 = 6. The bottom-right entry includes all six changes and totals 5."
      },
      {
        input: "[[0, 2], [-2, 0]]",
        output: "[[0, 2], [-2, 0]]",
        explanation: "The whole board balances to zero even though its intermediate corner rectangles do not."
      }
    ],
    constraints: ["The board is [] or a rectangular matrix with 1..50 rows and 1..50 columns.","-1000 <= board[r][c] <= 1000"],
    signature: "def corner_totals(board: list[list[int]]) -> list[list[int]]",
    starter: py`
      def corner_totals(board: list[list[int]]) -> list[list[int]]:
          pass
    `,
    solution: py`
      def corner_totals(board):
          if not board:
              return []
          rows, cols = len(board), len(board[0])
          dp = [[0] * (cols + 1) for _ in range(rows + 1)]
          for r in range(rows):
              for c in range(cols):
                  dp[r + 1][c + 1] = board[r][c] + dp[r][c + 1] + dp[r + 1][c] - dp[r][c]
          return [row[1:] for row in dp[1:]]
    `,
    complexity: {
      time: "O(rc)",
      space: "O(rc)",
      note: "r and c are board dimensions; the padded dynamic-programming table and returned matrix both have O(rc) cells."
    },
    explanation: "The rectangle ending here is the rectangle above plus the rectangle to the left plus this cell. Their shared upper-left rectangle was counted twice, so subtract it once.\n\nA zero border lets the same recurrence handle the first row and first column. Process rows from top to bottom and columns left to right so every dependency is already available.",
    hints: ["Neighboring corner totals contain much of the rectangle you need.","Add the above and left totals, but identify their overlap.","Use a padded zero table: dp[r+1][c+1] = board[r][c] + dp[r][c+1] + dp[r+1][c] - dp[r][c]."],
    idiomNote: "Create each table row separately with a comprehension. Padding also avoids negative-index boundary bugs, since Python permits negative indices instead of rejecting them.",
    wrong: [
      py`
        # Double-counts the overlap of the upper and left rectangles.
        def corner_totals(board):
            if not board:
                return []
            rows, cols = len(board), len(board[0])
            dp = [[0] * (cols + 1) for _ in range(rows + 1)]
            for r in range(rows):
                for c in range(cols):
                    dp[r + 1][c + 1] = board[r][c] + dp[r][c + 1] + dp[r + 1][c]
            return [row[1:] for row in dp[1:]]
      `,
      py`
        # Computes only row prefixes, omitting previous rows.
        def corner_totals(board):
            out = []
            for row in board:
                total, line = 0, []
                for value in row:
                    total += value
                    line.append(total)
                out.append(line)
            return out
      `
    ],
    grading: {
      entry: "corner_totals",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[[3, -2, 5], [4, 1, -6]]",
        expected: "[[3, 1, 6], [7, 6, 5]]"
      },
      {
        args: "[[0, 2], [-2, 0]]",
        expected: "[[0, 2], [-2, 0]]"
      },
      {
        args: "[]",
        expected: "[]"
      },
      {
        args: "[[-7]]",
        expected: "[[-7]]"
      },
      {
        args: "[[2, 2, 2]]",
        expected: "[[2, 4, 6]]"
      },
      {
        args: "[[1], [-3], [4]]",
        expected: "[[1], [-2], [2]]"
      },
      {
        args: "[[0, 0], [0, 0]]",
        expected: "[[0, 0], [0, 0]]"
      },
      {
        args: "[[1] * 50 for _ in range(50)]",
        expected: "[[(r + 1) * (c + 1) for c in range(50)] for r in range(50)]",
        label: "All 2,500 corner rectangles on a uniform board"
      }
    ],
    recipeIds: ["dp-table","prefix-sum"],
    provenance: "original"
  },
  {
    id: "branching-echo-rows",
    version: 1,
    title: "Record branching echoes",
    pattern: "dp-2d",
    subPatterns: ["row-by-row DP"],
    difficulty: "easy",
    priority: 1,
    estMinutes: 18,
    statement: "An echo experiment begins with a nonempty row of signed amplitudes, `seed`. On each round, every amplitude sends its full value to positions `j` and `j + 1` of a new row, which is one position longer. Contributions arriving at the same position add. Return all rows in order, including a copy of the seed followed by exactly `rounds` new rows. Earlier rows must retain their original values.",
    examples: [
      {
        input: "[2, -1], 2",
        output: "[[2, -1], [2, 1, -1], [2, 3, 0, -1]]",
        explanation: "Round one is [2, 2 + (-1), -1]. The next round is [2, 2 + 1, 1 + (-1), -1]."
      },
      {
        input: "[4], 3",
        output: "[[4], [4, 4], [4, 8, 4], [4, 12, 12, 4]]",
        explanation: "Each round preserves the two boundary amplitudes and adds neighboring contributions in the interior."
      }
    ],
    constraints: ["1 <= len(seed) <= 20","-10 <= seed[i] <= 10","0 <= rounds <= 20"],
    signature: "def echo_rows(seed: list[int], rounds: int) -> list[list[int]]",
    starter: py`
      def echo_rows(seed: list[int], rounds: int) -> list[list[int]]:
          pass
    `,
    solution: py`
      def echo_rows(seed, rounds):
          rows = [seed[:]]
          for _ in range(rounds):
              prev = rows[-1]
              current = [0] * (len(prev) + 1)
              for j, value in enumerate(prev):
                  current[j] += value
                  current[j + 1] += value
              rows.append(current)
          return rows
    `,
    complexity: {
      time: "O((t + 1)(w + t))",
      space: "O((t + 1)(w + t))",
      note: "w is the seed width and t the number of rounds; all output rows are retained."
    },
    explanation: "Each new row depends only on the previous row. Start it at zero, then add every previous value into its two receiving positions. This directly models the experiment and includes the boundary positions without special cases.\n\nAllocate a fresh row each round and append it after all contributions are accumulated. Mutating the previous row would both corrupt the saved history and feed updated values into the same round.",
    hints: ["A new row has one more slot than the previous row.","Allocate the new row separately and add each old value into two adjacent slots.","For each j, add prev[j] to current[j] and current[j + 1]; append current and repeat."],
    idiomNote: "Fresh lists keep the rows independent. `+=` accumulates overlapping contributions; plain assignment would overwrite an amplitude sent by a neighboring position.",
    wrong: [
      py`
        # Overwrites the contribution from the previous position.
        def echo_rows(seed, rounds):
            rows = [seed[:]]
            for _ in range(rounds):
                prev = rows[-1]
                current = [0] * (len(prev) + 1)
                for j, value in enumerate(prev):
                    current[j] = value
                    current[j + 1] += value
                rows.append(current)
            return rows
      `,
      py`
        # Produces one fewer propagation round.
        def echo_rows(seed, rounds):
            rows = [seed[:]]
            for _ in range(max(0, rounds - 1)):
                prev = rows[-1]
                current = [0] * (len(prev) + 1)
                for j, value in enumerate(prev):
                    current[j] += value
                    current[j + 1] += value
                rows.append(current)
            return rows
      `
    ],
    grading: {
      entry: "echo_rows",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[2, -1], 2",
        expected: "[[2, -1], [2, 1, -1], [2, 3, 0, -1]]"
      },
      {
        args: "[4], 3",
        expected: "[[4], [4, 4], [4, 8, 4], [4, 12, 12, 4]]"
      },
      {
        args: "[0], 0",
        expected: "[[0]]"
      },
      {
        args: "[-3, 3], 1",
        expected: "[[-3, 3], [-3, 0, 3]]"
      },
      {
        args: "[1, 1], 0",
        expected: "[[1, 1]]"
      },
      {
        args: "[0, 0], 2",
        expected: "[[0, 0], [0, 0, 0], [0, 0, 0, 0]]"
      },
      {
        args: "[1], 20",
        expected: "[[__import__(\"math\").comb(r, c) for c in range(r + 1)] for r in range(21)]",
        label: "Twenty rounds with binomial-coefficient expectations"
      }
    ],
    recipeIds: ["dp-table"],
    provenance: "original"
  },
  {
    id: "shared-milestone-chain",
    version: 1,
    title: "Align shared milestone logs",
    pattern: "dp-2d",
    subPatterns: ["two-sequence DP"],
    difficulty: "medium",
    priority: 1,
    estMinutes: 30,
    statement: "Two expedition logs record milestone IDs in visit order. Find the largest number of milestones that can be selected from each log to form the same ID sequence. Selected positions must advance in both logs, but skipped entries are allowed. Repeated IDs are separate visits and can match separate visits in the other log. Return the maximum count, not the sequence.",
    examples: [
      {
        input: "[8, -1, 4, 8, 6], [-1, 8, 6, 4]",
        output: "3",
        explanation: "The IDs [-1, 8, 6] occur in that order in both logs; their positions need not be adjacent."
      },
      {
        input: "[2, 2, 5], [2, 5, 2]",
        output: "2",
        explanation: "Either [2, 2] or [2, 5] gives two matches. All three cannot be aligned without reversing a visit."
      }
    ],
    constraints: ["0 <= len(a), len(b) <= 300","Milestone IDs are integers between -100 and 100."],
    signature: "def shared_milestones(a: list[int], b: list[int]) -> int",
    starter: py`
      def shared_milestones(a: list[int], b: list[int]) -> int:
          pass
    `,
    solution: py`
      def shared_milestones(a, b):
          previous = [0] * (len(b) + 1)
          for x in a:
              current = [0] * (len(b) + 1)
              for j, y in enumerate(b, 1):
                  if x == y:
                      current[j] = previous[j - 1] + 1
                  else:
                      current[j] = max(previous[j], current[j - 1])
              previous = current
          return previous[-1]
    `,
    complexity: {
      time: "O(mn)",
      space: "O(n)",
      note: "m = len(a), n = len(b); rolling rows store two n + 1 prefixes."
    },
    explanation: "For each pair of prefixes, record the best alignment length. Equal final IDs can extend the best alignment of both shorter prefixes by one. Otherwise discard one final ID and take the better of the two resulting prefix states.\n\nThe transition needs only the previous row and the current row's preceding cell, so two rows replace a full matrix without changing the recurrence.",
    hints: ["The same ID appearing in both logs is not enough; visit order matters.","Let dp[i][j] describe the two prefixes ending before i and j.","On equality use the diagonal + 1; otherwise use max(above, left). Roll the completed row forward."],
    idiomNote: "`enumerate(b, 1)` aligns sequence items with a padded DP row. Allocate a fresh current row for every item of a so diagonal reads still refer to the previous iteration.",
    wrong: [
      py`
        # Computes a common contiguous stretch instead of a subsequence.
        def shared_milestones(a, b):
            previous = [0] * (len(b) + 1)
            for x in a:
                current = [0] * (len(b) + 1)
                for j, y in enumerate(b, 1):
                    if x == y:
                        current[j] = previous[j - 1] + 1
                    else:
                        current[j] = 0
                previous = current
            return previous[-1]
      `,
      py`
        # Counts matching IDs as a multiset, ignoring their visit order.
        from collections import Counter
        def shared_milestones(a, b):
            return sum((Counter(a) & Counter(b)).values())
      `
    ],
    grading: {
      entry: "shared_milestones",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[8, -1, 4, 8, 6], [-1, 8, 6, 4]",
        expected: "3"
      },
      {
        args: "[2, 2, 5], [2, 5, 2]",
        expected: "2"
      },
      {
        args: "[], []",
        expected: "0"
      },
      {
        args: "[0], []",
        expected: "0"
      },
      {
        args: "[-3], [-3]",
        expected: "1"
      },
      {
        args: "[1, 2], [3, 4]",
        expected: "0"
      },
      {
        args: "[1, 2, 3], [3, 2, 1]",
        expected: "1"
      },
      {
        args: "[7] * 300, [7] * 250",
        expected: "250",
        label: "Repeated visits require 250 distinct matches"
      }
    ],
    recipeIds: ["dp-table"],
    provenance: "original"
  },
  {
    id: "one-trip-cargo-value",
    version: 1,
    title: "Choose cargo for one trip",
    pattern: "dp-2d",
    subPatterns: ["0/1 knapsack"],
    difficulty: "medium",
    priority: 2,
    estMinutes: 30,
    statement: "A courier can carry at most `capacity` weight units. Package i has positive weight `weights[i]` and signed value `values[i]`. Choose any subset of packages to maximize total value without exceeding capacity; each package can be taken once. Equal packages remain separate choices. Return the best value. Taking nothing is allowed, and there is no requirement to fill the vehicle.",
    examples: [
      {
        input: "[3, 4, 5], [5, 8, 9], 7",
        output: "13",
        explanation: "The 3-unit and 4-unit packages fit together and are worth 13, beating the single 5-unit package."
      },
      {
        input: "[2, 2, 3], [4, 4, -2], 4",
        output: "8",
        explanation: "The two equal packages are separate items and together are worth 8; the negative-value package is best left behind."
      }
    ],
    constraints: ["0 <= len(weights) = len(values) <= 100","1 <= weights[i] <= 100","-100 <= values[i] <= 100","0 <= capacity <= 1000"],
    signature: "def best_cargo(weights: list[int], values: list[int], capacity: int) -> int",
    starter: py`
      def best_cargo(weights: list[int], values: list[int], capacity: int) -> int:
          pass
    `,
    solution: py`
      def best_cargo(weights, values, capacity):
          dp = [0] * (capacity + 1)
          for weight, value in zip(weights, values):
              for room in range(capacity, weight - 1, -1):
                  dp[room] = max(dp[room], dp[room - weight] + value)
          return dp[capacity]
    `,
    complexity: {
      time: "O(nC)",
      space: "O(C)",
      note: "n is the package count and C the capacity. The item-by-capacity DP is compressed into one row."
    },
    explanation: "The conceptual state is the best value using a prefix of the packages with a given weight allowance. For each package, compare skipping it with adding it to the best state with enough room left over.\n\nVisit capacities downward when compressing the table. Then dp[room - weight] still belongs to the previous item row, so the current package cannot be reused. Zero initialization allows choosing no packages even when all values are negative.",
    hints: ["For a fixed package, every solution either includes it or excludes it.","Use an item-by-capacity DP; values are maximized over both choices.","Compress to one row and loop room downward from capacity to weight, updating max(dp[room], dp[room - weight] + value)."],
    idiomNote: "A descending `range(capacity, weight - 1, -1)` includes the exact-fit slot. An ascending loop silently changes a once-per-item problem into an unlimited-supply problem.",
    wrong: [
      py`
        # Reuses the current package through freshly updated states.
        def best_cargo(weights, values, capacity):
            dp = [0] * (capacity + 1)
            for weight, value in zip(weights, values):
                for room in range(weight, capacity + 1):
                    dp[room] = max(dp[room], dp[room - weight] + value)
            return dp[capacity]
      `,
      py`
        # Excludes packages that exactly fill the available room.
        def best_cargo(weights, values, capacity):
            dp = [0] * (capacity + 1)
            for weight, value in zip(weights, values):
                for room in range(capacity, weight, -1):
                    dp[room] = max(dp[room], dp[room - weight] + value)
            return dp[capacity]
      `
    ],
    grading: {
      entry: "best_cargo",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[3, 4, 5], [5, 8, 9], 7",
        expected: "13"
      },
      {
        args: "[2, 2, 3], [4, 4, -2], 4",
        expected: "8"
      },
      {
        args: "[], [], 5",
        expected: "0"
      },
      {
        args: "[1], [7], 0",
        expected: "0"
      },
      {
        args: "[2], [5], 4",
        expected: "5"
      },
      {
        args: "[4], [-3], 4",
        expected: "0"
      },
      {
        args: "[6, 2], [9, 3], 3",
        expected: "3"
      },
      {
        args: "[2] * 100, [3] * 100, 100",
        expected: "150",
        label: "Choose 50 of 100 identical packages"
      }
    ],
    recipeIds: ["dp-table"],
    provenance: "original"
  }
];
