// FIX ROUND 2 #6: review completion end to end, with seeded DATED storage (relative to the
// browser's own "today"). An assisted solve two days ago scheduled a review due today.
// Submit (pass) completes it; a later failing Submit does not reopen it; a reload keeps it done.
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { setEditor, watchErrors } from './helpers';

const RIGHT = 'def pair_indexes(nums, target):\n    seen = {}\n    for j, x in enumerate(nums):\n        if target - x in seen:\n            return [seen[target - x], j]\n        seen[x] = j\n    return []';
const WRONG = 'def pair_indexes(nums, target):\n    return [0, 1]';
const narrow = (info: TestInfo) => (info.project.use.viewport?.width ?? 1440) < 1024;

async function seed(page: Page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return; // seed once; reloads keep the app's own writes
    sessionStorage.setItem('seeded', '1');
    const d = new Date();
    const today = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000); // same rule as dayOf()
    const twoDaysAgo = (today - 2) * 86_400_000 + 12 * 3_600_000 + d.getTimezoneOffset() * 60_000;
    const prefs = { schema: 1, weeks: 2, hoursPerWeek: 6, level: 'rusty', patterns: ['arrays-hashing'], difficulties: ['easy', 'medium'], fluencyWarmups: false, reviewLane: true };
    const item = (lane: string, reasons: string[], extra = {}) => ({ problemId: 'two-sum-indexes', version: 2, kind: 'problem', lane, reasons, estMinutes: 15, ...extra });
    const plan = {
      schema: 1, generatorVersion: 1, catalogVersion: 'seeded', prefsHash: 'seeded', seed: 'seeded', startDay: today - 2, generatedDay: today - 2,
      weeks: [
        { index: 0, budgetMinutes: 360, items: [item('new', ['selected-topic']), item('review', ['review-due'], { dueDay: today })] },
        { index: 1, budgetMinutes: 360, items: [] },
      ],
      shortfall: null, unscheduled: 0,
    };
    const solve = { version: 2, at: twoDaysAgo, sourceHash: 'seeded', assisted: true };
    localStorage.setItem('pil:v1:prefs', JSON.stringify(prefs));
    localStorage.setItem('pil:v1:plan', JSON.stringify(plan));
    localStorage.setItem('pil:v1:progress', JSON.stringify({ schema: 1, exercises: { 'two-sum-indexes': { attempts: 1, lastStatus: 'passed', lastRunAt: twoDaysAgo, solved: solve, hintsShown: 2, solutionViewed: false } } }));
    localStorage.setItem('pil:v1:attempts', JSON.stringify({ schema: 1, items: [{ problemId: 'two-sum-indexes', version: 2, sourceHash: 'seeded', outcome: 'pass', assisted: true, at: twoDaysAgo }] }));
  });
}

const reviewRow = (page: Page) => page.locator('[data-testid=plan-item][data-lane=review][data-id=two-sum-indexes]');

test('Submit completes a due review; a later failure and a reload keep it complete @device', async ({ page }, info) => {
  const w = watchErrors(page);
  await seed(page);

  // Today offers the review (it is due today), and the plan shows it as not done.
  await page.goto('#/');
  await expect(page.getByTestId('next-card')).toContainText('Next review');
  await expect(page.getByTestId('next-card')).toContainText('Pair indexes with a value index');
  await page.goto('#/plan');
  await expect(reviewRow(page)).toHaveAttribute('data-state', 'todo');

  // Submit a correct solution: the review is done.
  await page.goto('#/p/two-sum-indexes');
  if (narrow(info)) await page.getByTestId('tab-code').click();
  await setEditor(page, RIGHT);
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('run-summary')).toContainText('All 5 cases passed', { timeout: 90_000 });
  await page.goto('#/plan');
  await expect(reviewRow(page)).toHaveAttribute('data-state', 'done');
  await page.goto('#/');
  await expect(page.getByTestId('next-card')).not.toContainText('Next review');

  // A later failing Submit does not reopen it.
  await page.goto('#/p/two-sum-indexes');
  if (narrow(info)) await page.getByTestId('tab-code').click();
  await setEditor(page, WRONG);
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('run-summary')).toContainText('cases passed · first failure', { timeout: 90_000 });
  await page.goto('#/plan');
  await expect(reviewRow(page)).toHaveAttribute('data-state', 'done');

  // Reload: still done, from the durable per-instance record.
  await page.reload();
  await expect(reviewRow(page)).toHaveAttribute('data-state', 'done');
  const reviews = JSON.parse((await page.evaluate(() => localStorage.getItem('pil:v1:reviews')))!);
  const rec = Object.entries(reviews.items as Record<string, { startedDay?: number; doneDay?: number }>).find(([k]) => k.startsWith('review:two-sum-indexes:'));
  expect(typeof rec?.[1].doneDay).toBe('number');
  expect(w.errors).toEqual([]);
});
