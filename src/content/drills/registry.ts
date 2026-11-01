// Skill-drill files registry: ONE line per file, `export { <name> } from './<file>';`
// Each file exports a `SkillDrill[]`. The drill bank is the concatenation of all exports here.
//
// Drill writers: add exactly one line, in your own section, and touch nothing else.

// --- Writer A (examples) ---
export { exampleDrills } from './_examples';

// --- Writer B (Tier 1 skills) ---

// --- Writer C (Tier 2-3 skills and traps) ---
export { bitOpsDrills } from './c-bit-ops';
export { conditionalExprDrills } from './c-conditional-expr';
export { slicingDrills } from './c-slicing';
export { membershipDrills } from './c-membership';
export { dictCounterDrills } from './c-dict-counter';
