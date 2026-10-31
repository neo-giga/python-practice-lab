// Writer B: greedy problems (original). See docs/AUTHORING.md.
import { py } from '../schema';
import type { CodingProblem } from '../problem-schema';

export const bGreedyProblems: CodingProblem[] = [
  {
    id: 'reach-final-checkpoint',
    version: 1,
    title: 'Can the courier reach the final checkpoint?',
    pattern: 'greedy',
    subPatterns: ['reach'],
    difficulty: 'medium',
    priority: 1,
    estMinutes: 20,
    statement: [
      'A courier moves along a row of checkpoints numbered from 0. At checkpoint `i` they can refuel for up to `boost[i]` checkpoints: from `i` they may move forward to any checkpoint from `i + 1` to `i + boost[i]`. A checkpoint with `boost[i] == 0` is a dead end unless they can skip over it from earlier.',
      'The courier starts at checkpoint 0. Return `True` if they can reach the last checkpoint, else `False`.',
    ].join('\n\n'),
    examples: [
      { input: '[2, 0, 3, 0, 0, 1]', output: 'True', explanation: 'From 0, jump to 2 (skipping the dead end at 1); from 2, jump 3 to the last checkpoint, 5.' },
      { input: '[1, 2, 0, 0, 4]', output: 'False', explanation: 'From 0 you reach 1, from 1 at most 3. Checkpoints 2 and 3 are dead ends, so 4 is out of reach.' },
    ],
    constraints: ['1 <= len(boost) <= 10**5', '0 <= boost[i] <= 10**5'],
    signature: 'def can_finish(boost: list[int]) -> bool',
    starter: py`
      def can_finish(boost: list[int]) -> bool:
          return True
    `,
    solution: py`
      def can_finish(boost: list[int]) -> bool:
          reach = 0  # furthest checkpoint reachable so far
          for i, b in enumerate(boost):
              if i > reach:
                  return False  # checkpoint i cannot be reached
              reach = max(reach, i + b)
          return True
    `,
    complexity: { time: 'O(n)', space: 'O(1)', note: 'n = len(boost).' },
    explanation: [
      'The reachable checkpoints always form a prefix `0..reach`: if you can reach `j`, you can reach everything before it on the way. So it is enough to track the furthest reachable checkpoint.',
      'Scan left to right. Every checkpoint `i <= reach` is reachable and can push `reach` to `i + boost[i]`. If the scan meets an `i > reach`, there is a gap nobody can jump over, and the last checkpoint is unreachable. There is no need to choose actual jumps, which is what makes the greedy safe.',
    ].join('\n\n'),
    hints: [
      'Do you need to know which jumps to make, or only how far you could possibly get?',
      'Track the furthest checkpoint reachable so far while scanning from left to right.',
      '`reach = 0`; for `i, b` in `enumerate(boost)`: if `i > reach` return False; `reach = max(reach, i + b)`. Return True.',
    ],
    idiomNote: '`for i, b in enumerate(boost)` reads index and value together, and `max(reach, i + b)` replaces an `if`. Returning `False` as soon as `i > reach` keeps the loop flat; Python\'s `for ... else` could express the same "finished without breaking" case, but an early `return` is clearer here.',
    wrong: [
      // Assumes any dead end blocks the courier.
      py`
        def can_finish(boost: list[int]) -> bool:
            return 0 not in boost[:-1]
      `,
      // Always takes the longest jump from where it stands.
      py`
        def can_finish(boost: list[int]) -> bool:
            i = 0
            last = len(boost) - 1
            while i < last:
                if boost[i] == 0:
                    return False
                i += boost[i]
            return True
      `,
      // Off by one: compares the reach with len(boost) instead of the last index.
      py`
        def can_finish(boost: list[int]) -> bool:
            reach = 0
            for i in range(len(boost)):
                if i > reach:
                    return False
                reach = max(reach, i + boost[i])
            return reach >= len(boost)
      `,
    ],
    grading: { entry: 'can_finish', kind: 'function', compare: 'exact', lcMethod: 'canFinish' },
    cases: [
      { args: '[2, 0, 3, 0, 0, 1]', expected: 'True' },
      { args: '[1, 2, 0, 0, 4]', expected: 'False' },
      { args: '[0]', expected: 'True' },
      { args: '[0, 1]', expected: 'False' },
      { args: '[5, 0, 0, 0]', expected: 'True' },
      { args: '[1, 1, 1, 1]', expected: 'True' },
      { args: '[2, 1, 1, 0, 7]', expected: 'False' },
      { args: '[2, 4, 0, 0, 1, 0]', expected: 'True' },
      { args: '[1] * 2999 + [0]', expected: 'True', label: '2 999 boosts of 1, then the last checkpoint' },
      { args: '[2999] + [0] * 3000', expected: 'False', label: 'One boost of 2 999, then 3 000 dead ends' },
    ],
    similarTo: { lc: 55, url: 'https://leetcode.com/problems/jump-game/' },
    recipeIds: ['range-enumerate'],
    provenance: 'original',
  },
];
