import { py, type Exercise } from './schema';

const fn = (entry: string, extra: Partial<Exercise['grading']> = {}): Exercise['grading'] => ({
  entry,
  kind: 'function',
  compare: 'exact',
  ...extra,
});

export const syntaxExercises: Exercise[] = [
  // ------------------------------------------------------------------ types
  {
    id: 'first-present',
    version: 1,
    topicId: 'types',
    title: 'First value that is actually present',
    kind: 'repair',
    difficulty: 'warm-up',
    objective: 'Distinguish "missing" (None) from falsy-but-valid values such as 0 and "".',
    prompt: 'Return the first element of `values` that is not `None`. Values like `0`, `""` and `[]` are real answers and must be returned. Return `None` when every element is `None` or the list is empty.\n\nThe starter code has a truthiness bug. Fix it.',
    signature: 'def first_present(values: list) -> object',
    starter: py`
      def first_present(values: list) -> object:
          for v in values:
              if v:
                  return v
          return None
    `,
    solution: py`
      def first_present(values: list) -> object:
          for v in values:
              if v is not None:
                  return v
          return None
    `,
    explanation: '`if v:` is False for 0, "" and empty containers, so the loop skipped legitimate values. `is not None` tests for the one value that means "missing".',
    complexity: 'O(n) time, O(1) space.',
    hints: ['Which values make `if v:` false?', 'Compare with the singleton directly: `v is not None`.'],
    wrong: [py`
      def first_present(values: list) -> object:
          return next((v for v in values if v != None and v), None)
    `],
    grading: fn('first_present'),
    cases: [
      { args: '[None, 0, 5]', expected: '0' },
      { args: '[None, None]', expected: 'None' },
      { args: '["", "a"]', expected: '""' },
      { args: '[]', expected: 'None' },
      { args: '[None, [], [1]]', expected: '[]' },
    ],
    recipeIds: ['truthiness', 'none-identity'],
  },
  {
    id: 'classify-value',
    version: 1,
    topicId: 'types',
    title: 'Classify a value precisely',
    kind: 'implement',
    difficulty: 'core',
    objective: 'Use `is None`, `isinstance` and truthiness in the right order, remembering that bool is a subclass of int.',
    prompt: 'Return one label for `x`:\n\n- `"none"` if `x` is `None`\n- `"bool"` if `x` is `True` or `False`\n- `"zero"` if `x` is a number equal to zero (`0` or `0.0`)\n- `"empty"` if `x` is an empty string, list, dict, set or tuple\n- `"value"` for anything else.',
    signature: 'def classify(x: object) -> str',
    starter: py`
      def classify(x: object) -> str:
          # Order matters: which checks must come first?
          pass
    `,
    solution: py`
      def classify(x: object) -> str:
          if x is None:
              return "none"
          if isinstance(x, bool):
              return "bool"
          if isinstance(x, (int, float)):
              return "zero" if x == 0 else "value"
          if isinstance(x, (str, list, dict, set, tuple)) and not x:
              return "empty"
          return "value"
    `,
    explanation: 'The bool check must come before the number check because `isinstance(False, int)` is True and `False == 0`. Only after handling numbers is `not x` a safe emptiness test.',
    complexity: 'O(1).',
    hints: ['`isinstance(True, int)` is True.', 'Check None, then bool, then numbers, then empty containers.'],
    wrong: [
      py`
        def classify(x: object) -> str:
            if x is None:
                return "none"
            if x == 0:
                return "zero"
            if isinstance(x, bool):
                return "bool"
            if not x:
                return "empty"
            return "value"
      `,
      py`
        def classify(x: object) -> str:
            if not x:
                return "empty"
            return "value"
      `,
    ],
    grading: fn('classify'),
    cases: [
      { args: 'None', expected: '"none"' },
      { args: 'False', expected: '"bool"' },
      { args: 'True', expected: '"bool"' },
      { args: '0', expected: '"zero"' },
      { args: '0.0', expected: '"zero"' },
      { args: '[]', expected: '"empty"' },
      { args: '""', expected: '"empty"' },
      { args: '-3', expected: '"value"' },
      { args: '[0]', expected: '"value"' },
    ],
    recipeIds: ['truthiness', 'none-identity'],
  },
  // ---------------------------------------------------------------- numbers
  {
    id: 'divide-toward-zero',
    version: 1,
    topicId: 'numbers',
    title: 'Divide toward zero without floats',
    kind: 'implement',
    difficulty: 'core',
    objective: 'Know how `//` rounds and avoid float precision loss with big integers.',
    prompt: 'Return `a / b` truncated toward zero, as C or Java would compute it, for any integers with `b != 0`. Do not use floats: the inputs may be far larger than 2**53.',
    signature: 'def divide_toward_zero(a: int, b: int) -> int',
    starter: py`
      def divide_toward_zero(a: int, b: int) -> int:
          return a // b
    `,
    solution: py`
      def divide_toward_zero(a: int, b: int) -> int:
          q = abs(a) // abs(b)
          return q if (a < 0) == (b < 0) else -q
    `,
    explanation: 'Divide the magnitudes with `//` (exact for non-negative ints), then apply the sign. `a // b` floors, which differs for negative results; `int(a / b)` passes through a 53-bit float.',
    complexity: 'O(1) for fixed-size values; for d-digit big ints, division costs more than linear in d.',
    hints: ['What is `-7 // 2`? What should the answer be?', 'Work with `abs(a) // abs(b)` and fix the sign afterwards.'],
    wrong: [py`
      def divide_toward_zero(a: int, b: int) -> int:
          return int(a / b)
    `],
    grading: fn('divide_toward_zero'),
    cases: [
      { args: '7, 2', expected: '3' },
      { args: '-7, 2', expected: '-3' },
      { args: '7, -2', expected: '-3' },
      { args: '-8, -2', expected: '4' },
      { args: '0, 5', expected: '0' },
      { args: '-(10**18 + 1), 1', expected: '-(10**18 + 1)' },
    ],
    recipeIds: ['floor-div-mod', 'truncating-division'],
  },
  {
    id: 'digit-sum',
    version: 1,
    topicId: 'numbers',
    title: 'Digit sum with divmod',
    kind: 'idiom',
    difficulty: 'warm-up',
    objective: 'Peel digits with `divmod(n, 10)` and handle negative input.',
    prompt: 'Return the sum of the decimal digits of `n`, ignoring its sign. `digit_sum(-907)` is 16.',
    signature: 'def digit_sum(n: int) -> int',
    starter: py`
      def digit_sum(n: int) -> int:
          total = 0
          # take digits off the end with divmod
          return total
    `,
    solution: py`
      def digit_sum(n: int) -> int:
          n = abs(n)
          total = 0
          while n:
              n, digit = divmod(n, 10)
              total += digit
          return total
    `,
    explanation: '`divmod(n, 10)` returns the remaining number and the last digit in one step. Taking `abs` first matters: with a negative n, `%` returns a positive remainder and `//` floors, so the loop would never reach 0.',
    complexity: 'O(number of digits).',
    hints: ['`divmod(1234, 10)` is `(123, 4)`.', 'Make n non-negative before looping.'],
    wrong: [py`
      def digit_sum(n: int) -> int:
          return sum(int(c) for c in str(n))
    `],
    grading: fn('digit_sum'),
    cases: [
      { args: '1234', expected: '10' },
      { args: '0', expected: '0' },
      { args: '-907', expected: '16' },
      { args: '10**30 + 5', expected: '6' },
    ],
    recipeIds: ['floor-div-mod', 'big-ints-inf'],
  },
  // ---------------------------------------------------------------- strings
  {
    id: 'clean-palindrome',
    version: 1,
    topicId: 'strings',
    title: 'Palindrome after cleaning',
    kind: 'implement',
    difficulty: 'warm-up',
    objective: 'Filter characters with `str.isalnum`, normalise case and compare with a reversed slice.',
    prompt: 'Return `True` if `s` reads the same forwards and backwards after removing every character that is not a letter or digit and ignoring case.',
    signature: 'def is_clean_palindrome(s: str) -> bool',
    starter: py`
      def is_clean_palindrome(s: str) -> bool:
          return s == s[::-1]
    `,
    solution: py`
      def is_clean_palindrome(s: str) -> bool:
          cleaned = [c.lower() for c in s if c.isalnum()]
          return cleaned == cleaned[::-1]
    `,
    explanation: 'Build the cleaned sequence once and compare it with its reverse. A two-pointer scan does the same in O(1) extra space.',
    complexity: 'O(n) time, O(n) space (O(1) with two pointers).',
    hints: ['`c.isalnum()` keeps letters and digits.', 'Lower-case before comparing.'],
    wrong: [py`
      def is_clean_palindrome(s: str) -> bool:
          t = s.lower().replace(" ", "")
          return t == t[::-1]
    `],
    grading: fn('is_clean_palindrome'),
    cases: [
      { args: '"Never odd, or even."', expected: 'True' },
      { args: '"top spots"', expected: 'False' },
      { args: '""', expected: 'True' },
      { args: '"0P"', expected: 'False' },
      { args: '"Abc, CBA!"', expected: 'True' },
    ],
    recipeIds: ['string-slicing', 'ord-chr'],
  },
  {
    id: 'run-length',
    version: 1,
    topicId: 'strings',
    title: 'Run-length encode',
    kind: 'implement',
    difficulty: 'core',
    objective: 'Scan runs with an index and build the result with `"".join`.',
    prompt: 'Encode each run of identical characters as the character followed by the run length: `"aaabcc"` becomes `"a3b1c2"`. The empty string encodes to `""`. Runs can be longer than 9.',
    signature: 'def run_length(s: str) -> str',
    starter: py`
      def run_length(s: str) -> str:
          parts = []
          return "".join(parts)
    `,
    solution: py`
      def run_length(s: str) -> str:
          parts = []
          i = 0
          while i < len(s):
              j = i
              while j < len(s) and s[j] == s[i]:
                  j += 1
              parts.append(f"{s[i]}{j - i}")
              i = j
          return "".join(parts)
    `,
    explanation: 'Each inner loop consumes one run, so the total work is linear. `itertools.groupby(s)` is an equally good one-liner: `"".join(f"{k}{len(list(g))}" for k, g in groupby(s))`.',
    complexity: 'O(n) time and output size.',
    hints: ['Find where the current run ends, then jump there.', '`itertools.groupby` groups consecutive equal items.'],
    wrong: [py`
      from collections import Counter
      def run_length(s: str) -> str:
          return "".join(f"{c}{n}" for c, n in Counter(s).items())
    `],
    grading: fn('run_length'),
    cases: [
      { args: '"aaabcc"', expected: '"a3b1c2"' },
      { args: '""', expected: '""' },
      { args: '"abab"', expected: '"a1b1a1b1"' },
      { args: '"z" * 12', expected: '"z12"' },
    ],
    recipeIds: ['string-building', 'split-join'],
  },
  {
    id: 'reverse-words',
    version: 1,
    topicId: 'strings',
    title: 'Reverse the words',
    kind: 'idiom',
    difficulty: 'warm-up',
    objective: 'Use `split()` without arguments to drop extra whitespace, then `join`.',
    prompt: 'Return the words of `s` in reverse order, separated by single spaces, with no leading or trailing spaces.',
    signature: 'def reverse_words(s: str) -> str',
    starter: py`
      def reverse_words(s: str) -> str:
          return " ".join(s.split(" ")[::-1])
    `,
    solution: py`
      def reverse_words(s: str) -> str:
          return " ".join(reversed(s.split()))
    `,
    explanation: '`split(" ")` keeps empty strings between repeated spaces; `split()` splits on runs of whitespace and discards empties.',
    complexity: 'O(n).',
    hints: ['Compare `"a  b".split(" ")` with `"a  b".split()`.'],
    wrong: [py`
      def reverse_words(s: str) -> str:
          return s[::-1]
    `],
    grading: fn('reverse_words'),
    cases: [
      { args: '"python is fun to learn"', expected: '"learn to fun is python"' },
      { args: '"  hello   world  "', expected: '"world hello"' },
      { args: '"one"', expected: '"one"' },
    ],
    recipeIds: ['split-join'],
  },
  // ------------------------------------------------------------------ lists
  {
    id: 'diagonal-grid',
    version: 1,
    topicId: 'lists',
    title: 'Fix the aliased grid',
    kind: 'repair',
    difficulty: 'warm-up',
    objective: 'Build 2-D lists whose rows are independent objects.',
    prompt: 'Return an `n × n` grid of 0s with 1s on the main diagonal. The starter code looks right but every row is the same list object. Fix it.',
    signature: 'def diagonal_grid(n: int) -> list[list[int]]',
    starter: py`
      def diagonal_grid(n: int) -> list[list[int]]:
          grid = [[0] * n] * n
          for i in range(n):
              grid[i][i] = 1
          return grid
    `,
    solution: py`
      def diagonal_grid(n: int) -> list[list[int]]:
          grid = [[0] * n for _ in range(n)]
          for i in range(n):
              grid[i][i] = 1
          return grid
    `,
    explanation: '`[row] * n` repeats a reference to one row. The comprehension evaluates `[0] * n` once per row, creating n separate lists.',
    complexity: 'O(n²) time and space.',
    hints: ['After `grid[0][0] = 1`, print the grid. What changed?', 'Create each row inside a comprehension.'],
    wrong: [py`
      def diagonal_grid(n: int) -> list[list[int]]:
          row = [0] * n
          grid = [row for _ in range(n)]
          for i in range(n):
              grid[i][i] = 1
          return grid
    `],
    grading: fn('diagonal_grid'),
    cases: [
      { args: '1', expected: '[[1]]' },
      { args: '2', expected: '[[1, 0], [0, 1]]' },
      { args: '3', expected: '[[1, 0, 0], [0, 1, 0], [0, 0, 1]]' },
      { args: '0', expected: '[]' },
    ],
    recipeIds: ['aliasing-copies'],
  },
  {
    id: 'rotate-in-place',
    version: 1,
    topicId: 'lists',
    title: 'Rotate a list in place',
    kind: 'repair',
    difficulty: 'core',
    objective: 'Tell rebinding a name apart from mutating the object the caller holds.',
    prompt: 'Rotate `nums` to the right by `k` steps **in place** and return `None`. `k` may be larger than the list length. The starter builds the right list but the caller never sees it. Fix it.',
    signature: 'def rotate(nums: list[int], k: int) -> None',
    starter: py`
      def rotate(nums: list[int], k: int) -> None:
          k %= len(nums)
          nums = nums[-k:] + nums[:-k]
    `,
    solution: py`
      def rotate(nums: list[int], k: int) -> None:
          if not nums:
              return
          k %= len(nums)
          nums[:] = nums[-k:] + nums[:-k]
    `,
    explanation: '`nums = ...` rebinds the local name only. Slice assignment `nums[:] = ...` replaces the contents of the caller\'s list. Guard the empty list before taking `% len(nums)`. Note that `nums[-0:]` is the whole list, so k == 0 still works.',
    complexity: 'O(n) time, O(n) extra space (O(1) with the three-reversal trick).',
    hints: ['The grader checks the list you were given, after the call.', 'Slice assignment mutates: `nums[:] = ...`.'],
    wrong: [py`
      def rotate(nums: list[int], k: int) -> None:
          for _ in range(k):
              nums.insert(0, nums.pop())
          return nums
    `],
    grading: fn('rotate', { check: 'mutated_arg0' }),
    comparison: 'The function must return None; the grader then compares the mutated first argument.',
    cases: [
      { args: '[1, 2, 3, 4, 5], 2', expected: '[4, 5, 1, 2, 3]' },
      { args: '[1, 2], 5', expected: '[2, 1]' },
      { args: '[7], 0', expected: '[7]' },
      { args: '[], 3', expected: '[]' },
      { args: '[1, 2, 3], 3', expected: '[1, 2, 3]' },
    ],
    recipeIds: ['inplace-none', 'aliasing-copies', 'list-basics'],
  },
  // ----------------------------------------------------------------- tuples
  {
    id: 'parse-record',
    version: 1,
    topicId: 'tuples',
    title: 'Parse a record with star-unpacking',
    kind: 'idiom',
    difficulty: 'warm-up',
    objective: 'Unpack a variable-length sequence into fixed fields plus a rest list and return a tuple.',
    prompt: 'A line holds a name, an age and zero or more hobbies, separated by spaces. Return a tuple `(name, age, hobbies)` where `age` is an `int` and `hobbies` is a list of strings.',
    signature: 'def parse_record(line: str) -> tuple[str, int, list[str]]',
    starter: py`
      def parse_record(line: str) -> tuple[str, int, list[str]]:
          parts = line.split()
          return [parts[0], parts[1], parts[2:]]
    `,
    solution: py`
      def parse_record(line: str) -> tuple[str, int, list[str]]:
          name, age, *hobbies = line.split()
          return name, int(age), hobbies
    `,
    explanation: 'Star-unpacking names every field in one line and always gives a list for the rest. Returning `a, b, c` builds a tuple; a list would fail the type-strict comparison.',
    complexity: 'O(n).',
    hints: ['`first, second, *rest = items`', 'Convert the age with `int()`.'],
    wrong: [py`
      def parse_record(line: str) -> tuple[str, int, list[str]]:
          name, age, *hobbies = line.split()
          return name, age, hobbies
    `],
    grading: fn('parse_record'),
    cases: [
      { args: '"ana 31 chess go"', expected: '("ana", 31, ["chess", "go"])' },
      { args: '"bo 7"', expected: '("bo", 7, [])' },
      { args: '"  cy   40 run "', expected: '("cy", 40, ["run"])' },
    ],
    recipeIds: ['unpacking', 'multiple-returns'],
  },
  {
    id: 'unique-points',
    version: 1,
    topicId: 'tuples',
    title: 'Count unique points',
    kind: 'repair',
    difficulty: 'warm-up',
    objective: 'Convert unhashable lists to tuples before using a set.',
    prompt: 'Points arrive as `[x, y]` lists. Return how many distinct points there are. The starter crashes; fix it.',
    signature: 'def count_unique_points(points: list[list[int]]) -> int',
    starter: py`
      def count_unique_points(points: list[list[int]]) -> int:
          return len(set(points))
    `,
    solution: py`
      def count_unique_points(points: list[list[int]]) -> int:
          return len({tuple(p) for p in points})
    `,
    explanation: 'Lists are mutable and therefore unhashable. Tuples of ints are hashable and compare by value.',
    complexity: 'O(n) average.',
    hints: ['What error does the starter raise?', '`tuple([1, 2])` is `(1, 2)`.'],
    wrong: [py`
      def count_unique_points(points: list[list[int]]) -> int:
          return len({p[0] for p in points})
    `],
    grading: fn('count_unique_points'),
    cases: [
      { args: '[[1, 2], [2, 1], [1, 2]]', expected: '2' },
      { args: '[]', expected: '0' },
      { args: '[[0, 0], [0, 1], [0, 2]]', expected: '3' },
    ],
    recipeIds: ['tuple-hashable', 'set-ops'],
  },
  // ------------------------------------------------------------- dicts-sets
  {
    id: 'two-sum-indexes',
    version: 1,
    topicId: 'dicts-sets',
    title: 'Pair indexes with a value index',
    kind: 'pattern',
    difficulty: 'core',
    objective: 'Trade a pass of O(n²) pair checks for one pass with a dict of seen values.',
    prompt: 'Return the indexes `[i, j]` with `i < j` of the two numbers in `nums` that add up to `target`. Exactly one such pair exists. Each index may be used once.',
    signature: 'def pair_indexes(nums: list[int], target: int) -> list[int]',
    starter: py`
      def pair_indexes(nums: list[int], target: int) -> list[int]:
          seen = {}  # value -> index
          return []
    `,
    solution: py`
      def pair_indexes(nums: list[int], target: int) -> list[int]:
          seen = {}
          for j, x in enumerate(nums):
              if target - x in seen:
                  return [seen[target - x], j]
              seen[x] = j
          return []
    `,
    explanation: 'For each number, the partner it needs is `target - x`. Looking it up before inserting `x` prevents pairing an element with itself, and the earlier index comes first.',
    complexity: 'O(n) average time, O(n) space.',
    hints: ['For each `x`, what value would complete the pair?', 'Check the dict before you insert the current value.'],
    wrong: [py`
      def pair_indexes(nums: list[int], target: int) -> list[int]:
          seen = {x: i for i, x in enumerate(nums)}
          for i, x in enumerate(nums):
              if target - x in seen:
                  return [i, seen[target - x]]
          return []
    `],
    grading: fn('pair_indexes'),
    cases: [
      { args: '[4, 11, 7, 2], 9', expected: '[2, 3]' },
      { args: '[5, 1, 3], 4', expected: '[1, 2]' },
      { args: '[3, 5, 1], 6', expected: '[1, 2]' },
      { args: '[3, 3], 6', expected: '[0, 1]' },
      { args: '[-1, 5, -4, 8], 4', expected: '[0, 1]' },
    ],
    recipeIds: ['dict-access', 'range-enumerate'],
  },
  {
    id: 'invert-mapping',
    version: 1,
    topicId: 'dicts-sets',
    title: 'Invert a mapping into groups',
    kind: 'idiom',
    difficulty: 'warm-up',
    objective: 'Group keys by value with `setdefault` or `defaultdict`, relying on insertion order.',
    prompt: 'Given a dict from person to team, return a dict from team to the list of people on it. Teams appear in the order they are first seen; people keep their original order.',
    signature: 'def invert(assignments: dict[str, str]) -> dict[str, list[str]]',
    starter: py`
      def invert(assignments: dict[str, str]) -> dict[str, list[str]]:
          teams = {}
          for person, team in assignments.items():
              teams[team] = [person]
          return teams
    `,
    solution: py`
      def invert(assignments: dict[str, str]) -> dict[str, list[str]]:
          teams = {}
          for person, team in assignments.items():
              teams.setdefault(team, []).append(person)
          return teams
    `,
    explanation: '`setdefault` returns the existing list or inserts a new one, so each person is appended to the right group. Returning a `defaultdict` would also compare equal, but the type-strict grader asks for a plain dict; wrap with `dict(...)`.',
    complexity: 'O(n).',
    hints: ['The starter overwrites the list for repeated teams.', '`d.setdefault(key, []).append(x)`'],
    wrong: [py`
      from collections import defaultdict
      def invert(assignments: dict[str, str]) -> dict[str, list[str]]:
          teams = defaultdict(list)
          for person, team in assignments.items():
              teams[team].append(person)
          return teams
    `],
    grading: fn('invert'),
    comparison: 'Type-strict: a defaultdict is not accepted where a dict is required.',
    cases: [
      { args: '{"ana": "red", "bo": "blue", "cy": "red"}', expected: '{"red": ["ana", "cy"], "blue": ["bo"]}' },
      { args: '{}', expected: '{}' },
      { args: '{"x": "t"}', expected: '{"t": ["x"]}' },
    ],
    recipeIds: ['dict-access', 'defaultdict', 'dict-iteration'],
  },
  {
    id: 'first-repeat',
    version: 1,
    topicId: 'dicts-sets',
    title: 'First repeated character',
    kind: 'implement',
    difficulty: 'warm-up',
    objective: 'Use a set for O(1) membership while scanning once.',
    prompt: 'Return the first character in `s` that appears a second time (the character whose second occurrence comes earliest). Return `None` if no character repeats.',
    signature: 'def first_repeat(s: str) -> str | None',
    starter: py`
      def first_repeat(s: str):
          pass
    `,
    solution: py`
      def first_repeat(s: str):
          seen = set()
          for ch in s:
              if ch in seen:
                  return ch
              seen.add(ch)
          return None
    `,
    explanation: 'The first character found already in `seen` is the one whose second occurrence is earliest.',
    complexity: 'O(n) time, O(alphabet) space.',
    hints: ['Track what you have seen so far.'],
    wrong: [py`
      from collections import Counter
      def first_repeat(s: str):
          for ch, n in Counter(s).items():
              if n > 1:
                  return ch
          return None
    `],
    grading: fn('first_repeat'),
    cases: [
      { args: '"abcbad"', expected: '"b"' },
      { args: '"abca"', expected: '"a"' },
      { args: '"xyz"', expected: 'None' },
      { args: '""', expected: 'None' },
    ],
    recipeIds: ['set-ops'],
  },
  // ------------------------------------------------------------------ loops
  {
    id: 'adjacent-gaps',
    version: 1,
    topicId: 'loops',
    title: 'Gaps between neighbours',
    kind: 'idiom',
    difficulty: 'warm-up',
    objective: 'Pair each element with its successor using `zip(a, a[1:])` or `itertools.pairwise`.',
    prompt: 'Return the list of differences `nums[i + 1] - nums[i]`. A list with fewer than two elements has no gaps.',
    signature: 'def gaps(nums: list[int]) -> list[int]',
    starter: py`
      def gaps(nums: list[int]) -> list[int]:
          return [nums[i + 1] - nums[i] for i in range(len(nums))]
    `,
    solution: py`
      def gaps(nums: list[int]) -> list[int]:
          return [b - a for a, b in zip(nums, nums[1:])]
    `,
    explanation: '`zip` stops at the shorter input, so the off-by-one disappears. `itertools.pairwise(nums)` (3.10+) avoids the slice copy.',
    complexity: 'O(n).',
    hints: ['The starter reads one element past the end.', '`zip(nums, nums[1:])` yields neighbour pairs.'],
    wrong: [py`
      def gaps(nums: list[int]) -> list[int]:
          return [nums[i] - nums[i - 1] for i in range(len(nums))]
    `],
    grading: fn('gaps'),
    cases: [
      { args: '[1, 4, 9, 16]', expected: '[3, 5, 7]' },
      { args: '[5]', expected: '[]' },
      { args: '[]', expected: '[]' },
      { args: '[3, 1]', expected: '[-2]' },
    ],
    recipeIds: ['zip-pairs', 'itertools-core'],
  },
  {
    id: 'transpose',
    version: 1,
    topicId: 'loops',
    title: 'Transpose a matrix',
    kind: 'idiom',
    difficulty: 'warm-up',
    objective: 'Use `zip(*rows)` and remember it yields tuples.',
    prompt: 'Return the transpose of a rectangular matrix as a list of lists. The transpose of `[]` is `[]`.',
    signature: 'def transpose(matrix: list[list[int]]) -> list[list[int]]',
    starter: py`
      def transpose(matrix: list[list[int]]) -> list[list[int]]:
          return list(zip(*matrix))
    `,
    solution: py`
      def transpose(matrix: list[list[int]]) -> list[list[int]]:
          return [list(col) for col in zip(*matrix)]
    `,
    explanation: '`zip(*matrix)` passes each row as a separate argument, so it walks the columns. It yields tuples; the contract asks for lists.',
    complexity: 'O(rows × cols).',
    hints: ['What type are the items that `zip` produces?'],
    wrong: [py`
      def transpose(matrix: list[list[int]]) -> list[list[int]]:
          return [row[::-1] for row in matrix]
    `],
    grading: fn('transpose'),
    comparison: 'Type-strict: rows must be lists, not tuples.',
    cases: [
      { args: '[[1, 2, 3], [4, 5, 6]]', expected: '[[1, 4], [2, 5], [3, 6]]' },
      { args: '[[7]]', expected: '[[7]]' },
      { args: '[]', expected: '[]' },
    ],
    recipeIds: ['zip-pairs'],
  },
  // --------------------------------------------------------- comprehensions
  {
    id: 'even-squares',
    version: 1,
    topicId: 'comprehensions',
    title: 'Flatten and filter in one comprehension',
    kind: 'idiom',
    difficulty: 'warm-up',
    objective: 'Write a nested comprehension with a filter in the right order.',
    prompt: 'Given a grid of ints, return the squares of the even values, reading row by row, left to right.',
    signature: 'def even_squares(grid: list[list[int]]) -> list[int]',
    starter: py`
      def even_squares(grid: list[list[int]]) -> list[int]:
          return []
    `,
    solution: py`
      def even_squares(grid: list[list[int]]) -> list[int]:
          return [x * x for row in grid for x in row if x % 2 == 0]
    `,
    explanation: 'The `for` clauses appear in the same order as nested loops would; the filter comes last.',
    complexity: 'O(cells).',
    hints: ['`[f(x) for row in grid for x in row if cond]`'],
    wrong: [py`
      def even_squares(grid: list[list[int]]) -> list[int]:
          return [x * x for row in grid for x in row if x % 2]
    `],
    grading: fn('even_squares'),
    cases: [
      { args: '[[1, 2], [3, 4]]', expected: '[4, 16]' },
      { args: '[[], [6]]', expected: '[36]' },
      { args: '[[-2, 0, 5]]', expected: '[4, 0]' },
    ],
    recipeIds: ['comprehensions'],
  },
  {
    id: 'one-pass-stats',
    version: 1,
    topicId: 'comprehensions',
    title: 'Statistics from a one-shot iterator',
    kind: 'repair',
    difficulty: 'core',
    objective: 'Remember that iterators are consumed by the first pass.',
    prompt: 'Return `(smallest, largest, count)` for the numbers produced by `values`, which may be a generator (single use). For an empty input return `(None, None, 0)`. The starter only works for lists; fix it.',
    signature: 'def stats(values) -> tuple',
    starter: py`
      def stats(values) -> tuple:
          return (min(values), max(values), len(list(values)))
    `,
    solution: py`
      def stats(values) -> tuple:
          items = list(values)
          if not items:
              return (None, None, 0)
          return (min(items), max(items), len(items))
    `,
    explanation: 'After `min` consumes the generator, `max` sees nothing and raises ValueError. Materialise once (or track all three in a single loop for O(1) memory).',
    complexity: 'O(n).',
    hints: ['Call `min` twice on the same generator and see what happens.', 'Turn the input into a list exactly once.'],
    wrong: [py`
      def stats(values) -> tuple:
          return (min(values, default=None), max(values, default=None), sum(1 for _ in values))
    `],
    grading: fn('stats'),
    cases: [
      { args: 'iter([3, 1, 2])', expected: '(1, 3, 3)' },
      { args: '(x * x for x in range(4))', expected: '(0, 9, 4)' },
      { args: 'iter([])', expected: '(None, None, 0)' },
      { args: '[5]', expected: '(5, 5, 1)' },
    ],
    recipeIds: ['iterator-exhaustion', 'generators'],
  },
  // -------------------------------------------------------------- functions
  {
    id: 'mutable-default-fix',
    version: 1,
    topicId: 'functions',
    title: 'Fix the shared default list',
    kind: 'repair',
    difficulty: 'warm-up',
    objective: 'Use `None` as the default for mutable parameters.',
    prompt: '`add_tag(tag, tags)` appends `tag` to `tags` and returns the list. When `tags` is omitted it should start from a new empty list on every call. The grader calls your function several times in one program.',
    signature: 'def add_tag(tag: str, tags: list[str] | None = None) -> list[str]',
    starter: py`
      def add_tag(tag, tags=[]):
          tags.append(tag)
          return tags
    `,
    solution: py`
      def add_tag(tag, tags=None):
          if tags is None:
              tags = []
          tags.append(tag)
          return tags
    `,
    explanation: 'Defaults are evaluated once at definition time. With `None` as the sentinel, each call that omits `tags` creates its own list.',
    complexity: 'O(1) per call.',
    hints: ['When is `[]` in the def line evaluated?', 'Default to `None` and create the list inside.'],
    wrong: [py`
      _shared = []
      def add_tag(tag, tags=_shared):
          tags.append(tag)
          return list(tags)
    `],
    grading: { entry: 'add_tag', kind: 'calls', compare: 'exact' },
    comparison: 'Each case is a sequence of calls in the same program; the list of return values is compared.',
    cases: [
      { args: '[("a",), ("b",)]', expected: '[["a"], ["b"]]' },
      { args: '[("x",), ("y", ["w"]), ("z",)]', expected: '[["x"], ["w", "y"], ["z"]]' },
      { args: '[("only",)]', expected: '[["only"]]' },
    ],
    recipeIds: ['mutable-default'],
  },
  {
    id: 'running-totals',
    version: 1,
    topicId: 'functions',
    title: 'Running totals with a nested helper',
    kind: 'repair',
    difficulty: 'core',
    objective: 'Rebind an enclosing variable from a nested function with `nonlocal`.',
    prompt: 'Return the running totals of `nums`: `[1, 2, 3]` gives `[1, 3, 6]`. Keep the nested `add` helper; fix the scope error.',
    signature: 'def running_totals(nums: list[int]) -> list[int]',
    starter: py`
      def running_totals(nums: list[int]) -> list[int]:
          total = 0
          out = []
          def add(x):
              total += x
              out.append(total)
          for x in nums:
              add(x)
          return out
    `,
    solution: py`
      def running_totals(nums: list[int]) -> list[int]:
          total = 0
          out = []
          def add(x):
              nonlocal total
              total += x
              out.append(total)
          for x in nums:
              add(x)
          return out
    `,
    explanation: 'Assigning to `total` inside `add` makes it local to `add`, so `total += x` reads an unassigned local (UnboundLocalError). `nonlocal total` binds it to the enclosing function. `out.append` needs nothing: it mutates, it does not rebind.',
    complexity: 'O(n).',
    hints: ['Run it: which error appears, and on which line?', 'Declare `nonlocal total` inside `add`.'],
    wrong: [py`
      def running_totals(nums: list[int]) -> list[int]:
          out = []
          def add(x):
              total = 0
              total += x
              out.append(total)
          for x in nums:
              add(x)
          return out
    `],
    grading: fn('running_totals'),
    cases: [
      { args: '[1, 2, 3]', expected: '[1, 3, 6]' },
      { args: '[]', expected: '[]' },
      { args: '[5, -5, 2]', expected: '[5, 0, 2]' },
    ],
    recipeIds: ['closures-nonlocal'],
  },
  // ---------------------------------------------------------------- classes
  {
    id: 'min-stack',
    version: 1,
    topicId: 'classes',
    title: 'Stack with constant-time minimum',
    kind: 'implement',
    difficulty: 'core',
    objective: 'Write a small class and keep an auxiliary stack of minimums.',
    prompt: 'Implement `MinStack` with `push(x)`, `pop()` (returns the removed value), `top()` and `get_min()`. Every method is O(1). `pop`, `top` and `get_min` are only called on a non-empty stack.\n\nEach test case lists the operations: the first is the constructor, and the expected list holds each call\'s return value.',
    signature: 'class MinStack: push(x) -> None, pop() -> int, top() -> int, get_min() -> int',
    starter: py`
      class MinStack:
          def __init__(self):
              pass

          def push(self, x: int) -> None:
              pass

          def pop(self) -> int:
              pass

          def top(self) -> int:
              pass

          def get_min(self) -> int:
              pass
    `,
    solution: py`
      class MinStack:
          def __init__(self):
              self.items = []
              self.mins = []

          def push(self, x: int) -> None:
              self.items.append(x)
              self.mins.append(x if not self.mins else min(x, self.mins[-1]))

          def pop(self) -> int:
              self.mins.pop()
              return self.items.pop()

          def top(self) -> int:
              return self.items[-1]

          def get_min(self) -> int:
              return self.mins[-1]
    `,
    explanation: '`mins[i]` stores the minimum of `items[:i + 1]`, so popping both stacks together keeps the minimum correct after removals.',
    complexity: 'O(1) per operation, O(n) space.',
    hints: ['What was the minimum before the latest push?', 'Keep a second list of "minimum so far".'],
    wrong: [py`
      class MinStack:
          def __init__(self):
              self.items = []
              self.low = None
          def push(self, x):
              self.items.append(x)
              self.low = x if self.low is None else min(self.low, x)
          def pop(self):
              return self.items.pop()
          def top(self):
              return self.items[-1]
          def get_min(self):
              return self.low
    `],
    grading: { entry: 'MinStack', kind: 'ops', compare: 'exact' },
    cases: [
      {
        args: '["MinStack", "push", "push", "push", "get_min", "pop", "top", "get_min"], [[], [4], [7], [2], [], [], [], []]',
        expected: '[None, None, None, None, 2, 2, 7, 4]',
      },
      { args: '["MinStack", "push", "get_min", "top"], [[], [5], [], []]', expected: '[None, None, 5, 5]' },
      {
        args: '["MinStack", "push", "push", "pop", "get_min"], [[], [1], [1], [], []]',
        expected: '[None, None, None, 1, 1]',
      },
    ],
    recipeIds: ['class-basics', 'stack-brackets'],
  },
  {
    id: 'reverse-linked-list',
    version: 1,
    topicId: 'classes',
    title: 'Reverse a linked list',
    kind: 'implement',
    difficulty: 'core',
    objective: 'Walk `ListNode` objects with prev/current pointers.',
    prompt: 'Reverse the singly linked list starting at `head` and return the new head. `ListNode` (with `val` and `next`) is predefined. An empty list is `None`.',
    signature: 'def reverse_list(head: ListNode | None) -> ListNode | None',
    starter: py`
      def reverse_list(head):
          return head
    `,
    solution: py`
      def reverse_list(head):
          prev = None
          node = head
          while node:
              node.next, prev, node = prev, node, node.next
          return prev
    `,
    explanation: 'Each step points the current node back at `prev`, then advances. The tuple assignment evaluates the right side first, so no temporary is needed, but the order of targets matters.',
    complexity: 'O(n) time, O(1) space.',
    hints: ['Keep `prev`, `node` and the next node before you overwrite `node.next`.'],
    wrong: [py`
      def reverse_list(head):
          values = []
          while head:
              values.append(head.val)
              head = head.next
          return build_list(values)
    `],
    grading: fn('reverse_list', { transform: 'linked_list' }),
    comparison: 'The returned list is walked node by node (cycle-safe) and compared as a list of values.',
    cases: [
      { args: 'build_list([1, 2, 3])', expected: '[3, 2, 1]' },
      { args: 'None', expected: '[]' },
      { args: 'build_list([7])', expected: '[7]' },
      { args: 'build_list([1, 1, 2])', expected: '[2, 1, 1]' },
    ],
    recipeIds: ['listnode-treenode'],
  },
  {
    id: 'mirror-tree',
    version: 1,
    topicId: 'classes',
    title: 'Mirror a binary tree',
    kind: 'implement',
    difficulty: 'warm-up',
    objective: 'Recurse over `TreeNode.left` and `TreeNode.right`.',
    prompt: 'Swap the left and right children of every node and return the root. `TreeNode` is predefined. Trees are written in level order with `None` gaps.',
    signature: 'def mirror(root: TreeNode | None) -> TreeNode | None',
    starter: py`
      def mirror(root):
          return root
    `,
    solution: py`
      def mirror(root):
          if root is None:
              return None
          root.left, root.right = mirror(root.right), mirror(root.left)
          return root
    `,
    explanation: 'Mirror both subtrees, then attach them on the opposite sides. Tuple assignment evaluates both calls before assigning.',
    complexity: 'O(n) time, O(height) stack.',
    hints: ['What is the mirror of an empty tree?', 'Swap after mirroring the children.'],
    wrong: [py`
      def mirror(root):
          if root:
              root.left, root.right = root.right, root.left
          return root
    `],
    grading: fn('mirror', { transform: 'tree' }),
    comparison: 'The returned tree is serialised in level order (trailing Nones removed) and compared.',
    cases: [
      { args: 'build_tree([5, 3, 8, 1, 4, 7, 9])', expected: '[5, 8, 3, 9, 7, 4, 1]' },
      { args: 'None', expected: '[]' },
      { args: 'build_tree([1, 2])', expected: '[1, None, 2]' },
    ],
    recipeIds: ['listnode-treenode', 'dfs-iterative'],
  },
];
