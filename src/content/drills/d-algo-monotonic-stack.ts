// Writer D: monotonic stack template drills (algo-monotonic-stack).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoMonotonicStackDrills: SkillDrill[] = [
  {
    id: 'ms-days-until-higher',
    version: 1,
    title: 'Write the monotonic stack: days until a higher reading',
    skills: ['algo-monotonic-stack', 'list-basics'],
    kind: 'write',
    prompt: 'For each day in `readings`, return how many days you wait for a strictly higher reading, or 0 if none comes. Keep a stack of indexes still waiting; each new reading answers the lower ones.',
    signature: 'def days_until_higher(readings: list[int]) -> list[int]',
    starter: py`
      def days_until_higher(readings: list[int]) -> list[int]:
          return [0] * len(readings)
    `,
    solution: py`
      def days_until_higher(readings: list[int]) -> list[int]:
          out = [0] * len(readings)
          stack = []
          for i, x in enumerate(readings):
              while stack and readings[stack[-1]] < x:
                  j = stack.pop()
                  out[j] = i - j
              stack.append(i)
          return out
    `,
    why: 'Indexes on the stack have non-increasing readings, so a new higher reading answers them from the top down; storing indexes gives the distance `i - j`.',
    hints: ['Push indexes, not values: you need the distance.', '`while stack and readings[stack[-1]] < x:` pop `j` and set `out[j] = i - j`.'],
    wrong: [
      // `<=` treats an equal reading as higher.
      py`
        def days_until_higher(readings: list[int]) -> list[int]:
            out = [0] * len(readings)
            stack = []
            for i, x in enumerate(readings):
                while stack and readings[stack[-1]] <= x:
                    j = stack.pop()
                    out[j] = i - j
                stack.append(i)
            return out
      `,
      // `if` answers only one waiting day per new reading.
      py`
        def days_until_higher(readings: list[int]) -> list[int]:
            out = [0] * len(readings)
            stack = []
            for i, x in enumerate(readings):
                if stack and readings[stack[-1]] < x:
                    j = stack.pop()
                    out[j] = i - j
                stack.append(i)
            return out
      `,
    ],
    grading: { entry: 'days_until_higher', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[3, 1, 2, 5]', expected: '[3, 1, 1, 0]' },
      { args: '[1, 3, 2, 4]', expected: '[1, 2, 1, 0]' },
      { args: '[2, 2, 3]', expected: '[2, 1, 0]' },
      { args: '[5, 4, 3]', expected: '[0, 0, 0]' },
      { args: '[4]', expected: '[0]' },
      { args: '[]', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'ms-pop-while-fix',
    version: 1,
    title: 'Fix the monotonic stack that pops once',
    skills: ['algo-monotonic-stack', 'while-loops'],
    kind: 'fix',
    prompt: '`next_smaller(nums)` should give, for each item, the first later item that is strictly smaller, or -1. Several items are left at -1 when one small value should answer them all. Fix it.',
    signature: 'def next_smaller(nums: list[int]) -> list[int]',
    starter: py`
      def next_smaller(nums: list[int]) -> list[int]:
          out = [-1] * len(nums)
          stack = []
          for i, x in enumerate(nums):
              if stack and nums[stack[-1]] > x:
                  out[stack.pop()] = x
              stack.append(i)
          return out
    `,
    solution: py`
      def next_smaller(nums: list[int]) -> list[int]:
          out = [-1] * len(nums)
          stack = []
          for i, x in enumerate(nums):
              while stack and nums[stack[-1]] > x:
                  out[stack.pop()] = x
              stack.append(i)
          return out
    `,
    why: 'One new value can be the answer for many waiting indexes, so pop with `while` until the top is no longer bigger.',
    hints: ['Trace `[5, 6, 7, 1]`: how many indexes should the 1 answer?', 'Change the `if` to `while`.'],
    wrong: [
      // `>=` lets an equal value count as smaller.
      py`
        def next_smaller(nums: list[int]) -> list[int]:
            out = [-1] * len(nums)
            stack = []
            for i, x in enumerate(nums):
                while stack and nums[stack[-1]] >= x:
                    out[stack.pop()] = x
                stack.append(i)
            return out
      `,
    ],
    grading: { entry: 'next_smaller', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[5, 6, 7, 1]', expected: '[1, 1, 1, -1]' },
      { args: '[4, 5, 2, 10]', expected: '[2, 2, -1, -1]' },
      { args: '[3, 2, 1]', expected: '[2, 1, -1]' },
      { args: '[1, 2, 3]', expected: '[-1, -1, -1]' },
      { args: '[2, 2]', expected: '[-1, -1]' },
      { args: '[]', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'ms-price-spans',
    version: 1,
    title: 'Apply the monotonic stack: price spans',
    skills: ['algo-monotonic-stack', 'enumerate-zip'],
    kind: 'write',
    prompt: 'For each day `i`, return the span: how many consecutive days ending at `i` (including `i`) had a price `<= prices[i]`. Keep a stack of indexes with strictly greater prices.',
    signature: 'def price_spans(prices: list[int]) -> list[int]',
    starter: py`
      def price_spans(prices: list[int]) -> list[int]:
          return [1] * len(prices)
    `,
    solution: py`
      def price_spans(prices: list[int]) -> list[int]:
          out = []
          stack = []
          for i, p in enumerate(prices):
              while stack and prices[stack[-1]] <= p:
                  stack.pop()
              out.append(i - stack[-1] if stack else i + 1)
              stack.append(i)
          return out
    `,
    why: 'After popping every index with a price `<= p`, the top is the previous strictly higher day, so the span is the distance to it (or to the start).',
    hints: ['The span ends at the previous day with a *higher* price.', 'Pop while `prices[stack[-1]] <= p`; span is `i - stack[-1]`, or `i + 1` if the stack is empty.'],
    wrong: [
      // `<` stops at an equal price, so equal days do not extend the span.
      py`
        def price_spans(prices: list[int]) -> list[int]:
            out = []
            stack = []
            for i, p in enumerate(prices):
                while stack and prices[stack[-1]] < p:
                    stack.pop()
                out.append(i - stack[-1] if stack else i + 1)
                stack.append(i)
            return out
      `,
      // Counts only the run of days directly before, not the days they already covered.
      py`
        def price_spans(prices: list[int]) -> list[int]:
            out = []
            for i, p in enumerate(prices):
                span = 1
                if i > 0 and prices[i - 1] <= p:
                    span += 1
                out.append(span)
            return out
      `,
    ],
    grading: { entry: 'price_spans', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[7, 3, 4, 8]', expected: '[1, 1, 2, 4]' },
      { args: '[2, 6, 1, 1, 7]', expected: '[1, 2, 1, 2, 5]' },
      { args: '[5, 5, 5]', expected: '[1, 2, 3]' },
      { args: '[1, 2, 3]', expected: '[1, 2, 3]' },
      { args: '[3, 2, 1]', expected: '[1, 1, 1]' },
      { args: '[]', expected: '[]' },
    ],
    provenance: 'original',
  },
];
