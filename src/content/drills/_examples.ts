// Two complete skill drills that double as authoring templates (docs/AUTHORING.md, "Skill drills").
// Copy one, then change everything except the shape.
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const exampleDrills: SkillDrill[] = [
  // Template 1: "write it" — implement a short function.
  {
    id: 'evens-countdown',
    version: 1,
    title: 'Even numbers, counting down',
    skills: ['loops-range'],
    kind: 'write',
    prompt: 'Return the even numbers from `n` down to 0 (both ends included when even), largest first. Use `range` with a negative step. `n >= 0`.',
    signature: 'def evens_down(n: int) -> list[int]',
    starter: py`
      def evens_down(n: int) -> list[int]:
          return []
    `,
    solution: py`
      def evens_down(n: int) -> list[int]:
          return list(range(n - n % 2, -1, -2))
    `,
    why: '`range(start, stop, step)` stops before `stop`, so counting down to 0 inclusive needs `stop = -1`; `n - n % 2` rounds an odd start down to even.',
    hints: ['A negative step counts down: `range(10, 0, -2)`.', 'The stop value is excluded. Which stop includes 0?'],
    wrong: [
      // Stops before 0, and starts on an odd number for odd n.
      py`
        def evens_down(n: int) -> list[int]:
            return list(range(n, 0, -2))
      `,
      // Right numbers, wrong order.
      py`
        def evens_down(n: int) -> list[int]:
            return list(range(0, n + 1, 2))
      `,
    ],
    grading: { entry: 'evens_down', kind: 'function', compare: 'exact' },
    cases: [
      { args: '6', expected: '[6, 4, 2, 0]' },
      { args: '7', expected: '[6, 4, 2, 0]' },
      { args: '0', expected: '[0]' },
      { args: '1', expected: '[0]' },
      { args: '10', expected: '[10, 8, 6, 4, 2, 0]' },
    ],
    provenance: 'original',
  },
  // Template 2: "fix it" — the starter is the bug (here the [[0] * n] * n aliasing trap).
  {
    id: 'diagonal-grid-fix',
    version: 1,
    title: 'Fix the diagonal grid',
    skills: ['trap-mutability', 'grids-2d'],
    kind: 'fix',
    prompt: '`mark_diagonal(n)` should return an `n x n` grid of 0s with 1s on the main diagonal. It marks every row instead. Fix it.',
    signature: 'def mark_diagonal(n: int) -> list[list[int]]',
    starter: py`
      def mark_diagonal(n: int) -> list[list[int]]:
          grid = [[0] * n] * n
          for i in range(n):
              grid[i][i] = 1
          return grid
    `,
    solution: py`
      def mark_diagonal(n: int) -> list[list[int]]:
          grid = [[0] * n for _ in range(n)]
          for i in range(n):
              grid[i][i] = 1
          return grid
    `,
    why: '`[[0] * n] * n` repeats one row object n times, so writing to one row writes to all; a comprehension builds n separate rows.',
    hints: ['Print `grid[0] is grid[1]`.', 'Build each row separately: `[[0] * n for _ in range(n)]`.'],
    wrong: [
      // Separate rows, but the anti-diagonal.
      py`
        def mark_diagonal(n: int) -> list[list[int]]:
            grid = [[0] * n for _ in range(n)]
            for i in range(n):
                grid[i][n - 1 - i] = 1
            return grid
      `,
      // Copies the aliased grid's rows after marking: still all ones.
      py`
        def mark_diagonal(n: int) -> list[list[int]]:
            grid = [[0] * n] * n
            for i in range(n):
                grid[i][i] = 1
            return [row[:] for row in grid]
      `,
    ],
    grading: { entry: 'mark_diagonal', kind: 'function', compare: 'exact' },
    cases: [
      { args: '1', expected: '[[1]]' },
      { args: '2', expected: '[[1, 0], [0, 1]]' },
      { args: '3', expected: '[[1, 0, 0], [0, 1, 0], [0, 0, 1]]' },
      { args: '0', expected: '[]' },
    ],
    provenance: 'original',
  },
];
