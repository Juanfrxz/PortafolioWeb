import { expect, test } from '@playwright/test';

const workIndexes = [
  {
    path: '/work/',
    lang: 'en',
    heading: 'Selected Work',
    featuredTitles: ['Formula1', 'SGCI-app', 'Kinetic Systems Lab'],
    archiveTitles: ['Proyecto MySQL', 'FacturaWeb-Lit'],
    hiddenTitle: 'Event Mobile App',
    sourceOnly: 'Source only',
  },
  {
    path: '/es/proyectos/',
    lang: 'es',
    heading: 'Proyectos seleccionados',
    featuredTitles: [
      'Formula1',
      'SGCI-app',
      'Laboratorio de Sistemas Cinéticos',
    ],
    archiveTitles: ['Proyecto MySQL', 'FacturaWeb-Lit'],
    hiddenTitle: 'Aplicación Móvil de Eventos',
    sourceOnly: 'Solo código fuente',
  },
] as const;

for (const workIndex of workIndexes) {
  test(`${workIndex.path} publishes featured cases and the launch archive`, async ({
    page,
  }) => {
    const response = await page.goto(workIndex.path);

    expect(response?.ok()).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('lang', workIndex.lang);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(
      page.getByRole('heading', { level: 1, name: workIndex.heading }),
    ).toBeVisible();

    const featured = page.locator('[data-featured-project]');
    await expect(featured).toHaveCount(3);

    for (const title of workIndex.featuredTitles) {
      await expect(
        featured.getByRole('heading', { level: 2, name: title }),
      ).toBeVisible();
    }

    const caseLinks = page.locator('[data-case-study-link]');
    await expect(caseLinks).toHaveCount(3);
    expect(
      await caseLinks.evaluateAll((links) =>
        links.map((link) => link.getAttribute('href')),
      ),
    ).toEqual(
      workIndex.lang === 'en'
        ? ['/work/formula1/', '/work/sgci-app/', '/work/kinetic-systems-lab/']
        : [
            '/es/proyectos/formula1/',
            '/es/proyectos/sgci-app/',
            '/es/proyectos/kinetic-systems-lab/',
          ],
    );

    const archive = page.locator('[data-archive-project]');
    await expect(archive).toHaveCount(2);

    for (const title of workIndex.archiveTitles) {
      const entry = archive.filter({ hasText: title });
      await expect(entry).toHaveCount(1);
      await expect(
        entry.locator('a[data-project-link="repository"]'),
      ).toHaveAttribute('rel', 'noopener noreferrer');
      await expect(
        entry.locator('[data-project-link="demo"]'),
      ).not.toHaveAttribute('href', /.+/);
      await expect(entry.locator('[data-project-link="demo"]')).toHaveText(
        workIndex.sourceOnly,
      );
    }

    await expect(
      page.getByText(workIndex.hiddenTitle, { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.locator(
        'a[href*="event-mobile-app"], a[href*="proyecto-mysql/"], a[href*="facturaweb-lit/"]',
      ),
    ).toHaveCount(0);

    if (workIndex.lang === 'es') {
      await expect(page.getByText('ARCHIVE / 02', { exact: true })).toHaveCount(
        0,
      );
    }
  });
}

const caseStudies = [
  {
    path: '/work/formula1/',
    lang: 'en',
    title: 'Formula1',
    ownership: 'Collaborative project',
    alternatePath: '/es/proyectos/formula1/',
    backPath: '/work/',
    hasImage: true,
    sourceOnly: 'Source only',
    attribution: 'Formula1 repository collaborators',
  },
  {
    path: '/work/sgci-app/',
    lang: 'en',
    title: 'SGCI-app',
    ownership: 'Collaborative project',
    alternatePath: '/es/proyectos/sgci-app/',
    backPath: '/work/',
    hasImage: false,
    sourceOnly: 'Source only',
    attribution: 'SGCI-app repository collaborators',
  },
  {
    path: '/work/kinetic-systems-lab/',
    lang: 'en',
    title: 'Kinetic Systems Lab',
    ownership: 'Individual project',
    alternatePath: '/es/proyectos/kinetic-systems-lab/',
    backPath: '/work/',
    hasImage: false,
    sourceOnly: 'Source only',
    attribution: null,
  },
  {
    path: '/es/proyectos/formula1/',
    lang: 'es',
    title: 'Formula1',
    ownership: 'Proyecto colaborativo',
    alternatePath: '/work/formula1/',
    backPath: '/es/proyectos/',
    hasImage: true,
    sourceOnly: 'Solo código fuente',
    attribution: 'Colaboradores del repositorio Formula1',
  },
  {
    path: '/es/proyectos/sgci-app/',
    lang: 'es',
    title: 'SGCI-app',
    ownership: 'Proyecto colaborativo',
    alternatePath: '/work/sgci-app/',
    backPath: '/es/proyectos/',
    hasImage: false,
    sourceOnly: 'Solo código fuente',
    attribution: 'Colaboradores del repositorio SGCI-app',
  },
  {
    path: '/es/proyectos/kinetic-systems-lab/',
    lang: 'es',
    title: 'Laboratorio de Sistemas Cinéticos',
    ownership: 'Proyecto individual',
    alternatePath: '/work/kinetic-systems-lab/',
    backPath: '/es/proyectos/',
    hasImage: false,
    sourceOnly: 'Solo código fuente',
    attribution: null,
  },
] as const;

for (const caseStudy of caseStudies) {
  test(`${caseStudy.path} exposes a complete evidence-led case`, async ({
    page,
  }) => {
    const response = await page.goto(caseStudy.path);

    expect(response?.ok()).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('lang', caseStudy.lang);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(
      page.getByRole('heading', { level: 1, name: caseStudy.title }),
    ).toBeVisible();
    await expect(
      page.getByText(caseStudy.ownership, { exact: true }),
    ).toBeVisible();

    const attribution = page.locator('[data-team-attribution]');
    if (caseStudy.attribution) {
      expect((await attribution.textContent())?.trim()).toBe(
        caseStudy.attribution,
      );
    } else {
      expect(await attribution.count()).toBe(0);
    }

    const expectedSections =
      caseStudy.lang === 'en'
        ? [
            'Problem',
            'Contribution',
            'Architecture',
            'Key decisions',
            'Outcome',
            'Technologies',
          ]
        : [
            'Problema',
            'Contribución',
            'Arquitectura',
            'Decisiones clave',
            'Resultado',
            'Tecnologías',
          ];

    for (const section of expectedSections) {
      await expect(
        page.getByRole('heading', { name: section, exact: true }),
      ).toBeVisible();
    }

    await expect(page.locator('[data-architecture-map] ol li')).not.toHaveCount(
      0,
    );
    await expect(page.locator('[data-architecture-map] svg')).toHaveAttribute(
      'aria-hidden',
      'true',
    );

    const identity = page.locator('[data-project-identity]');
    await expect(identity).toHaveCount(1);
    await expect(
      identity.locator(caseStudy.hasImage ? 'img' : '[data-identity-fallback]'),
    ).toHaveCount(1);

    const repository = page.locator('a[data-project-link="repository"]');
    await expect(repository).toHaveAttribute('target', '_blank');
    await expect(repository).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(page.locator('a[data-project-link="demo"]')).toHaveCount(0);
    await expect(page.locator('[data-project-link="demo"]')).toHaveText(
      caseStudy.sourceOnly,
    );

    await expect(page.locator('[data-back-to-work]')).toHaveAttribute(
      'href',
      caseStudy.backPath,
    );
    await expect(
      page.locator(`a[hreflang="${caseStudy.lang === 'en' ? 'es' : 'en'}"]`),
    ).toHaveAttribute('href', caseStudy.alternatePath);

    const homePath = caseStudy.lang === 'en' ? '/' : '/es/';
    const homeAnchors = [
      ['data-hud-work', `${homePath}#selected-work`],
      ['data-hud-about', `${homePath}#signal-trail`],
      ['data-hud-contact', `${homePath}#contact`],
    ] as const;

    for (const [attribute, href] of homeAnchors) {
      await expect(
        page.locator(`.hud__desktop-navigation [${attribute}]`),
      ).toHaveAttribute('href', href);
    }

    if (caseStudy.lang === 'es') {
      await expect(page.getByText(/repository collaborators/i)).toHaveCount(0);
      await expect(page.getByText(/^NODE \/ /)).toHaveCount(0);
      await expect(
        page.getByText('IDENTITY SIGNAL', { exact: true }),
      ).toHaveCount(0);
      await expect(page.getByLabel(/connects to/i)).toHaveCount(0);
    }
  });
}

for (const unavailablePath of [
  '/work/proyecto-mysql/',
  '/work/facturaweb-lit/',
  '/work/event-mobile-app/',
  '/es/proyectos/proyecto-mysql/',
  '/es/proyectos/facturaweb-lit/',
  '/es/proyectos/event-mobile-app/',
]) {
  test(`${unavailablePath} is not generated`, async ({ page }) => {
    const response = await page.goto(unavailablePath);
    expect(response?.status()).toBe(404);
  });
}
