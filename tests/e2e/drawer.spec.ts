import { expect, test } from '@playwright/test';
import { isNarrow, watchErrors } from './helpers';

// The drawer is a modal on narrow screens. A parent re-render while it is open
// (a filter change, a pending search write) must not move focus, drop the scroll
// lock, or forget which button opened it.
test.describe('Drawer focus lifecycle', () => {
  test.beforeEach(({}, info) => test.skip(!isNarrow(info), 'the drawer only exists on narrow screens'));

  test('changing a filter inside the open drawer keeps focus, scroll lock, Tab trap and opener', async ({ page }) => {
    const w = watchErrors(page);
    await page.goto('#/practice/digit-sum');
    const opener = page.getByRole('button', { name: /^All drills/ });
    await opener.click();
    const drawer = page.getByRole('dialog', { name: 'All drills' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Close' })).toBeFocused();
    await expect(page.locator('body')).toHaveClass(/no-scroll/);

    // Changing the filter navigates, which re-renders the page that owns the drawer.
    const filter = drawer.getByTestId('status-filter');
    await filter.focus();
    await filter.selectOption('unsolved');
    await expect.poll(() => page.url()).toContain('status=unsolved');
    await expect(filter).toHaveValue('unsolved');
    await expect(filter).toBeFocused();
    await expect(page.locator('body')).toHaveClass(/no-scroll/);

    // Tab still wraps inside the drawer in both directions.
    const last = drawer.getByTestId('exercise-link').last();
    await last.focus();
    await page.keyboard.press('Tab');
    await expect(drawer.getByRole('button', { name: 'Close' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(last).toBeFocused();

    // Escape closes and returns focus to the button that opened the drawer.
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page.locator('body')).not.toHaveClass(/no-scroll/);
    expect(w.errors).toEqual([]);
  });

  test('a pending search write while the Topics drawer is open does not steal focus', async ({ page }) => {
    const w = watchErrors(page);
    await page.goto('#/learn');
    // The search box writes its query to the URL 250 ms after the last keystroke;
    // open the drawer and move focus inside it before that write lands.
    await page.getByTestId('recipe-search').fill('heap');
    const opener = page.getByRole('button', { name: /^Topics/ });
    await opener.click();
    const drawer = page.getByRole('dialog', { name: 'Topics' });
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Tab');
    const allTopics = drawer.getByRole('link', { name: /^All topics/ });
    await expect(allTopics).toBeFocused();

    await expect.poll(() => page.url()).toContain('q=heap');
    await expect(allTopics).toBeFocused();
    await expect(page.locator('body')).toHaveClass(/no-scroll/);

    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page.locator('body')).not.toHaveClass(/no-scroll/);
    expect(w.errors).toEqual([]);
  });
});
