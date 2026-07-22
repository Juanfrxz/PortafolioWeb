import { expect, test } from '@playwright/test';

const homes = [
  {
    path: '/',
    heading: 'Engineering interfaces for real systems.',
    skipLink: 'Skip to main content',
  },
  {
    path: '/es/',
    heading: 'Creo interfaces para sistemas reales.',
    skipLink: 'Saltar al contenido principal',
  },
] as const;

for (const home of homes) {
  test(`${home.path} reflows at a 200 percent equivalent viewport`, async ({
    page,
  }) => {
    // A 640 CSS-pixel viewport represents a 1280-pixel desktop viewport at 200%.
    await page.setViewportSize({ width: 640, height: 450 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(home.path);

    await expect(
      page.getByRole('heading', { level: 1, name: home.heading }),
    ).toBeVisible();
    await expect(page.locator('details[data-hud-menu]')).toBeVisible();
    await expect(page.locator('.hud__desktop-navigation')).toBeHidden();
    await expect(page.locator('#contact form')).toBeVisible();

    const viewport = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth + 1);

    const formControlsFit = await page
      .locator('#contact input, #contact textarea, #contact button')
      .evaluateAll((elements) =>
        elements.every((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left >= -1 && rect.right <= window.innerWidth + 1;
        }),
      );
    expect(formControlsFit).toBe(true);
  });

  test(`${home.path} preserves content and focus in forced colors`, async ({
    page,
  }) => {
    await page.emulateMedia({
      colorScheme: 'dark',
      forcedColors: 'active',
      reducedMotion: 'reduce',
    });
    await page.goto(home.path);

    expect(
      await page.evaluate(() => matchMedia('(forced-colors: active)').matches),
    ).toBe(true);
    await expect(
      page.getByRole('heading', { level: 1, name: home.heading }),
    ).toBeVisible();
    await expect(page.locator('#contact form')).toBeVisible();

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: home.skipLink });
    await expect(skipLink).toBeFocused();
    const focus = await skipLink.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(focus.outlineStyle).not.toBe('none');
    expect(focus.outlineWidth).toBeGreaterThanOrEqual(2);
  });
}
