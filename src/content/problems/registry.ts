// Problem files registry: ONE line per file, `export { <name> } from './<file>';`
// Each file exports a `CodingProblem[]`. The catalog is the concatenation of all
// exports here (order does not matter: the generator sorts deterministically).
//
// Content writers: add exactly one line, in your own section, and touch nothing else.

// --- Writer A (examples and upgraded drills) ---
export { exampleProblems } from './_examples';
export { upgradedProblems } from './upgraded';

// --- Writer B (arrays-hashing, two-pointers, sliding-window, stack, binary-search,
//     linked-list, intervals, greedy, math) ---
export { bArraysHashingProblems } from './b-arrays-hashing';
export { bTwoPointerProblems } from './b-two-pointers';
export { bSlidingWindowProblems } from './b-sliding-window';
export { bStackProblems } from './b-stack';
export { bBinarySearchProblems } from './b-binary-search';
export { bLinkedListProblems } from './b-linked-list';
export { bIntervalProblems } from './b-intervals';
export { bGreedyProblems } from './b-greedy';
export { bMathProblems } from './b-math';

// --- Writer C (trees, tries, heap, backtracking, graphs, topo-sort, shortest-paths,
//     dp-1d, dp-2d) ---
export { cShortestPathsProblems } from './c-shortest-paths';
export { cTopoSortProblems } from './c-topo-sort';
export { cTriesProblems } from './c-tries';
export { cDp2dProblems } from './c-dp-2d';
export { cDp1dProblems } from './c-dp-1d';
export { cGraphsProblems } from './c-graphs';
export { cTreesProblems } from './c-trees';
export { cHeapProblems } from './c-heap';
export { cBacktrackingProblems } from './c-backtracking';
