// The M1 journey on the production build with the real Pyodide runtime:
// onboarding → plan → Today → problem → Run examples (wrong) → Submit (right)
// → progress → reload; the failed-3x adaptation; Edit plan with a diff.
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { editorText, expectNoHorizontalOverflow, setEditor, shot, watchErrors } from './helpers';

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

async function onboard(page: Page, patterns: string[]) {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: /Practise coding-interview problems/ })).toBeVisible();
  await page.getByTestId('build-plan').click();
  await expect(page.getByRole('heading', { level: 1, name: 'How long until your interviews?' })).toBeVisible();
  await page.getByRole('button', { name: /^Standard/ }).click(); // preset: 6 weeks x 6 h → jumps to the level question
  await expect(page.getByRole('heading', { level: 1, name: 'Where are you with these patterns?' })).toBeVisible();
  await page.getByRole('radio', { name: /^Rusty/ }).click(); // one tap advances
  await expect(page.getByRole('heading', { level: 1, name: 'Anything to focus on?' })).toBeVisible();
  await page.getByRole('radio', { name: /^Choose patterns/ }).click();
  for (const p of patterns) await page.getByTestId(`pattern-${p}`).click();
  await expect(page.getByTestId('setup-summary')).toContainText('over 6 weeks');
  await page.getByTestId('setup-finish').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your plan' })).toBeVisible();
}

