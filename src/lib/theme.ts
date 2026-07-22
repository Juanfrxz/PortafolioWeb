export type Theme = 'dark' | 'light';

export function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

export function resolveInitialTheme(
  savedTheme: string | null,
  systemDark: boolean | null,
): Theme {
  if (isTheme(savedTheme)) {
    return savedTheme;
  }

  if (systemDark !== null) {
    return systemDark ? 'dark' : 'light';
  }

  return 'dark';
}

export const THEME_BOOTSTRAP_SCRIPT = String.raw`(() => {
  let savedTheme = null;

  try {
    savedTheme = localStorage.theme ?? null;
  } catch {}

  let systemDark = null;

  if (savedTheme !== 'dark' && savedTheme !== 'light') {
    try {
      systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {}
  }

  const theme =
    savedTheme === 'dark' || savedTheme === 'light'
      ? savedTheme
      : systemDark === false
        ? 'light'
        : 'dark';

  document.documentElement.dataset.theme = theme;
})();`;
