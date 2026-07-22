import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/components/hero/HeroExperience', () => ({
  HeroExperience: () => <div data-testid="loaded-hero" />,
}));

import { DeferredHeroExperience } from '../../src/components/hero/DeferredHeroExperience';

describe('DeferredHeroExperience', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        media: '',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
      })),
    );
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'connection');
  });

  it('keeps the poster path lightweight until the first user intent', async () => {
    render(
      <div data-hero-visual>
        <DeferredHeroExperience />
      </div>,
    );

    expect(screen.queryByTestId('loaded-hero')).not.toBeInTheDocument();
    expect(document.querySelector('[data-hero-experience]')).toHaveAttribute(
      'data-render-state',
      'poster',
    );

    fireEvent.pointerMove(document.querySelector('[data-hero-visual]')!);

    await waitFor(() =>
      expect(screen.getByTestId('loaded-hero')).toBeInTheDocument(),
    );
  });

  it('does not import the 3D scene when reduced motion is active', async () => {
    vi.mocked(matchMedia).mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    });

    render(
      <div data-hero-visual>
        <DeferredHeroExperience />
      </div>,
    );
    fireEvent.pointerMove(document.querySelector('[data-hero-visual]')!);

    await waitFor(() =>
      expect(document.querySelector('[data-hero-experience]')).toHaveAttribute(
        'data-render-state',
        'static',
      ),
    );
    expect(screen.queryByTestId('loaded-hero')).not.toBeInTheDocument();
  });
});
