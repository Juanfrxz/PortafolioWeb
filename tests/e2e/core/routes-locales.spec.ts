import { expect, test } from '@playwright/test';

const routes = [
  ['/', 'en', 'Engineering interfaces for real systems.'],
  ['/es/', 'es', 'Creo interfaces para sistemas reales.'],
  ['/work/', 'en', 'Selected Work'],
  ['/es/proyectos/', 'es', 'Proyectos seleccionados'],
  ['/work/formula1/', 'en', 'Formula1'],
  ['/work/sgci-app/', 'en', 'SGCI-app'],
  ['/work/kinetic-systems-lab/', 'en', 'Kinetic Systems Lab'],
  ['/es/proyectos/formula1/', 'es', 'Formula1'],
  ['/es/proyectos/sgci-app/', 'es', 'SGCI-app'],
  [
    '/es/proyectos/kinetic-systems-lab/',
    'es',
    'Laboratorio de Sistemas Cinéticos',
  ],
] as const;

for (const [path, language, heading] of routes) {
  test(`${path} exposes its localized document contract`, async ({ page }) => {
    const response = await page.goto(path);

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      heading,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });
}

test('the configured contact channel submits in every browser engine', async ({
  page,
}) => {
  await page.route('**/formspree.io/f/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await page.goto('/');
  const form = page.locator('[data-contact-form]');
  await form.scrollIntoViewIfNeeded();
  await expect(form).toHaveAttribute('data-hydrated', 'true');
  await form.getByLabel('Name', { exact: true }).fill('Ada Lovelace');
  await form.getByLabel('Email', { exact: true }).fill('ada@example.com');
  await form
    .getByLabel('Message', { exact: true })
    .fill('I would like to discuss a real interface system.');
  await form.getByRole('button', { name: 'Send message' }).click();

  await expect(form.getByRole('status')).toContainText('Message sent.');
});
