import { SITE } from '../config/site';
import type { Project } from '../content/schema';
import { caseStudyPath, homePath, type Locale } from './locale';

export type OpenGraphType = 'website' | 'article';
export type JsonLdObject = Record<string, unknown>;

export interface SeoInput {
  locale: Locale;
  title: string;
  description: string;
  canonicalPath: string;
  alternatePath: string;
  socialImagePath: string;
  openGraphType?: OpenGraphType;
  noindex?: boolean;
}

export interface SeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  alternates: {
    en: string;
    es: string;
    xDefault: string;
  };
  openGraph: {
    title: string;
    description: string;
    siteName: string;
    type: OpenGraphType;
    locale: 'en_US' | 'es_CO';
    alternateLocale: 'en_US' | 'es_CO';
    url: string;
    image: string;
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    image: string;
  };
  robots: 'index, follow' | 'noindex, follow';
}

export function absoluteSiteUrl(path: string): string {
  return new URL(`/${path.replace(/^\/+/, '')}`, SITE.url).href;
}

export function buildSeo({
  locale,
  title,
  description,
  canonicalPath,
  alternatePath,
  socialImagePath,
  openGraphType = 'website',
  noindex = false,
}: SeoInput): SeoMetadata {
  const canonicalUrl = absoluteSiteUrl(canonicalPath);
  const alternateUrl = absoluteSiteUrl(alternatePath);
  const englishUrl = locale === 'en' ? canonicalUrl : alternateUrl;
  const spanishUrl = locale === 'es' ? canonicalUrl : alternateUrl;
  const socialImageUrl = absoluteSiteUrl(socialImagePath);

  return {
    title,
    description,
    canonicalUrl,
    alternates: {
      en: englishUrl,
      es: spanishUrl,
      xDefault: englishUrl,
    },
    openGraph: {
      title,
      description,
      siteName: 'Kinetic Systems Lab',
      type: openGraphType,
      locale: locale === 'en' ? 'en_US' : 'es_CO',
      alternateLocale: locale === 'en' ? 'es_CO' : 'en_US',
      url: canonicalUrl,
      image: socialImageUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: socialImageUrl,
    },
    robots: noindex ? 'noindex, follow' : 'index, follow',
  };
}

export function buildHomeStructuredData(locale: Locale): {
  '@context': 'https://schema.org';
  '@graph': JsonLdObject[];
} {
  const personId = `${SITE.url}/#person`;
  const websiteId = `${SITE.url}/#website`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: SITE.name,
        url: absoluteSiteUrl(homePath('en')),
        jobTitle:
          locale === 'en'
            ? 'Creative Full-Stack Developer'
            : 'Desarrollador Full-Stack Creativo',
        sameAs: SITE.professionalLinks.map((link) => link.href),
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: 'Kinetic Systems Lab',
        url: absoluteSiteUrl(homePath(locale)),
        inLanguage: locale,
        publisher: { '@id': personId },
      },
    ],
  };
}

export function buildProjectStructuredData(
  project: Project,
  locale: Locale,
): JsonLdObject[] {
  const projectUrl = absoluteSiteUrl(caseStudyPath(project.slug, locale));
  const creativeWork: JsonLdObject = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${projectUrl}#creative-work`,
    name: project.title[locale],
    description: project.summary[locale],
    url: projectUrl,
    inLanguage: locale,
    author: { '@id': `${SITE.url}/#person` },
    isPartOf: { '@id': `${SITE.url}/#website` },
    keywords: project.technologies.join(', '),
  };

  if (project.repository.state !== 'available') {
    return [creativeWork];
  }

  return [
    creativeWork,
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      '@id': `${projectUrl}#source-code`,
      name: project.title[locale],
      description: project.summary[locale],
      url: projectUrl,
      codeRepository: project.repository.url,
      programmingLanguage: project.technologies,
      inLanguage: locale,
      author: { '@id': `${SITE.url}/#person` },
    },
  ];
}
