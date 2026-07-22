import { describe, expect, it } from 'vitest';

import { en, es } from '../../src/i18n';

function leafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

function placeholders(value: unknown): string[] {
  return typeof value === 'string'
    ? [...value.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map(
        (match) => match[1] ?? '',
      )
    : [];
}

describe('localized dictionary parity', () => {
  it('keeps the exact same leaf contract in English and Spanish', () => {
    expect(leafPaths(es).sort()).toEqual(leafPaths(en).sort());
  });

  it('keeps interpolation placeholders aligned', () => {
    const english = en as Record<string, unknown>;
    const spanish = es as Record<string, unknown>;

    for (const section of Object.keys(english)) {
      const englishSection = english[section] as Record<string, unknown>;
      const spanishSection = spanish[section] as Record<string, unknown>;
      for (const key of Object.keys(englishSection)) {
        expect(placeholders(spanishSection[key]).sort()).toEqual(
          placeholders(englishSection[key]).sort(),
        );
      }
    }
  });
});
