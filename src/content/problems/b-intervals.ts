// Writer B: intervals problems (original). See docs/AUTHORING.md.
import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const bIntervalProblems: CodingProblem[] = [
  {
    id: 'book-into-calendar',
    version: 1,
    title: 'Book a slot into a merged calendar',
    pattern: 'intervals',
    subPatterns: ['sort + sweep', 'insert and merge'],
    difficulty: 'medium',
    priority: 2,
    estMinutes: 25,
    statement: [
      'A room calendar `booked` lists busy blocks `[start, end]` (inclusive, in minutes). The blocks are sorted by `start` and already merged: no two of them overlap or touch.',
      'Add the block `new` and return the calendar in the same form: sorted, with every overlapping or touching block merged into one. Blocks touch when one ends exactly where the next starts, such as `[1, 2]` and `[2, 4]`. Do not modify the input lists.',
    ].join('\n\n'),
    examples: [
      { input: '[[9, 10], [13, 15], [20, 24]], [14, 21]', output: '[[9, 10], [13, 24]]', explanation: '`[14, 21]` overlaps both `[13, 15]` and `[20, 24]`, so all three become `[13, 24]`.' },
      { input: '[[2, 4], [8, 9]], [5, 6]', output: '[[2, 4], [5, 6], [8, 9]]', explanation: 'The new block fits in a gap and merges with nothing.' },
    ],
    constraints: ['0 <= len(booked) <= 10**4', 'booked is sorted by start; its blocks neither overlap nor touch.', 'start <= end for every block, including new', '-10**6 <= start, end <= 10**6'],
    signature: 'def book(booked: list[list[int]], new: list[int]) -> list[list[int]]',
    starter: py`
      def book(booked: list[list[int]], new: list[int]) -> list[list[int]]:
          return booked + [new]
    `,
    solution: py`
      def book(booked: list[list[int]], new: list[int]) -> list[list[int]]:
          start, end = new
          out = []
          i, n = 0, len(booked)
          while i < n and booked[i][1] < start:  # entirely before the new block
              out.append(booked[i])
              i += 1
          while i < n and booked[i][0] <= end:  # overlaps or touches: absorb it
              start = min(start, booked[i][0])
              end = max(end, booked[i][1])
              i += 1
          out.append([start, end])
          out.extend(booked[i:])  # entirely after
          return out
    `,
    complexity: { time: 'O(n)', space: 'O(n) for the result', note: 'n = len(booked); the input is already sorted, so no sort is needed.' },
    explanation: [
      'Because `booked` is sorted and disjoint, it splits into three runs: blocks that end before `new` starts, blocks that overlap or touch `new`, and blocks that start after `new` ends.',
      'Copy the first run, fold the middle run into `new` by widening `start` and `end`, append the merged block, then copy the rest. The tests use `<` and `<=` so that touching blocks are merged.',
    ].join('\n\n'),
    hints: [
      'The calendar is already sorted and merged. Which blocks can the new one possibly affect?',
      'Walk once: keep blocks that end before `new` starts; merge every block that starts at or before `new`\'s (growing) end; keep the rest.',
      '`start, end = new`; copy while `booked[i][1] < start`; while `booked[i][0] <= end`: widen `start`/`end`; append `[start, end]`; `out.extend(booked[i:])`.',
    ],
    idiomNote: '`start, end = new` unpacks into fresh names, so widening them never changes the caller\'s `new` list (writing `new[1] = ...` would). `out.extend(booked[i:])` copies the tail in one call. Lists compare element by element, so `sorted(booked + [new])` would also order blocks by start, at O(n log n).',
    wrong: [
      // Strict < when testing overlap: touching blocks are not merged.
      py`
        def book(booked: list[list[int]], new: list[int]) -> list[list[int]]:
            start, end = new
            out = []
            i, n = 0, len(booked)
            while i < n and booked[i][1] < start:
                out.append(booked[i])
                i += 1
            while i < n and booked[i][0] < end:
                start = min(start, booked[i][0])
                end = max(end, booked[i][1])
                i += 1
            out.append([start, end])
            out.extend(booked[i:])
            return out
      `,
      // Widens only the end: forgets that an absorbed block can start earlier.
      py`
        def book(booked: list[list[int]], new: list[int]) -> list[list[int]]:
            start, end = new
            out = []
            i, n = 0, len(booked)
            while i < n and booked[i][1] < start:
                out.append(booked[i])
                i += 1
            while i < n and booked[i][0] <= end:
                end = max(end, booked[i][1])
                i += 1
            out.append([start, end])
            out.extend(booked[i:])
            return out
      `,
      // Merges correctly but appends the merged block at the end instead of in order.
      py`
        def book(booked: list[list[int]], new: list[int]) -> list[list[int]]:
            start, end = new
            out = []
            for s, e in booked:
                if e < start or s > end:
                    out.append([s, e])
                else:
                    start, end = min(start, s), max(end, e)
            out.append([start, end])
            return out
      `,
    ],
    grading: { entry: 'book', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[[9, 10], [13, 15], [20, 24]], [14, 21]', expected: '[[9, 10], [13, 24]]' },
      { args: '[[2, 4], [8, 9]], [5, 6]', expected: '[[2, 4], [5, 6], [8, 9]]' },
      { args: '[], [3, 7]', expected: '[[3, 7]]' },
      { args: '[[5, 8]], [1, 2]', expected: '[[1, 2], [5, 8]]' },
      { args: '[[5, 8]], [10, 12]', expected: '[[5, 8], [10, 12]]' },
      { args: '[[1, 2], [4, 5]], [2, 4]', expected: '[[1, 5]]' },
      { args: '[[-10, -5], [0, 0]], [-4, -1]', expected: '[[-10, -5], [-4, -1], [0, 0]]' },
      { args: '[[1, 5]], [2, 3]', expected: '[[1, 5]]' },
      { args: '[[1, 3], [6, 7]], [0, 9]', expected: '[[0, 9]]' },
      { args: '[[i, i] for i in range(0, 6000, 2)], [1, 5999]', expected: '[[0, 0], [1, 5999]]', label: '3 000 one-minute blocks at even minutes; new block [1, 5999]' },
    ],
    similarTo: { lc: 57, url: 'https://leetcode.com/problems/insert-interval/' },
    recipeIds: ['unpacking', 'list-basics'],
    provenance: 'original',
  },
];
