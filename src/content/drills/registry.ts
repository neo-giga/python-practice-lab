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

// --- Writer C (Tier 2-3 skills and traps) ---
