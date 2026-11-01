import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const cDp1dProblems: CodingProblem[] = [
  {
    id: "steady-reading-run",
    version: 1,
    similarTo: { lc: 674, url: "https://leetcode.com/problems/longest-continuous-increasing-subsequence/" },
    title: "Find the longest steady stretch",
    pattern: "dp-1d",
    subPatterns: ["rolling state"],
    difficulty: "easy",
    priority: 1,
    estMinutes: 18,
    statement: "A logger records signed readings in time order. Find the length of the longest consecutive stretch in which readings never decrease. Equal neighboring readings are allowed. You may not skip a reading inside the stretch. Return 0 for an empty log.",
    examples: [
      {
        input: "[-4, -4, 2, -1, 0, 0, 5]",
        output: "4",
        explanation: "The final stretch [-1, 0, 0, 5] has length 4; the earlier [-4, -4, 2] has length 3."
      },
      {
        input: "[7, 3, 4, 2, 6]",
        output: "2",
        explanation: "The stretches [3, 4] and [2, 6] tie at length 2. Skipping the 2 to join 3, 4 and 6 is not allowed."
      }
    ],
    constraints: ["0 <= len(readings) <= 3000","-10000 <= readings[i] <= 10000"],
    signature: "def steady_run(readings: list[int]) -> int",
    starter: py`
      def steady_run(readings: list[int]) -> int:
          pass
    `,
    solution: py`
      def steady_run(readings):
          best = run = 0
          for i, value in enumerate(readings):
              run = run + 1 if i > 0 and value >= readings[i - 1] else 1
              best = max(best, run)
          return best
    `,
    complexity: {
      time: "O(n)",
      space: "O(1)",
      note: "n is the number of readings; only the previous ending length and best length are stored."
    },
    explanation: "Let the state at i be the longest valid stretch ending exactly at i. If the current reading is at least the previous one, extend that state by one; otherwise the new stretch starts here with length one.\n\nThe overall answer is the maximum ending state, not necessarily the final state. Initializing both counters to zero handles an empty log naturally.",
    hints: ["A stretch must end at some position. What is the best stretch ending here?","Extend the previous ending length only when the new reading does not drop.","For each index, set run to run + 1 or 1, and update best with max(best, run)."],
    idiomNote: "`enumerate` provides both the reading and its index. Guard `i > 0` before accessing the previous reading: Python negative indexing would otherwise read the final element.",
    wrong: [
      py`
        # Breaks a stretch on equal readings.
        def steady_run(readings):
            best = run = 0
            for i, value in enumerate(readings):
                run = run + 1 if i > 0 and value > readings[i - 1] else 1
                best = max(best, run)
            return best
      `,
      py`
        # Returns only the final stretch instead of the longest one.
        def steady_run(readings):
            best = run = 0
            for i, value in enumerate(readings):
                run = run + 1 if i > 0 and value >= readings[i - 1] else 1
                best = max(best, run)
            return run
      `
    ],
    grading: {
      entry: "steady_run",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[-4, -4, 2, -1, 0, 0, 5]",
        expected: "4"
      },
      {
        args: "[7, 3, 4, 2, 6]",
        expected: "2"
      },
      {
        args: "[]",
        expected: "0"
      },
      {
        args: "[0]",
        expected: "1"
      },
      {
        args: "[5, 5, 5, 5]",
        expected: "4"
      },
      {
        args: "[4, 3, 2, 1]",
        expected: "1"
      },
      {
        args: "[-9, -7, -2, 0]",
        expected: "4"
      },
      {
        args: "[1, 2, 3, 4, -1]",
        expected: "4"
      },
      {
        args: "[0] * 1500 + [-1] + [1] * 1499",
        expected: "1500",
        label: "Two equal-length stretches separated by a drop"
      }
    ],
    recipeIds: ["dp-table"],
    provenance: "original"
  },
  {
    id: "fewest-screen-panels",
    version: 1,
    similarTo: { lc: 322, url: "https://leetcode.com/problems/coin-change/" },
    title: "Build a screen with fewest panels",
    pattern: "dp-1d",
    subPatterns: ["unbounded choices"],
    difficulty: "medium",
    priority: 1,
    estMinutes: 30,
    statement: "A stage crew must build a screen of exactly `width` units using panels from the positive sizes in `lengths`. There is an unlimited supply of each listed size. Return the fewest panels needed, or -1 if exact construction is impossible. Width zero needs zero panels. Duplicate size listings do not change availability.",
    examples: [
      {
        input: "[1, 4, 6], 8",
        output: "2",
        explanation: "Two 4-unit panels use fewer pieces than a 6 and two 1s. Largest-first selection would miss the optimum."
      },
      {
        input: "[5, 8], 7",
        output: "-1",
        explanation: "Neither a single panel nor any sum of the listed sizes reaches 7 exactly."
      }
    ],
    constraints: ["0 <= len(lengths) <= 30","1 <= lengths[i] <= 100","0 <= width <= 3000"],
    signature: "def fewest_panels(lengths: list[int], width: int) -> int",
    starter: py`
      def fewest_panels(lengths: list[int], width: int) -> int:
          pass
    `,
    solution: py`
      def fewest_panels(lengths, width):
          unreachable = width + 1
          dp = [0] + [unreachable] * width
          for total in range(1, width + 1):
              for size in lengths:
                  if size <= total:
                      dp[total] = min(dp[total], dp[total - size] + 1)
          return -1 if dp[width] == unreachable else dp[width]
    `,
    complexity: {
      time: "O(wm)",
      space: "O(w)",
      note: "w is the requested width and m the number of listed sizes."
    },
    explanation: "For each total width, consider its last panel. Removing a panel of size s leaves an already-solved smaller total, so the candidate is dp[total - s] + 1. The minimum over all possible last panels is optimal.\n\nA sentinel of width + 1 represents impossible totals: since every panel is at least one unit, a valid answer cannot exceed width. This also avoids confusing an impossible width with the valid zero-panel base case.",
    hints: ["The largest panel is not always part of the best construction.","Store the fewest panels for every smaller width, starting with dp[0] = 0.","For each total and size <= total, minimize dp[total] using dp[total - size] + 1; convert the unreachable sentinel to -1."],
    idiomNote: "A finite integer sentinel keeps the table integer-valued. Do not initialize all totals to zero: zero means a valid construction only for width zero.",
    wrong: [
      py`
        # Greedily uses the largest panel first.
        def fewest_panels(lengths, width):
            count = 0
            for size in sorted(set(lengths), reverse=True):
                used, width = divmod(width, size)
                count += used
            return count if width == 0 else -1
      `,
      py`
        # Treats every positive width as already achievable with no panels.
        def fewest_panels(lengths, width):
            unreachable = width + 1
            dp = [0] * (width + 1)
            for total in range(1, width + 1):
                for size in lengths:
                    if size <= total:
                        dp[total] = min(dp[total], dp[total - size] + 1)
            return -1 if dp[width] == unreachable else dp[width]
      `
    ],
    grading: {
      entry: "fewest_panels",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[1, 4, 6], 8",
        expected: "2"
      },
      {
        args: "[5, 8], 7",
        expected: "-1"
      },
      {
        args: "[], 0",
        expected: "0"
      },
      {
        args: "[], 3",
        expected: "-1"
      },
      {
        args: "[3, 3], 6",
        expected: "2"
      },
      {
        args: "[9], 9",
        expected: "1"
      },
      {
        args: "[2, 7], 1",
        expected: "-1"
      },
      {
        args: "[7, 13], 2600",
        expected: "200",
        label: "Build 2,600 units with 200 panels"
      }
    ],
    recipeIds: ["dp-table"],
    provenance: "original"
  }
];
