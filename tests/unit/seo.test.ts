import { describe, expect, it } from 'vitest';

import formula1Source from '../../src/content/projects/formula1.json';
import { projectSchema, type Project } from '../../src/content/schema';
import {
  buildHomeStructuredData,
  buildProjectStructuredData,
  buildSeo,
} from '../../src/lib/seo';

describe('buildSeo', () => {
  it('builds absolute English discovery metadata and reciprocal alternates', () => {
    const seo = buildSeo({
      locale: 'en',
      title: 'Kinetic Systems Lab',
      description: 'Evidence-led creative systems.',
      canonicalPath: '/',
      alternatePath: '/es/',
      socialImagePath: '/social/home-en.webp',
    });

    expect(seo.canonicalUrl).toBe('https://juanfrxz.dev/');
    expect(seo.alternates).toEqual({
      en: 'https://juanfrxz.dev/',
      es: 'https://juanfrxz.dev/es/',
      xDefault: 'https://juanfrxz.dev/',
    });
    expect(seo.openGraph).toMatchObject({
      locale: 'en_US',
      type: 'website',
      url: 'https://juanfrxz.dev/',
      image: 'https://juanfrxz.dev/social/home-en.webp',
    });
    expect(seo.twitter).toEqual({
      card: 'summary_large_image',
      title: 'Kinetic Systems Lab',
      description: 'Evidence-led creative systems.',
      image: 'https://juanfrxz.dev/social/home-en.webp',
    });
  });

  it('keeps x-default on English for Spanish routes and supports noindex', () => {
    const seo = buildSeo({
      locale: 'es',
      title: 'Proyectos seleccionados',
      description: 'Sistemas creativos con evidencia.',
      canonicalPath: '/es/proyectos/',
      alternatePath: '/work/',
      socialImagePath: '/social/work-es.webp',
      noindex: true,
    });

    expect(seo.alternates.xDefault).toBe('https://juanfrxz.dev/work/');
    expect(seo.openGraph.locale).toBe('es_CO');
    expect(seo.robots).toBe('noindex, follow');
  });
});

describe('structured data', () => {
  it('describes the home page as one Person and one WebSite', () => {
    const graph = buildHomeStructuredData('en')['@graph'];

    expect(graph.map((node) => node['@type'])).toEqual(['Person', 'WebSite']);
    expect(graph[0]).toMatchObject({
      name: 'Juan Rodriguez',
      url: 'https://juanfrxz.dev/',
    });
    expect(graph[1]).toMatchObject({
      name: 'Kinetic Systems Lab',
      inLanguage: 'en',
    });
  });

  it('adds SoftwareSourceCode only when a public repository is available', () => {
    const project = projectSchema.parse(formula1Source);
    const available = buildProjectStructuredData(project, 'en');

    expect(available.map((node) => node['@type'])).toEqual([
      'CreativeWork',
      'SoftwareSourceCode',
    ]);
    expect(available[1]).toMatchObject({
      codeRepository: 'https://github.com/Juanfrxz/Formula1',
    });

    const sourceOnly = {
      ...project,
      repository: { state: 'source-only', url: null },
    } as Project;
    expect(buildProjectStructuredData(sourceOnly, 'es')).toHaveLength(1);
    expect(buildProjectStructuredData(sourceOnly, 'es')[0]?.['@type']).toBe(
      'CreativeWork',
    );
  });
});
