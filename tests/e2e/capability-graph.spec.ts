import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const homes = [
  {
    path: '/',
    graphSummary: 'Show capability graph',
    frontend: 'Frontend systems',
    backend: 'Backend architecture',
    selected: 'Selected',
    resultName: 'Backend architecture evidence',
  },
  {
    path: '/es/',
    graphSummary: 'Mostrar grafo de capacidades',
    frontend: 'Sistemas frontend',
    backend: 'Arquitectura backend',
    selected: 'Seleccionado',
    resultName: 'Evidencia de Arquitectura backend',
  },
] as const;

const expectedRelations = [
  'frontend::astro::kinetic-systems-lab',
  'frontend::javascript::formula1',
  'frontend::react::kinetic-systems-lab',
  'frontend::typescript::kinetic-systems-lab',
  'frontend::web-components::formula1',
  'backend::c-sharp::sgci-app',
  'backend::dotnet::sgci-app',
  'data::javascript::formula1',
  'data::sql::sgci-app',
  'immersive::three-js::formula1',
  'immersive::three-js::kinetic-systems-lab',
  'delivery::astro::kinetic-systems-lab',
  'delivery::typescript::kinetic-systems-lab',
] as const;

for (const home of homes) {
  test(`${home.path} keeps list and graph on one normalized projection`, async ({
    page,
  }) => {
    await page.goto(home.path);

    const capabilitySection = page.locator('#capabilities');
    const semanticList = capabilitySection.locator('[data-capability-list]');
    const graph = capabilitySection.locator('[data-capability-graph]');
    await expect(semanticList).toBeVisible();
    await expect(graph).toBeVisible();

    const listRelations = await semanticList
      .locator('[data-capability-relation]')
      .evaluateAll((elements) =>
        elements.map((element) =>
          element.getAttribute('data-capability-relation'),
        ),
      );
    const graphRelations = await graph
      .locator('svg [data-capability-relation]')
      .evaluateAll((elements) =>
        elements.map((element) =>
          element.getAttribute('data-capability-relation'),
        ),
      );

    expect(listRelations.length).toBeGreaterThan(0);
    expect(listRelations).toEqual(expectedRelations);
    expect(graphRelations).toEqual(listRelations);
    await graph.scrollIntoViewIfNeeded();
    await expect(graph).toHaveAttribute('data-hydrated', 'true');

    const frontend = graph.getByRole('button', {
      name: new RegExp(home.frontend, 'i'),
    });
    const backend = graph.getByRole('button', {
      name: new RegExp(home.backend, 'i'),
    });
    await expect(frontend).toHaveAttribute('aria-pressed', 'true');
    await frontend.focus();
    await page.keyboard.press('ArrowRight');
    await expect(backend).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(backend).toHaveAttribute('aria-pressed', 'true');
    await expect(
      backend.getByText(home.selected, { exact: true }),
    ).toBeVisible();
    await expect(
      graph.getByRole('region', { name: home.resultName }),
    ).toBeVisible();
  });

  test(`${home.path} keeps the semantic list primary on mobile`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(home.path);

    const capabilitySection = page.locator('#capabilities');
    const list = capabilitySection.locator('[data-capability-list]');
    const disclosure = capabilitySection.locator(
      'details[data-capability-graph-disclosure]',
    );

    await expect(list).toBeVisible();
    await expect(disclosure).toBeVisible();
    await expect(disclosure).not.toHaveAttribute('open', '');
    await expect(
      disclosure.getByText(home.graphSummary, { exact: true }),
    ).toBeVisible();
    expect(
      await capabilitySection.evaluate((section) => {
        const semanticList = section.querySelector('[data-capability-list]');
        const graphDisclosure = section.querySelector(
          'details[data-capability-graph-disclosure]',
        );

        return Boolean(
          semanticList &&
          graphDisclosure &&
          semanticList.compareDocumentPosition(graphDisclosure) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
      }),
    ).toBe(true);

    await disclosure.locator('summary').click();
    await expect(disclosure).toHaveAttribute('open', '');

    const mobileGraph = disclosure.locator('[data-capability-graph]');
    await expect(mobileGraph).toBeVisible();
    await expect(mobileGraph).toHaveAttribute('data-hydrated', 'true');

    const backend = mobileGraph.getByRole('button', {
      name: new RegExp(home.backend, 'i'),
    });
    await backend.click();
    await expect(backend).toHaveAttribute('aria-pressed', 'true');
    await expect(
      backend.getByText(home.selected, { exact: true }),
    ).toBeVisible();
  });
}

