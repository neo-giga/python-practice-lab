// The practice journey on the production build with the real Pyodide runtime. Since the skills
// correction (spec 2026-10-31-python-practice-lab-skills.md, "Product (decided)" / "Regression 1"),
// setup, plan and Today serve the skills track; problem pages stay reachable by link (#/p/<id>),
// e.g. from a skill page's "Apply it" list:
// onboarding → plan → Today → skill page → problem → Run examples (wrong) → Submit (right)
// → progress → reload; three failed submits; Edit plan keeps solved work.
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { drillById, editorText, expectNoHorizontalOverflow, onboardSkills, setEditor, shot, watchErrors } from './helpers';

const narrowWs = (info: TestInfo) => (info.project.use.viewport?.width ?? 1440) < 1024;

/** On phone/tablet the editor lives in the Code tab; the result appears in the Result tab. */
async function openCode(page: Page, info: TestInfo) {
  if (narrowWs(info)) await page.getByTestId('tab-code').click();
}
async function openProblemTab(page: Page, info: TestInfo) {
  if (narrowWs(info)) await page.getByTestId('tab-problem').click();
}

const TWO_SUM_RIGHT = 'def pair_indexes(nums, target):\n    seen = {}\n    for j, x in enumerate(nums):\n        if target - x in seen:\n            return [seen[target - x], j]\n        seen[x] = j\n    return []';
const TWO_SUM_WRONG = 'def pair_indexes(nums, target):\n    return [0, 1]';

