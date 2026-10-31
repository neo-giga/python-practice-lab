import { expect, test } from '@playwright/test';
import { editorText, expectNoHorizontalOverflow, setEditor, shot, watchErrors } from './helpers';

const SOLUTION = `def first_present(values: list) -> object:
    for v in values:
        if v is not None:
            return v
    return None`;

// Fluency drills, reached through the legacy #/practice/<id> links (they redirect to #/fluency/<id>).
test.describe('Fluency drills (real Pyodide grading)', () => {
  test('wrong output fails, correct passes, hints/solution, drafts and progress survive reload', async ({ page }, info) => {
    const w = watchErrors(page);
    await page.goto('#/practice/first-present');
    await expect(page.getByRole('heading', { level: 1, name: 'First value that is actually present' })).toBeVisible();
    await expect(page.getByTestId('solve-state')).toHaveText(/Not solved/);
    await expect(page.getByTestId('progress-chip')).toContainText('0/');

    // 1. Starter (buggy) code: real grading must fail, with per-case details.
    await page.getByTestId('run').click();
    const summary = page.getByTestId('run-summary');
    await expect(summary).toContainText(/of 5 cases passed/, { timeout: 90_000 });
    await expect(summary).toHaveAttribute('data-status', 'ok');
    await expect(page.getByTestId('case').filter({ hasText: '✗ Fail' }).first()).toBeVisible();
    await expect(page.getByTestId('case').first()).toContainText('[None, 0, 5]');
    await expect(page.getByTestId('solve-state')).toHaveText(/Not solved/);
    await expect(page.getByTestId('runtime-status')).toContainText(/Python 3\.14\.\d+ · Pyodide 314\.0\.7/);
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'practice-fail');

    // 2. Hints are progressive.
    await page.getByTestId('show-hint').click();
    await expect(page.getByTestId('hint')).toHaveCount(1);
    await page.getByTestId('show-hint').click();
    await expect(page.getByTestId('hint')).toHaveCount(2);

    // 3. Correct code passes and marks the drill solved (not assisted).
    await setEditor(page, SOLUTION);
    await page.getByTestId('run').click();
    await expect(summary).toContainText('All 5 cases passed');
    await expect(page.getByTestId('case').filter({ hasText: '✓ Pass' })).toHaveCount(5);
    await expect(page.getByTestId('solve-state')).toHaveText('Solved');
    await expect(page.getByTestId('progress-chip')).toContainText('1/');
    await expect(page.getByTestId('next-drill')).toBeVisible();
    await shot(page, info, 'practice-pass');

    // 4. Editing after a run flags the shown result as stale.
    await page.locator('[data-testid=editor] .cm-content').click();
    await page.keyboard.press('ControlOrMeta+End');
    await page.keyboard.insertText('\n# edited');
    await expect(page.getByText('This result is for an earlier version of your code')).toBeVisible();

    // 5. Draft + progress survive a reload.
    await page.waitForTimeout(600); // debounce
    await page.reload();
    await expect(page.getByTestId('solve-state')).toHaveText('Solved');
    expect(await editorText(page)).toContain('# edited');
    expect(await editorText(page)).toContain('if v is not None');
    await expect(page.getByTestId('hint')).toHaveCount(2);

    // 6. A failing retry keeps the historic solve but reports the current failure.
    await setEditor(page, 'def first_present(values):\n    return 42');
    await page.getByTestId('run').click();
    await expect(summary).toContainText(/0 of 5 cases passed/);
    await expect(page.getByTestId('solve-state')).toHaveText('Solved');
    await expect(page.getByText('Your latest run failed. Your earlier solve is still recorded.')).toBeVisible();

    // 7. Reset asks first; dismissing keeps the draft.
    page.once('dialog', (d) => d.dismiss());
    await page.getByTestId('reset').click();
    expect(await editorText(page)).toContain('return 42');
    page.once('dialog', (d) => d.accept());
    await page.getByTestId('reset').click();
    expect(await editorText(page)).toContain('if v:');
    expect(w.errors).toEqual([]);
  });

  test('viewing the solution is tracked as assisted, never as solved by itself', async ({ page }) => {
    const w = watchErrors(page);
    await page.goto('#/practice/digit-sum');
    page.once('dialog', (d) => d.accept());
    await page.getByTestId('show-solution').click();
    await expect(page.getByTestId('solution')).toContainText('divmod(n, 10)');
    await expect(page.getByTestId('solve-state')).toHaveText(/Not solved/);
    await page.reload();
    await expect(page.getByTestId('solve-state')).toHaveText(/Not solved/);
    await expect(page.getByTestId('show-solution')).toHaveText('Show solution again');
    await page.getByTestId('show-solution').click(); // already viewed: no second confirmation
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Copy into editor' }).click();
    await page.getByTestId('run').click();
    await expect(page.getByTestId('run-summary')).toContainText('All 4 cases passed', { timeout: 90_000 });
    await expect(page.getByTestId('solve-state')).toHaveText('Solved after viewing the solution');
    expect(w.errors).toEqual([]);
  });

  test('drafts are per drill and the list filter reflects solved state', async ({ page }) => {
    await page.goto('#/practice/digit-sum');
    await setEditor(page, 'def digit_sum(n):\n    return "draft-for-digit-sum"');
    await page.waitForTimeout(600);
    await page.goto('#/practice/run-length');
    expect(await editorText(page)).not.toContain('draft-for-digit-sum');
    await page.goto('#/practice/digit-sum');
    expect(await editorText(page)).toContain('draft-for-digit-sum');
    await page.goto('#/fluency?status=solved');
    await expect(page.getByText('No drills match this filter.').first()).toBeAttached();
  });

  test('leaving a drill while it runs stops the run and never grades the other drill', async ({ page }) => {
    await page.goto('#/practice/digit-sum');
    await setEditor(page, 'def digit_sum(n):\n    while True:\n        pass');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('stop')).toBeVisible();
    await page.goto('#/practice/first-present');
    await expect(page.getByTestId('run')).toBeEnabled({ timeout: 10_000 });
    await page.goto('#/practice/digit-sum');
    await expect(page.getByTestId('solve-state')).toHaveText(/Not solved/);
    await page.goto('#/practice/first-present');
    await expect(page.getByTestId('solve-state')).toHaveText(/Not solved/);
  });
});
