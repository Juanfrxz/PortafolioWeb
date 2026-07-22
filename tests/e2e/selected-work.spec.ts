import { expect, test, type Page } from '@playwright/test';

const expectedOrder = ['formula1', 'sgci-app', 'kinetic-systems-lab'];
const expectedTitles = ['Formula1', 'SGCI-app', 'Kinetic Systems Lab'];

async function projectOrder(page: Page) {
  return page
    .locator('[data-project-chapter]')
    .evaluateAll((chapters) =>
      chapters.map((chapter) => chapter.getAttribute('data-project-chapter')),
    );
}

async function chapterTops(page: Page) {
  return page
    .locator('[data-project-chapter]')
    .evaluateAll((chapters) =>
      chapters.map(
        (chapter) => chapter.getBoundingClientRect().top + window.scrollY,
      ),
    );
}

async function scrollToChapterTarget(page: Page, chapterIndex: number) {
  const top = await page
    .locator('[data-selected-work-stage]')
    .evaluate((stage, index) => {
      const trackTop = stage.getBoundingClientRect().top + window.scrollY;
      const top = trackTop + window.innerHeight * (1 + Number(index));
      window.scrollTo({ top, behavior: 'auto' });
      return top;
    }, chapterIndex);
  await expect
    .poll(() =>
      page.evaluate((target) => Math.abs(window.scrollY - Number(target)), top),
    )
    .toBeLessThan(3);
  return top;
}

