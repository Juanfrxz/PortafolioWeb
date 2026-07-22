import { expect, test } from '@playwright/test';

test('mobile navigation opens, closes, and transfers focus to its target', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('.hud__desktop-navigation')).toBeHidden();
  const details = page.locator('details[data-hud-menu]');
  const summary = details.locator('summary');
  await summary.click();
  await expect(details).toHaveAttribute('open', '');
  await details.getByRole('link', { name: 'Contact' }).click();
  await expect(details).not.toHaveAttribute('open', '');
  await expect(page.locator('#contact')).toBeFocused();
});

test('desktop navigation keeps all primary controls available', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  await expect(page.locator('.hud__desktop-navigation')).toBeVisible();
  await expect(page.locator('details[data-hud-menu]')).toBeHidden();
  await expect(page.locator('.theme-control')).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Change language' }),
  ).toBeVisible();
});
