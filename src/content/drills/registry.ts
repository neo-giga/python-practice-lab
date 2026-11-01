// Skill-drill files registry: ONE line per file, `export { <name> } from './<file>';`
// Each file exports a `SkillDrill[]`. The drill bank is the concatenation of all exports here.
//
// Drill writers: add exactly one line, in your own section, and touch nothing else.

// --- Writer A (examples) ---
export { exampleDrills } from './_examples';

// --- Writer B (Tier 1 skills) ---
export { loopsRangeDrills } from './b-loops-range';
export { indexingLenDrills } from './b-indexing-len';
export { assignSwapDrills } from './b-assign-swap';
export { recursionHelpersDrills } from './b-recursion-helpers';
export { whileLoopsDrills } from './b-while-loops';
export { listBasicsDrills } from './b-list-basics';
export { builtinsAggregateDrills } from './b-builtins-aggregate';
export { enumerateZipDrills } from './b-enumerate-zip';
export { comprehensionsDrills } from './b-comprehensions';
export { intMathDrills } from './b-int-math';
export { grids2dDrills } from './b-grids-2d';

// --- Writer C (Tier 2-3 skills and traps) ---
export { bitOpsDrills } from './c-bit-ops';
export { conditionalExprDrills } from './c-conditional-expr';
export { slicingDrills } from './c-slicing';
export { membershipDrills } from './c-membership';
export { dictCounterDrills } from './c-dict-counter';
export { infinityDrills } from './c-infinity';
export { sortingDrills } from './c-sorting';
export { nodesDrills } from './c-nodes';
export { typeConversionDrills } from './c-type-conversion';
export { setsDrills } from './c-sets';
export { stringsDrills } from './c-strings';
export { trapMutabilityDrills } from './c-trap-mutability';
export { trapNumbersRuntimeDrills } from './c-trap-numbers-runtime';
export { dequeDrills } from './c-deque';
export { memoCacheDrills } from './c-memo-cache';
export { heapqDrills } from './c-heapq';
export { itertoolsDrills } from './c-itertools';
export { bisectDrills } from './c-bisect';
export { nonlocalDrills } from './c-nonlocal';
export { anyAllDrills } from './c-any-all';
