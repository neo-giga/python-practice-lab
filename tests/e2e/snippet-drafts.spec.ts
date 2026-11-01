import { expect, test } from '@playwright/test';
import { curatedReference } from '../../src/content/curated-reference';
import { editorText, setEditor } from './helpers';

const first = curatedReference[0];
const second = curatedReference[1];
const snippetUrl = (id: string) => `#/playground?snippet=${encodeURIComponent(`reference:${id}`)}`;

test('edited snippet reload preserves the original draft source, stdin and timeout for restore', async ({ page }) => {
  await page.goto('#/playground');
  const original = 'print("original draft")';
  await setEditor(page, original);
  await page.locator('.stdin summary').click();
  await page.getByTestId('stdin').fill('original input\nsecond line');
  await page.getByTestId('timeout-10000').click();
  await page.goto('#/cheatsheet');
  await page.locator(`[data-reference="${first.id}"]`).getByRole('link', { name: 'Try in Playground' }).click();
  await expect.poll(() => editorText(page)).toBe(first.code);
  const edited = 'print("edited snippet")';
  await setEditor(page, edited);
  await page.getByTestId('stdin').fill('snippet input');
  await page.getByTestId('timeout-2000').click();
  await page.reload();
  await expect(page).toHaveURL(/snippet=/);
  await expect.poll(() => editorText(page)).toBe(edited);
  await expect(page.getByTestId('stdin')).toHaveValue('snippet input');
  await expect(page.getByTestId('timeout-select')).toHaveAttribute('data-value', '2000');
  await page.reload();
  await expect.poll(() => editorText(page)).toBe(edited);
  await page.getByRole('button', { name: 'Restore previous code' }).click();
  await expect.poll(() => editorText(page)).toBe(original);
  await expect(page.getByTestId('stdin')).toHaveValue('original input\nsecond line');
  await expect(page.getByTestId('timeout-select')).toHaveAttribute('data-value', '10000');
  await page.reload();
  await expect.poll(() => editorText(page)).toBe(original);
  await expect(page.getByRole('button', { name: 'Restore previous code' })).toHaveCount(0);
});

for (const action of ['example', 'reset'] as const) {
  test(`${action} after snippet survives reload`, async ({ page }) => {
    await page.goto(snippetUrl(first.id));
    await expect.poll(() => editorText(page)).toBe(first.code);
    if (action === 'example') {
      await page.getByTestId('example-menu').locator('summary').click();
      await page.getByTestId('example-traceback').click();
      await expect.poll(() => editorText(page)).toContain('def average(nums):');
    } else {
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Reset', exact: true }).click();
      await expect.poll(() => editorText(page)).toContain('words =');
    }
    const source = await editorText(page);
    await expect(page).not.toHaveURL(/snippet=/);
    await page.reload();
    await expect.poll(() => editorText(page)).toBe(source);
    await page.getByRole('button', { name: 'Restore previous code' }).click();
    await expect.poll(() => editorText(page)).toBe(first.code);
    await page.reload();
    await expect.poll(() => editorText(page)).toBe(first.code);
  });
}

test('fresh links and switching snippets preload exact source while same-session reload keeps edits', async ({ page }) => {
  await page.goto(snippetUrl(first.id));
  await expect.poll(() => editorText(page)).toBe(first.code);
  await setEditor(page, 'print("first edited")');
  await page.goto(snippetUrl(second.id));
  await expect.poll(() => editorText(page)).toBe(second.code);
  await setEditor(page, 'print("second edited")');
  await page.reload();
  await expect.poll(() => editorText(page)).toBe('print("second edited")');
  await page.goto(snippetUrl(first.id));
  await expect.poll(() => editorText(page)).toBe(first.code);
  await page.getByRole('button', { name: 'Restore previous code' }).click();
  await expect.poll(() => editorText(page)).toBe('print("second edited")');
});