test('desktop-to-mobile resize preserves an open disclosure and focused graph control', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  const disclosure = page.locator('details[data-capability-graph-disclosure]');
  const graph = disclosure.locator('[data-capability-graph]');
  await graph.scrollIntoViewIfNeeded();
  await expect(graph).toHaveAttribute('data-hydrated', 'true');

  const backend = graph.getByRole('button', {
    name: /backend architecture/i,
  });
  await backend.focus();
  await expect(backend).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });

  await expect(disclosure).toHaveAttribute('open', '');
  await expect(backend).toBeFocused();
  await expect(backend).toBeVisible();
  expect(
    await page.evaluate(() => document.activeElement?.textContent),
  ).toContain('Backend architecture');
});

test('responsive disclosure releases its owned media-query listener', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const nativeMatchMedia = window.matchMedia.bind(window);
    const counts = { added: 0, removed: 0 };
    Object.defineProperty(window, '__capabilityListenerCounts', {
      value: counts,
    });

    window.matchMedia = (query) => {
      const mediaQuery = nativeMatchMedia(query);

      if (query !== '(max-width: 50rem)') return mediaQuery;

      return new Proxy(mediaQuery, {
        get(target, property) {
          if (property === 'addEventListener') {
            return (
              type: string,
              listener: EventListenerOrEventListenerObject,
              options?: AddEventListenerOptions | boolean,
            ) => {
              if (type === 'change') counts.added += 1;
              target.addEventListener(type, listener, options);
            };
          }

          if (property === 'removeEventListener') {
            return (
              type: string,
              listener: EventListenerOrEventListenerObject,
              options?: EventListenerOptions | boolean,
            ) => {
              if (type === 'change') counts.removed += 1;
              target.removeEventListener(type, listener, options);
            };
          }

          const value = Reflect.get(target, property, target);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    };
  });
  await page.goto('/');

  const listenerCounts = () =>
    page.evaluate(() => {
      const counts = (
        window as Window & {
          __capabilityListenerCounts?: {
            added: number;
            removed: number;
          };
        }
      ).__capabilityListenerCounts;

      if (!counts) {
        throw new Error('Capability listener instrumentation was not set.');
      }

      return counts;
    });

  await expect.poll(listenerCounts).toEqual({ added: 1, removed: 0 });
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent('pagehide', { persisted: false }),
    ),
  );
  await expect.poll(listenerCounts).toEqual({ added: 1, removed: 1 });

  await page.reload();
  await expect.poll(listenerCounts).toEqual({ added: 1, removed: 0 });
  await page.evaluate(() =>
    document.dispatchEvent(new Event('astro:before-swap')),
  );
  await expect.poll(listenerCounts).toEqual({ added: 1, removed: 1 });
});

test('@a11y capability experiences have no automated Axe violations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const desktopGraph = page.locator('[data-capability-graph]');
  await desktopGraph.scrollIntoViewIfNeeded();
  await expect(desktopGraph).toHaveAttribute('data-hydrated', 'true');

  const desktopResults = await new AxeBuilder({ page })
    .include('#capabilities')
    .analyze();
  expect(desktopResults.violations).toEqual([]);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/es/');
  const mobileDisclosure = page.locator(
    'details[data-capability-graph-disclosure]',
  );
  await mobileDisclosure.locator('summary').click();
  const mobileGraph = mobileDisclosure.locator('[data-capability-graph]');
  await expect(mobileGraph).toBeVisible();
  await expect(mobileGraph).toHaveAttribute('data-hydrated', 'true');

  const mobileResults = await new AxeBuilder({ page })
    .include('#capabilities')
    .analyze();
  expect(mobileResults.violations).toEqual([]);
});

test('the complete capability evidence remains available without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  const list = page.locator('[data-capability-list]');
  await expect(list).toBeVisible();
  expect(
    await list
      .locator('[data-capability-relation]')
      .evaluateAll((elements) =>
        elements.map((element) =>
          element.getAttribute('data-capability-relation'),
        ),
      ),
  ).toEqual(expectedRelations);
  await expect(
    list.getByRole('heading', { name: 'Frontend systems' }),
  ).toBeVisible();
  await expect(
    list.getByText('Formula1', { exact: true }).first(),
  ).toBeVisible();

  await context.close();
});
