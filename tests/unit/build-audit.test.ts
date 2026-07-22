import { describe, expect, it } from 'vitest';

import {
  auditBuildDocuments,
  type BuildDocument,
} from '../../scripts/lib/build-audit';
import { validateProductionEnvironment } from '../../scripts/check-production-env';

const englishDocument: BuildDocument = {
  routePath: '/',
  filePath: 'dist/index.html',
  html: `<!doctype html>
    <html lang="es">
      <head>
        <link rel="canonical" href="https://juanfrxz.dev/">
        <link rel="alternate" hreflang="en" href="https://juanfrxz.dev/">
        <link rel="alternate" hreflang="es" href="https://juanfrxz.dev/es/">
        <script type="application/ld+json">{broken json</script>
      </head>
      <body>
        <h1>One</h1><h1>Two</h1>
        <a href="https://example.com" target="_blank">Unsafe link</a>
        <a href="https://example.com/demo" data-project-link="demo" data-link-state="unavailable">Dead demo</a>
        <img src="/missing.webp" alt="Missing">
        <img src="/large.webp" alt="Too large">
      </body>
    </html>`,
};

const spanishDocument: BuildDocument = {
  routePath: '/es/',
  filePath: 'dist/es/index.html',
  html: `<!doctype html>
    <html lang="es">
      <head>
        <link rel="canonical" href="https://juanfrxz.dev/es/">
        <link rel="alternate" hreflang="es" href="https://juanfrxz.dev/es/">
      </head>
      <body><h1>Uno</h1></body>
    </html>`,
};

describe('auditBuildDocuments', () => {
  it('reports structural, safety, localization, asset, and reciprocity defects', () => {
    const issues = auditBuildDocuments([englishDocument, spanishDocument], {
      getAsset(path) {
        if (path === '/large.webp') {
          return { exists: true, size: 300 * 1024 + 1 };
        }
        return { exists: false, size: 0 };
      },
    });
    const codes = new Set(issues.map((issue) => issue.code));

    expect(codes).toEqual(
      new Set([
        'heading-count',
        'hreflang-reciprocity',
        'html-lang',
        'invalid-json-ld',
        'missing-asset',
        'oversized-asset',
        'unavailable-link',
        'unsafe-blank-target',
      ]),
    );
  });

  it('accepts a reciprocal, semantic, safe pair of localized documents', () => {
    const english = {
      ...englishDocument,
      html: `<!doctype html><html lang="en"><head>
        <link rel="canonical" href="https://juanfrxz.dev/">
        <link rel="alternate" hreflang="en" href="https://juanfrxz.dev/">
        <link rel="alternate" hreflang="es" href="https://juanfrxz.dev/es/">
        <script type="application/ld+json">{"@type":"WebSite"}</script>
      </head><body><h1>One</h1><a href="https://example.com" target="_blank" rel="noopener noreferrer">Safe</a></body></html>`,
    };
    const spanish = {
      ...spanishDocument,
      html: `<!doctype html><html lang="es"><head>
        <link rel="canonical" href="https://juanfrxz.dev/es/">
        <link rel="alternate" hreflang="en" href="https://juanfrxz.dev/">
        <link rel="alternate" hreflang="es" href="https://juanfrxz.dev/es/">
      </head><body><h1>Uno</h1></body></html>`,
    };

    expect(auditBuildDocuments([english, spanish])).toEqual([]);
  });
});

describe('production environment', () => {
  it('rejects missing and test Formspree identifiers only for production', () => {
    expect(validateProductionEnvironment({ DEPLOY_TARGET: 'preview' })).toEqual(
      [],
    );
    expect(
      validateProductionEnvironment({ DEPLOY_TARGET: 'production' }),
    ).toContain('PUBLIC_FORMSPREE_FORM_ID is required for production.');
    expect(
      validateProductionEnvironment({
        DEPLOY_TARGET: 'production',
        PUBLIC_FORMSPREE_FORM_ID: 'test-form-id',
      }),
    ).toContain('PUBLIC_FORMSPREE_FORM_ID cannot use the test identifier.');
    expect(
      validateProductionEnvironment({
        DEPLOY_TARGET: 'production',
        PUBLIC_FORMSPREE_FORM_ID: 'real-form-id',
      }),
    ).toEqual([]);
  });
});
