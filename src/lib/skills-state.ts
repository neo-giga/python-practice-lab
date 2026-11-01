// App glue for the skill track: preferences (pil:v1:skillPrefs, additive) and per-drill state
// read from the existing progress store (drill ids share the progress namespace).
import { useSyncExternalStore } from 'react';
import { drillBank, drillById } from '../content/drill-bank';
import { skills } from '../content/skills';
import { buildSkillPlan, isSkillPrefs, type DrillState, type SkillPlan, type SkillPrefs } from './skill-plan';
import { solveState, type ProgressState } from './progress';
import { store } from '../state';

let prefs: SkillPrefs | null = store.read('skillPrefs', isSkillPrefs);
const listeners = new Set<() => void>();

export function setSkillPrefs(next: SkillPrefs | null) {
  prefs = next;
  if (next) store.write('skillPrefs', next);
  else store.remove('skillPrefs');
  for (const l of listeners) l();
}

/** Re-read after an import or "clear all data". */
export function reloadSkillPrefs() {
  prefs = store.read('skillPrefs', isSkillPrefs);
  for (const l of listeners) l();
}

export function useSkillPrefs(): SkillPrefs | null {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => prefs,
  );
}

const planCache = new Map<number, SkillPlan>();
export function planFor(p: SkillPrefs): SkillPlan {
  if (!planCache.has(p.minutesPerDay)) planCache.set(p.minutesPerDay, buildSkillPlan(skills, drillBank, p));
  return planCache.get(p.minutesPerDay)!;
}

export function drillState(p: ProgressState, drillId: string): DrillState {
  const d = drillById.get(drillId);
  const ep = p.exercises[drillId];
  if (!d) return { solved: false, missed: false };
  const s = solveState(ep, d.version);
  const solved = s === 'solved' || s === 'assisted';
  return { solved, missed: !solved && ep?.lastStatus === 'failed' };
}
