import { describe, expect, it } from 'vitest';

import { SITE } from '../../src/config/site';
import { resolveInitialTheme } from '../../src/lib/theme';

describe('theme resolution', () => {
  it.each([
    ['light', true, 'light'],
    ['dark', false, 'dark'],
  ] as const)(
    'prefers the saved %s theme over the operating system',
    (savedTheme, systemDark, expectedTheme) => {
      expect(resolveInitialTheme(savedTheme, systemDark)).toBe(expectedTheme);
    },
  );

  it('uses a dark system preference when nothing is saved', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
  });

  it('uses a light system preference when nothing is saved', () => {
    expect(resolveInitialTheme(null, false)).toBe('light');
  });

  it('ignores an invalid saved value and uses the system preference', () => {
    expect(resolveInitialTheme('sepia', false)).toBe('light');
  });

  it('defaults to dark only when the system preference is unavailable', () => {
    expect(resolveInitialTheme(null, null)).toBe('dark');
  });
});

describe('site configuration', () => {
  it('keeps the verified origin and contact details in one immutable source', () => {
    expect(SITE.url).toBe('https://juanfrxz.dev');
    expect(SITE.email).toBe('jr563384@gmail.com');
    expect(SITE.professionalLinks).toEqual([
      { label: 'GitHub', href: 'https://github.com/Juanfrxz' },
      {
        label: 'LinkedIn',
        href: 'https://www.linkedin.com/in/david-rodr%C3%ADguez-13686a25b',
      },
    ]);

    for (const link of SITE.professionalLinks) {
      expect(new URL(link.href).protocol).toBe('https:');
      expect(Object.isFrozen(link)).toBe(true);
    }

    expect(Object.isFrozen(SITE.professionalLinks)).toBe(true);
    expect(Object.isFrozen(SITE)).toBe(true);
  });
});
