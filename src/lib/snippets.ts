import { skillById } from '../content/skills';
import { curatedReference } from '../content/curated-reference';

/** Namespaced, stable content IDs; never execute a snippet during navigation. */
export function findSnippet(id: string) {
  if (id.startsWith('skill:')) {
    const skill = skillById.get(id.slice(6));
    if (skill?.cheat) return { title: skill.title, code: skill.cheat.syntax };
  }
  if (id.startsWith('reference:')) return curatedReference.find((r) => r.id === id.slice(10));
  return undefined;
}
