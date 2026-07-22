import { expect, test } from '@playwright/test';

const homeCases = [
  {
    name: 'home-desktop',
    path: '/',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: 'home-mobile',
    path: '/',
    viewport: { width: 390, height: 844 },
  },
  {
    name: 'home-es-desktop',
    path: '/es/',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: 'home-es-mobile',
    path: '/es/',
    viewport: { width: 390, height: 844 },
  },
] as const;

async function preparePage(
  page: import('@playwright/test').Page,
  path: string,
  theme: 'dark' | 'light',
  viewport: { width: number; height: number },
) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript((savedTheme) => {
    localStorage.setItem('theme', savedTheme);
  }, theme);
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);

  const hero = page.locator('[data-hero-experience]');
  if ((await hero.count()) > 0) {
    await expect(hero).toHaveAttribute('data-render-state', 'static');
  }
  const graph = page.locator('[data-capability-graph]');
  if ((await graph.count()) > 0) {
    if (viewport.width > 800) {
      await graph.scrollIntoViewIfNeeded();
      await expect(graph).toHaveAttribute('data-hydrated', 'true');
    } else {
      await expect(graph).toHaveAttribute('data-hydrated', 'false');
    }
  }
  const contact = page.locator('[data-contact-form]');
  if ((await contact.count()) > 0) {
    await contact.scrollIntoViewIfNeeded();
    await expect(contact).toHaveAttribute('data-hydrated', 'true');
  }
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images, async (image) => {
        if (!image.complete) {
          await new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          });
        }

        await image.decode().catch(() => undefined);
      }),
    );
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        window.scrollTo(0, 0);
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

for (const theme of ['dark', 'light'] as const) {
  for (const homeCase of homeCases) {
    test(`${homeCase.name} ${theme} visual`, async ({ page }) => {
      await preparePage(page, homeCase.path, theme, homeCase.viewport);
      await expect(page).toHaveScreenshot(`${homeCase.name}-${theme}.png`, {
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
      });
    });
  }

  test(`formula1 case ${theme} visual`, async ({ page }) => {
    await preparePage(page, '/work/formula1/', theme, {
      width: 1440,
      height: 900,
    });
    await expect(page).toHaveScreenshot(`formula1-${theme}.png`, {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
  });
}

test('technology tokens use the bundled monospace font', async ({ page }) => {
  await page.goto('/');
  const technology = page
    .locator(
      '[data-featured-project="formula1"] .project-chapter__technologies code',
    )
    .first();

  await expect(technology).toBeAttached();
  await expect
    .poll(() =>
      technology.evaluate((element) => getComputedStyle(element).fontFamily),
    )
    .toContain('DM Mono');
});