test.describe('Practice journey @device', () => {
  test('onboarding → plan → Run examples (fail, no solve) → Submit (pass) → progress → reload keeps everything', async ({ page }, info) => {
    const w = watchErrors(page);
    await onboard(page, ['arrays-hashing']);
    // The plan is visible at once, in the URL, and contains only the chosen pattern.
    await expect(page).toHaveURL(/#\/plan\?w=6&h=6&lvl=rusty&p=arrays-hashing/);
    await expect(page.getByTestId('plan-week').first()).toContainText('This week');
    await expect(page.getByTestId('plan-item').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'plan');

    // Today: one prominent next problem with its reason.
    await page.goto('#/');
    await expect(page.getByTestId('next-card')).toContainText('Pair indexes with a value index');
    await expect(page.getByTestId('next-why')).toContainText('Why this?');
    await expect(page.getByTestId('plan-progress')).toHaveText(/^0 of \d+$/);
    const total = Number((await page.getByTestId('plan-progress').textContent())!.split(' of ')[1]);
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'today');
    await page.getByTestId('next-problem').click();
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

    // Plan and Today show the progress.
    await page.goto('#/');
    // One done; the pass also schedules a review, so the total can grow by one.
    await expect(page.getByTestId('plan-progress')).toHaveText(new RegExp(`^1 of (${total}|${total + 1})$`));
    await expect(page.getByTestId('next-card')).not.toContainText('Pair indexes with a value index');
    await page.goto('#/plan');
    await expect(page.locator('[data-testid=plan-item][data-lane=new][data-id=two-sum-indexes]')).toHaveAttribute('data-state', 'done');

    // Reload keeps plan, progress and draft.
    await page.reload();
    await expect(page.locator('[data-testid=plan-item][data-lane=new][data-id=two-sum-indexes]')).toHaveAttribute('data-state', 'done');
    await page.goto('#/p/two-sum-indexes');
    await expect(page.getByTestId('solve-state')).toHaveText('Solved');
    await openCode(page, info);
    expect(await editorText(page)).toContain('seen[x] = j');
    expect(w.errors).toEqual([]);
  });

  test('three failed submits, then leaving: an easier sibling comes next with its reason, and the original is re-queued', async ({ page }, info) => {
    const w = watchErrors(page);
    await onboard(page, ['arrays-hashing']);
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
    await expect(page.getByTestId('next-why')).toContainText('Easier sibling of “Group anagrams”');
    await expect(page.getByTestId('next-card')).toContainText('Pair indexes with a value index');
    await page.goto('#/plan');
    await expect(page.locator('[data-testid=plan-item][data-lane=review][data-id=group-anagrams]').filter({ hasText: 'Second try at “Group anagrams”' })).toHaveCount(1);
    expect(w.errors).toEqual([]);
  });

  test('Edit plan shows a diff first and keeps solved work', async ({ page }, info) => {
    const w = watchErrors(page);
    await onboard(page, ['arrays-hashing']);
    await page.goto('#/p/two-sum-indexes');
    await openCode(page, info);
    await setEditor(page, TWO_SUM_RIGHT);
    await page.getByTestId('submit').click();
    await expect(page.getByTestId('run-summary')).toContainText('All 5 cases passed', { timeout: 90_000 });

    await page.goto('#/plan');
    await page.getByTestId('edit-plan').click();
    await expect(page.getByRole('heading', { level: 1, name: 'How long until your interviews?' })).toBeVisible();
    await page.getByTestId('setup-next').click();
    await page.getByTestId('setup-next').click();
    await page.getByTestId('setup-next').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Anything to focus on?' })).toBeVisible();
    await expect(page.getByTestId('pattern-arrays-hashing')).toHaveAttribute('aria-pressed', 'true'); // prefilled
    await page.getByTestId('pattern-two-pointers').click();
    await page.getByTestId('setup-finish').click();
    const diff = page.getByTestId('plan-diff');
    await expect(diff).toContainText(/\+\d+ Two pointers/);
    await expect(diff).toContainText('Finished work is kept (1 done problem');
    // Cancel changes nothing; Apply replaces the future only.
    await page.getByTestId('cancel-plan').click();
    await page.getByTestId('setup-finish').click();
    await page.getByTestId('apply-plan').click();
    await expect(page).toHaveURL(/p=arrays-hashing%2Ctwo-pointers|p=arrays-hashing,two-pointers/);
    await expect(page.locator('[data-testid=plan-item][data-lane=new][data-id=two-sum-indexes]')).toHaveAttribute('data-state', 'done');
    await expect(page.locator('[data-testid=plan-item][data-lane=new][data-id=squares-sorted]')).toHaveCount(1);
    expect(w.errors).toEqual([]);
  });

  test('a shared plan link reproduces the plan in a fresh browser', async ({ page }) => {
    await page.goto('#/plan?w=2&h=4&lvl=comfortable&p=stack&d=easy%2Cmedium&fw=0&rv=1');
    await expect(page.getByRole('heading', { level: 1, name: 'Shared plan' })).toBeVisible();
    await expect(page.getByTestId('linked-plan')).toBeVisible();
    await expect(page.getByTestId('plan-item').first()).toBeVisible();
    await page.getByRole('button', { name: 'Start this plan' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Your plan' })).toBeVisible();
    expect(JSON.parse((await page.evaluate(() => localStorage.getItem('pil:v1:prefs')))!)).toMatchObject({ weeks: 2, hoursPerWeek: 4, level: 'comfortable', patterns: ['stack'] });
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
  test('tapping an unselected card advances to the next question', async ({ page }) => {
    await page.goto('#/setup');
    await page.getByRole('radio', { name: /^8 weeks/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'How many hours a week can you practise?' })).toBeVisible();
    await page.getByRole('radio', { name: /^4 h/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Where are you with these patterns?' })).toBeVisible();
    await page.getByRole('radio', { name: /^New to these patterns/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Anything to focus on?' })).toBeVisible();
    await expect(page.getByTestId('setup-summary')).toContainText('over 8 weeks');
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
    await onboard(page, ['stack']);
    for (const r of ['#/', '#/plan', '#/problems', '#/p/postfix-eval', '#/learn', '#/fluency/first-present', '#/playground']) {
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
    await onboard(page, ['arrays-hashing', 'stack']);
    const routes = ['#/', '#/setup', '#/plan', '#/problems', '#/p/stretch-hits-target', '#/p/versioned-settings', '#/fluency', '#/fluency/first-present', '#/learn', '#/playground', '#/about', '#/nope'];
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
