import { expect, test, type BrowserContext } from '@playwright/test';

const routes = ['/', '/es/'] as const;

async function probeWebGL2(context: BrowserContext): Promise<boolean> {
  const probePage = await context.newPage();

  try {
    await probePage.goto('about:blank');
    return await probePage.evaluate(() => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2');

      if (!context) {
        return false;
      }

      context.getExtension('WEBGL_lose_context')?.loseContext();
      return true;
    });
  } finally {
    await probePage.close();
  }
}

for (const route of routes) {
  test(`${route} upgrades on capable hardware without losing accessible content`, async ({
    context,
    page,
  }) => {
    const serverResponse = await page.request.get(route);
    expect(await serverResponse.text()).toContain('data-render-state="poster"');
    const webgl2Available = await probeWebGL2(context);

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        configurable: true,
        value: 8,
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        configurable: true,
        value: 8,
      });
      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: {
          saveData: false,
          addEventListener() {},
          removeEventListener() {},
        },
      });
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(route);

    const fallback = page.locator('[data-hero-fallback]');
    const experience = page.locator('[data-hero-experience]');

    await expect(fallback).toBeVisible();

    await expect(page.locator('#system-core h1')).toBeVisible();
    await expect(page.locator('#system-core a')).toHaveCount(2);

    if (!webgl2Available) {
      await expect(experience).toHaveAttribute('data-quality-tier', 'static');
      await expect(experience.locator('canvas')).toHaveCount(0);
      return;
    }

    await expect(experience).toHaveAttribute('data-quality-tier', 'full', {
      timeout: 10_000,
    });
    await expect(
      experience.locator('canvas[data-canvas-ready="true"]'),
    ).toHaveCount(1);
    await expect(experience).toHaveAttribute(
      'data-model-phase',
      /^(light-ready|full-loading|full-ready)$/,
      { timeout: 20_000 },
    );
    await expect(experience).toHaveAttribute('data-render-state', 'ready', {
      timeout: 20_000,
    });
  });

  test(`${route} selects Static for reduced motion without creating Canvas`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);

    const experience = page.locator('[data-hero-experience]');
    await expect(experience).toHaveAttribute('data-quality-tier', 'static');
    await expect(experience).toHaveAttribute('data-render-state', 'static', {
      timeout: 30_000,
    });
    await expect(experience.locator('canvas')).toHaveCount(0);
    await expect(page.locator('[data-hero-fallback]')).toBeVisible();
  });
}

test('WebGL2 failure deterministically falls back to Static', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(
      this: HTMLCanvasElement,
      contextId: string,
      ...args: unknown[]
    ) {
      if (contextId === 'webgl2') {
        return null;
      }

      return Reflect.apply(originalGetContext, this, [contextId, ...args]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });

  await page.goto('/');

  const experience = page.locator('[data-hero-experience]');
  await expect(experience).toHaveAttribute('data-quality-tier', 'static');
  await expect(experience).toHaveAttribute('data-render-state', 'static', {
    timeout: 30_000,
  });
  await expect(experience.locator('canvas')).toHaveCount(0);
  await expect(page.locator('[data-hero-fallback]')).toBeVisible();
});
