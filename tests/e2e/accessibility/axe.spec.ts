import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routePairs = [
  ['/', '/es/'],
  ['/work/', '/es/proyectos/'],
  ['/work/formula1/', '/es/proyectos/formula1/'],
  ['/work/sgci-app/', '/es/proyectos/sgci-app/'],
  ['/work/kinetic-systems-lab/', '/es/proyectos/kinetic-systems-lab/'],
] as const;

for (const routes of routePairs) {
  for (const path of routes) {
    for (const theme of ['dark', 'light'] as const) {
      test(`${path} ${theme} has no automated axe violations`, async ({
        page,
      }) => {
        await page.addInitScript((savedTheme) => {
          localStorage.setItem('theme', savedTheme);
        }, theme);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(path);
        const results = await new AxeBuilder({ page }).analyze();

        expect(results.violations).toEqual([]);
      });
    }
  }
}
