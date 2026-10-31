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
export const exercises: Exercise[] = [...syntaxExercises, ...libraryExercises, ...patternExercises];
