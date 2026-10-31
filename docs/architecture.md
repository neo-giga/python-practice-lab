# Architecture and design decisions

This document records what was built, the prior art that was weighed, the measurements that settled the open questions, and an explicit response to an independent architecture review.

## 1. Shape of the system

```
index.html ─ React app (hash routes: #/learn, #/practice/<id>, #/playground, #/about)
  │
  ├─ src/content/*.ts          canonical curriculum (topics, recipes, exercises), versioned
  │     └─ docs/CHEATSHEET.md  generated from it (unit test fails on drift)
  │
  ├─ src/lib/storage.ts        localStorage with corruption quarantine + in-memory fallback
  ├─ src/lib/progress.ts       solve records (exercise version + source hash), drafts per id
  │
  └─ src/runtime/runner.ts     UI-thread owner of execution: one run at a time
        │  new Worker(python.worker.ts, {type: "module"})  ← fresh per run
        ▼
     python.worker.ts          loads Pyodide from ./pyodide/ (same origin), runs ONE request
        └─ harness.py          Python-side runner and grader (also runs under native CPython)
```

Static files only. There is no backend, account, analytics or service worker.

## 2. Phase 0: measured before building

A throwaway page (outside the repository) loaded real Pyodide 314.0.7 in a **module worker** in three browser engines via Playwright, from both a self-hosted copy of the npm package and `https://cdn.jsdelivr.net/pyodide/v314.0.7/full/`. No COOP/COEP headers were set (`crossOriginIsolated === false`, `SharedArrayBuffer` undefined).

| Engine | Init, self-hosted | Init, CDN | Re-init of a fresh worker (cached) | UI ticks during a 2 s `while True` |
| --- | --- | --- | --- | --- |
| Chromium 156.0.8078.4 | 779 ms | 1043 ms | 684 ms | 27 / 40 |
| Firefox 157.0 | 982 ms | 1296 ms | 1179 ms | 16 / 40 |
| WebKit 27.2 | 768 ms | 1014 ms | 761 ms | 37 / 40 |

In every engine:

- `sys.version` was `3.14.2`.
- `Counter`, `deque`, `heapq`, `functools` and `bisect` imported and behaved correctly.
- A `ZeroDivisionError` traceback came back intact.
- `while True: pass` was stopped at 2.0 s by `worker.terminate()` on the UI thread.
- A new worker then ran `sum(range(10))` correctly, and a global from the previous run was gone (`NameError`).

These numbers settled the biggest design question in favour of **a fresh interpreter for every submitted run**: about 0.7–1.2 s once the runtime is cached.

Phase 0 also executed three of the reference repositories' snippets under Python 3.14 to confirm that they need translation (see [REFERENCES.md](REFERENCES.md)).

## 3. Prior art and reuse decisions

