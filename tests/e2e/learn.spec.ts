import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, isNarrow, shot, watchErrors } from './helpers';

test.describe('Reference (was Cheatsheet)', () => {
  test('search, level/topic filters, empty state and shareable URLs', async ({ page }, info) => {
    const w = watchErrors(page);
    await page.goto('#/learn');
    await expect(page.getByRole('heading', { level: 1, name: 'Reference' })).toBeVisible();
    await expect(page.getByTestId('result-count')).toHaveText(/Showing all \d+ recipes/);
    const total = await page.getByTestId('recipe').count();
    expect(total).toBeGreaterThanOrEqual(60);
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'learn');

    await page.getByTestId('recipe-search').fill('heap tie');
    await expect(page.getByTestId('result-count')).toHaveText(/of \d+ recipes match/);
    await expect(page.getByRole('heading', { name: 'Tuple priorities and tie-breakers' })).toBeVisible();
    await expect.poll(() => page.url()).toContain('q=heap+tie');
    const filtered = await page.getByTestId('recipe').count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(total);

    // The filtered view survives a reload (shareable link).
    await page.reload();
    await expect(page.getByTestId('recipe-search')).toHaveValue('heap tie');
    await expect(page.getByTestId('recipe')).toHaveCount(filtered);

    await page.getByTestId('recipe-search').fill('zzzz-no-such-idiom');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await page.getByRole('link', { name: 'Clear filters' }).click();
    await expect(page.getByTestId('recipe')).toHaveCount(total);

    await page.getByTestId('level-filter').getByRole('radio', { name: 'Advanced' }).click();
    await expect.poll(() => page.url()).toContain('level=advanced');
    await expect.poll(() => page.getByTestId('recipe').count()).toBeLessThan(total);
    expect(await page.getByTestId('recipe').count()).toBeGreaterThan(0);
    await page.getByTestId('level-filter').getByRole('radio', { name: 'All levels' }).click();
    await expect(page.getByTestId('recipe')).toHaveCount(total);

    // Topic filter: sidebar on desktop, accessible drawer on narrow screens.
    if (isNarrow(info)) {
      const opener = page.getByRole('button', { name: /^Topics/ });
      await opener.click();
      const drawer = page.getByRole('dialog', { name: 'Topics' });
      await expect(drawer).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(drawer).toBeHidden();
      await expect(opener).toBeFocused();
      await opener.click();
      await drawer.getByRole('link', { name: /heapq & priority queues/ }).click();
      await expect(drawer).toBeHidden();
    } else {
      await page.getByRole('navigation', { name: 'Topics' }).getByRole('link', { name: /heapq & priority queues/ }).click();
    }
    await expect(page.getByTestId('result-count')).toContainText('heapq & priority queues');
    await expect(page.getByRole('heading', { level: 2, name: 'heapq & priority queues' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expect(w.errors).toEqual([]);
  });

  test('deep link to a recipe opens, focuses and highlights it after a cold load', async ({ page }, info) => {
    const w = watchErrors(page);
    await page.goto('#/learn/aliasing-copies');
    const card = page.locator('#recipe-aliasing-copies');
    await expect(card).toHaveClass(/highlighted/);
    await expect(card).toBeFocused();
    await expect(card).toBeInViewport();
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'deeplink');
    expect(w.errors).toEqual([]);
  });

  test('skip link moves focus to the main content', async ({ page }) => {
    await page.goto('#/learn');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('Download .md produces the generated cheatsheet', async ({ page }) => {
    await page.goto('#/learn');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download .md' }).click()]);
    expect(download.suggestedFilename()).toBe('python-interview-lab-cheatsheet.md');
    const path = await download.path();
    const { readFileSync } = await import('node:fs');
    const text = readFileSync(path!, 'utf8');
    expect(text).toContain('# Python Interview Lab — Cheatsheet');
    expect(text).toContain(readFileSync('docs/CHEATSHEET.md', 'utf8').slice(0, 400));
  });

  test('cheatsheet keeps working offline once loaded (no runtime needed to read)', async ({ page, context }) => {
    await page.goto('#/learn');
    await expect(page.getByTestId('recipe').first()).toBeVisible();
    await context.setOffline(true);
    await page.getByTestId('recipe-search').fill('bisect');
    await expect(page.getByRole('heading', { name: 'bisect_left and bisect_right' })).toBeVisible();
    await page.evaluate(() => (location.hash = '#/learn/counter'));
    await expect(page.locator('#recipe-counter')).toBeFocused();
    await expect(page.getByTestId('recipe-search')).toHaveValue('');
    await context.setOffline(false);
  });
});
