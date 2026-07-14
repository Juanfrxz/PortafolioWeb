export type Locale = 'en' | 'es';

const homePaths: Record<Locale, string> = {
  en: '/',
  es: '/es/',
};

const workIndexPaths: Record<Locale, string> = {
  en: '/work/',
  es: '/es/proyectos/',
};

const caseStudySlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function homePath(locale: Locale): string {
  return homePaths[locale];
}

export function workIndexPath(locale: Locale): string {
  return workIndexPaths[locale];
}

export function caseStudyPath(slug: string, locale: Locale): string {
  assertCaseStudySlug(slug);

  return `${workIndexPath(locale)}${slug}/`;
}

function isCaseStudySlug(slug: string): boolean {
  return caseStudySlugPattern.test(slug);
}

function assertCaseStudySlug(slug: string): void {
  if (!isCaseStudySlug(slug)) {
    throw new TypeError(
      'Case-study slug must be a lowercase kebab-case segment.',
    );
  }
}

function normalizedPathname(path: string): string | null {
  const separatorIndex = path.search(/[?#]/);
  const pathname = separatorIndex === -1 ? path : path.slice(0, separatorIndex);

  if (!pathname.startsWith('/') || pathname.includes('//')) {
    return null;
  }

  if (pathname === '/' || pathname.endsWith('/')) {
    return pathname;
  }

  return `${pathname}/`;
}

export function alternateLocalePath(
  currentPath: string,
  targetLocale: Locale,
): string {
  const path = normalizedPathname(currentPath);

  if (path === null) {
    return homePath(targetLocale);
  }

  if (path === homePath('en') || path === homePath('es')) {
    return homePath(targetLocale);
  }

  if (path === workIndexPath('en') || path === workIndexPath('es')) {
    return workIndexPath(targetLocale);
  }

  const caseStudyMatch = path.match(/^\/(?:work|es\/proyectos)\/([^/]+)\/$/);

  if (caseStudyMatch?.[1] && isCaseStudySlug(caseStudyMatch[1])) {
    return caseStudyPath(caseStudyMatch[1], targetLocale);
  }

  return homePath(targetLocale);
}
