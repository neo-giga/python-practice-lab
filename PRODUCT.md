# Product

<!-- impeccable:product-schema 1 -->

Source of these facts: the M1 spec (`plans/2026-10-31-python-practice-lab-m1.md`, decisions D1–D7) and the existing
repository. The owner delegated every product decision for M1; nothing below was invented beyond that spec.

## Platform

web

## Users

One primary user today: the owner, a staff engineer preparing for coding interviews, practising on phone, tablet and
desktop, often in short sessions. The product is public and works for anyone in the same situation: a developer who
knows some Python and needs structured, time-boxed practice on LeetCode-style problems.

## Product Purpose

Python Practice Lab is a general Python practice lab. Milestone 1 ships one primary track, **Coding interview
(LeetCode-style)**: the learner states time left, hours per week, level and an optional focus, and gets a week-by-week
plan of original problems that are graded in the browser by real CPython (Pyodide). A secondary **Python fluency**
track (19 drills), a **Reference** of 74 runnable recipes, and a **Playground** stay available without a plan.

Success: the learner always knows the next problem and why it was picked, gets truthful feedback on every submit, and
never loses work.

## Positioning

- The plan is generated from the learner's preferences by a deterministic, explainable generator over a pattern
  prerequisite graph, and it adapts to results (review after a pass; an easier sibling and a retry after repeated
  failure). Mainstream study plans are fixed lists.
- Every problem is original and its point is the **Python** that expresses the algorithm (an idiom note per problem,
  links into the Reference). It is a Python lab, not a LeetCode mirror.
- Everything runs locally: real CPython in a worker, no account, no server, progress in the browser.

## Operating Context

Short practice sessions on a phone (often one-handed), longer ones on a tablet or laptop. Typical loop: open Today →
start the next problem → read → code → Run examples → Submit → next. Interviews themselves happen elsewhere; the lab
is preparation.

## Capabilities and Constraints

- Static site on GitHub Pages under `/python-practice-lab/`; hash routes; storage namespace `pil:v1:` (never renamed).
- Python runs only in a fresh Pyodide worker per run (about 13.5 MB, downloaded on the first Run only); Stop
  terminates the worker. Speed is not graded.
- Run examples never records a solve; Submit records attempt, outcome and whether help was used.
- Legacy links (`#/practice/<id>`, `#/learn…`) keep working.
- Out of scope for M1: accounts/sync, server, LLM-generated problems, other tracks' content, offline/PWA claims.

## Brand Commitments

- Name in the UI: **Python Practice Lab**. Repository and URL keep the old name.
- Voice: plain, precise, sentence case, no hype. Errors say what happened and what to do next.
- Original content, MIT licensed; never copy LeetCode statements, titles or examples, or CC BY-NC lists.

## Evidence on Hand

- 41 coding problems at the time of writing (39 upgraded drills + 2 templates); content writers are adding more.
- No testimonials, user counts or benchmarks exist; do not invent any.

## Product Principles

1. The next action is always one tap away and explains itself.
2. Feedback is truthful: real CPython, type-strict grading, no grading of things we cannot measure reliably.
3. Never lose work: drafts, solves and plans survive reloads, version changes and imports.
4. Python first: each problem teaches an idiom, not just an algorithm.
5. Calm tool, not a game: no streak pressure, no forced re-solves beyond a capped review lane.

## Accessibility & Inclusion

Keyboard operable throughout (visible focus, skip link, drawer/sheet focus management), non-colour status labels,
reduced motion respected, 44 px touch targets on coarse pointers, 16 px code on touch devices (no iOS zoom), light and
dark themes. Real-device software-keyboard behaviour is untested.
