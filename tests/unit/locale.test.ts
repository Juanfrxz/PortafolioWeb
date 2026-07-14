import { describe, expect, it } from 'vitest';

import {
  alternateLocalePath,
  caseStudyPath,
  homePath,
  workIndexPath,
  type Locale,
} from '../../src/lib/locale';

describe('locale route helpers', () => {
  it.each<[Locale, string]>([
    ['en', '/'],
    ['es', '/es/'],
  ])('builds the %s home path', (locale, expectedPath) => {
    expect(homePath(locale)).toBe(expectedPath);
  });

  it.each<[Locale, string]>([
    ['en', '/work/'],
    ['es', '/es/proyectos/'],
  ])('builds the %s work index path', (locale, expectedPath) => {
    expect(workIndexPath(locale)).toBe(expectedPath);
  });

  it.each<[Locale, string]>([
    ['en', '/work/formula1/'],
    ['es', '/es/proyectos/formula1/'],
  ])('builds the %s case-study path', (locale, expectedPath) => {
    expect(caseStudyPath('formula1', locale)).toBe(expectedPath);
  });

  it.each<[string, Locale, string]>([
    ['/work/', 'es', '/es/proyectos/'],
    ['/es/proyectos/', 'en', '/work/'],
    ['/work/formula1/', 'es', '/es/proyectos/formula1/'],
    ['/es/proyectos/formula1/', 'en', '/work/formula1/'],
    ['/es/', 'en', '/'],
    ['/', 'es', '/es/'],
  ])(
    'maps the known route %s to its %s counterpart',
    (path, targetLocale, expectedPath) => {
      expect(alternateLocalePath(path, targetLocale)).toBe(expectedPath);
    },
  );

  it.each<[string, Locale, string]>([
    ['/work', 'es', '/es/proyectos/'],
    ['/es/proyectos', 'en', '/work/'],
    ['/work/formula1', 'es', '/es/proyectos/formula1/'],
    ['/es/proyectos/formula1', 'en', '/work/formula1/'],
    ['/es', 'en', '/'],
  ])(
    'normalizes a missing trailing slash in %s',
    (path, targetLocale, expectedPath) => {
      expect(alternateLocalePath(path, targetLocale)).toBe(expectedPath);
    },
  );

  it.each<[string, Locale, string]>([
    ['/', 'en', '/'],
    ['/es/', 'es', '/es/'],
    ['/work/', 'en', '/work/'],
    ['/es/proyectos/', 'es', '/es/proyectos/'],
    ['/work/formula1', 'en', '/work/formula1/'],
    ['/es/proyectos/formula1', 'es', '/es/proyectos/formula1/'],
  ])(
    'normalizes known same-locale route %s for %s',
    (path, targetLocale, expectedPath) => {
      expect(alternateLocalePath(path, targetLocale)).toBe(expectedPath);
    },
  );

  it.each<[string, Locale, string]>([
    ['/about/', 'en', '/'],
    ['/about/', 'es', '/es/'],
    ['/es/desconocido/', 'en', '/'],
    ['/work/formula1/details/', 'es', '/es/'],
  ])(
    'falls back from unknown path %s to the %s home',
    (path, targetLocale, expectedPath) => {
      expect(alternateLocalePath(path, targetLocale)).toBe(expectedPath);
    },
  );
});