| Candidate | What it offers | Cost / gap for this product | Decision |
| --- | --- | --- | --- |
| **Pyodide** (MPL-2.0) | Real CPython 3.14 compiled to WebAssembly, maintained upstream. The only mature option. | About 13.5 MB uncompressed (about 6.3 MB gzip) on first run. Its documentation requires a module worker (`pyodide.asm.mjs` is ESM). Interrupts need `SharedArrayBuffer`, which needs cross-origin isolation that GitHub Pages cannot provide. | **Adopt**, pinned to exactly `314.0.7`. **Self-host** the npm package's files (copied at build time and never committed) so tests and production use one reproducible asset set with no third-party CDN dependency. We did not write an interpreter or a fallback. |
| Pyodide CDN (jsDelivr) | Zero bundling. | An external availability and supply-chain dependency; Phase 0 showed it was about 250–300 ms slower. | **Reject** for production. It was verified working in Phase 0 and is a documented fallback only. |
| **CodeMirror 6** + `@codemirror/lang-python` (MIT) | A mature editor. It uses native `contenteditable` (IME, accessibility, mobile selection), Python highlighting and indentation, and is small. | A thin React wrapper (~120 lines) and a touch key row for characters missing from soft keyboards. | **Adopt.** The same Lezer grammar highlights the static code blocks, so there is no second highlighter. |
| Monaco | VS Code's editor. | Its own FAQ states that mobile browsers are not supported, and it weighs several MB. | **Reject.** |
| **React + TypeScript + Vite** | A small static app shell, standard tooling and worker bundling. | — | **Adopt.** The editor pages are lazy-loaded, so the cheatsheet does not download CodeMirror. TypeScript 7.0 (the native compiler) was verified to work with Vite 8 / plugin-react 6. |
| PyScript | Python-in-HTML integration with worker support. It *can* exchange serializable messages with workers without special headers. | React already owns the UI. PyScript would add a second abstraction around the interpreter lifecycle, which is exactly the part this app must control: fresh interpreter per run, two deadlines, terminate-and-respawn, bounded output, run identity. Its `mini-coi` workaround is unnecessary because we cancel by terminating. | **Reject** for integration overhead, not for any claimed header requirement. |
| JupyterLite | A complete notebook environment. | It brings notebook UX, a file system and a kernel protocol. A grader for short, focused drills needs none of these, and notebook chrome wastes phone screen space. | **Reject.** |
| Pyodide console / `react-py` | Ready-made REPL / React hook. | `react-py` hard-codes old CDN Pyodide versions and uses SharedArrayBuffer for interrupts. Both hide the timeout and restart semantics we need to own. | **Reject.** Used only as reading material. |
| futurecoder (MIT) | A proven Pyodide course. | Its strength is synchronous `input()` through a service worker. Drills here take function arguments, and the playground's stdin box covers `input()`. | **Reference only.** |
| The four reference repositories and docs.python.org | Coverage signal: which idioms recur in real interview solutions. | Mixed Python 2 / 3 code. Licenses range from MIT to CC BY-NC-ND to none or custom terms. | **Inspiration only.** Every recipe, drill, case and explanation here was written from scratch. See [REFERENCES.md](REFERENCES.md). |
| Existing company infrastructure | — | Not relevant to a personal, standalone learning site. It uses no customer data and no infrastructure. | **Not used.** |

## 4. Execution model

**Fresh worker per run.** `PythonRunner.run()` creates a new module worker, which posts `ready` after `loadPyodide()` and harness setup. The runner sends exactly one `exec` (playground run or grading of all cases), receives one result, and terminates the worker. The browser's HTTP cache makes the next start about 1 s. This is a *full interpreter reset*: modules, builtins, the file system and pending async work are all new.

**Deadlines on the UI thread.** A worker busy in Python cannot read messages, so the UI thread owns all cancellation:

- Startup deadline: 90 s. It covers download and initialisation on slow mobile networks.
- Execution deadline: 5 s by default, configurable in the Playground.
- Stop: `worker.terminate()` immediately.

Every path goes through one `settle()` that runs at most once, clears the timer, removes all three listeners (`message`, `error`, `messageerror`) and terminates the worker. Messages with a different `runId`, or arriving after settlement, are ignored. A load failure leaves the runner ready for a retry.

**Early load-failure detection (found by the E2E suite).** When the `.wasm` download fails, Pyodide 314.0.7 only logs `wasm instantiation failed` and its `loadPyodide()` promise never settles. Waiting for the 90 s deadline would be a poor experience, so the worker watches `console.warn` for that message during initialisation and reports `init-error` at once. Failures of `pyodide.mjs` or of the standard-library zip reject normally. All three cases are covered by E2E tests.

**Single flight and identity.** `run()` rejects with `BusyError` while a run is active. Each request carries a tag: run kind, exercise id, exercise version and a hash of the source snapshot. The practice view grades only if the tag matches the drill that is still mounted. Leaving a page stops its run. The editor is read-only during a run. If you edit after a run, the result is labelled "for an earlier version of your code".

**Bounded output.** The worker uses Pyodide's raw `write` handlers, so it counts bytes before decoding. Output is capped at 64 KiB per run (stdout and stderr combined); later bytes are dropped and the UI is told the output was truncated. Messages are batched to at most one per 40 ms or per 2 KiB, after the first 200 writes. Those early writes are forwarded immediately, because a program can block right after printing and a busy worker cannot run timers. On the Python side, per-case stdout is capped at 2,000 characters, and reprs go through `reprlib` with a 600-character cap and an exception guard.

**stdin.** The playground's optional stdin box supplies lines to `input()`; when the lines run out, `input()` raises `EOFError`. During grading, `input()` raises `EOFError` with an explanation.

**Not a sandbox.** The worker protects responsiveness, not security. Pyodide exposes JavaScript, including `fetch`, to Python. Terminating the worker cannot stop a program that exhausts memory before the deadline. The site should not share an origin with sensitive applications.

## 5. Grading semantics

