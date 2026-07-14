import { expect, test } from '@playwright/test';

test('the HUD exposes keyboard-first anchors and real locale navigation', async ({
  page,
}) => {
  await page.goto('/');

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveAttribute('href', '#main-content');

  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  await expect(
    page.getByRole('link', { name: 'Work', exact: true }),
  ).toHaveAttribute('href', '#selected-work');
  await expect(page.getByRole('link', { name: 'About' })).toHaveAttribute(
    'href',
    '#signal-trail',
  );
  await expect(page.getByRole('link', { name: 'Contact' })).toHaveAttribute(
    'href',
    '#contact',
  );

  await expect(page.locator('.theme-control')).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Change language' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'ES', exact: true }).click();
  await expect(page).toHaveURL('/es/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(
    page.getByRole('navigation', { name: 'Cambiar idioma' }),
  ).toBeVisible();
});

for (const home of [
  {
    path: '/',
    openLabel: 'Open navigation menu',
    closeLabel: 'Close navigation menu',
    contact: 'Contact',
  },
  {
    path: '/es/',
    openLabel: 'Abrir menú de navegación',
    closeLabel: 'Cerrar menú de navegación',
    contact: 'Contacto',
  },
] as const) {
  test(`${home.path} provides an accessible mobile details menu`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(home.path);

    const details = page.locator('details[data-hud-menu]');
    const summary = details.locator('summary');

    await expect(summary).toHaveAccessibleName(home.openLabel);
    await summary.focus();
    await summary.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await expect(summary).toHaveAccessibleName(home.closeLabel);

    const targets = [
      summary,
      details.getByRole('link', { name: home.contact }),
      page.getByRole('link', { name: 'EN', exact: true }),
      page.getByRole('link', { name: 'ES', exact: true }),
      page.locator('.theme-control'),
    ];

    for (const target of targets) {
      const box = await target.boundingBox();
      expect(box, 'interactive target must have a layout box').not.toBeNull();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }

    await summary.press('Enter');
    await expect(details).not.toHaveAttribute('open', '');
    await expect(page.locator('.theme-control')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'EN', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'ES', exact: true }),
    ).toBeVisible();

    await summary.press('Enter');
    await details.getByRole('link', { name: home.contact }).click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(details).not.toHaveAttribute('open', '');
    await expect(page.locator('#contact')).toBeFocused();

    const focusRemainsHidden = await details.evaluate((element) =>
      element.contains(document.activeElement),
    );
    expect(focusRemainsHidden).toBe(false);
  });
}
