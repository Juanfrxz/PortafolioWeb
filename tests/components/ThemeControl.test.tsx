import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ThemeControl from '../../src/components/ui/ThemeControl';

const englishLabels = {
  useLight: 'Use light theme',
  useDark: 'Use dark theme',
};

const spanishLabels = {
  useLight: 'Usar tema claro',
  useDark: 'Usar tema oscuro',
};

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-theme');
  document.body.replaceChildren();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('ThemeControl', () => {
  it('does not claim a contradictory theme before hydration', () => {
    document.documentElement.dataset.theme = 'light';

    const serverMarkup = renderToStaticMarkup(
      <ThemeControl labels={englishLabels} />,
    );

    expect(serverMarkup).not.toContain('>DARK<');
    expect(serverMarkup).not.toContain(
      `aria-label="${englishLabels.useLight}"`,
    );
    expect(serverMarkup).toContain(englishLabels.useLight);
    expect(serverMarkup).toContain(englishLabels.useDark);
  });

  it('exposes exactly one accessible button for the next theme', () => {
    document.documentElement.dataset.theme = 'dark';

    render(<ThemeControl labels={englishLabels} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: englishLabels.useLight }),
    ).toBeInTheDocument();
  });

  it('updates the document theme, persists it, and changes its accessible name', async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = 'dark';
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    render(<ThemeControl labels={englishLabels} />);

    await user.click(
      screen.getByRole('button', { name: englishLabels.useLight }),
    );

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(setItem).toHaveBeenLastCalledWith('theme', 'light');
    expect(
      screen.getByRole('button', { name: englishLabels.useDark }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: englishLabels.useDark }),
    );

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(setItem).toHaveBeenLastCalledWith('theme', 'dark');
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole('button', { name: englishLabels.useLight }),
    ).toBeInTheDocument();
  });

  it('uses localized accessible names', async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = 'light';

    render(<ThemeControl labels={spanishLabels} />);

    await user.click(
      screen.getByRole('button', { name: spanishLabels.useDark }),
    );

    expect(
      screen.getByRole('button', { name: spanishLabels.useLight }),
    ).toBeInTheDocument();
  });

  it('still applies the theme when storage is unavailable', async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = 'dark';
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'SecurityError');
    });

    render(<ThemeControl labels={englishLabels} />);

    await user.click(
      screen.getByRole('button', { name: englishLabels.useLight }),
    );

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(
      screen.getByRole('button', { name: englishLabels.useDark }),
    ).toBeInTheDocument();
  });
});
