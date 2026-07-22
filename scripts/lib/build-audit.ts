import { load } from 'cheerio';

const SITE_ORIGIN = 'https://juanfrxz.dev';
const MAX_RESPONSIVE_MEDIA_BYTES = 300 * 1024;
const LOCAL_ASSET_EXTENSION =
  /\.(?:avif|css|gif|glb|ico|jpe?g|js|json|ktx2|pdf|png|svg|webp|woff2?)$/i;
const BUDGETED_MEDIA_EXTENSION = /\.(?:avif|gif|jpe?g|png|webp)$/i;

export type BuildAuditCode =
  | 'heading-count'
  | 'hreflang-reciprocity'
  | 'html-lang'
  | 'invalid-json-ld'
  | 'missing-asset'
  | 'oversized-asset'
  | 'unavailable-link'
  | 'unsafe-blank-target';

export interface BuildAuditIssue {
  code: BuildAuditCode;
  filePath: string;
  message: string;
}

export interface BuildDocument {
  routePath: string;
  filePath: string;
  html: string;
}

export interface AssetInfo {
  exists: boolean;
  size: number;
}

export interface BuildAuditOptions {
  getAsset?: (path: string) => AssetInfo;
  maxResponsiveMediaBytes?: number;
}

interface ParsedDocument {
  source: BuildDocument;
  canonicalUrl: string | undefined;
  alternates: Map<string, string>;
}

function issue(
  source: BuildDocument,
  code: BuildAuditCode,
  message: string,
): BuildAuditIssue {
  return { code, filePath: source.filePath, message };
}

function expectedLanguage(routePath: string): 'en' | 'es' {
  return routePath.startsWith('/es/') ? 'es' : 'en';
}

function localAssetPath(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed, SITE_ORIGIN);
    if (
      url.origin !== SITE_ORIGIN ||
      !LOCAL_ASSET_EXTENSION.test(url.pathname)
    ) {
      return undefined;
    }
    return decodeURIComponent(url.pathname);
  } catch {
    return undefined;
  }
}

function referencedAssetPaths(html: string): string[] {
  const $ = load(html);
  const paths = new Set<string>();

  $('[src], [href], [poster]').each((_index, element) => {
    for (const attribute of ['src', 'href', 'poster']) {
      const path = localAssetPath($(element).attr(attribute) ?? '');
      if (path) {
        paths.add(path);
      }
    }
  });

  $('[srcset]').each((_index, element) => {
    const srcset = $(element).attr('srcset') ?? '';
    for (const candidate of srcset.split(',')) {
      const path = localAssetPath(candidate.trim().split(/\s+/)[0] ?? '');
      if (path) {
        paths.add(path);
      }
    }
  });

  return [...paths].sort();
}

function auditDocument(
  source: BuildDocument,
  options: BuildAuditOptions,
): { parsed: ParsedDocument; issues: BuildAuditIssue[] } {
  const $ = load(source.html);
  const issues: BuildAuditIssue[] = [];
  const expected = expectedLanguage(source.routePath);
  const actualLanguage = $('html').attr('lang');

  if (actualLanguage !== expected) {
    issues.push(
      issue(
        source,
        'html-lang',
        `Expected html[lang]="${expected}" but found "${actualLanguage ?? ''}".`,
      ),
    );
  }

  const headingCount = $('h1').length;
  if (headingCount !== 1) {
    issues.push(
      issue(
        source,
        'heading-count',
        `Expected one h1 but found ${headingCount}.`,
      ),
    );
  }

  $('script[type="application/ld+json"]').each((_index, element) => {
    try {
      JSON.parse($(element).text());
    } catch {
      issues.push(
        issue(source, 'invalid-json-ld', 'JSON-LD is not valid JSON.'),
      );
    }
  });

  $('a[target="_blank"]').each((_index, element) => {
    const rel = new Set(
      ($(element).attr('rel') ?? '').toLowerCase().split(/\s+/).filter(Boolean),
    );
    if (!rel.has('noopener') || !rel.has('noreferrer')) {
      issues.push(
        issue(
          source,
          'unsafe-blank-target',
          'target="_blank" requires rel="noopener noreferrer".',
        ),
      );
    }
  });

  $('a[data-link-state]').each((_index, element) => {
    const state = $(element).attr('data-link-state');
    if (state !== 'available') {
      issues.push(
        issue(
          source,
          'unavailable-link',
          `Link state "${state ?? ''}" must not render an href.`,
        ),
      );
    }
  });

  if (options.getAsset) {
    const maxBytes =
      options.maxResponsiveMediaBytes ?? MAX_RESPONSIVE_MEDIA_BYTES;
    for (const path of referencedAssetPaths(source.html)) {
      const asset = options.getAsset(path);
      if (!asset.exists) {
        issues.push(
          issue(source, 'missing-asset', `Missing local asset: ${path}`),
        );
      } else if (BUDGETED_MEDIA_EXTENSION.test(path) && asset.size > maxBytes) {
        issues.push(
          issue(
            source,
            'oversized-asset',
            `${path} is ${asset.size} bytes; limit is ${maxBytes}.`,
          ),
        );
      }
    }
  }

  const alternates = new Map<string, string>();
  $('link[rel="alternate"][hreflang]').each((_index, element) => {
    const language = $(element).attr('hreflang');
    const href = $(element).attr('href');
    if (language && href) {
      alternates.set(language, href);
    }
  });

  return {
    parsed: {
      source,
      canonicalUrl: $('link[rel="canonical"]').attr('href'),
      alternates,
    },
    issues,
  };
}

export function auditBuildDocuments(
  documents: readonly BuildDocument[],
  options: BuildAuditOptions = {},
): BuildAuditIssue[] {
  const results = documents.map((document) => auditDocument(document, options));
  const issues = results.flatMap((result) => result.issues);
  const byCanonical = new Map(
    results
      .filter((result) => result.parsed.canonicalUrl)
      .map((result) => [result.parsed.canonicalUrl!, result.parsed]),
  );

  for (const { parsed } of results) {
    if (!parsed.canonicalUrl) {
      continue;
    }

    for (const locale of ['en', 'es'] as const) {
      const alternateUrl = parsed.alternates.get(locale);
      const alternate = alternateUrl
        ? byCanonical.get(alternateUrl)
        : undefined;
      const sourceLocale = expectedLanguage(parsed.source.routePath);
      if (
        !alternateUrl ||
        !alternate ||
        alternate.alternates.get(sourceLocale) !== parsed.canonicalUrl
      ) {
        issues.push(
          issue(
            parsed.source,
            'hreflang-reciprocity',
            `Missing reciprocal ${locale} hreflang for ${parsed.canonicalUrl}.`,
          ),
        );
      }
    }
  }

  return issues;
}
