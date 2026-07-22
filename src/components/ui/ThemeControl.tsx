import React, { useEffect, useState } from 'react';

import { isTheme, type Theme } from '../../lib/theme';

interface ThemeControlLabels {
  useLight: string;
  useDark: string;
}

interface ThemeControlProps {
  labels: ThemeControlLabels;
}

function documentTheme(): Theme {
  if (typeof document === 'undefined') {
    return 'dark';
  }

  const currentTheme = document.documentElement.dataset.theme;
  return isTheme(currentTheme) ? currentTheme : 'dark';
}

export default function ThemeControl({ labels }: ThemeControlProps) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(documentTheme());
  }, []);

  const accessibleName =
    theme === null
      ? undefined
      : theme === 'dark'
        ? labels.useLight
        : labels.useDark;

  function toggleTheme() {
    const nextTheme = documentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);

    try {
      localStorage.setItem('theme', nextTheme);
    } catch {
      // The visible theme remains usable when storage is blocked or full.
    }
  }

  return (
    <button
      type="button"
      className="theme-control"
      aria-label={accessibleName}
      onClick={toggleTheme}
    >
      <span className="theme-control__label theme-control__label--use-light">
        {labels.useLight}
      </span>
      <span className="theme-control__label theme-control__label--use-dark">
        {labels.useDark}
      </span>
    </button>
  );
}
