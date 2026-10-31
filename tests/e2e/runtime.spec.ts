// @runtime tests run in Chromium (3 viewports), Firefox and WebKit, all against
// the real self-hosted Pyodide runtime. Nothing here is mocked.
import { expect, test } from '@playwright/test';
import { editorText, expectNoHorizontalOverflow, setEditor, shot, watchErrors } from './helpers';

test.describe('Playground runtime @runtime', () => {
  test('stdout, traceback, Stop on an infinite loop, timeout, then a correct run', async ({ page }, info) => {
    const w = watchErrors(page);
    await page.goto('#/playground');
    await expect(page.getByTestId('runtime-status')).toContainText('not loaded yet');

    // stdout + exact runtime version after real initialisation
    await setEditor(page, 'import sys\nprint(sys.version_info[:2], 2 + 2)\nprint("héllo", end="")');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('stdout')).toHaveText('(3, 14) 4\nhéllo', { timeout: 90_000 });
    await expect(page.getByTestId('run-summary')).toHaveAttribute('data-status', 'ok');
    await expect(page.getByTestId('runtime-status')).toContainText(/Python 3\.14\.\d+ · Pyodide 314\.0\.7 · ready/);

    // Python error -> traceback on stderr limited to the user's file
    await setEditor(page, 'def f(xs):\n    return xs[3]\n\nprint("before")\nf([1])');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('stderr')).toContainText('IndexError: list index out of range');
    await expect(page.getByTestId('stderr')).toContainText('File "main.py", line 5');
    await expect(page.getByTestId('stdout')).toHaveText('before');
    await expect(page.getByTestId('run-summary')).toHaveAttribute('data-status', 'error');
    await expect(page.getByTestId('stderr')).not.toContainText('_pyodide');

    // Infinite loop: the UI stays responsive and Stop terminates the worker
    await setEditor(page, 'print("spinning", flush=True)\nwhile True:\n    pass');
    await page.getByTestId('timeout-select').selectOption('30000');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('stop')).toBeVisible();
    await expect(page.getByTestId('stdout')).toHaveText('spinning'); // streamed before the loop
    const t0 = Date.now();
    await page.locator('details.stdin summary').click(); // main thread still handles input
    expect(Date.now() - t0).toBeLessThan(2000);
    const ticks = await page.evaluate(
      () => new Promise<number>((res) => {
        let n = 0;
        const id = setInterval(() => n++, 50);
        setTimeout(() => (clearInterval(id), res(n)), 1000);
      }),
    );
    // Python runs in the worker, so UI-thread timers keep firing. Headless Firefox
    // throttles 50 ms intervals (8/s observed), so assert 'not blocked', not full rate.
    console.log(`[${info.project.name}] UI timer ticks during infinite loop: ${ticks}/20`);
    expect(ticks).toBeGreaterThanOrEqual(5);
    await page.getByTestId('stop').click();
    await expect(page.getByTestId('run-summary')).toHaveAttribute('data-status', 'stopped');
    await expect(page.getByTestId('run-summary')).toContainText('Stopped');

    // Execution timeout (2 s limit) is enforced by terminating the worker
    await page.getByTestId('timeout-select').selectOption('2000');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('run-summary')).toHaveAttribute('data-status', 'timeout', { timeout: 30_000 });
    await expect(page.getByTestId('run-summary')).toContainText('Timed out');

    // ...and the next run works without reloading, in a fresh interpreter
    await setEditor(page, 'print(sum(range(10)))\nprint("x" in globals())');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('stdout')).toHaveText('45\nFalse');
    await expect(page.getByTestId('run-summary')).toHaveAttribute('data-status', 'ok');
    await expectNoHorizontalOverflow(page);
    await shot(page, info, 'playground');
    expect(w.errors).toEqual([]);
  });

  test('stdin box feeds input(); EOF is explained', async ({ page }) => {
    await page.goto('#/playground');
    await page.getByTestId('example-select').selectOption('stdin');
    await page.locator('details.stdin summary').click();
    await page.getByTestId('stdin').fill('3\n4 5 6');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('stdout')).toHaveText('3 15', { timeout: 90_000 });
    await page.getByTestId('stdin').fill('');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('stderr')).toContainText('EOFError');
  });

  test('output floods are capped at 64 KiB and the tab stays usable', async ({ page }) => {
    await page.goto('#/playground');
    await setEditor(page, 'for i in range(200000):\n    print("line", i)\nprint("x" * 300000, end="")');
    await page.getByTestId('timeout-select').selectOption('10000');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('run-summary')).toHaveAttribute('data-status', /ok|timeout/, { timeout: 90_000 });
    await expect(page.getByText('Output truncated at 64 KiB.')).toBeVisible();
    const len = await page.getByTestId('stdout').evaluate((el) => el.textContent!.length);
    expect(len).toBeLessThanOrEqual(64 * 1024);
  });

  test('recipe -> Run here and recipe -> Playground (previous code restorable)', async ({ page }) => {
    const w = watchErrors(page);
    await page.goto('#/playground');
    await setEditor(page, 'print("my own scratch")');
    await page.waitForTimeout(500);
    await page.goto('#/learn/counter');
    const card = page.locator('#recipe-counter');
    await card.getByTestId('recipe-run-btn').click();
    await expect(card.getByTestId('recipe-run')).toContainText('Output matches', { timeout: 90_000 });
    await card.getByTestId('open-playground').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Playground' })).toBeVisible();
    expect(await editorText(page)).toContain('Counter("mississippi")');
    await page.getByTestId('run').click();
    await expect(page.getByTestId('stdout')).toContainText("4 0 [('i', 4), ('s', 4)]");
    await page.getByRole('button', { name: 'Restore previous code' }).click();
    expect(await editorText(page)).toContain('my own scratch');
    expect(w.errors).toEqual([]);
  });
});
