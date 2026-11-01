# Authoring coding problems

This is the guide for writing a LeetCode-style problem for the **Coding interview** track. The schema and the grading
contract are frozen: new fields can only be added as optional, so a problem written against this page keeps working.

- Schema: [`src/content/problem-schema.ts`](../src/content/problem-schema.ts) (`CodingProblem`)
- Patterns and the prerequisite graph: [`src/content/patterns.ts`](../src/content/patterns.ts) (22 ids)
- Grader: [`src/runtime/harness.py`](../src/runtime/harness.py) and [`src/runtime/protocol.ts`](../src/runtime/protocol.ts)
- Two complete templates: [`src/content/problems/_examples.ts`](../src/content/problems/_examples.ts)

## Workflow

1. Create your own file, for example `src/content/problems/b-two-pointers.ts`, exporting one array:
   `export const twoPointerProblems: CodingProblem[] = [ ... ];`
   Start each problem by copying a template from `_examples.ts`, then replace **everything**.
2. Register the file with **one line** in your section of [`src/content/problems/registry.ts`](../src/content/problems/registry.ts):
   `export { twoPointerProblems } from './b-two-pointers';`
   Edit nothing else (no schema, harness, UI or other writers' files).
3. Run the gate for your file until it prints `all gates pass`:

   ```bash
   npm run gate -- src/content/problems/b-two-pointers.ts
   ```

4. Run the full checks before handing back:

   ```bash
   npm run typecheck && npm run test:unit && npm run test:corpus && npm run test:portability
   ```

## Fields

| Field | Rule |
|---|---|
| `id` | kebab-case, globally unique (recipes, drills and problems share the URL space). Never rename after publishing. |
| `version` | Start at 1. Bump only when cases or the contract change (old solves then show "earlier version"). |
| `title` | Original. **Never** a LeetCode title verbatim, and never the word "LeetCode". |
| `pattern` | One of the 22 ids in `patterns.ts`. `subPatterns` are free tags such as `"fast-slow"`. |
| `difficulty` | `'easy' \| 'medium' \| 'hard'`, on LeetCode's scale. |
| `priority` | 1 = the classic everyone should do first in that pattern and difficulty; 2, 3, … come later. |
| `estMinutes` | Honest solve time for a prepared learner: Easy ≈ 10–20, Medium ≈ 20–35, Hard ≈ 35–50. The planner multiplies it by 1.6. |
| `statement` | Original framing and data. Markdown-lite: paragraphs separated by a blank line, `` `code` `` spans, `**bold**`. Say what to return in edge cases. |
| `examples` | 2–3. `input` and `output` must be **character-for-character** equal to one case's `args` and `expected`. "Run examples" runs exactly these. |
| `constraints` | One bound or guarantee per string, e.g. `"1 <= len(nums) <= 10**5"`. |
| `signature` | One line: `def name(params) -> type`, or for design problems `class Name: method(...) -> type; ...`. |
| `starter` | Compiles, has the right signature, and **fails** at least one case. |
| `solution` | The reference. Idiomatic, readable Python 3.11+ (set `minPython` if it needs newer). |
| `complexity` | `{ time, space, note? }`, e.g. `{ time: 'O(n)', space: 'O(1) extra' }`. |
| `explanation` | Why the reference works, in 2–4 short paragraphs. |
| `hints` | Exactly 3: a nudge → the approach → near-pseudocode. |
| `idiomNote` | The Python point of the problem (the idiom it practises, or the trap). This is what makes the lab a *Python* lab. |
| `wrong` | At least 2 plausible wrong solutions (off-by-one, truthiness, wrong data structure, missed edge case). Each must fail ≥ 1 case. Add a one-line comment above each saying what is wrong. |
| `grading` | See "Grading modes". Never includes `cases`. |
| `cases` | 6–12 with distinct `args`: empty/minimal input, duplicates, negatives, boundaries, and at least one larger case (built with an expression such as `list(range(3000))`, with a `label`). |
| `similarTo` | Optional link `{ lc: 15, url: 'https://leetcode.com/problems/<slug>/' }`. Link only, never copied text. |
| `recipeIds` | Cheatsheet recipe ids that teach the idiom (may be empty). The gate rejects unknown ids. |
| `provenance` | Always `'original'`. |

## Grading modes

Cases are Python expressions. `args` is the positional argument list (no surrounding parentheses), evaluated in the
learner's fresh namespace for every case; `expected` is evaluated in its own namespace, so a learner mutating an input
cannot change the expectation. Comparison is Python-native and **type-strict**: `True` is not `1`, a tuple is not a list.

| `grading` | Use for |
|---|---|
| `{ entry, kind: 'function', compare: 'exact' }` | The default: compare the return value. |
| `compare: 'unordered'` | The top-level list may be in any order (duplicates still count). |
| `compare: 'unordered_nested'` | Outer list and each inner list may be in any order (e.g. all subsets). |
| `compare: 'approx'` | Floats, tolerance 1e-9. |
| `compare: 'exact_ordered'` | Like exact, but dict key order matters too. |
| `compare: 'checker'`, `checker: py\`def check(args, result): ...\`` | **Several valid answers** (any valid path, any topological order, any index pair). `check` receives a fresh, unmutated copy of the original args tuple (the args expression evaluated again in its own namespace) and the learner's raw result; it returns `None` to accept or a short message to reject. It runs in its own namespace. If it raises, the case is rejected (not crashed), so keep it robust to odd results (check types first). `expected` is still required: it is one valid answer, shown to the learner. |
| `check: 'mutated_arg0'` | In-place problems: the function must return `None`; `args[0]` is graded after the call. |
| `check: 'return_k_prefix'` | "Return k and keep the first k items" problems: the return must be an `int` equal to `len(expected)`, and `args[0][:k]` is compared with `compare: 'exact'` or `'unordered'`. |
| `transform: 'linked_list'` / `'tree'` | Return a `ListNode` / `TreeNode`; it is compared as its value list (trees in level order with trailing `None`s trimmed). Write `expected` as a plain list. |
| `kind: 'ops'`, `entry: 'ClassName'` | Design problems. `args` is `["ClassName", "method", ...], [[ctor args], [method args], ...]`; the list of return values (constructor → `None`) is compared. |
| `kind: 'calls'` | Several calls to one function in one module scope, when shared state is the point. |
| `lcMethod: 'camelCase'` | Optional. If the snake_case `entry` function is missing, `Solution().<lcMethod>` is called, so a learner can paste a LeetCode-style `class Solution`. Present snake_case in the signature. |

**Helpers available in every case expression and to the learner** (the prelude): `List, Optional, Dict, Set, Tuple`,
`ListNode(val, next)`, `TreeNode(val, left, right)`, `GraphNode(val, neighbors)`, `build_list([..])`,
`build_tree([3, 9, 20, None, None, 15, 7])` (level order), `build_cycle_list(values, pos)` (tail links to index `pos`;
`-1` for none), `build_shared_lists(a, b, tail)` → `(head_a, head_b)` sharing the `tail` nodes,
`build_graph(adj)` (1-indexed adjacency list → node 1) and `graph_to_adj(node)`.
Node-identity problems (cycle start, intersection, clone) use `compare: 'checker'`.

**Long linked structures are safe.** The harness cuts `next`/`left`/`right`/… links iteratively after every case, so a
5,000-node (or longer) list or tree in a case, an expected value or a learner's result never overflows the stack on free.

**Speed is not graded.** A larger case exists to catch wrong logic at scale, not to time solutions; browsers differ too
much for reliable timing. Keep the reference under about 3 s for all cases in Pyodide (the gate enforces it), and size
large cases so an honest O(n²) attempt still finishes (n ≈ 2 000–3 000). Submit runs with a 10 s limit.

## Gates (all must pass; a failing problem is cut, never padded)

`npm run gate -- <file>` runs, under real Pyodide:

1. Structural validation: every field above, 6–12 cases, 2–3 examples equal to cases, 3 hints, ≥ 2 wrong, known
   pattern and recipe ids, id not already taken.
2. The reference passes every case and every example.
3. The starter fails at least one case.
4. Every `wrong` solution fails at least one case.
5. The reference stays inside the time budget.

`npm run test:portability` re-runs 2–4 under native CPython 3.11. `npm run test:corpus` runs the gate for the whole
registered catalog.

## Originality (non-negotiable)

- New framing, new data, new title. Do not paraphrase a LeetCode statement or reuse its examples or constraints text.
- `similarTo` is a link for the learner, never a source to copy from.
- Do not copy from CC BY-NC sources (for example `seanprashad/leetcode-patterns`, Project Euler) or from Grind 75's data.
- Reviewers compare each problem with its `similarTo` link; a paraphrase is cut.