async function expectHorizontalTargetFits(page: Page, chapterIndex: number) {
  const chapter = page.locator('[data-project-chapter]').nth(chapterIndex);
  await scrollToChapterTarget(page, chapterIndex);
  await expect
    .poll(() =>
      chapter.evaluate((element) =>
        Math.max(
          Math.abs(element.getBoundingClientRect().left),
          Math.abs(element.getBoundingClientRect().top),
        ),
      ),
    )
    .toBeLessThan(3);

  const measurement = await chapter.evaluate((element) => {
    const track = element.closest<HTMLElement>('[data-selected-work-track]');
    const controls = Array.from(
      element.querySelectorAll<HTMLElement>(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
      (control) => {
        const bounds = control.getBoundingClientRect();
        return {
          left: bounds.left,
          right: bounds.right,
          top: bounds.top,
          bottom: bounds.bottom,
        };
      },
    );

    return {
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      trackScrollHeight: track?.scrollHeight ?? Number.POSITIVE_INFINITY,
      articleScrollHeight: element.scrollHeight,
      controls,
    };
  });

  expect(measurement.trackScrollHeight).toBeLessThanOrEqual(
    measurement.viewportHeight,
  );
  expect(measurement.articleScrollHeight).toBeLessThanOrEqual(
    measurement.viewportHeight,
  );
  expect(measurement.controls.length).toBeGreaterThan(0);

  for (const control of measurement.controls) {
    expect(control.left).toBeGreaterThanOrEqual(-1);
    expect(control.right).toBeLessThanOrEqual(measurement.viewportWidth + 1);
    expect(control.top).toBeGreaterThanOrEqual(-1);
    expect(control.bottom).toBeLessThanOrEqual(measurement.viewportHeight + 1);
  }
}

async function expectNextSectionReachable(page: Page) {
  const nextSection = page.locator('#capabilities');
  await nextSection.evaluate((element) =>
    element.scrollIntoView({ block: 'start', behavior: 'auto' }),
  );
  await expect(nextSection).toBeVisible();
  await expect
    .poll(() =>
      nextSection.evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeLessThan(page.viewportSize()?.height ?? 0);
}

test('eligible tall desktop uses a bounded native-scroll track without trapping scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  const selectedWork = page.locator('[data-selected-work]');
  const stage = page.locator('[data-selected-work-stage]');
  const track = page.locator('[data-selected-work-track]');

  await expect(selectedWork).toHaveAttribute('data-track-mode', 'horizontal');
  expect(await projectOrder(page)).toEqual(expectedOrder);
  expect(
    await page
      .locator('[data-project-chapter] > .project-chapter__inner > header h3')
      .allTextContents(),
  ).toEqual(expectedTitles);
  await expect(stage).toHaveCSS('--selected-work-track-viewports', '4');
  await expect(track).toHaveCSS('position', 'sticky');

  for (
    let chapterIndex = 0;
    chapterIndex < expectedOrder.length;
    chapterIndex += 1
  ) {
    await expectHorizontalTargetFits(page, chapterIndex);
  }

  const entranceTop = await stage.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + 20, behavior: 'auto' });
    return top + 20;
  });
  await expect
    .poll(() =>
      page.evaluate(
        (top) => Math.abs(window.scrollY - Number(top)),
        entranceTop,
      ),
    )
    .toBeLessThan(3);
  const beforeWheel = await page.evaluate(() => window.scrollY);
  const stageBox = await stage.boundingBox();

  if (!stageBox) {
    throw new Error('Selected Work stage is not visible');
  }

  await page.mouse.move(
    stageBox.x + stageBox.width / 2,
    Math.min(stageBox.y + stageBox.height / 2, 900),
  );
  await page.mouse.wheel(0, 600);

  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(beforeWheel + 100);
  await expectNextSectionReachable(page);
});

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
]) {
  test(`${viewport.width}x${viewport.height} enables horizontal only when every chapter and control fits`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    const selectedWork = page.locator('[data-selected-work]');
    await expect(selectedWork).toHaveAttribute('data-track-ready', 'true');
    await expect(selectedWork).toHaveAttribute(
      'data-track-mode',
      /^(horizontal|vertical)$/,
    );
    const mode = await selectedWork.getAttribute('data-track-mode');

    if (mode === 'horizontal') {
      for (
        let chapterIndex = 0;
        chapterIndex < expectedOrder.length;
        chapterIndex += 1
      ) {
        await expectHorizontalTargetFits(page, chapterIndex);
      }
    } else {
      expect(await projectOrder(page)).toEqual(expectedOrder);
      const tops = await chapterTops(page);
      expect(tops[1]).toBeGreaterThan(tops[0] ?? 0);
      expect(tops[2]).toBeGreaterThan(tops[1] ?? 0);

      const chapterLinks = page.locator('[data-project-chapter] a');
      for (let index = 0; index < (await chapterLinks.count()); index += 1) {
        await chapterLinks.nth(index).scrollIntoViewIfNeeded();
        await expect(chapterLinks.nth(index)).toBeVisible();
      }
    }

    await expectNextSectionReachable(page);
  });
}

test('1100x600 safety guard falls back to the vertical narrative', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 600 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  await expect(page.locator('[data-selected-work]')).toHaveAttribute(
    'data-track-mode',
    'vertical',
  );
  const tops = await chapterTops(page);
  expect(tops[1]).toBeGreaterThan(tops[0] ?? 0);
  expect(tops[2]).toBeGreaterThan(tops[1] ?? 0);
});

test('ScrollTrigger refresh re-evaluates the safety guard after viewport changes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  const selectedWork = page.locator('[data-selected-work]');
  await expect(selectedWork).toHaveAttribute('data-track-mode', 'horizontal');

  await page.setViewportSize({ width: 1440, height: 600 });
  await expect(selectedWork).toHaveAttribute('data-track-mode', 'vertical');

  await page.setViewportSize({ width: 1440, height: 1200 });
  await expect(selectedWork).toHaveAttribute('data-track-mode', 'horizontal');
});

