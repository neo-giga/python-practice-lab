// Skill-drill files registry: ONE line per file, `export { <name> } from './<file>';`
// Each file exports a `SkillDrill[]`. The drill bank is the concatenation of all exports here.
//
// Drill writers: add exactly one line, in your own section, and touch nothing else.

// --- Writer A (examples) ---
export { exampleDrills } from './_examples';

// --- Writer B (Tier 1 skills) ---

// --- Writer C (Tier 2-3 skills and traps) ---

// --- Writer D (algorithm templates) ---
export { dAlgoBfsDrills } from './d-algo-bfs';
export { dAlgoDfsDrills } from './d-algo-dfs';
export { dAlgoBinarySearchDrills } from './d-algo-binary-search';
export { dAlgoBacktrackingDrills } from './d-algo-backtracking';
export { dAlgoSlidingWindowDrills } from './d-algo-sliding-window';
export { dAlgoTwoPointersDrills } from './d-algo-two-pointers';
export { dAlgoTreeTraversalDrills } from './d-algo-tree-traversal';
export { dAlgoDpDrills } from './d-algo-dp';
export { dAlgoHashmapCountingDrills } from './d-algo-hashmap-counting';
