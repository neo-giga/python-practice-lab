import { topics } from './topics';
import { syntaxRecipes } from './recipes-syntax';
import { libraryRecipes } from './recipes-library';
import { patternRecipes } from './recipes-patterns';
import { syntaxExercises } from './exercises-syntax';
import { libraryExercises } from './exercises-library';
import { patternExercises } from './exercises-patterns';
import type { Exercise, Recipe } from './schema';
import { codingProblems } from './problems/index';

export { topics, codingProblems };
export const recipes: Recipe[] = [...syntaxRecipes, ...libraryRecipes, ...patternRecipes];
/** All 58 drills as they existed before M1 (used for legacy links and backups). */
export const legacyExercises: Exercise[] = [...syntaxExercises, ...libraryExercises, ...patternExercises];
/** The Python fluency track: drills that were not upgraded to coding problems. */
export const exercises: Exercise[] = legacyExercises.filter((e) => !codingProblems.some((p) => p.id === e.id && p.legacy));
