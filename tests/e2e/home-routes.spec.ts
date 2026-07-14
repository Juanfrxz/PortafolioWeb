import { expect, test } from '@playwright/test';

const homes = [
  {
    path: '/',
    lang: 'en',
    heading: 'Engineering interfaces for real systems.',
    labels: ['Name', 'Email', 'Message'],
    hiddenTitles: ['Proyecto MySQL', 'FacturaWeb-Lit', 'Event Mobile App'],
  },
  {
    path: '/es/',
    lang: 'es',
    heading: 'Creo interfaces para sistemas reales.',
    labels: ['Nombre', 'Correo electrónico', 'Mensaje'],
    hiddenTitles: [
      'Proyecto MySQL',
      'FacturaWeb-Lit',
      'Aplicación Móvil de Eventos',
    ],
  },
] as const;

for (const home of homes) {
  test(`${home.path} renders the complete static home`, async ({ page }) => {
    const response = await page.goto(home.path);

    expect(response?.ok()).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('lang', home.lang);
    await expect(
      page.getByRole('heading', { level: 1, name: home.heading }),
    ).toBeVisible();

    const moduleIds = await page
      .locator('main#main-content > [id]')
      .evaluateAll((elements) => elements.map(({ id }) => id));

    expect(moduleIds).toEqual([
      'system-core',
      'selected-work',
      'capabilities',
      'signal-trail',
      'contact',
    ]);

    const fallback = page.locator('[data-hero-fallback]');
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveAttribute('aria-hidden', 'true');

    const chapters = page.locator('[data-project-chapter]');
    await expect(chapters).toHaveCount(3);
    expect(
      await chapters.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-project-chapter')),
      ),
    ).toEqual(['formula1', 'sgci-app', 'kinetic-systems-lab']);
    expect(
      await chapters.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-ownership')),
      ),
    ).toEqual(['collaborative', 'collaborative', 'individual']);

    const trail = page.locator('[data-trail-entry]');
    await expect(trail).toHaveCount(4);
    expect(
      await trail.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('data-experience-id')),
      ),
    ).toEqual([
      'ict-infrastructure',
      'network-operations',
      'full-stack-systems',
      'creative-interface-engineering',
    ]);
    await expect(page.locator('[data-current="true"]')).toHaveCount(1);
    await expect(page.locator('[data-current="true"]')).toHaveAttribute(
      'data-experience-id',
      'full-stack-systems',
    );

    const form = page.locator('#contact form');
    await expect(form).toBeVisible();

    for (const label of home.labels) {
      await expect(form.getByLabel(label, { exact: true })).toBeVisible();
    }

    await expect(form.getByRole('button')).toBeDisabled();

    for (const title of home.hiddenTitles) {
      await expect(page.getByText(title, { exact: true })).toHaveCount(0);
    }

    await expect(
      page.locator('[data-project-chapter="event-mobile-app"]'),
    ).toHaveCount(0);

    if (home.lang === 'es') {
      await expect(page.getByText(/repository collaborators/i)).toHaveCount(0);
    }
  });
}