`harness.py` is plain standard-library Python. The same file runs in the browser worker, in the Node corpus test and under native CPython 3.11.

- The learner's source is compiled once as `main.py` and **executed in a fresh module namespace for each case**, so caches and globals never leak between cases. Helper names (`ListNode`, `TreeNode`, `build_list`, `build_tree`, `List`, `Optional`) are predefined, as on common judges.
- Arguments are written as Python literals and evaluated fresh for each case, which clones them. **Expected values are evaluated in a separate namespace**, so mutating an input cannot change the expectation.
- Comparison happens **in Python, never via repr, stdout or JS conversion**:
  - `exact` (default): recursive and type-strict. `True` is not `1`, and `(1, 2)` is not `[1, 2]`; a type mismatch is reported as such.
  - `exact_ordered`: `exact` plus dict key order (opt-in, used where the prompt promises an order; plain `exact` dict equality ignores key order).
  - `unordered`: a multiset over a top-level list.
  - `unordered_nested`: inner lists are unordered too.
  - `approx`: `math.isclose`, relative and absolute tolerance 1e-9 (available, currently unused).
- Contract options per drill:
  - `check: mutated_arg0`: the function must return `None`, and the first argument is compared after the call.
  - `transform: linked_list | tree`: a cycle-safe, bounded structural snapshot is compared.
  - `kind: ops`: a design question. The class is constructed fresh for each case and the listed methods are called in order.
  - `kind: calls`: several calls share one module scope, used where shared state is the point, such as the mutable-default drill.
- Exceptions become tracebacks that contain **only the learner's frames**. A syntax error is reported once.
- **Solved** means that one source snapshot passed every case of the current exercise version (`progress.ts`). Showing the solution never solves; a later pass is recorded as *assisted*. A failing retry keeps the historical solve and shows the current failure. If an exercise version is bumped, the solve shows as "solved an earlier version".

## 6. Content model and verification

- 25 topics, 74 recipes and 58 drills in typed TypeScript modules, with Python in raw template literals. Ids are stable kebab-case and unique across recipes and drills. Each drill has a `version`.
- `validate.ts` checks counts, id uniqueness, references, non-empty fields, at least 3 cases and at least 1 known-wrong solution per drill.
- Corpus test (real Pyodide in Node): every recipe's stdout must equal its documented output exactly; every reference solution must pass every case; every starter must fail (there are no "predict the output" drills whose starter could pass); every known-wrong solution must fail at least one case.
- Portability: the same harness runs the corpus under native CPython 3.11. Recipes that need 3.12 or 3.14 are tagged with `minPython` and skipped. This matters because the browser runs 3.14 while interview judges may run older versions.
- Independent cross-checks recompute expectations for five drills in JavaScript, by brute force or closed form, rather than with the Python solutions.

## 7. Response to the independent architecture review

An independent reviewer (Codex) proposed revisions before implementation. Each point is listed below with what was done.

