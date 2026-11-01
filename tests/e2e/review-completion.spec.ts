// Review completion end to end.
// 1. Legacy problem-plan data (FIX ROUND 2 #6), seeded DATED storage relative to the browser's own "today": an
//    assisted solve two days ago scheduled a review due today. Submit (pass) completes it; a later failing Submit
//    does not reopen it; a reload keeps it done. The problem-plan screens left the main flow with the skills
//    correction (spec Regression 1), so completion is read from its durable per-instance record, and the plan
//    screens now show the skills plan.
// 2. The skills track's equivalent: a missed drill returns in a later session's review lane; passing it there
//    clears it, and a reload keeps it cleared.
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { drillById, onboardSkills, setEditor, watchErrors } from './helpers';

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

/** The durable record of the seeded review instance (pil:v1:reviews), or undefined. */
const reviewRecord = async (page: Page) => {
  const raw = await page.evaluate(() => localStorage.getItem('pil:v1:reviews'));
  const items = (raw ? JSON.parse(raw).items : {}) as Record<string, { startedDay?: number; doneDay?: number }>;
  return Object.entries(items).find(([k]) => k.startsWith('review:two-sum-indexes:'))?.[1];
};

test('Submit completes a due review; a later failure and a reload keep it complete @device', async ({ page }, info) => {
  const w = watchErrors(page);
  await seed(page);

  // The review is due and not done; the plan screens now show the skills plan, not the legacy problem plan.
  await page.goto('#/');
  await expect(page.getByTestId('next-card')).toHaveCount(0); // no skills plan yet: the welcome page
  await expect(page.getByTestId('build-plan')).toBeVisible();
  await page.goto('#/plan');
  await expect(page.getByTestId('build-plan')).toBeVisible();
  expect((await reviewRecord(page))?.doneDay).toBeUndefined();

  // Submit a correct solution: the review is done.
  await page.goto('#/p/two-sum-indexes');
  if (narrow(info)) await page.getByTestId('tab-code').click();
  await setEditor(page, RIGHT);
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('run-summary')).toContainText('All 5 cases passed', { timeout: 90_000 });
  await expect.poll(async () => typeof (await reviewRecord(page))?.doneDay).toBe('number');
  const doneDay = (await reviewRecord(page))!.doneDay;

  // A later failing Submit does not reopen it.
  await page.goto('#/p/two-sum-indexes');
  if (narrow(info)) await page.getByTestId('tab-code').click();
  await setEditor(page, WRONG);
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('run-summary')).toContainText('cases passed · first failure', { timeout: 90_000 });
  expect((await reviewRecord(page))?.doneDay).toBe(doneDay);

  // Reload: still done, from the durable per-instance record.
  await page.reload();
  expect((await reviewRecord(page))?.doneDay).toBe(doneDay);
  expect(w.errors).toEqual([]);
});

test('a missed skill drill returns in the review lane; passing it there clears it, and a reload keeps it cleared @device', async ({ page }) => {
  test.setTimeout(240_000);
  const w = watchErrors(page);
  await onboardSkills(page, 10); // at 10 min the first session is one skill
  await page.goto('#/session');
  await page.getByTestId('card-next').click();

  // Session 1: miss the first drill (its starter fails), pass the rest.
  const drill = page.getByTestId('drill');
  let missedId = '';
  for (let k = 0; await drill.isVisible(); k++) {
    const id = (await drill.getAttribute('data-drill-id'))!;
    if (k === 0) {
      missedId = id;
      await setEditor(page, drillById(id)!.starter);
      await page.getByTestId('run').click();
      await expect(page.getByTestId('solve-state')).toHaveText('Not yet', { timeout: 90_000 });
      await expect(page.getByTestId('drill-next')).toHaveText(/Skip for now/);
    } else {
      await setEditor(page, drillById(id)!.solution);
      await page.getByTestId('run').click();
      await expect(page.getByTestId('solve-state')).toHaveText('Solved', { timeout: 90_000 });
    }
    await page.getByTestId('drill-next').click();
    await expect(page.locator(`[data-testid=drill][data-drill-id="${id}"]`)).toHaveCount(0);
  }
  await expect(page.getByTestId('session-done')).toBeVisible();

  // Today: session 2 is next and the missed drill is due in review.
  await page.getByTestId('back-today').click();
  await expect(page.getByTestId('next-card')).toContainText('Session 2 of');
  await expect(page.getByTestId('review-due')).toContainText('1 missed drill comes back in review');

  // The review step is in today's session, labelled; passing it clears the review.
  await page.getByTestId('start-session').click();
  await page.getByTestId('card-next').click();
  const review = page.getByText('Review: you missed this one before');
  while (!(await review.isVisible())) {
    await expect(drill).toBeVisible();
    await page.getByTestId('drill-next').click();
    if (await page.getByTestId('card-next').isVisible()) await page.getByTestId('card-next').click();
  }
  await expect(drill).toHaveAttribute('data-drill-id', missedId);
  await setEditor(page, drillById(missedId)!.solution);
  await page.getByTestId('run').click();
  await expect(page.getByTestId('solve-state')).toHaveText('Solved', { timeout: 90_000 });
  await page.goto('#/');
  await expect(page.getByTestId('review-due')).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId('next-card')).toContainText('Session 2 of');
  await expect(page.getByTestId('review-due')).toHaveCount(0);
  expect(w.errors).toEqual([]);
});
