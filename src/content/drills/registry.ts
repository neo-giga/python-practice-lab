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

// --- Writer C (Tier 2-3 skills and traps) ---
