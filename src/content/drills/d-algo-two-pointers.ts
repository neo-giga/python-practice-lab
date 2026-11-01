// Writer D: two pointers template drills (algo-two-pointers).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoTwoPointersDrills: SkillDrill[] = [
  {
    id: 'tp-sorted-pair-sum',
    version: 1,
    title: 'Write two pointers: a pair with a given sum',
    skills: ['algo-two-pointers', 'while-loops'],
    kind: 'write',
    prompt: '`a` is sorted ascending. Return `[i, j]` with `i < j` and `a[i] + a[j] == target`, or `[]` if no pair exists (at most one pair does). Start one index at each end and move them inward.',
    signature: 'def pair_with_sum(a: list[int], target: int) -> list[int]',
    starter: py`
      def pair_with_sum(a: list[int], target: int) -> list[int]:
          return []
    `,
    solution: py`
      def pair_with_sum(a: list[int], target: int) -> list[int]:
          i, j = 0, len(a) - 1
          while i < j:
              s = a[i] + a[j]
              if s == target:
                  return [i, j]
              if s < target:
                  i += 1
              else:
                  j -= 1
          return []
    `,
    why: 'On sorted input a sum that is too small can only grow by moving `i` right, and one that is too big only shrinks by moving `j` left, so each step discards a whole row of pairs.',
    hints: ['`i, j = 0, len(a) - 1`.', 'Too small: `i += 1`. Too big: `j -= 1`. Stop when they meet.'],
    wrong: [
      // `<=` lets an item pair with itself.
      py`
        def pair_with_sum(a: list[int], target: int) -> list[int]:
            i, j = 0, len(a) - 1
            while i <= j:
                s = a[i] + a[j]
                if s == target:
                    return [i, j]
                if s < target:
                    i += 1
                else:
                    j -= 1
            return []
      `,
      // Moves the wrong pointer: a small sum shrinks further.
      py`
        def pair_with_sum(a: list[int], target: int) -> list[int]:
            i, j = 0, len(a) - 1
            while i < j:
                s = a[i] + a[j]
                if s == target:
                    return [i, j]
                if s < target:
                    j -= 1
                else:
                    i += 1
            return []
      `,
    ],
    grading: { entry: 'pair_with_sum', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 2, 4, 7, 11], 9', expected: '[1, 3]' },
      { args: '[1, 2, 4, 7, 11], 15', expected: '[2, 4]' },
      { args: '[1, 2, 4, 7, 11], 14', expected: '[]' },
      { args: '[-5, -1, 2, 4], -1', expected: '[0, 3]' },
      { args: '[3, 3], 6', expected: '[0, 1]' },
      { args: '[1, 2], 4', expected: '[]' },
      { args: '[], 1', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'tp-read-write-fix',
    version: 1,
    title: 'Fix the read/write compaction',
    skills: ['algo-two-pointers', 'indexing-len'],
    kind: 'fix',
    prompt: '`remove_value(a, val)` should move every item not equal to `val` to the front of `a`, in order, and return how many there are (`k`); only `a[:k]` is checked. It writes to the wrong slot. Fix it.',
    signature: 'def remove_value(a: list[int], val: int) -> int',
    starter: py`
      def remove_value(a: list[int], val: int) -> int:
          w = 0
          for r in range(len(a)):
              if a[r] != val:
                  w += 1
                  a[w] = a[r]
          return w
    `,
    solution: py`
      def remove_value(a: list[int], val: int) -> int:
          w = 0
          for r in range(len(a)):
              if a[r] != val:
                  a[w] = a[r]
                  w += 1
          return w
    `,
    why: '`w` is the next free slot: write first, then advance; advancing first skips slot 0 and can run past the end.',
    hints: ['What should `a[0]` be after the first kept item?', 'Swap the two lines inside the `if`.'],
    wrong: [
      // Right count, but the list itself is never changed.
      py`
        def remove_value(a: list[int], val: int) -> int:
            return len([x for x in a if x != val])
      `,
      // Keeps the items equal to val instead.
      py`
        def remove_value(a: list[int], val: int) -> int:
            w = 0
            for r in range(len(a)):
                if a[r] == val:
                    a[w] = a[r]
                    w += 1
            return w
      `,
    ],
    grading: { entry: 'remove_value', kind: 'function', compare: 'exact', check: 'return_k_prefix' },
    cases: [
      { args: '[3, 1, 3, 2], 3', expected: '[1, 2]' },
      { args: '[4, 4, 1, 4, 2], 4', expected: '[1, 2]' },
      { args: '[1, 2, 3], 9', expected: '[1, 2, 3]' },
      { args: '[5, 5], 5', expected: '[]' },
      { args: '[], 1', expected: '[]' },
      { args: '[7, 8, 7], 8', expected: '[7, 7]' },
    ],
    provenance: 'original',
  },
  {
    id: 'tp-palindrome-skip',
    version: 1,
    title: 'Write two pointers: palindrome, ignoring punctuation',
    skills: ['algo-two-pointers', 'strings'],
    kind: 'write',
    prompt: 'Return `True` if `s` reads the same both ways when you look only at letters and digits and ignore case. Walk two indexes inward, skipping other characters; do not build a cleaned copy.',
    signature: 'def is_palindrome(s: str) -> bool',
    starter: py`
      def is_palindrome(s: str) -> bool:
          return s == s[::-1]
    `,
    solution: py`
      def is_palindrome(s: str) -> bool:
          i, j = 0, len(s) - 1
          while i < j:
              if not s[i].isalnum():
                  i += 1
              elif not s[j].isalnum():
                  j -= 1
              elif s[i].lower() != s[j].lower():
                  return False
              else:
                  i, j = i + 1, j - 1
          return True
    `,
    why: 'Each step either skips one non-alphanumeric character or compares one pair, so the walk is O(n) with O(1) extra space.',
    hints: ['Skip with `str.isalnum()`; compare with `.lower()`.', 'Use an `if / elif` chain so each loop turn moves exactly one thing.'],
    wrong: [
      // Case-sensitive comparison.
      py`
        def is_palindrome(s: str) -> bool:
            i, j = 0, len(s) - 1
            while i < j:
                if not s[i].isalnum():
                    i += 1
                elif not s[j].isalnum():
                    j -= 1
                elif s[i] != s[j]:
                    return False
                else:
                    i, j = i + 1, j - 1
            return True
      `,
      // Never skips punctuation.
      py`
        def is_palindrome(s: str) -> bool:
            i, j = 0, len(s) - 1
            while i < j:
                if s[i].lower() != s[j].lower():
                    return False
                i, j = i + 1, j - 1
            return True
      `,
    ],
    grading: { entry: 'is_palindrome', kind: 'function', compare: 'exact' },
    cases: [
      { args: "'ab,BA'", expected: 'True' },
      { args: "'Rotor 8 rotor'", expected: 'True' },
      { args: "'a.'", expected: 'True' },
      { args: "''", expected: 'True' },
      { args: "'.,!'", expected: 'True' },
      { args: "'abc'", expected: 'False' },
      { args: "'1a2'", expected: 'False' },
    ],
    provenance: 'original',
  },
  {
    id: 'tp-merge-two-sorted',
    version: 1,
    title: 'Apply two pointers: merge two sorted lists',
    skills: ['algo-two-pointers', 'list-basics'],
    kind: 'write',
    prompt: '`a` and `b` are sorted ascending. Return one ascending list with all their items, in a single pass with one index per list (no `sort` or `sorted`).',
    signature: 'def merge_sorted(a: list[int], b: list[int]) -> list[int]',
    starter: py`
      def merge_sorted(a: list[int], b: list[int]) -> list[int]:
          return a + b
    `,
    solution: py`
      def merge_sorted(a: list[int], b: list[int]) -> list[int]:
          out = []
          i = j = 0
          while i < len(a) and j < len(b):
              if a[i] <= b[j]:
                  out.append(a[i])
                  i += 1
              else:
                  out.append(b[j])
                  j += 1
          out.extend(a[i:])
          out.extend(b[j:])
          return out
    `,
    why: 'Always take the smaller front item; when one list runs out, the rest of the other is already sorted and is appended as is.',
    hints: ['Loop while both indexes are in range.', 'After the loop, extend with `a[i:]` and `b[j:]`.'],
    wrong: [
      // Forgets the leftover tail of whichever list did not run out.
      py`
        def merge_sorted(a: list[int], b: list[int]) -> list[int]:
            out = []
            i = j = 0
            while i < len(a) and j < len(b):
                if a[i] <= b[j]:
                    out.append(a[i])
                    i += 1
                else:
                    out.append(b[j])
                    j += 1
            return out
      `,
      // Only appends a's leftovers.
      py`
        def merge_sorted(a: list[int], b: list[int]) -> list[int]:
            out = []
            i = j = 0
            while i < len(a) and j < len(b):
                if a[i] <= b[j]:
                    out.append(a[i])
                    i += 1
                else:
                    out.append(b[j])
                    j += 1
            return out + a[i:]
      `,
    ],
    grading: { entry: 'merge_sorted', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[1, 4, 9], [2, 3, 10]', expected: '[1, 2, 3, 4, 9, 10]' },
      { args: '[1, 1, 3], [1, 2]', expected: '[1, 1, 1, 2, 3]' },
      { args: '[1, 2], [7, 8]', expected: '[1, 2, 7, 8]' },
      { args: '[], [1, 2]', expected: '[1, 2]' },
      { args: '[5], []', expected: '[5]' },
      { args: '[], []', expected: '[]' },
    ],
    provenance: 'original',
  },
];
