// Writer D: intervals template drills (algo-intervals).
import { py } from '../schema';
import type { SkillDrill } from '../drill-schema';

export const dAlgoIntervalsDrills: SkillDrill[] = [
  {
    id: 'iv-merge-max-end-fix',
    version: 1,
    title: 'Fix the interval merge',
    skills: ['algo-intervals', 'sorting'],
    kind: 'fix',
    prompt: '`merge(intervals)` should return the merged `[start, end]` intervals in order; touching intervals such as `[1, 2]` and `[2, 3]` merge. A short interval inside a long one cuts the long one short. Fix it.',
    signature: 'def merge(intervals: list[list[int]]) -> list[list[int]]',
    starter: py`
      def merge(intervals: list[list[int]]) -> list[list[int]]:
          out = []
          for start, end in sorted(intervals):
              if out and start <= out[-1][1]:
                  out[-1][1] = end
              else:
                  out.append([start, end])
          return out
    `,
    solution: py`
      def merge(intervals: list[list[int]]) -> list[list[int]]:
          out = []
          for start, end in sorted(intervals):
              if out and start <= out[-1][1]:
                  out[-1][1] = max(out[-1][1], end)
              else:
                  out.append([start, end])
          return out
    `,
    why: 'After sorting by start, an overlapping interval can still end earlier than the merged one, so the merged end is the `max` of both ends.',
    hints: ['Trace `[[1, 10], [2, 3]]`.', 'Extend with `max(out[-1][1], end)`.'],
    wrong: [
      // Does not sort first, so an earlier interval later in the input is never merged.
      py`
        def merge(intervals: list[list[int]]) -> list[list[int]]:
            out = []
            for start, end in intervals:
                if out and start <= out[-1][1]:
                    out[-1][1] = max(out[-1][1], end)
                else:
                    out.append([start, end])
            return out
      `,
      // `<` leaves touching intervals apart.
      py`
        def merge(intervals: list[list[int]]) -> list[list[int]]:
            out = []
            for start, end in sorted(intervals):
                if out and start < out[-1][1]:
                    out[-1][1] = max(out[-1][1], end)
                else:
                    out.append([start, end])
            return out
      `,
    ],
    grading: { entry: 'merge', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[[1, 10], [2, 3]]', expected: '[[1, 10]]' },
      { args: '[[6, 8], [1, 9], [2, 4]]', expected: '[[1, 9]]' },
      { args: '[[3, 4], [1, 2]]', expected: '[[1, 2], [3, 4]]' },
      { args: '[[1, 2], [2, 3]]', expected: '[[1, 3]]' },
      { args: '[[1, 4], [0, 0]]', expected: '[[0, 0], [1, 4]]' },
      { args: '[[5, 6]]', expected: '[[5, 6]]' },
      { args: '[]', expected: '[]' },
    ],
    provenance: 'original',
  },
  {
    id: 'iv-max-overlap-sweep',
    version: 1,
    title: 'Write the sweep: most bookings at once',
    skills: ['algo-intervals', 'sorting'],
    kind: 'write',
    prompt: 'Each `[start, end]` books a room for the half-open time `[start, end)`. Return the most bookings that overlap at any moment (so `[1, 3]` and `[3, 5]` never overlap). Sweep sorted start and end events.',
    signature: 'def max_overlap(intervals: list[list[int]]) -> int',
    starter: py`
      def max_overlap(intervals: list[list[int]]) -> int:
          return min(len(intervals), 1)
    `,
    solution: py`
      def max_overlap(intervals: list[list[int]]) -> int:
          events = sorted([(s, 1) for s, e in intervals] + [(e, -1) for s, e in intervals])
          rooms = best = 0
          for _, delta in events:
              rooms += delta
              best = max(best, rooms)
          return best
    `,
    why: '`(t, -1)` sorts before `(t, 1)`, so at equal times a room is freed before the next booking takes one, which is what half-open intervals mean.',
    hints: ['Turn each booking into a `+1` event at its start and a `-1` event at its end.', 'Sort the events; check what happens when an end and a start share a time.'],
    wrong: [
      // Starts sort before ends at the same time, so touching bookings count as overlapping.
      py`
        def max_overlap(intervals: list[list[int]]) -> int:
            events = sorted([(s, 0) for s, e in intervals] + [(e, 1) for s, e in intervals])
            rooms = best = 0
            for _, kind in events:
                rooms += 1 if kind == 0 else -1
                best = max(best, rooms)
            return best
      `,
      // Counts how many bookings overlap the first one only.
      py`
        def max_overlap(intervals: list[list[int]]) -> int:
            if not intervals:
                return 0
            s0, e0 = min(intervals)
            return sum(1 for s, e in intervals if s < e0 and s0 < e)
      `,
    ],
    grading: { entry: 'max_overlap', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[[1, 5], [2, 6], [8, 9]]', expected: '2' },
      { args: '[[1, 10], [2, 9], [3, 8]]', expected: '3' },
      { args: '[[1, 3], [3, 5]]', expected: '1' },
      { args: '[[4, 6], [1, 3], [2, 5]]', expected: '2' },
      { args: '[[1, 2], [5, 9], [6, 7], [6, 8]]', expected: '3' },
      { args: '[[1, 2]]', expected: '1' },
      { args: '[]', expected: '0' },
    ],
    provenance: 'original',
  },
  {
    id: 'iv-free-gaps',
    version: 1,
    title: 'Apply merge: free gaps between bookings',
    skills: ['algo-intervals', 'sorting'],
    kind: 'write',
    prompt: 'Return the free gaps `[end, next_start]` between the bookings in `bookings` (in any order, possibly overlapping), in time order. Touching bookings leave no gap. Merge first, then read the gaps.',
    signature: 'def free_gaps(bookings: list[list[int]]) -> list[list[int]]',
    starter: py`
      def free_gaps(bookings: list[list[int]]) -> list[list[int]]:
          return []
    `,
    solution: py`
      def free_gaps(bookings: list[list[int]]) -> list[list[int]]:
          merged = []
          for start, end in sorted(bookings):
              if merged and start <= merged[-1][1]:
                  merged[-1][1] = max(merged[-1][1], end)
              else:
                  merged.append([start, end])
          return [[a[1], b[0]] for a, b in zip(merged, merged[1:])]
    `,
    why: 'Once intervals are merged, the gaps are just the spaces between neighbours: `zip(merged, merged[1:])` walks the adjacent pairs.',
    hints: ['Reuse the merge template.', 'Pair each merged interval with the next one: `zip(merged, merged[1:])`.'],
    wrong: [
      // Extends with the new end instead of max, so a nested booking reopens a gap.
      py`
        def free_gaps(bookings: list[list[int]]) -> list[list[int]]:
            merged = []
            for start, end in sorted(bookings):
                if merged and start <= merged[-1][1]:
                    merged[-1][1] = end
                else:
                    merged.append([start, end])
            return [[a[1], b[0]] for a, b in zip(merged, merged[1:])]
      `,
      // Skips merging: overlapping pairs produce negative "gaps".
      py`
        def free_gaps(bookings: list[list[int]]) -> list[list[int]]:
            ordered = sorted(bookings)
            return [[a[1], b[0]] for a, b in zip(ordered, ordered[1:]) if a[1] != b[0]]
      `,
    ],
    grading: { entry: 'free_gaps', kind: 'function', compare: 'exact' },
    cases: [
      { args: '[[1, 3], [6, 7], [2, 4]]', expected: '[[4, 6]]' },
      { args: '[[5, 6], [1, 2], [3, 4]]', expected: '[[2, 3], [4, 5]]' },
      { args: '[[1, 10], [2, 3], [11, 12]]', expected: '[[10, 11]]' },
      { args: '[[1, 2], [2, 3]]', expected: '[]' },
      { args: '[[1, 2]]', expected: '[]' },
      { args: '[]', expected: '[]' },
    ],
    provenance: 'original',
  },
];
