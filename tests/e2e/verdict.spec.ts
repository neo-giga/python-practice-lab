// FIX ROUND 1 #6 (Bugbot "First failure stays collapsed after rerun"): every run
// re-applies the default, so the first failing case is expanded after each run.
import { expect, test } from '@playwright/test';
import { setEditor } from './helpers';

const narrow = (w?: number) => (w ?? 1440) < 1024;
const FAIL_CASES_1_2_3 = 'def pair_indexes(nums, target):\n    return [0, 1]';
// Correct except for case 3 ([3, 5, 1], 6 -> [1, 2]).
const FAIL_CASE_3_ONLY =
  'def pair_indexes(nums, target):\n    if nums == [3, 5, 1]:\n        return [0, 0]\n    seen = {}\n    for j, x in enumerate(nums):\n        if target - x in seen:\n            return [seen[target - x], j]\n        seen[x] = j\n    return []';

test('the first failing case is expanded after every Submit, not only the first one', async ({ page }) => {
  await page.goto('#/p/two-sum-indexes');
  const openCode = async () => {
    if (narrow(page.viewportSize()?.width)) await page.getByTestId('tab-code').click();
  };
  await openCode();
  await setEditor(page, FAIL_CASES_1_2_3);
  await page.getByTestId('submit').click();
  const cases = page.getByTestId('case');
  await expect(page.getByTestId('run-summary')).toContainText('first failure: case 1', { timeout: 90_000 });
  await expect(cases.nth(0).locator('.case-head')).toHaveAttribute('aria-expanded', 'true');
  await expect(cases.nth(2).locator('.case-head')).toHaveAttribute('aria-expanded', 'false');

  await openCode();
  await setEditor(page, FAIL_CASE_3_ONLY);
  await page.getByTestId('submit').click();
  await expect(page.getByTestId('run-summary')).toContainText('first failure: case 3');
  await expect(cases.nth(2).locator('.case-head')).toHaveAttribute('aria-expanded', 'true');
  await expect(cases.nth(2)).toContainText('Expected');
  await expect(cases.nth(0).locator('.case-head')).toHaveAttribute('aria-expanded', 'false');
});
