# How the skill plan is ordered: measured frequency

The coding-interview plan orders Python skills by how often they appear in real LeetCode solutions. The numbers are
**document frequency**: the share of solutions in which a skill appears at least once. They are generated, not
hand-written: `src/content/frequency.json` is produced by `scripts/frequency/skill_frequency.py`, and
`src/content/skills.ts` reads each skill's frequency from it.

## Corpora

| Corpus | Commit | Files parsed | Skipped (not Python 3) | Role |
|---|---|---|---|---|
| [walkccc/LeetCode](https://github.com/walkccc/LeetCode) | `9b85aa1` | 3165 | 4 | ranking |
| [doocs/leetcode](https://github.com/doocs/leetcode) | `09e4b10` | 3565 | 0 | ranking |
| [qiyuangong/leetcode](https://github.com/qiyuangong/leetcode) | `a6f3b71` | 329 | 50 | cross-check (older style) |
| [Jack-Lee-Hiter/AlgorithmsByPython](https://github.com/Jack-Lee-Hiter/AlgorithmsByPython) | `78d7ac4` | 150 | 1 | cross-check (older style) |

The ranking uses the average of the two modern corpora. Only constructs are counted: no solution text is copied into
this repository, and the corpora themselves are not vendored.

## Method

1. Parse every `.py` file with Python's `ast` module; files that do not parse as Python 3 (mostly Python 2) are skipped.
2. For each file, collect the set of skills whose constructs appear (`skills_of()` in the script). A file counts **once**
   per skill, however often the construct repeats.
3. Share = files using the skill / files parsed, per corpus; the ranking value is the mean of the two modern corpora.

Skill definitions (refined from Seeker's first construct-level count):

- **dict-counter:** dict literals and comprehensions, `dict()`, `Counter`, `defaultdict`, `OrderedDict`, and `.get` /
  `.setdefault` / `.items` / `.keys` / `.values` / `.most_common` calls. The first count saw only one construct at a time
  (8.5%); counting them together gives 18%. `d[k] += 1` alone is still not attributed to dicts, so this is a lower bound.
- **heapq / itertools / bisect / deque:** counted under both import styles (`import heapq` + `heapq.x`, and
  `from heapq import x` + bare calls).
- **indexing-len:** any non-slice subscript `a[i]` or `len()`. This is why it ranks above `for` loops.
- **recursion-helpers:** a call to a function defined in the same file (including `self.method`), or a nested `def`.
- **loops-range:** any `for` loop or `range()` call. **assign-swap:** `+=`-style assignment or tuple targets.
- Traps (`trap-mutability`, `trap-numbers-runtime`) have no frequency: they are must-know because they break correct-looking code, not because solutions show them.

Tiers: **Tier 1 (must-know)** ≥ 15%, **Tier 2 (common)** 5–15% plus the two trap skills, **Tier 3 (good to know)** < 5%.

## Results

| # | Skill id | Skill | Tier | Ranking (avg) | walkccc | doocs | qiyuangong | Jack-Lee |
|---|---|---|---|---|---|---|---|---|
| 1 | `indexing-len` | len(), indexing and negative indexes | 1 | **86.9%** | 85.0% | 88.8% | 71.1% | 69.3% |
| 2 | `loops-range` | for loops and range() | 1 | **70.1%** | 70.2% | 70.0% | 56.8% | 55.3% |
| 3 | `assign-swap` | Augmented assignment, swaps and unpacking | 1 | **56.7%** | 51.5% | 61.8% | 53.8% | 64.0% |
| 4 | `builtins-aggregate` | max(), min(), sum() and abs() | 1 | **40.8%** | 41.1% | 40.5% | 20.1% | 15.3% |
| 5 | `list-basics` | Lists: append, pop and [0] * n | 1 | **37.3%** | 36.9% | 37.7% | 37.7% | 50.0% |
| 6 | `comprehensions` | Comprehensions and generator expressions | 1 | **31.6%** | 32.4% | 30.8% | 11.2% | 9.3% |
| 7 | `recursion-helpers` | Recursion and nested helper functions | 1 | **28.7%** | 32.0% | 25.4% | 25.5% | 64.0% |
| 8 | `while-loops` | while loops and two indexes | 1 | **26.0%** | 25.8% | 26.2% | 38.3% | 65.3% |
| 9 | `int-math` | Integer math: //, %, divmod and ** | 1 | **25.8%** | 27.5% | 24.0% | 14.6% | 20.0% |
| 10 | `enumerate-zip` | enumerate() and zip() | 1 | **22.7%** | 21.7% | 23.7% | 6.4% | 6.0% |
| 11 | `dict-counter` | dict, Counter and defaultdict | 1 | **18.0%** | 17.0% | 19.0% | 14.3% | 14.7% |
| 12 | `grids-2d` | 2-D grids: grid[r][c] and neighbours | 1 | **15.4%** | 14.8% | 16.0% | 10.3% | 7.3% |
| 13 | `bit-ops` | Bit operators: & \| ^ ~ << >> | 1 | **15.3%** | 14.1% | 16.4% | 7.0% | 7.3% |
| 14 | `type-conversion` | Type conversion: int(), str(), list() | 2 | **13.2%** | 12.8% | 13.6% | 12.5% | 18.0% |
| 15 | `conditional-expr` | Conditional expressions and truthiness | 2 | **13.2%** | 14.0% | 12.4% | 2.1% | 8.7% |
| 16 | `sorting` | sort(), sorted(), key= and lambda | 2 | **11.9%** | 11.2% | 12.6% | 5.5% | 8.0% |
| 17 | `slicing` | Slicing and [::-1] | 2 | **11.6%** | 9.7% | 13.6% | 10.3% | 19.3% |
| 18 | `membership` | Membership: in and not in | 2 | **10.3%** | 10.9% | 9.7% | 11.2% | 10.0% |
| 19 | `sets` | Sets: add, discard and set algebra | 2 | **8.8%** | 8.6% | 8.9% | 7.6% | 2.7% |
| 20 | `infinity` | Infinity: math.inf and float("inf") | 2 | **7.9%** | 7.1% | 8.7% | 1.5% | 0.0% |
| 21 | `strings` | Strings: join, split, ord, chr and is* | 2 | **7.5%** | 7.1% | 7.8% | 9.4% | 10.0% |
| 22 | `nodes` | ListNode and TreeNode basics | 2 | **6.8%** | 7.2% | 6.4% | 21.0% | 31.3% |
| 23 | `itertools` | itertools: accumulate, pairwise, combinations | 2 | **5.5%** | 3.9% | 7.2% | 0.0% | 0.0% |
| 24 | `deque` | collections.deque (BFS queue) | 3 | **4.1%** | 4.2% | 4.0% | 0.0% | 0.0% |
| 25 | `memo-cache` | Memoization: @cache and lru_cache | 3 | **3.9%** | 3.7% | 4.2% | 0.0% | 0.0% |
| 26 | `bisect` | bisect: binary search on sorted lists | 3 | **3.5%** | 3.1% | 3.9% | 0.0% | 0.0% |
| 27 | `any-all` | any() and all() | 3 | **3.1%** | 3.6% | 2.7% | 0.6% | 0.7% |
| 28 | `heapq` | heapq: min-heaps, top-k, max-heap by negation | 3 | **3.1%** | 3.2% | 2.9% | 1.5% | 0.7% |
| 29 | `nonlocal` | nonlocal (and closures) | 3 | **2.2%** | 1.8% | 2.5% | 0.0% | 0.0% |

## Known biases

- **Rare problems.** The corpora include every LeetCode problem, so rare problems weigh as much as interview favourites.
  The ranking is a fair proxy for "what Python a solution needs", not for interview frequency per problem.
- **Lower bounds.** Constructs that the AST cannot attribute (for example `d[k] += 1` on a dict built elsewhere) are missed.
- **The two cross-check corpora** are older and partly Python 2; they confirm the order of the top skills but are not
  used for ranking.

## Regenerate

```bash
python3 scripts/frequency/skill_frequency.py walkccc=<path> doocs=<path> classic=<path> > a.json
python3 scripts/frequency/skill_frequency.py jacklee=<path> > b.json
# then rebuild src/content/frequency.json from a.json + b.json (same field layout)
```