test('native Tab focus synchronizes and reveals controls in chapters two and three', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  await expect(page.locator('[data-selected-work]')).toHaveAttribute(
    'data-track-mode',
    'horizontal',
  );

  const chapters = page.locator('[data-project-chapter]');

  for (const chapterIndex of [1, 2]) {
    await scrollToChapterTarget(page, chapterIndex - 1);
    await chapters
      .nth(chapterIndex - 1)
      .locator('a')
      .last()
      .focus();
    await page.keyboard.press('Tab');

    await expect
      .poll(() =>
        page.evaluate(() =>
          document.activeElement
            ?.closest('[data-project-chapter]')
            ?.getAttribute('data-project-chapter'),
        ),
      )
      .toBe(expectedOrder[chapterIndex]);

    const expectedTop = await page
      .locator('[data-selected-work-stage]')
      .evaluate((stage, index) => {
        const trackTop = stage.getBoundingClientRect().top + window.scrollY;
        return trackTop + window.innerHeight * (1 + Number(index));
      }, chapterIndex);
    await expect
      .poll(() =>
        page.evaluate(
          (top) => Math.abs(window.scrollY - Number(top)),
          expectedTop,
        ),
      )
      .toBeLessThan(20);

    const activeBounds = await page.evaluate(() => {
      const bounds = document.activeElement?.getBoundingClientRect();
      return bounds
        ? {
            left: bounds.left,
            right: bounds.right,
            top: bounds.top,
            bottom: bounds.bottom,
            width: window.innerWidth,
            height: window.innerHeight,
          }
        : null;
    });

    expect(activeBounds).not.toBeNull();
    expect(activeBounds?.left).toBeGreaterThanOrEqual(-1);
    expect(activeBounds?.right).toBeLessThanOrEqual(
      (activeBounds?.width ?? 0) + 1,
    );
    expect(activeBounds?.top).toBeGreaterThanOrEqual(-1);
    expect(activeBounds?.bottom).toBeLessThanOrEqual(
      (activeBounds?.height ?? 0) + 1,
    );
  }
});

test('pagehide preserves bfcache state and cleans up only on real unload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  const selectedWork = page.locator('[data-selected-work]');
  await expect(selectedWork).toHaveAttribute('data-track-mode', 'horizontal');

  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent('pagehide', { persisted: true }),
    ),
  );
  await expect(selectedWork).toHaveAttribute('data-track-mode', 'horizontal');

  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent('pagehide', { persisted: false }),
    ),
  );
  await expect(selectedWork).toHaveAttribute('data-track-mode', 'vertical');

  await page.reload();
  await expect(selectedWork).toHaveAttribute('data-track-mode', 'horizontal');
  await page.evaluate(() =>
    document.dispatchEvent(new Event('astro:before-swap')),
  );
  await expect(selectedWork).toHaveAttribute('data-track-mode', 'vertical');
});

for (const mode of [
  { name: 'mobile', width: 900, reducedMotion: 'no-preference' as const },
  { name: 'reduced motion', width: 1440, reducedMotion: 'reduce' as const },
]) {
  test(`${mode.name} keeps the authoritative vertical sequence`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: mode.width, height: 900 });
    await page.emulateMedia({ reducedMotion: mode.reducedMotion });
    await page.goto('/');

    await expect(page.locator('[data-selected-work]')).toHaveAttribute(
      'data-track-mode',
      'vertical',
    );
    expect(await projectOrder(page)).toEqual(expectedOrder);

    const tops = await chapterTops(page);
    expect(tops[1]).toBeGreaterThan(tops[0] ?? 0);
    expect(tops[2]).toBeGreaterThan(tops[1] ?? 0);
  });
}

test('no JavaScript preserves the vertical project narrative', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    await page.goto('/');
    await expect(page.locator('[data-selected-work]')).toHaveAttribute(
      'data-track-mode',
      'vertical',
    );
    expect(await projectOrder(page)).toEqual(expectedOrder);

    const tops = await chapterTops(page);
    expect(tops[1]).toBeGreaterThan(tops[0] ?? 0);
    expect(tops[2]).toBeGreaterThan(tops[1] ?? 0);
  } finally {
    await context.close();
  }
});
