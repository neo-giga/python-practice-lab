# Python Practice Lab

A practice lab for Python. The first track is **LeetCode-style coding problems in a plan built from your preferences**: say how long you have, how many hours a week, where you stand and (optionally) what to focus on, and you get a week-by-week plan of original problems, graded in your browser by real CPython compiled to WebAssembly ([Pyodide](https://pyodide.org/)). No install, no account, no backend.

**Website: <https://neo-giga.github.io/python-practice-lab/>** · [Today](https://neo-giga.github.io/python-practice-lab/#/) · [Problems](https://neo-giga.github.io/python-practice-lab/#/problems) · [Reference](https://neo-giga.github.io/python-practice-lab/#/learn) · [Playground](https://neo-giga.github.io/python-practice-lab/#/playground)

| Today on a desktop | Problem workspace on a desktop | Problem on a phone | Plan on a tablet |
| --- | --- | --- | --- |
| ![](docs/screenshots/desktop-1440-today.png) | ![](docs/screenshots/desktop-1440-problem-result.png) | ![](docs/screenshots/phone-375-problem-result.png) | ![](docs/screenshots/tablet-768-plan.png) |

## What it is

| | Content |
| --- | --- |
| **Coding interview track** | Original LeetCode-style problems across 22 patterns (12 core, 10 secondary), each with worked examples, constraints, three progressive hints, a reference solution with complexity, and an idiom note: the Python point of the problem. **Run examples** tries only the examples and never records a solve; **Submit** checks every case, including edge cases and a larger input. |
| **Your plan** | A deterministic, explainable generator orders patterns by prerequisites (hashing before two pointers, trees before graphs), fits your hours (estimate × 1.6), interleaves patterns, and says *why* each problem is there. It adapts: a pass schedules a review (7 days, or 2 if you needed help); three failed submits and leaving bring an easier sibling next and a retry 3 days later. Stop, timeouts and load failures never count against you. Preferences live in the plan URL, so a link reproduces the plan. |
| **Python fluency** | 19 short drills on the language itself: implement, repair a pitfall, apply an idiom. |
| **Reference** | 74 runnable recipes in 25 topics: what and when, code, its exact output, complexity, and the trap interviewers look for. Also in [`docs/CHEATSHEET.md`](docs/CHEATSHEET.md). |
| **Playground** | Free-form code with stdout, stderr, tracebacks, stdin, Stop and a time limit. |

Problem authors: see [`docs/AUTHORING.md`](docs/AUTHORING.md) (schema, grading modes, the `npm run gate -- <file>` corpus gate, originality rules). The design system is described in [`DESIGN.md`](DESIGN.md) and the product in [`PRODUCT.md`](PRODUCT.md).

## Run it locally

Requirements: Node.js 22.12+, 24 or 26+ (the range the locked Vitest supports; tested with 26.8.1, CI uses 24) and npm.

```bash
npm ci
npm run dev        # http://localhost:5173/  (copies the Pyodide runtime into public/pyodide first)
```

Production build, served under the GitHub Pages subpath:

```bash
npm run build
npm run preview    # http://127.0.0.1:4173/python-practice-lab/
```

## Tests

```bash
npm run typecheck          # TypeScript 7 (tsc --noEmit)
npm run test:unit          # content + problem validation, plan generator, storage/migration/backup, router + legacy links, runner races (fake worker), cross-checks
npm run test:corpus        # REAL Pyodide in Node: every recipe's output; every problem/drill reference passes, starters and known-wrong solutions fail, examples execute
npm run gate -- <file>     # the same corpus gate for one problem file (for authors)
npm run test:portability   # the same corpus under native CPython 3.11 (needs `uv`); items marked 3.12+/3.14 are skipped
npx playwright install chromium firefox webkit   # once
npm run build && npm run test:e2e   # real browsers, real Pyodide: 375×812, 768×1024, 1440×900 in Chromium; runtime checks in Firefox and WebKit
npm run cheatsheet         # regenerate docs/CHEATSHEET.md after editing content
```

`npm run check` runs typecheck, unit + corpus tests, the build and the E2E suite in sequence.

The **mocked** tests are only the deterministic boundary tests: runner load failure, timeouts and Stop races (a fake worker), storage corruption and quota errors, and injected network failures in the browser. Every test that claims Python behaviour uses the real runtime.

## Runtime and network

| Item | Version |
| --- | --- |
| Pyodide | 314.0.7 (npm `pyodide`, pinned in `package-lock.json`) |
| CPython inside Pyodide | 3.14.2 |
| Editor | CodeMirror 6 with `@codemirror/lang-python` |
| App | React 19.3, Vite 8.3, TypeScript 7.0 |

- The runtime is **self-hosted**. At build time it is copied from the exact npm package into `dist/pyodide/`, and it is served from the same origin as the app. No CDN is used at runtime.
- **Download size:** the runtime is about 13.5 MB uncompressed (about 6.3 MB with gzip). It downloads only when you first press Run, and the browser caches it afterwards. Reading the cheatsheet never needs it.
- After the page has loaded, the cheatsheet keeps working if the network drops (tested). This is **not** an offline-first app: there is no service worker, and a cold visit needs the network.

## Browser support and limits

- Tested with Playwright in Chromium 156, Firefox 157 and WebKit 27.2, at phone, tablet and desktop viewport sizes.
- **Not verified on real devices.** Touch and viewport emulation does not prove iOS Safari or Android Chrome behaviour, especially for software keyboards. Treat real mobile devices as untested.
- On touch screens, an extra key row (Tab, dedent, `: ( ) [ ] { } " _ =`) appears under the editor. The editor font is 16 px on phones so that iOS does not zoom on focus.
- Keyboard: Ctrl/⌘ + Enter runs the code. In the editor, Tab indents; press **Esc, then Tab** to move focus out.

## Your data

Your plan, progress, drafts and playground code are stored **only in this browser** (localStorage, keys `pil:v1:*`). There is no account, sync, analytics or server. If saving fails (private mode, quota, corrupt data), a warning is shown and the app keeps working in memory. Unreadable data is kept under a `pil:v1:corrupt:*` key instead of being deleted. Use **About → Export/Import progress** to move between browsers.

A problem or drill counts as **solved** only when a specific version of your code passes every case of its current version (for problems: on Submit). Viewing the solution is tracked as "solved after viewing the solution". A later failing run does not erase an earlier solve.

## Architecture, isolation and cancellation

Read [`docs/architecture.md`](docs/architecture.md), which covers decisions, prior art and the design review. In short:

- Each Run or grading creates a **fresh module worker with a fresh interpreter** and then terminates it. Python never runs on the UI thread.
- The UI thread owns two deadlines: one for startup (90 s) and one for execution (5 s by default; the Playground offers 2, 5, 10 or 30 s). **Stop** and both timeouts call `worker.terminate()`. This needs neither `SharedArrayBuffer` nor cross-origin isolation headers, so it works on GitHub Pages.
- Only one run can be active at a time. Results carry the identity of the run and of the source, so a stale result can never grade a different drill or draft. Leaving a page stops its run.
- Combined stdout and stderr are capped at 64 KiB per run, inside the worker, before anything is posted to the page. Per-case reports and reprs are bounded too.
- Grading happens in Python (`src/runtime/harness.py`), never by comparing printed output or JavaScript-converted values. The comparison is type-strict, and each drill states its comparison policy (unordered, in-place mutation, linked list or tree shape, and so on).

**Security:** the worker isolates *responsiveness*, not security. Code in Pyodide can reach browser APIs, including the network, with this page's permissions. Stop cannot prevent memory exhaustion. Tests and solutions ship with the page, so scores are self-study feedback, not credentials. Saved or imported code never runs automatically.

## Deploying (GitHub Pages)

`.github/workflows/ci.yml` runs on pull requests and pushes. It installs from the lockfile and runs the typecheck, the unit and Pyodide corpus tests, the build and the Playwright suite. `.github/workflows/pages.yml` deploys `dist/` from the `dev` branch to GitHub Pages. Its deploy job has only `pages: write` and `id-token: write`, and it refuses to publish if `dev` has moved past the commit it built. The build uses a relative base and hash routes, so it works at any subpath, such as `https://<user>.github.io/python-practice-lab/`, and reloading a deep link works without a 404 fallback.

To enable it: in **Settings → Pages**, set *Source: GitHub Actions*.

## Sources and licenses

- The app code and all curriculum content (recipes, drills, tests, explanations) are original and released under the [MIT License](LICENSE).
- The curriculum was *informed by* four public solution collections and the official Python documentation. No content was copied, and their licenses are not changed by this project. See [`docs/REFERENCES.md`](docs/REFERENCES.md), which lists each source, its license, and the Python 2 relics it contains.
- Third-party software, including the shipped Pyodide runtime (MPL-2.0, which bundles CPython under the PSF license), is listed in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
