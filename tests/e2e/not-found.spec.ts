import { expect, test } from '@playwright/test';

test('English unknown routes render the useful noindex 404', async ({
  page,
}) => {
  const response = await page.goto('/missing-system/');

  expect(response?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
  await expect(page.locator('[data-not-found-locale="en"]')).toBeVisible();
  await expect(page.locator('[data-not-found-locale="es"]')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute(
    'href',
    '/',
  );
});

test('Spanish unknown routes select Spanish before interaction', async ({
  page,
}) => {
  const response = await page.goto('/es/sistema-perdido/');

  expect(response?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('[data-not-found-locale="es"]')).toBeVisible();
  await expect(page.locator('[data-not-found-locale="en"]')).toBeHidden();
  await expect(
    page.getByRole('link', { name: 'Volver al inicio' }),
  ).toHaveAttribute('href', '/es/');
});

test('the 404 remains navigable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/missing-without-javascript/');

  await expect(page.locator('[data-not-found-locale="en"]')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Inicio en español' }),
  ).toBeVisible();
  await context.close();
});
