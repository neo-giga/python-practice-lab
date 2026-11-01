// A drill opened from one of its skills' pages stays in that skill: the back link names it and
// "Next drill" follows that skill's drill sequence (Bugbot on PR #3: DrillPage used skills[0]).
// bfs-hop-distances is tagged [algo-bfs, deque]; here it is opened from its SECOND skill, deque.
import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

test('a multi-skill drill opened from its second skill keeps that skill for the back link and Next drill', async ({ page }) => {
  const w = watchErrors(page);
  await page.goto('./#/skill/deque');
  const links = page.getByTestId('skill-drill').getByRole('link');
  const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
  const k = hrefs.findIndex((h) => h.startsWith('#/drill/bfs-hop-distances'));
  expect(k, 'bfs-hop-distances is listed on the deque page').toBeGreaterThanOrEqual(0);
  const nextId = hrefs[k + 1].replace(/^#\/drill\//, '').replace(/\?.*$/, '');
  await links.nth(k).click();

  await expect(page.getByTestId('drill')).toHaveAttribute('data-drill-id', 'bfs-hop-distances');
  const back = page.locator('main .back-link');
  await expect(back).toContainText('collections.deque');
  await expect(back).toHaveAttribute('href', '#/skill/deque');
  await expect(page.getByTestId('next-drill')).toHaveAttribute('href', new RegExp(`^#/drill/${nextId}(\\?from=deque)?$`));

  // Next drill keeps the source skill.
  await page.getByTestId('next-drill').click();
  await expect(page.getByTestId('drill')).toHaveAttribute('data-drill-id', nextId);
  await expect(page.locator('main .back-link')).toHaveAttribute('href', '#/skill/deque');

  // A source skill the drill does not have falls back to its first skill (no crash, no not-found page).
  await page.goto('./#/drill/bfs-hop-distances?from=heapq');
  await expect(page.getByTestId('drill')).toHaveAttribute('data-drill-id', 'bfs-hop-distances');
  await expect(page.locator('main .back-link')).toHaveAttribute('href', '#/skill/algo-bfs');
  expect(w.errors).toEqual([]);
});
