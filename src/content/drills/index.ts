// The skill-drill bank: every SkillDrill registered in ./registry.ts.
import type { SkillDrill } from '../drill-schema';
import * as registry from './registry';

/** Module namespace keys are sorted, so this order is stable across builds. */
export const skillDrills: SkillDrill[] = Object.values(registry as Record<string, SkillDrill[]>).flat();