test.describe('Practice journey @device', () => {
  test('onboarding → plan → skill page → problem: Run examples (fail, no solve) → Submit (pass) → progress → reload keeps everything', async ({ page }, info) => {
    const w = watchErrors(page);
    await onboardSkills(page);
    // The plan is visible at once: sessions, the next one open, with skill rows.
    await expect(page).toHaveURL(/#\/plan$/);
    await expect(page.getByTestId('plan-session').first()).toContainText('Next');
    await expect(page.getByTestId('plan-skill').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'plan');

    // Today: one prominent next session with its reason.
    await page.goto('#/');
    await expect(page.getByTestId('next-card')).toContainText('Session 1 of');
    await expect(page.getByTestId('next-why')).toContainText('Why this?');
    await expect(page.getByTestId('tier-1')).toContainText(/0\/\d+/);
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'today');
    // A problem is reached from a skill page's "Apply it" list.
    await page.goto('#/skill/algo-hashmap-counting');
    await page.getByTestId('apply-links').getByRole('link', { name: 'Pair indexes with a value index' }).click();
    await expect(page).toHaveURL(/#\/p\/two-sum-indexes$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Pair indexes with a value index' })).toBeVisible();
    await expect(page.getByTestId('solve-state')).toHaveText('Not solved');

    // Run examples with a wrong answer: failure shown, nothing recorded.
    await openCode(page, info);
    await setEditor(page, TWO_SUM_WRONG);
    await page.getByTestId('run-examples').click();
    const summary = page.getByTestId('run-summary');
    await expect(summary).toHaveAttribute('data-mode', 'examples', { timeout: 90_000 });
    await expect(summary).toContainText(/2 of 3 cases passed · first failure: case 1/);
    await expect(page.getByTestId('case-ticks')).toBeVisible();
    await expect(page.getByTestId('case').filter({ hasText: 'Fail' }).first()).toContainText('Expected');
    await openProblemTab(page, info);
    await expect(page.getByTestId('solve-state')).toHaveText('Not solved');
    expect(await page.evaluate(() => localStorage.getItem('pil:v1:progress'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('pil:v1:attempts'))).toBeNull();
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'problem-fail');

    // Fix and Submit: every case, solve recorded.
    await openCode(page, info);
    await setEditor(page, TWO_SUM_RIGHT);
    await page.getByTestId('submit').click();
    await expect(summary).toHaveAttribute('data-mode', 'submit');
    await expect(summary).toContainText('All 5 cases passed');
    await expect(page.getByTestId('next-problem')).toBeVisible();
    await openProblemTab(page, info);
    await expect(page.getByTestId('solve-state')).toHaveText('Solved');
    await shot(page, info, 'problem-pass');

    // The problem list shows the progress (problems are no longer part of the skills plan).
    const solvedRow = page.getByTestId('problem-row').filter({ hasText: 'Pair indexes with a value index' });
    await page.goto('#/problems?status=solved');
    await expect(solvedRow).toHaveCount(1);
    await page.goto('#/problems?status=unsolved');
    await expect(solvedRow).toHaveCount(0);

    // Reload keeps the plan, progress and draft.
    await page.goto('#/problems?status=solved');
    await page.reload();
    await expect(solvedRow).toHaveCount(1);
    await page.goto('#/plan');
    await expect(page.getByRole('heading', { level: 1, name: 'Your plan' })).toBeVisible();
    await page.goto('#/p/two-sum-indexes');
    await expect(page.getByTestId('solve-state')).toHaveText('Solved');
    await openCode(page, info);
    expect(await editorText(page)).toContain('seen[x] = j');
    expect(w.errors).toEqual([]);
  });

  // The M1 plan adaptation (easier sibling, re-queued retry) left with problem-based plans (spec Regression 1);
  // missed skill drills now return through the review lane (review-completion.spec.ts). The problem page's own
  // behaviour is unchanged.
  test('three failed submits, then leaving: the nudge shows and the problem stays unsolved; Today still offers the skills session', async ({ page }, info) => {
    const w = watchErrors(page);
    await onboardSkills(page);
    await page.goto('#/p/group-anagrams');
    await openCode(page, info);
    await setEditor(page, 'def group_anagrams(words):\n    return [words]');
    for (let i = 1; i <= 3; i++) {
      await page.getByTestId('submit').click();
      await expect(page.getByTestId('run-summary')).toHaveAttribute('data-mode', 'submit', { timeout: 90_000 });
      await expect(page.getByTestId('run-summary')).toHaveAttribute('data-status', 'ok');
      await expect(page.getByTestId('run-summary')).not.toContainText('All');
      if (i < 3) await page.getByTestId('run-examples').click(), await expect(page.getByTestId('run-summary')).toHaveAttribute('data-mode', 'examples');
    }
    await openProblemTab(page, info);
    await expect(page.getByTestId('fail-nudge')).toContainText('3 failed submits');
    await page.goto('#/'); // leave unsolved
    await expect(page.getByTestId('next-card')).toContainText('Session 1 of');
    await expect(page.getByTestId('next-card')).not.toContainText('Group anagrams');
    await page.goto('#/problems?status=unsolved');
    await expect(page.getByTestId('problem-row').filter({ hasText: 'Group anagrams' })).toHaveCount(1);
    expect(w.errors).toEqual([]);
  });

  // The skills setup has one choice that changes the plan (minutes per day); the plan is recomputed from it
  // and from progress, so there is no diff step and nothing to cancel (spec "Product (decided)": one-screen Setup).
  test('Edit plan keeps solved work and re-packs the sessions', async ({ page }) => {
    const w = watchErrors(page);
    await onboardSkills(page, 20);
    const sessions20 = await page.getByTestId('plan-session').count();
    await page.goto('#/session');
    await page.getByTestId('card-next').click();
    const drillId = (await page.getByTestId('drill').getAttribute('data-drill-id'))!;
    await setEditor(page, drillById(drillId)!.solution);
    await page.getByTestId('run').click();
    await expect(page.getByTestId('solve-state')).toHaveText('Solved', { timeout: 90_000 });

    await page.goto('#/plan');
    await page.getByTestId('edit-plan').click();
    await expect(page.getByTestId('setup')).toBeVisible();
    await expect(page.getByTestId('minutes').getByRole('radio', { name: '20 min' })).toHaveAttribute('aria-checked', 'true'); // prefilled
    await page.getByTestId('minutes').getByRole('radio', { name: '10 min' }).click();
    await expect(page.getByTestId('setup-finish')).toHaveText('Update my plan');
    await page.getByTestId('setup-finish').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Your plan' })).toBeVisible();
    expect(await page.getByTestId('plan-session').count()).toBeGreaterThan(sessions20);
    await expect(page.locator('[data-testid=plan-skill][data-state=in-progress], [data-testid=plan-skill][data-state=done]').first()).toBeVisible();
    expect(JSON.parse((await page.evaluate(() => localStorage.getItem('pil:v1:skillPrefs')))!)).toMatchObject({ minutesPerDay: 10 });
    await page.goto(`#/drill/${drillId}`);
    await expect(page.getByTestId('solve-state')).toHaveText('Solved');
    expect(w.errors).toEqual([]);
  });

  // Shared problem-plan links (#/plan?w=…) belonged to the problem-based plan (spec Regression 1). An old link
  // still lands on the Plan page; the skills plan is reproducible because it is a pure function of its settings.
  test('an old shared plan link lands on the Plan page; the same settings reproduce the plan in a fresh browser', async ({ page, browser }) => {
    await page.goto('#/plan?w=2&h=4&lvl=comfortable&p=stack&d=easy%2Cmedium&fw=0&rv=1');
    await expect(page.getByRole('heading', { level: 1, name: 'Plan' })).toBeVisible();
    await expect(page.getByTestId('build-plan')).toBeVisible();
    await onboardSkills(page, 10);
    const order = await page.getByTestId('plan-skill').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id));
    const fresh = await browser.newPage();
    await onboardSkills(fresh, 10);
    expect(await fresh.getByTestId('plan-skill').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id))).toEqual(order);
    expect(JSON.parse((await fresh.evaluate(() => localStorage.getItem('pil:v1:skillPrefs')))!)).toMatchObject({ track: 'coding-interview', minutesPerDay: 10 });
    await fresh.close();
  });

  test('legacy links, unknown routes and malformed URLs land somewhere useful', async ({ page }) => {
    const w = watchErrors(page);
    await page.goto('#/practice/two-sum-indexes');
    await expect(page).toHaveURL(/#\/p\/two-sum-indexes$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Pair indexes with a value index' })).toBeVisible();
    await page.goto('#/practice/first-present?status=unsolved');
    await expect(page).toHaveURL(/#\/fluency\/first-present\?status=unsolved$/);
    await expect(page.getByRole('heading', { level: 1, name: 'First value that is actually present' })).toBeVisible();
    await page.goto('#/practice');
    await expect(page).toHaveURL(/#\/problems$/);
    await page.goto('#/learn/heap-ties');
    await expect(page.locator('#recipe-heap-ties')).toBeFocused();
    await page.goto('#/no-such-page');
    await expect(page.getByTestId('not-found')).toContainText('Nothing lives at');
    await page.goto('#/p/%E0%A4%A');
    await expect(page.getByTestId('not-found')).toBeVisible();
    expect(w.errors).toEqual([]);
  });

  test('theme follows the OS, the toggle overrides it and persists', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('#/problems');
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(await bg()).toBe('rgb(11, 11, 12)');
    await page.getByTestId('theme-toggle').filter({ visible: true }).click(); // system → light
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await bg()).toBe('rgb(250, 250, 250)');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('Problem workspace runtime states @device', () => {
  test('Stop during Submit is not a failed attempt; tab switches never cancel a run; edits mark results stale', async ({ page }, info) => {
    const w = watchErrors(page);
    await page.goto('#/p/two-sum-indexes');
    await openCode(page, info);
    await setEditor(page, 'def pair_indexes(nums, target):\n    while True:\n        pass');
    await page.getByTestId('submit').click();
    await expect(page.getByTestId('stop')).toBeVisible({ timeout: 90_000 });
    if (narrowWs(info)) {
      // Switching tabs keeps the run going.
      await page.getByTestId('tab-problem').click();
      await page.getByTestId('tab-result').click();
      await expect(page.getByTestId('stop')).toBeVisible();
    }
    await page.getByTestId('stop').click();
    await expect(page.getByTestId('run-summary')).toHaveAttribute('data-status', 'stopped');
    expect(await page.evaluate(() => localStorage.getItem('pil:v1:attempts'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('pil:v1:progress'))).toBeNull();
    await openCode(page, info);
    await setEditor(page, TWO_SUM_WRONG);
    await page.getByTestId('run-examples').click();
    await expect(page.getByTestId('run-summary')).toHaveAttribute('data-mode', 'examples', { timeout: 90_000 });
    await openCode(page, info);
    await page.locator('[data-testid=editor] .cm-content').click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.insertText('\n# edited');
    if (narrowWs(info)) await page.getByTestId('tab-result').click();
    await expect(page.getByText('This result is for an earlier version of your code')).toBeVisible();
    expect(w.errors).toEqual([]);
  });
});

test.describe('Onboarding taps and run focus @device', () => {
  // The setup is one screen now (spec "Product (decided)"): one tap on a minutes option updates the summary at once.
  test('tapping an unselected option updates the setup summary at once', async ({ page }) => {
    await page.goto('#/setup');
    await expect(page.getByTestId('track-coding-interview')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('track-software-engineer')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByTestId('setup-summary')).toContainText('about 20 minutes');
    const sessions = async () => Number(await page.getByTestId('setup-summary').locator('strong').textContent());
    const at20 = await sessions();
    await page.getByTestId('minutes').getByRole('radio', { name: '10 min' }).click();
    await expect(page.getByTestId('setup-summary')).toContainText('about 10 minutes');
    expect(await sessions()).toBeGreaterThan(at20);
    await page.getByTestId('minutes').getByRole('radio', { name: '30 min' }).click();
    await expect(page.getByTestId('setup-summary')).toContainText('about 30 minutes');
    expect(await sessions()).toBeLessThan(at20);
  });

  test('focus survives a run: shortcut keeps the editor, a button run returns focus to its button', async ({ page }, info) => {
    const w = watchErrors(page);
    await page.goto('#/p/two-sum-indexes');
    await openCode(page, info);
    await setEditor(page, TWO_SUM_WRONG);
    // Hardware-keyboard shortcut (desktop layout): the editor stays focused and keeps taking input after the run.
    if (!narrowWs(info)) {
      await page.keyboard.press('ControlOrMeta+Enter');
      await expect(page.getByTestId('run-summary')).toHaveAttribute('data-mode', 'examples', { timeout: 90_000 });
      await expect(page.locator('[data-testid=editor] .cm-content')).toBeFocused();
      await page.keyboard.insertText('# still typing');
      await expect(page.locator('[data-testid=editor] .cm-content')).toContainText('# still typing');
    }
    // Button run: focus goes to Stop during the run (if it lasts) and back to the button after.
    await page.getByTestId('submit').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('run-summary')).toHaveAttribute('data-mode', 'submit', { timeout: 90_000 });
    await expect(page.getByTestId('submit')).toBeFocused();
    expect(w.errors).toEqual([]);
  });
});

test.describe('Problem grading and persistence @runtime', () => {
  test('Run examples, Submit, reload: solve and draft survive (every browser)', async ({ page }, info) => {
    const w = watchErrors(page);
    await page.goto('#/p/two-sum-indexes');
    await openCode(page, info);
    await setEditor(page, TWO_SUM_WRONG);
    await page.getByTestId('run-examples').click();
    await expect(page.getByTestId('run-summary')).toContainText('2 of 3 cases passed', { timeout: 90_000 });
    await openCode(page, info); // the run switched a narrow screen to the Result tab
    await setEditor(page, TWO_SUM_RIGHT);
    await page.getByTestId('submit').click();
    await expect(page.getByTestId('run-summary')).toContainText('All 5 cases passed');
    await page.waitForTimeout(600);
    await page.reload();
    await openProblemTab(page, info);
    await expect(page.getByTestId('solve-state')).toHaveText('Solved');
    await openCode(page, info);
    expect(await editorText(page)).toContain('seen[x] = j');
    expect(w.errors).toEqual([]);
  });
});

test.describe('Runtime download', () => {
  test('nothing from the Python runtime is requested before the first Run', async ({ page }) => {
    const pyodide: string[] = [];
    page.on('request', (r) => r.url().includes('/pyodide/') && pyodide.push(r.url()));
    await onboardSkills(page);
    for (const r of ['#/', '#/plan', '#/cheatsheet', '#/skill/heapq', '#/problems', '#/p/postfix-eval', '#/reference', '#/fluency/first-present', '#/playground']) {
      await page.goto(r);
      await page.locator('main h1:visible').first().waitFor();
    }
    expect(pyodide).toEqual([]);
    await page.goto('#/p/postfix-eval');
    await page.getByTestId('run-examples').click();
    await expect(page.getByTestId('run-summary')).toBeVisible({ timeout: 90_000 });
    expect(pyodide.length).toBeGreaterThan(0);
  });
});

test.describe('Layout', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop-1440', 'one project resizes through every width'));
  test('no horizontal overflow at 320, 375, 768, 1024 and 1440 on every page', async ({ page }) => {
    await onboardSkills(page);
    const routes = ['#/', '#/setup', '#/plan', '#/cheatsheet', '#/skill/algo-bfs', '#/problems', '#/p/stretch-hits-target', '#/p/versioned-settings', '#/fluency', '#/fluency/first-present', '#/reference', '#/playground', '#/about', '#/nope'];
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const r of routes) {
        await page.goto(r);
        await page.locator('main h1').first().waitFor();
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over, `${r} at ${width}px`).toBeLessThanOrEqual(0);
      }
    }
  });
});
