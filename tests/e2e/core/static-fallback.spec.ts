import { expect, test } from '@playwright/test';

test.use({ javaScriptEnabled: false });

for (const route of [
  { path: '/', cta: 'Explore selected work', contact: 'Open Channel' },
  { path: '/es/', cta: 'Explorar proyectos', contact: 'Abrir un canal' },
] as const) {
  test(`${route.path} remains complete without JavaScript`, async ({
    page,
  }) => {
    await page.goto(route.path);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: route.cta })).toBeVisible();
    await expect(page.locator('[data-project-chapter]')).toHaveCount(3);
    await expect(page.locator('[data-capability-list]')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: route.contact, exact: true }),
    ).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  });
}
