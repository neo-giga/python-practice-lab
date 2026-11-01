// Interview weight of an algorithm template, from the Grind 75 topic tags in frequency.json `algorithms`.
// Its own module so skills.ts and skills-algorithms.ts (which skills.ts imports) can both use it
// without a circular import.
import frequency from './frequency.json';

/** Share of the interview list's problems tagged with any of `tags` (tag shares summed, an upper bound on the union, capped at 1). */
export const interviewShare = (...tags: string[]): number => {
  const a = frequency.algorithms as Record<string, { share: number }>;
  return Math.min(1, Math.round(tags.reduce((t, k) => t + (a[k]?.share ?? 0), 0) * 1e4) / 1e4);
};
