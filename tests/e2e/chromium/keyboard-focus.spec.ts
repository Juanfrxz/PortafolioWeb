import { expect, test } from '@playwright/test';

test('keyboard navigation exposes a visible focus indicator and skip target', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();

  const focusStyle = await skipLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(focusStyle.outlineStyle).not.toBe('none');
  expect(focusStyle.outlineWidth).toBeGreaterThanOrEqual(2);

  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('capability graph uses the documented roving keyboard contract', async ({
  page,
}) => {
  await page.goto('/');
  const graph = page.locator('[data-capability-graph]');
  await graph.scrollIntoViewIfNeeded();
  await expect(graph).toHaveAttribute('data-hydrated', 'true');
  const buttons = graph.getByRole('button');
  await buttons.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
});
