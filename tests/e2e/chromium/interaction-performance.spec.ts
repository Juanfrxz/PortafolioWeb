import { expect, test } from '@playwright/test';

test('theme interaction responds within the synthetic 200ms budget', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.theme-control')).toHaveAccessibleName(/theme/i);

  const duration = await page
    .locator('.theme-control')
    .evaluate(async (element) => {
      const button = element as HTMLButtonElement;
      const before = document.documentElement.dataset.theme;
      const started = performance.now();
      button.click();
      while (document.documentElement.dataset.theme === before) {
        await new Promise(requestAnimationFrame);
      }
      return performance.now() - started;
    });

  expect(duration).toBeLessThanOrEqual(200);
});
