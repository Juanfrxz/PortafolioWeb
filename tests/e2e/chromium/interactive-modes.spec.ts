import { expect, test } from '@playwright/test';

test('reduced motion preserves the static hero and vertical work narrative', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.locator('[data-hero-experience]')).toHaveAttribute(
    'data-quality-tier',
    'static',
  );
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('[data-selected-work]')).toHaveAttribute(
    'data-track-mode',
    'vertical',
  );
});

test('data saver selects the static hero without removing content', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        saveData: true,
        effectiveType: '4g',
        addEventListener() {},
        removeEventListener() {},
      },
    });
  });
  await page.goto('/');

  await expect(page.locator('[data-hero-experience]')).toHaveAttribute(
    'data-quality-tier',
    'static',
  );
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
