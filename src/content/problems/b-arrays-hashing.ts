// Writer B: arrays-hashing problems (original). See docs/AUTHORING.md.
import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const bArraysHashingProblems: CodingProblem[] = [
  {
    id: 'longest-ticket-run',
    version: 1,
    title: 'Longest run of consecutive raffle tickets',
    pattern: 'arrays-hashing',
    subPatterns: ['set membership'],
    difficulty: 'medium',
    priority: 2,
    estMinutes: 25,
    statement: [
      'A raffle box holds stubs, each printed with an integer in `tickets`. The stubs are in no particular order, some numbers appear more than once, and the printer also produced zero and negative numbers.',
      'Return the length of the longest run of consecutive integers `x, x + 1, x + 2, ...` that are **all** present in the box. Repeated stubs count once. An empty box has a longest run of `0`.',
      'Sorting would work, but aim for a single O(n) pass over a hash set.',
    ].join('\n\n'),
    examples: [
      { input: '[12, 4, 10, 11, 5, 13]', output: '4', explanation: '`10, 11, 12, 13` are all present. `4, 5` is a shorter run.' },
      { input: '[7, 7, 8, -1, 0, 1, 2]', output: '4', explanation: '`-1, 0, 1, 2` is the longest run. The second `7` adds nothing: `7, 8` has length 2.' },
    ],
    constraints: ['0 <= len(tickets) <= 10**5', '-10**9 <= tickets[i] <= 10**9'],
    signature: 'def longest_run(tickets: list[int]) -> int',
    starter: py`
      def longest_run(tickets: list[int]) -> int:
          return 0
    `,
    solution: py`
      def longest_run(tickets: list[int]) -> int:
          present = set(tickets)
          best = 0
          for x in present:
              if x - 1 in present:
                  continue  # not the start of a run; its start will count it
              end = x
              while end + 1 in present:
                  end += 1
              best = max(best, end - x + 1)
          return best
    `,
    complexity: { time: 'O(n)', space: 'O(n)', note: 'n = len(tickets). Each number is visited by the inner while loop at most once, from the start of its own run.' },
    explanation: [
      'Put every number in a set. A number `x` starts a run exactly when `x - 1` is missing. Only from those starts do we walk forward with `end + 1 in present` to measure the run.',
      'Every number belongs to exactly one run and is walked over once, from that run\'s start, so the whole loop is O(n) even though it contains a `while`.',
    ].join('\n\n'),
    hints: [
      'If you could ask "is this number in the box?" in O(1), where would a run have to start?',
      'Build a set. A number `x` starts a run only if `x - 1` is not in the set. Measure runs only from their starts.',
      'For each `x` in the set with `x - 1` absent: `end = x`; while `end + 1` is in the set, `end += 1`; best = max(best, end - x + 1).',
    ],
    idiomNote: '`set(tickets)` removes duplicates and gives O(1) `in` tests. Loop over the **set**, not the list: with many repeated stubs, a loop over the list would re-measure the same run once per copy. A sort-based answer must also skip equal neighbours, which is the classic bug.',
    wrong: [
      // Sort-based, but a repeated number resets the run.
      py`
        def longest_run(tickets: list[int]) -> int:
            if not tickets:
                return 0
            nums = sorted(tickets)
            best = cur = 1
            for a, b in zip(nums, nums[1:]):
                if b == a + 1:
                    cur += 1
                else:
                    cur = 1
                best = max(best, cur)
            return best
      `,
      // Sort-based and dedups, but only records a run when it breaks, so a run that reaches the end is lost.
      py`
        def longest_run(tickets: list[int]) -> int:
            nums = sorted(set(tickets))
            best = 0
            cur = 1 if nums else 0
            for a, b in zip(nums, nums[1:]):
                if b == a + 1:
                    cur += 1
                else:
                    best = max(best, cur)
                    cur = 1
            return best
      `,
      // Seeds best with 1, so an empty box reports a run of 1.
      py`
        def longest_run(tickets: list[int]) -> int:
            present = set(tickets)
            best = 1
            for x in present:
                if x - 1 not in present:
                    end = x
                    while end + 1 in present:
                        end += 1
                    best = max(best, end - x + 1)
            return best
      `,
    ],
    grading: { entry: 'longest_run', kind: 'function', compare: 'exact', lcMethod: 'longestRun' },
    cases: [
      { args: '[12, 4, 10, 11, 5, 13]', expected: '4' },
      { args: '[7, 7, 8, -1, 0, 1, 2]', expected: '4' },
      { args: '[]', expected: '0' },
      { args: '[42]', expected: '1' },
      { args: '[3, 3, 3]', expected: '1' },
      { args: '[-3, -2, -1, 5, 6]', expected: '3' },
      { args: '[1, 3, 5, 7]', expected: '1' },
      { args: '[2, 1, 2, 3, 1, 4]', expected: '4' },
      { args: '[0, -1, 1, 10**9, -10**9]', expected: '3' },
      { args: 'list(range(3000, 0, -2)) + list(range(1, 3000, 2))', expected: '3000', label: 'Evens 3000..2 descending, then odds 1..2999' },
    ],
    similarTo: { lc: 128, url: 'https://leetcode.com/problems/longest-consecutive-sequence/' },
    recipeIds: ['set-ops'],
    provenance: 'original',
  },
];
