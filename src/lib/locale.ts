export type Locale = 'en' | 'es';

const homePaths: Record<Locale, string> = {
  en: '/',
  es: '/es/',
};

const workIndexPaths: Record<Locale, string> = {
  en: '/work/',
  es: '/es/proyectos/',
};

export function homePath(locale: Locale): string {
  return homePaths[locale];
}

export function workIndexPath(locale: Locale): string {
  return workIndexPaths[locale];
}

export function caseStudyPath(slug: string, locale: Locale): string {
  return `${workIndexPath(locale)}${slug}/`;
}

function withTrailingSlash(path: string): string {
  if (path === '/') {
    return path;
  }

  return `${path.replace(/\/+$/, '')}/`;
}

export function alternateLocalePath(
  currentPath: string,
  targetLocale: Locale,
): string {
  const path = withTrailingSlash(currentPath);

  if (path === homePath('en') || path === homePath('es')) {
    return homePath(targetLocale);
  }

  if (path === workIndexPath('en') || path === workIndexPath('es')) {
    return workIndexPath(targetLocale);
  }

  const caseStudyMatch = path.match(/^\/(?:work|es\/proyectos)\/([^/]+)\/$/);

  if (caseStudyMatch?.[1]) {
    return caseStudyPath(caseStudyMatch[1], targetLocale);
  }

  return homePath(targetLocale);
}
