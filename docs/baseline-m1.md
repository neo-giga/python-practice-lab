# Baseline before Practice Lab M1

Recorded 2026-10-31 on `origin/dev` 600587a (tree equal to `e5f1415`), Node 26.8.1, macOS, before any M1 change.

| Check | Result |
|---|---|
| `npm ci` | OK |
| `npm run typecheck` | PASS |
| `npm run test:unit` | 34 passed (5 files) |
| `npm run test:corpus` (Pyodide 314.0.7, CPython 3.14.2) | 258 passed |
| `npm run test:portability` (CPython 3.11.16) | 130 passed, 0 failed, 2 skipped (`max-heap` needs 3.14, `version-features` needs 3.12) |
| `npm run build` | OK |
| `npm run test:e2e` (Chromium 375/768/1440, Firefox + WebKit `@runtime`) | 83 passed, 2 skipped (85 listed; the drawer specs skip themselves at 1440) |

Content: 25 topics, 74 recipes, 58 drills (39 LeetCode-style, 19 Python fluency), 0 coding problems.

## Bundle sizes (`vite build`)

| Asset | Raw | gzip |
|---|---|---|
| `index-*.js` (app + all content) | 521.45 kB | 166.31 kB |
| `RunOutput-*.js` (CodeMirror, lazy) | 374.51 kB | 121.08 kB |
| `Practice-*.js` (lazy) | 11.95 kB | 3.93 kB |
| `Playground-*.js` (lazy) | 6.10 kB | 2.42 kB |
| `python.worker-*.js` | 17.55 kB | — |
| `index-*.css` | 15.57 kB | 4.51 kB |
| Pyodide runtime (first Run only) | ≈ 13.5 MB | ≈ 6.3 MB |

No runtime download happens before the first Run.
