import { expect, test } from '@playwright/test';
import { curatedReference } from '../../src/content/curated-reference';
import { editorText, expectNoHorizontalOverflow, setEditor } from './helpers';

test('cheatsheet fills the workspace at all breakpoints with local code scroll', async ({ page }, info) => {
  await page.goto('#/cheatsheet');
  for (const width of [320, 375, 768, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    await expectNoHorizontalOverflow(page);
    const bounds = await page.getByTestId('cheatsheet').boundingBox();
    expect(bounds!.x + bounds!.width).toBeGreaterThan(width - 5);
    const layout = await page.locator('.cheat-grid').first().evaluate((el) => {
      const cards = [...el.children].map((c) => c.getBoundingClientRect());
      return { columns: new Set(cards.map((c) => Math.round(c.x))).size, maxHeight: Math.max(...cards.map((c) => c.height)), minHeight: Math.min(...cards.map((c) => c.height)) };
    });
    if (width <= 375) expect(layout.columns).toBe(1);
    if (width === 768) expect(layout.columns).toBe(2);
    expect(await page.locator('.cheatsheet pre').evaluateAll((blocks) => blocks.some((b) => b.scrollWidth > b.clientWidth))).toBe(true);
    if (width >= 1440) expect(layout.columns).toBeGreaterThanOrEqual(3);
    expect(layout.maxHeight).toBeGreaterThan(layout.minHeight);
    if ([320, 375, 768, 1440, 1920, 2560].includes(width)) await page.screenshot({ path: `evidence/t_2e7dae1a/screens/${info.project.name}-cheatsheet-${width}.png` });
  }
  await expect(page.locator('[data-reference]')).toHaveCount(17);
  await expect(page.locator('[data-reference] .freq')).toHaveCount(0);
  await page.getByTestId('cheat-search').fill('nonlocal');
  await expect(page.locator('[data-reference="functions"]')).toBeVisible();
  await expect(page.locator('[data-reference]')).toHaveCount(1);
});

test('Copy writes exact displayed source and denied access gives honest selectable fallback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('#/cheatsheet');
  const card = page.locator('[data-reference="functions"]');
  const source = await card.locator('pre code').textContent();
  await card.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(card.getByRole('status')).toHaveText('Copied.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
  await card.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(card.getByRole('status')).toContainText('Clipboard unavailable');
  await expect(card.getByRole('textbox')).toHaveValue(source!);
  await card.getByRole('textbox').focus();
  expect(await card.getByRole('textbox').evaluate((el: HTMLTextAreaElement) => el.value.slice(el.selectionStart, el.selectionEnd))).toBe(source);
  await expectNoHorizontalOverflow(page);
});

test('skill and curated handoffs preload exact source without running; draft restores; recipes still work', async ({ page }) => {
  await page.goto('#/playground');
  await setEditor(page, 'print("prior draft")');
  await page.goto('#/cheatsheet');
  const skill = page.locator('[data-skill]').first();
  const skillSource = await skill.locator('pre code').textContent();
  await skill.getByRole('link', { name: 'Try in Playground' }).click();
  await expect.poll(() => editorText(page)).toBe(skillSource);
  await expect(page.getByTestId('results')).toBeEmpty();
  await expect(page.getByTestId('runtime-status')).toContainText('not loaded yet');
  await page.getByRole('button', { name: 'Restore previous code' }).click();
  await expect.poll(() => editorText(page)).toBe('print("prior draft")');
  await page.goto('#/cheatsheet');
  await page.locator('[data-reference="core-types"]').getByRole('link', { name: 'Try in Playground' }).click();
  await expect.poll(() => editorText(page)).toBe(curatedReference[0].code);
  await expect(page).toHaveURL(/snippet=reference%3Acore-types/);
  await expect(page.getByTestId('results')).toBeEmpty();
  await page.reload();
  await expect.poll(() => editorText(page)).toBe(curatedReference[0].code);
  await page.getByRole('button', { name: 'Restore previous code' }).click();
  await expect.poll(() => editorText(page)).toBe('print("prior draft")');
  await page.goto('#/playground?recipe=counter');
  await expect.poll(() => editorText(page)).toContain('Counter("mississippi")');
  await page.getByRole('button', { name: 'Restore previous code' }).click();
  await expect.poll(() => editorText(page)).toBe('print("prior draft")');
});

// Give each fresh interpreter its own test budget and identifiable failure.
// An aggregate budget for 17 worker startups was flaky on shared CI hosts.
for (const reference of curatedReference) {
  test(`curated reference ${reference.id} executes in real browser Pyodide`, async ({ page }) => {
    await page.goto(`#/playground?snippet=${encodeURIComponent(`reference:${reference.id}`)}`);
    await expect.poll(() => editorText(page)).toBe(reference.code);
    await expect(page.getByTestId('results')).toBeEmpty();
    await page.getByTestId('run').click();
    await expect(page.getByTestId('run-summary')).toHaveAttribute('data-status', 'ok', { timeout: 90_000 });
    await expect(page.getByTestId('stdout')).not.toBeEmpty();
  });
}
