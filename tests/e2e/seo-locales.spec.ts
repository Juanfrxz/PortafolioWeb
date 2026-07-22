import { expect, test } from '@playwright/test';

const routes = [
  {
    path: '/',
    canonical: 'https://juanfrxz.dev/',
    en: 'https://juanfrxz.dev/',
    es: 'https://juanfrxz.dev/es/',
    image: 'https://juanfrxz.dev/social/home-en.webp',
    locale: 'en_US',
  },
  {
    path: '/es/',
    canonical: 'https://juanfrxz.dev/es/',
    en: 'https://juanfrxz.dev/',
    es: 'https://juanfrxz.dev/es/',
    image: 'https://juanfrxz.dev/social/home-es.webp',
    locale: 'es_CO',
  },
  {
    path: '/work/',
    canonical: 'https://juanfrxz.dev/work/',
    en: 'https://juanfrxz.dev/work/',
    es: 'https://juanfrxz.dev/es/proyectos/',
    image: 'https://juanfrxz.dev/social/work-en.webp',
    locale: 'en_US',
  },
  {
    path: '/es/proyectos/',
    canonical: 'https://juanfrxz.dev/es/proyectos/',
    en: 'https://juanfrxz.dev/work/',
    es: 'https://juanfrxz.dev/es/proyectos/',
    image: 'https://juanfrxz.dev/social/work-es.webp',
    locale: 'es_CO',
  },
] as const;

for (const route of routes) {
  test(`${route.path} publishes localized social and alternate metadata`, async ({
    page,
  }) => {
    await page.goto(route.path);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      route.canonical,
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveAttribute('href', route.en);
    await expect(
      page.locator('link[rel="alternate"][hreflang="es"]'),
    ).toHaveAttribute('href', route.es);
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]'),
    ).toHaveAttribute('href', route.en);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      route.image,
    );
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      route.locale,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
  });
}

test('home publishes Person and WebSite JSON-LD', async ({ page }) => {
  await page.goto('/');
  const payload = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const graph = JSON.parse(payload ?? '{}')['@graph'];

  expect(graph.map((node: { '@type': string }) => node['@type'])).toEqual([
    'Person',
    'WebSite',
  ]);
});

test('a case publishes CreativeWork and public source metadata', async ({
  page,
}) => {
  await page.goto('/work/formula1/');
  const scripts = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const types = scripts.map((payload) => JSON.parse(payload)['@type']);

  expect(types).toEqual(['CreativeWork', 'SoftwareSourceCode']);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://juanfrxz.dev/social/formula1-en.webp',
  );
});
