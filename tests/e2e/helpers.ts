import { expect, type Page, type TestInfo } from '@playwright/test';

/** Collect console errors and uncaught page errors; assert none at the end. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return {
    errors,
    allow(re: RegExp) {
      for (let i = errors.length - 1; i >= 0; i--) if (re.test(errors[i])) errors.splice(i, 1);
    },
  };
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.documentElement.clientWidth,
  }));
  expect(overflow.doc, 'document must not scroll horizontally').toBeLessThanOrEqual(0);
  expect(overflow.body, 'body must not be wider than the viewport').toBeLessThanOrEqual(0);
}

/** Replace the CodeMirror document by typing, as a user would (select all, then insert). */
export async function setEditor(page: Page, code: string) {
  const content = page.locator('[data-testid=editor] .cm-content');
  await content.click();
  await page.keyboard.press('ControlOrMeta+A');
  // Mobile-WebKit device emulation can drop the select-all shortcut; fall back to a DOM
  // selection over the editor content (CodeMirror adopts DOM selection changes).
  const allSelected = () =>
    content.evaluate((el) => (getSelection()?.toString() ?? '').replace(/\s/g, '') === (el.textContent ?? '').replace(/\s/g, ''));
  if (!(await allSelected())) {
    await content.evaluate((el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      const sel = getSelection()!;
      sel.removeAllRanges();
      sel.addRange(r);
    });
    await expect.poll(allSelected).toBe(true);
  }
  // Type over the selection (no forward-Delete: mobile WebKit emulation mishandles it, and
  // phone keyboards have no such key).
  await page.keyboard.insertText(code);
  await expect.poll(async () => (await editorText(page)).trim()).toBe(code.trim());
}

export async function editorText(page: Page) {
  return page.locator('[data-testid=editor] .cm-content').evaluate((el) =>
    [...el.querySelectorAll('.cm-line')].map((l) => l.textContent).join('\n'),
  );
}

export async function shot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: `test-results/screens/${info.project.name}-${name}.png`, fullPage: false });
}

export const isNarrow = (info: TestInfo) => (info.project.use.viewport?.width ?? 1440) < 1024;
