# How the skill plan is ordered: measured frequency

The coding-interview plan orders Python skills by how often they appear in real LeetCode solutions to **interview
problems**. The numbers are **document frequency**: the share of solutions in which a skill appears at least once. They
are generated, not hand-written: `scripts/frequency/freq.py` reads `scripts/frequency/corpora.json`, measures the
counted corpora and writes `src/content/frequency.json` and the generated sections of this file. `src/content/skills.ts`
reads each skill's `avg` from that JSON.

## Regenerate

```bash
python3 scripts/frequency/freq.py            # re-measure every counted corpus, rewrite frequency.json and this file
python3 scripts/frequency/freq.py --update-pins   # after pulling a clone forward: accept the new commits
```

The clones live outside the repo (default `~/.hermes/cache/scratch/py-freq/<dir>`, override with `--cache`); they are
sparse shallow clones of the globs in `corpora.json`, for example
`git clone --depth 1 --filter=blob:none --sparse https://github.com/neetcode-gh/leetcode neetcode && git -C neetcode sparse-checkout set python`.
The script refuses a clone whose commit differs from the pin. To add a corpus, add an entry to `corpora.json`
(`glob`, `key` rule for mapping files to LeetCode problems, `licence`, `weight`, `role`) and re-run. Skill ids never
change; only frequencies, and so tiers, may move.

## Sources

Only constructs are counted: no solution or problem text is copied into this repository, and the corpora are not
vendored. Unlicensed repos and Python 2-only repos are not counted.

