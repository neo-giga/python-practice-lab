# References and inspiration

Every recipe, drill, test case, hint and explanation in Python Interview Lab was written for this project. The resources below informed **which idioms and pitfalls to cover**. No problem statements, solutions or prose were copied, and this project does not relicense any of them.

The research read shallow clones of each repository at the commits linked below.

| Source | Commit read | License | What it is | How it was used |
| --- | --- | --- | --- | --- |
| [qiyuangong/leetcode — `python/`](https://github.com/qiyuangong/leetcode/tree/master/python) | [`a6f3b71`](https://github.com/qiyuangong/leetcode/tree/a6f3b711afecd57ba6fdced8554af3f9f87cbaac/python) | MIT | About 380 solution files, largely Python 2 style | Source of Python 2 → 3 pitfalls (see below) |
| [itcharge/AlgoNote](https://github.com/itcharge/AlgoNote/tree/main) | [`2aa4fd0`](https://github.com/itcharge/AlgoNote/tree/2aa4fd0a2214bb93f5566372c68afa4d2a1d22ef) | CC BY-NC-ND 4.0 | A Chinese-language algorithms textbook with modern Python 3 | Coverage signal for modern idioms (`deque`, `defaultdict`, `heapq`, `bisect`, `@cache`, `nonlocal`, union-find) |
| [Jack-Lee-Hiter/AlgorithmsByPython — `leetcode/`](https://github.com/Jack-Lee-Hiter/AlgorithmsByPython/tree/master/leetcode) | [`78d7ac4`](https://github.com/Jack-Lee-Hiter/AlgorithmsByPython/tree/78d7ac4d93db9da40601a5567350bfb3e97e7d46/leetcode) | No license file | A small mixed Python 2/3 collection | Coverage signal only |
| [SamirPaulb/DSAlgo](https://github.com/SamirPaulb/DSAlgo) | [`12db170`](https://github.com/SamirPaulb/DSAlgo/tree/12db170b6df61ab699a511ac74ec7789b2a06b99) | Custom terms ("free to use to practice… do not copy it directly") | A large topic-organised collection, mostly Python 3 | Coverage signal (heap tie-breakers, two-heap median, `defaultdict` graphs) |
| [Python documentation](https://docs.python.org/3/) | — | PSF documentation license | Language and library reference | Semantics and "new in version" facts |

A user-supplied three-page "Python for LeetCode" summary, organised in 17 sections, was used as a coverage checklist only. It is not redistributed. Several of its claims are corrected in this curriculum:

- "Python only has a min-heap" is outdated since 3.14 (`heapq.heappush_max`), so recipe `max-heap` teaches negation as the portable form and the 3.14 API as optional.
- `{x: nums.count(x) for x in nums}` is O(n²), so recipe `counter` recommends `Counter(nums)`.
- "Never `+=` strings, it is O(n²)" is too absolute. Recipe `string-building` says CPython may extend in place, but only `join` is guaranteed linear.
- `int(a / b)` for truncation loses precision above 2⁵³, so recipe `truncating-division` and drill `divide-toward-zero` use integer-only arithmetic.

## Python 2 relics found in the sources

These were checked by executing them under Python 3.14 during Phase 0. They became recipe `py2-relics` and the drills `py2-binary-search` and `py2-leaderboard`.

| Location | Relic | Under Python 3 |
| --- | --- | --- |
| qiyuangong `python/033_Search_in_Rotated_Sorted_Array.py` | `mid = (start + end) / 2` | Produces a float, so indexing raises `TypeError: list indices must be integers or slices, not float` |
| qiyuangong `python/832_Flipping_an_Image.py` | `xrange((len(row) + 1) / 2)` | `NameError: name 'xrange' is not defined` (and `/` is a float again) |
| qiyuangong `python/692_Top_K_Frequent_Words.py` | `sorted(..., cmp=...)` | `cmp=` was removed; use `key=` or `functools.cmp_to_key` |
| qiyuangong `python/263_Ugly_Number.py` | `print s.isUgly(...)` | A syntax error |
| SamirPaulb `14_Queue/01. Sliding Window Maximum.py` | `collections.deque()` with the import commented out | Works only with a judge's implicit imports; standalone it raises `NameError` |
| AlgorithmsByPython `leetcode/239. Sliding Window Maximum.py` | `queue.pop(0)` (its own comment suggests `deque`) | Correct, but O(n) per pop: the anti-pattern recipe `list-basics` warns about |

## Related learning resources (links only)

- Pyodide documentation: <https://pyodide.org/en/stable/>
- CodeMirror documentation: <https://codemirror.net/docs/>
- Python "What's New" pages, for version-specific features: <https://docs.python.org/3/whatsnew/>