| # | Recommendation | Decision | Reason / where |
| --- | --- | --- | --- |
| 1 | Keep React/TS/Vite + CodeMirror 6 + a dedicated Pyodide worker; keep custom infrastructure small; no notebook, package manager or service worker. | **Accepted** | §1, §3. The worker protocol is a small typed message union with no RPC library. |
| 1a | Do not reject PyScript on an inaccurate "needs isolation headers" claim. | **Accepted** | §3: rejected for lifecycle-control overhead instead. |
| 2 | "Fresh namespace" is weaker than it sounds. Use a **fresh worker per graded submission** (all cases in it) and fresh fixtures per case; use the same model in the playground at first. | **Accepted** | Phase 0 measured re-init at 0.7–1.2 s, which made this affordable. Playground runs also use fresh workers. A persistent REPL is deferred. |
| 2a | The main thread must own the deadlines; have separate load and execution deadlines; settle exactly once; discard later messages; use a module worker. | **Accepted** | §4. Covered by mocked-boundary unit tests and real-browser E2E. |
| 3 | Grade in Python; never by repr, stdout or JS conversion. Destroy PyProxies. | **Accepted** | §5. The worker calls `destroy()` on the function proxies it fetches; only a JSON string crosses the boundary. |
| 3a | An explicit comparison policy per drill (types, order, floats/NaN, mutation, trees/lists, exceptions, repeated calls). | **Accepted, mostly** | §5 lists every policy, and the UI shows it under "How answers are checked". *Not implemented:* "expected exception" cases. No current drill needs one, so it was left out instead of shipping an untested path. |
| 3b | Build expected values independently of learner-owned mutable inputs; bound the formatting of large results and pathological reprs. | **Accepted** | Separate namespace; `reprlib` plus an exception guard; a corpus test feeds a `__repr__` that raises and 100 KB of prints. |
| 3c | Ship known-wrong solutions so that a grader accepting `return None` or a hard-coded sample is caught. | **Accepted** | Every drill has at least one; the corpus test proves each is rejected, and a test proves that a hard-coded first sample fails. |
| 3d | Output tests cannot prove use of the intended syntax; avoid brittle source-string checks. | **Accepted** | There are no source checks. The prompt states the idiom in its objective, and hints and explanations teach it. |
| 4 | Make run identity and content identity first-class: worker generation, run id, content id/version, source revision; solved history separate from the current draft; exercise versions separate from the storage schema. | **Accepted** | §4 (tags), §5 (solve records). Storage schema `pil:v1:*` is separate from per-exercise `version`. |
| 5 | Threat model with concrete consequences; render output as text; never auto-run saved or imported code; preserve corrupt data; export/import. | **Accepted** | README "Security", About page. Output is rendered as React text. Corrupt values are copied to `pil:v1:corrupt:*`. Export/import is on the About page; imports are validated and never executed. |
| 5a | Pin the whole Pyodide asset set and deployment actions. | **Accepted** | `pyodide` is pinned exactly in the lockfile and its files are copied at build. Workflow actions are pinned to major versions plus `npm ci` from the lockfile. See §8 for SHA pinning. |
| 6 | Curriculum as a coverage matrix, not a count; prioritise interview mistakes; label version-specific features; separate "passed", "used hints" and "viewed solution". | **Accepted** | Every topic has recipes and drills linked both ways (validated). 10 repair drills and 13 idiom drills target the listed misconceptions. `minPython` badges are shown. Hints shown and solution viewed are stored separately from solves. |
| 6a | Phone layout with Learn/Practice/Output *tabs*. | **Modified** | We used a vertical stack instead: problem, then editor with a key row, then per-case results. The top nav already offers Cheatsheet/Practice/Playground. Results sit directly under Run, so tabs would hide the feedback that the next action depends on. |
| 7 | Release gates: corpus, recovery, races, 5 s / 64 KiB limits, persistence edge cases, Chromium + Firefox + WebKit, and **real iOS / Android devices**. | **Accepted except real devices** | All automated gates pass (see the build report). Real-device testing was **not performed**: Playwright touch emulation is not evidence of iOS Safari or Android Chrome software-keyboard behaviour. This is stated in the README. |
| 7a | Deployment: relative base, hash routing, build/test on feature branches and `dev`, keep the previous artifact. | **Accepted** | `base: './'` plus hash routes; E2E runs against the production build served at `/python-interview-lab/`. The Pages workflow publishes only from `dev`, with a stale-SHA guard. Rollback means re-running the workflow on an earlier commit or reverting. |

## 8. Known limitations and follow-ups

- Real-device mobile testing (iOS Safari, Android Chrome) has not been done.
- No offline-first mode. A service worker could cache the runtime, but it adds update and invalidation complexity, so it was deliberately left out.
- GitHub Actions in the workflows are pinned by major version tag. Pinning to full commit SHAs would harden the supply chain further.
- The browser runs Python 3.14. The portability check guards a 3.11 floor for content, but your own code may still use newer features without warning.
- Deep recursion in Pyodide can exhaust the WebAssembly stack before Python's `RecursionError` is raised. The worker reports this as a crash with an explanation, and the next run starts clean.

## 9. Content review

An independent, read-only technical review of the curriculum's prose found 25 issues before release, and all of them were addressed:

- Incorrect claims were fixed. Most importantly, a C operator-precedence rule had been stated as Python's: in Python, `x & 1 == 0` is `(x & 1) == 0`. Other fixes: JavaScript `-7 / 2` is `-3.5`, `range` is an indexable sequence, `math.lcm` is new in 3.9, and union-find uses path *halving*, with honest complexity bounds.
- Misleading wording was tightened.
- LeetCode's own example data was replaced with original data. Every new expected value was recomputed by the corpus test.
- Four recipes were added for idioms that were missing: `groupby`, `for`/`else`, `find` vs `index`, and binary-string conversion.