<!-- freq:sources:start -->
| Repository | Commit | Files counted | Skipped (not Python 3) | Interview list found | Python | Licence | Weight | Used for |
|---|---|---|---|---|---|---|---|---|
| [neetcode-gh/leetcode](https://github.com/neetcode-gh/leetcode) | `8fed5f7` | 393 | 3 | 67/75 | Python 3 | MIT | 2 | counted constructs only; no text copied |
| [walkccc/LeetCode](https://github.com/walkccc/LeetCode) | `9b85aa1` | 3165 | 4 | 73/75 | Python 3 | MIT | 1 | counted constructs only; no text copied |
| [kamyu104/LeetCode-Solutions](https://github.com/kamyu104/LeetCode-Solutions) | `4acdcc1` | 3686 | 2 | 75/75 | Python 2 style (xrange etc.); only files that parse as Python 3 are counted | MIT | 1 | counted constructs only; no text copied |
| [doocs/leetcode](https://github.com/doocs/leetcode) | `09e4b10` | 3565 | 0 | 75/75 | Python 3 | CC BY-SA 4.0 | 1 | counted constructs only; no text copied |
| [Grind 75 (tech-interview-handbook QuestionGroups.json)](https://github.com/yangshun/tech-interview-handbook) | `e1d28e8` | 75 problems | – | – | – | MIT | – | interview weighting: problem ids, slugs and tags only |
| [qiyuangong/leetcode](https://github.com/qiyuangong/leetcode) | `a6f3b71` | – | – | – | – | MIT | – | earlier cross-check only (older, partly Python 2); not counted |
| [itcharge/AlgoNote](https://github.com/itcharge/AlgoNote) | `2aa4fd0` | – | – | – | – | CC BY-NC-ND 4.0 | – | not cloned; listed as reference for which templates to cover; no wording copied (licence forbids derivatives); not counted |
| [Jack-Lee-Hiter/AlgorithmsByPython](https://github.com/Jack-Lee-Hiter/AlgorithmsByPython) | `78d7ac4` | – | – | – | – | none found | – | earlier cross-check only; dropped from counting because it has no licence; not counted |
| [SamirPaulb/DSAlgo](https://github.com/SamirPaulb/DSAlgo) | `12db170` | – | – | – | – | custom notice (free to practise with; asks not to copy directly) | – | not cloned; listed as reference; nothing copied; not counted |
<!-- freq:sources:end -->

## Method

1. Parse every file matching a counted corpus' glob with Python's `ast` module; files that do not parse as Python 3 are
   skipped and reported (this matters for kamyu104, which is written in Python 2 style).
2. For each file, collect the set of skills whose constructs appear (`skills_of()` in the script). A file counts **once**
   per skill, however often the construct repeats. Problems with several solution files count each file.
3. Map each file to a LeetCode problem (number or slug, per the corpus' `key` rule) and mark it if the problem is on the
   interview list.
4. Per corpus: **all** = files using the skill / files parsed; **interview list** = the same over the marked files only.
   Each is combined as a weighted mean over corpora (neetcode weight 2, the others 1).
5. **avg** (what the planner uses) = the interview-list value. If fewer than 5 interview-list files across all counted
   corpora use a skill, the interview estimate is too noisy and avg falls back to the all-problems value (`avgSource`
   in the JSON; marked "(all)" below).

Interview list: the tech-interview-handbook repo ships only the **Grind 75** question groups (75 problems, 8 weeks); the
full Grind 169 list is served by the grind75 site and is not in the MIT-licensed repo, so the 75 are used.

Skill definitions:

- **dict-counter:** dict literals and comprehensions, `dict()`, `Counter`, `defaultdict`, `OrderedDict`, and `.get` /
  `.setdefault` / `.items` / `.keys` / `.values` / `.most_common` calls. `d[k] += 1` alone is not attributed to dicts,
  so this is a lower bound.
- **heapq / itertools / bisect / deque:** counted under both import styles (`import heapq` + `heapq.x`, and
  `from heapq import x` + bare calls).
- **indexing-len:** any non-slice subscript `a[i]` or `len()`. This is why it ranks above `for` loops.
- **recursion-helpers:** a call to a function defined in the same file (including `self.method`), or a nested `def`.
- **loops-range:** any `for` loop or `range()` call. **assign-swap:** `+=`-style assignment or tuple targets.
- Traps (`trap-mutability`, `trap-numbers-runtime`) have no frequency: they are must-know because they break
  correct-looking code, not because solutions show them.

Tiers: **Tier 1 (must-know)** ≥ 15%, **Tier 2 (common)** 5–15% plus the two trap skills, **Tier 3 (good to know)** < 5%.
"Tier now" is read from `skills.ts`; "Tier by rule" is what the rule gives for the new avg.

## Results

Per-corpus columns are the interview-list values; per-corpus all-problems values are in the JSON.

<!-- freq:table:start -->
| # | Skill id | Skill | Tier now | Tier by rule | **avg** (planner) | All problems | Interview list | neetcode (list) | walkccc (list) | kamyu (list) | doocs (list) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `indexing-len` | len(), indexing and negative indexes | 1 | 1 | **84.1%** | 85.7% | 84.1% | 85.1% | 78.2% | 81.3% | 90.7% |
| 2 | `loops-range` | for loops and range() | 1 | 1 | **59.0%** | 69.0% | 59.0% | 59.7% | 58.4% | 64.0% | 53.3% |
| 3 | `assign-swap` | Augmented assignment, swaps and unpacking | 1 | 1 | **55.9%** | 63.8% | 55.9% | 56.7% | 28.7% | 78.7% | 58.7% |
| 4 | `list-basics` | Lists: append, pop and [0] * n | 1 | 1 | **43.1%** | 38.1% | 43.1% | 43.3% | 43.6% | 44.0% | 41.3% |
| 5 | `while-loops` | while loops and two indexes | 1 | 1 | **41.6%** | 36.1% | 41.6% | 41.8% | 32.7% | 56.0% | 36.0% |
| 6 | `recursion-helpers` | Recursion and nested helper functions | 1 | 1 | **35.7%** | 32.3% | 35.7% | 34.3% | 37.6% | 42.7% | 29.3% |
| 7 | `builtins-aggregate` | max(), min(), sum() and abs() | 1 | 1 | **26.9%** | 37.7% | 26.9% | 25.4% | 27.7% | 32.0% | 24.0% |
| 8 | `nodes` | ListNode and TreeNode basics | 2 | 1 | **25.4%** | 10.3% | 25.4% | 26.9% | 26.7% | 24.0% | 22.7% |
| 9 | `dict-counter` | dict, Counter and defaultdict | 1 | 1 | **21.8%** | 21.4% | 21.8% | 22.4% | 18.8% | 25.3% | 20.0% |
| 10 | `membership` | Membership: in and not in | 2 | 1 | **18.3%** | 16.7% | 18.3% | 20.9% | 14.8% | 18.7% | 16.0% |
| 11 | `grids-2d` | 2-D grids: grid[r][c] and neighbours | 1 | 1 | **15.5%** | 17.3% | 15.5% | 13.4% | 15.8% | 17.3% | 17.3% |
| 12 | `slicing` | Slicing and [::-1] | 2 | 2 | **14.5%** | 11.1% | 14.5% | 16.4% | 7.9% | 16.0% | 16.0% |
| 13 | `comprehensions` | Comprehensions and generator expressions | 1 | 2 | **14.1%** | 25.6% | 14.1% | 4.5% | 18.8% | 17.3% | 25.3% |
| 14 | `conditional-expr` | Conditional expressions and truthiness | 2 | 2 | **12.6%** | 13.6% | 12.6% | 13.4% | 11.9% | 10.7% | 13.3% |
| 15 | `type-conversion` | Type conversion: int(), str(), list() | 2 | 2 | **12.4%** | 14.3% | 12.4% | 7.5% | 10.9% | 24.0% | 12.0% |
| 16 | `enumerate-zip` | enumerate() and zip() | 1 | 2 | **11.0%** | 15.2% | 11.0% | 6.0% | 14.8% | 8.0% | 20.0% |
| 17 | `int-math` | Integer math: //, %, divmod and ** | 1 | 2 | **9.2%** | 24.8% | 9.2% | 10.4% | 7.9% | 10.7% | 6.7% |
| 18 | `deque` | collections.deque (BFS queue) | 3 | 2 | **8.5%** | 4.3% | 8.5% | 9.0% | 9.9% | 5.3% | 9.3% |
| 19 | `sets` | Sets: add, discard and set algebra | 2 | 2 | **7.8%** | 10.8% | 7.8% | 10.4% | 8.9% | 4.0% | 5.3% |
| 20 | `sorting` | sort(), sorted(), key= and lambda | 2 | 2 | **7.5%** | 11.2% | 7.5% | 4.5% | 5.9% | 12.0% | 10.7% |
| 21 | `strings` | Strings: join, split, ord, chr and is* | 2 | 2 | **6.4%** | 6.5% | 6.4% | 7.5% | 5.0% | 5.3% | 6.7% |
| 22 | `bit-ops` | Bit operators: & \| ^ ~ << >> | 1 | 2 | **5.5%** | 9.7% | 5.5% | 0.0% | 20.8% | 2.7% | 4.0% |
| 23 | `infinity` | Infinity: math.inf and float("inf") | 2 | 3 | **5.0%** | 7.0% | 5.0% | 3.0% | 3.0% | 9.3% | 6.7% |
| 24 | `heapq` | heapq: min-heaps, top-k, max-heap by negation | 3 | 3 | **4.0%** | 4.5% | 4.0% | 4.5% | 3.0% | 5.3% | 2.7% |
| 25 | `itertools` | itertools: accumulate, pairwise, combinations | 2 | 3 | **2.7%** | 3.2% | 2.7% | 0.0% | 0.0% | 5.3% | 8.0% |
| 26 | `any-all` | any() and all() | 3 | 3 | **2.2%** | 2.2% | 2.2% | 0.0% | 6.9% | 0.0% | 4.0% |
| 27 | `bisect` | bisect: binary search on sorted lists | 3 | 3 | **1.9%** | 2.1% | 1.9% | 0.0% | 4.0% | 2.7% | 2.7% |
| 28 | `nonlocal` | nonlocal (and closures) | 3 | 3 | **1.7%** | 1.5% | 1.7% | 1.5% | 3.0% | 0.0% | 2.7% |
| 29 | `memo-cache` | Memoization: @cache and lru_cache | 3 | 3 | **1.6%** (all) | 1.6% | 0.9% | 0.0% | 3.0% | 0.0% | 1.3% |
<!-- freq:table:end -->

## Algorithm patterns on the interview list

Share of the interview-list problems carrying each topic or routine tag (a problem can carry several). The planner
orders the algorithm-template skills by this (`algorithms` in the JSON).

<!-- freq:algorithms:start -->
| Tag | Problems | Share |
|---|---|---|
| array | 11 | 14.7% |
| graph | 10 | 13.3% |
| binary-tree | 9 | 12.0% |
| string | 8 | 10.7% |
| dynamic-programming | 7 | 9.3% |
| stack | 7 | 9.3% |
| two-pointers | 6 | 8.0% |
| backtracking | 5 | 6.7% |
| binary-search | 5 | 6.7% |
| breadth-first-search | 5 | 6.7% |
| linked-list | 5 | 6.7% |
| depth-first-search | 4 | 5.3% |
| heap | 4 | 5.3% |
| binary-search-tree | 3 | 4.0% |
| hash-table | 3 | 4.0% |
| palindrome | 3 | 4.0% |
| recursion | 3 | 4.0% |
| anagram | 2 | 2.7% |
| interval | 2 | 2.7% |
| matrix | 2 | 2.7% |
| monotonic-stack | 2 | 2.7% |
| sliding-window | 2 | 2.7% |
| sorting | 2 | 2.7% |
| topo-sort | 2 | 2.7% |
| trie | 2 | 2.7% |
| binary | 1 | 1.3% |
| geometry | 1 | 1.3% |
| greedy | 1 | 1.3% |
| hashing | 1 | 1.3% |
| parsing | 1 | 1.3% |
| prefix-sum | 1 | 1.3% |
| union-find | 1 | 1.3% |
<!-- freq:algorithms:end -->

## Known biases

- **Small interview sample.** 75 problems; corpora miss some (premium problems, renamed slugs), see "Interview list
  found". Skills used in only a few interview solutions are noisy, hence the fallback rule.
- **Author style.** Each corpus is one author's (or one project's) style; neetcode is weighted double because it is the
  most interview-focused, which also doubles its style.
- **Lower bounds.** Constructs that the AST cannot attribute (for example `d[k] += 1` on a dict built elsewhere) are missed.
- **kamyu104** is Python 2 style; files that still parse under Python 3 are counted, so it leans towards older idioms
  (no `@cache`, `xrange` names).
