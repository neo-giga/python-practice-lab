import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const cHeapProblems: CodingProblem[] = [
  {
    id: "next-job-costs",
    version: 1,
    title: "Choose the next job costs",
    pattern: "heap",
    subPatterns: ["min-heap"],
    difficulty: "easy",
    priority: 1,
    estMinutes: 18,
    statement: "A workshop selects `k` pending jobs by quoted cost, cheapest first. Credits appear as negative costs. Return the selected costs in nondecreasing order, including one entry for each selected job even when costs tie. Selecting zero jobs returns `[]`. The original ordering of jobs is irrelevant.",
    examples: [
      {
        input: "[8, -3, 5, -3, 0], 3",
        output: "[-3, -3, 0]",
        explanation: "Two separate jobs cost -3, so both are selected before the zero-cost job."
      },
      {
        input: "[7, 2, 9, 4], 2",
        output: "[2, 4]",
        explanation: "2 and 4 are the smallest two quotes, regardless of input positions."
      }
    ],
    constraints: ["0 <= len(costs) <= 3000","0 <= k <= len(costs)","-10000 <= costs[i] <= 10000"],
    signature: "def take_costs(costs: list[int], k: int) -> list[int]",
    starter: py`
      def take_costs(costs: list[int], k: int) -> list[int]:
          pass
    `,
    solution: py`
      import heapq

      def take_costs(costs, k):
          pending = list(costs)
          heapq.heapify(pending)
          return [heapq.heappop(pending) for _ in range(k)]
    `,
    complexity: {
      time: "O(n + k log n)",
      space: "O(n + k)",
      note: "n is the number of jobs; heapify is linear, and the result contains k costs."
    },
    explanation: "Build a min-heap from all costs. Each pop removes the cheapest remaining job; after k pops the output is already sorted.\n\nDo not deduplicate: equal quotes represent different jobs. Copying the input before heapifying also avoids rearranging the caller's list.",
    hints: ["After choosing one job, you still need the smallest remaining quote.","A min-heap exposes the cheapest quote at index zero.","Heapify a copy, then append heappop results exactly k times."],
    idiomNote: "`heapq.heapify` changes a list in place and returns `None`. A heap is only partially ordered; slicing its underlying list does not produce the smallest k items in sorted order.",
    wrong: [
      py`
        # Collapses distinct jobs with equal quotes.
        import heapq

        def take_costs(costs, k):
            pending = list(set(costs))
            heapq.heapify(pending)
            return [heapq.heappop(pending) for _ in range(k)]
      `,
      py`
        # Mistakes heap storage order for sorted order.
        import heapq

        def take_costs(costs, k):
            pending = list(costs)
            heapq.heapify(pending)
            return pending[:k]
      `
    ],
    grading: {
      entry: "take_costs",
      kind: "function",
      compare: "exact"
    },
    cases: [
      {
        args: "[8, -3, 5, -3, 0], 3",
        expected: "[-3, -3, 0]"
      },
      {
        args: "[7, 2, 9, 4], 2",
        expected: "[2, 4]"
      },
      {
        args: "[], 0",
        expected: "[]"
      },
      {
        args: "[0], 1",
        expected: "[0]"
      },
      {
        args: "[-8, -1], 0",
        expected: "[]"
      },
      {
        args: "[4, 4, 4], 3",
        expected: "[4, 4, 4]"
      },
      {
        args: "[5, 1, -2], 3",
        expected: "[-2, 1, 5]"
      },
      {
        args: "list(range(2500, 0, -1)), 1200",
        expected: "list(range(1, 1201))",
        label: "Select 1,200 jobs from 2,500 descending costs"
      }
    ],
    recipeIds: ["heap-basics"],
    provenance: "original"
  }
];
