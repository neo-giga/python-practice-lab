# Design

The visual system of Python Practice Lab, as built in M1 (`src/styles/app.css`, `src/components/ui.tsx`,
`src/components/Icon.tsx`). It replaces the pre-M1 look (teal-on-cream docs template, no type scale, one button style),
which the baseline critique rated 28/40 heuristics, 12/20 audit.

## Direction

A calm, professional developer tool. Operate mode for Today, Plan, Problems, the problem workspace and the Playground;
Read mode for the Reference. Patterns the visitor already knows (left rail, bottom tabs, segmented controls, split
panes) do the work; the brand lives in precise details and one signature element.

**Signature element: ticks.** A row of small vertical bars, one per test case or per plan item, filled by state
(pass/done green, fail red, attempted amber, with-help half-filled, current accent, not yet gray). It appears in the
verdict after every run, in each week header of the plan, and in Today's progress strip, so "how am I doing" reads
the same everywhere. Ticks always carry a text label (`role="img"` + `aria-label`); colour is never the only signal.

## Colour

Restrained: neutral grays with fixed roles, one accent, three semantic hues. Every colour is a custom property;
light and dark are two token blocks. Dark follows `prefers-color-scheme` unless `data-theme` on `<html>` overrides it
(toggle in the rail/top bar, stored as `pil:v1:theme`, applied before first paint by an inline script).

| Token | Role | Light | Dark |
|---|---|---|---|
| `--bg` | page | `#fafafa` | `#0b0b0c` |
| `--surface` | cards, panes, inputs | `#ffffff` | `#121214` |
| `--gray-100` | subtle fill (code chips, hover rows) | `#f4f4f5` | `#18181b` |
| `--gray-200` | hover fill, selected nav, segmented track | `#ececee` | `#1f1f23` |
| `--gray-300` | dividers, empty ticks | `#e2e2e5` | `#2a2a2f` |
| `--gray-400` | borders | `#dadadf` | `#303036` |
| `--gray-500` | hover border | `#c8c8ce` | `#3c3c43` |
| `--gray-600` | strong border, disabled | `#a9a9b1` | `#55555e` |
| `--gray-700` | icons | `#85858e` | `#73737d` |
| `--gray-800` | tertiary text | `#6c6c75` | `#8f8f99` |
| `--gray-900` | secondary text | `#5b5b63` | `#a6a6af` |
| `--gray-1000` | primary text | `#18181b` | `#ededf0` |
| `--accent` | primary button, current nav icon, focus ring, current tick | `#3e63dd` (hover `#3358d4`) | `#4467e0` (hover `#3a5bd0`; white text ≥ 4.9:1) |
| `--accent-text` / `--accent-subtle` | links / selected fills | `#3451c2` / `#edf2fe` | `#9db1ff` / `#17203d` |
| `--pass*` | pass, solved, Easy | `#1f7a4d` on `#e9f6ee`, solid `#30a46c` | `#4cc38a` on `#10251b` |
| `--fail*` | fail, Hard, destructive | `#c62a2f` on `#fdeded`, solid `#e5484d` | `#ff8f8a` on `#2f1214` |
| `--hint*` | hints, traps, Medium, attempted, warnings | `#9a4d00` on `#fff5d6`, solid `#f5a524` | `#f5c24b` on `#2a1f08` |

The accent is used for exactly: the one primary action per region, the active navigation icon, focus, selection, and
the current tick. Code colours (`--tok-*`, `--code-bg`) are tokens too, so the CodeMirror editor and static code blocks
switch with the theme.

## Typography

Geist Sans (UI and prose) and Geist Mono (code, data), OFL, self-hosted from npm (`@fontsource-variable/*`, Latin
subset loaded by `unicode-range`; no font CDN). Scale: 12 / 13 / 14 / 15 (body) / 17 / 21 / 26 / 34 px; weights 400,
500, 600 only. Headings use `text-wrap: balance`, tracking -0.015 to -0.03em. Prose measure ≤ 70ch. Tabular numerals for
counts and minutes. Code is 13.5 px, 16 px on coarse pointers.

## Shape, space, elevation

Radii: 6 px controls, 10 px surfaces, 14 px the next-problem card and data card, pills only for small tags and chips.
Spacing steps 4/8/12/16/24/32/40. Elevation is a border, not a shadow; only popovers, drawers and sheets get
`--shadow-pop`.

## Components

- **Buttons:** one system. `.btn-primary` (filled accent, one per region: Start, Submit, Build my plan),
  `.btn-secondary` (outlined: Run examples, Edit plan, Export), `.btn-quiet` (text with hover fill: Print, Reset, Show
  solution, Back), `.btn-danger` (Stop). 40 px high, 44 px on touch.
- **Choice cards** (onboarding): radio semantics, a tap on a card advances to the next question; keyboard selection does
  not auto-advance. **Presets** labelled by prep time.
- **Segmented control** for filters (difficulty, status, level, time limit) instead of native selects; **chips** for
  multi-select (patterns, difficulties); **switch** for booleans; **disclosure** rows with a drawn chevron.
- **Item rows:** status mark (drawn icon + hidden label), title (whole row is the link), "Why this?" line, difficulty
  tag, minutes.
- **Verdict:** icon + one-line verdict ("2 of 3 cases passed · first failure: case 1"), mode and duration, case ticks;
  cases as compact rows, the first failure expanded with Input / Expected / Actual.
- **Trap callout** (Reference): amber tinted block with a "Trap" label; code and its expected output side by side at
  ≥ 1280 px.
- **Icons:** one authored 24-unit set, 1.75 stroke, round caps (`Icon.tsx`). No emoji or Unicode glyphs as icons.

## Layout

- **≥ 1200 px:** 232 px left rail (sections, About and theme at the bottom). **768–1199 px:** 84 px rail with stacked
  labels. **< 768 px:** 52 px top bar (brand, theme) and a bottom tab bar (Today, Plan, Problems, More → sheet with
  Fluency, Reference, Playground, About).
- **Problem workspace ≥ 1024 px:** resizable two-pane split (statement left; editor, Run examples/Submit, results right),
  keyboard-resizable separator. **< 1024 px:** bottom tabs Problem / Code / Result above a sticky Run examples + Submit
  bar; the run switches to Result automatically; hints, solution and code settings live in a bottom sheet; the editor
  stays mounted across tabs.
- No horizontal overflow at 320–1440 px (tested).

## Motion

Minimal and functional: 120–160 ms colour transitions, chevron rotation, sheet/drawer entrance (260 ms, exponential
ease-out), and the current tick's slow pulse. All disabled under `prefers-reduced-motion`.

## Browser surfaces

Themed `::selection`, caret (accent), focus ring (2 px accent, 2 px offset), scrollbars in panes, `color-scheme` and
`theme-color` per theme, `touch-action: manipulation`, no tap highlight.
