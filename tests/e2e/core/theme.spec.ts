import { expect, test } from '@playwright/test';

for (const theme of ['dark', 'light'] as const) {
  test(`saved ${theme} theme is the first observed document state`, async ({
    page,
  }) => {
    await page.addInitScript((savedTheme) => {
      localStorage.setItem('theme', savedTheme);
      const observed: string[] = [];
      Object.assign(window, { __observedThemes: observed });
      new MutationObserver(() => {
        const current = document.documentElement?.dataset.theme;
        if (current) observed.push(current);
      }).observe(document, {
        attributes: true,
        attributeFilter: ['data-theme'],
        subtree: true,
      });
    }, theme);

    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const observed = await page.evaluate(
      () =>
        (window as typeof window & { __observedThemes?: string[] })
          .__observedThemes ?? [],
    );
    expect(observed[0]).toBe(theme);

    const control = page.locator('.theme-control');
    await expect(control).toBeVisible();
    await control.click();
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      theme === 'dark' ? 'light' : 'dark',
    );
  });
}
