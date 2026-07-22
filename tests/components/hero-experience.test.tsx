import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React, { useEffect, useRef } from 'react';
import type { WebGLDebug } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HeroUpgradeState } from '../../src/lib/hero-upgrade';
import { QUALITY_SETTINGS } from '../../src/lib/quality-tier';

const harness = vi.hoisted(() => ({
  creationErrorBeforeCreated: false,
  renderer: null as {
    debug: { onShaderError: unknown };
    domElement: HTMLCanvasElement | null;
  } | null,
  sceneThrows: false,
  skipOnCreated: false,
}));

interface SceneHarnessProps {
  machine: HeroUpgradeState;
  settings: {
    particles: number;
    initialModel: string | null;
    enhancedModel: string | null;
  };
  onFirstFrame: () => void;
  onLightLoaded: () => void;
  onFullLoaded: () => void;
  onLoadFailure: () => void;
  onFatalError?: (error: Error) => void;
  onStableSample: (factor: number) => void;
  onPerformanceRegression: () => void;
}

vi.mock('../../src/components/hero/HeroScene', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('../../src/components/hero/HeroScene')
    >();
  const ReactModule = await import('react');

  return {
    ...actual,
    HeroScene: (props: SceneHarnessProps) => {
      if (harness.sceneThrows) {
        throw new Error('scene failed');
      }

      return ReactModule.createElement(
        'div',
        {
          'data-testid': 'scene',
          'data-effects': String(props.machine.effects),
          'data-enhanced-model': props.settings.enhancedModel ?? 'none',
          'data-initial-model': props.settings.initialModel ?? 'none',
          'data-model': props.machine.model ?? 'none',
          'data-particles': String(props.settings.particles),
          'data-phase': props.machine.phase,
          'data-stable-samples': String(props.machine.stableSamples),
        },
        ReactModule.createElement(
          'button',
          { type: 'button', onClick: props.onFirstFrame },
          'first frame',
        ),
        ReactModule.createElement(
          'button',
          { type: 'button', onClick: props.onLightLoaded },
          'light loaded',
        ),
        ReactModule.createElement(
          'button',
          {
            type: 'button',
            onClick: () => props.onStableSample(1),
          },
          'stable sample',
        ),
        ReactModule.createElement(
          'button',
          { type: 'button', onClick: props.onFullLoaded },
          'full loaded',
        ),
        ReactModule.createElement(
          'button',
          { type: 'button', onClick: props.onPerformanceRegression },
          'performance regression',
        ),
        ReactModule.createElement(
          'button',
          {
            type: 'button',
            onClick: () => {
              props.onLoadFailure();
              props.onFatalError?.(new Error('late model failure'));
            },
          },
          'internal error',
        ),
      );
    },
  };
});

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  Canvas: ({
    children,
    dpr,
    frameloop,
    gl,
    onCreated,
    ref: forwardedRef,
    shadows,
  }: {
    children: React.ReactNode;
    dpr: [number, number];
    frameloop: string;
    gl: {
      alpha: boolean;
      antialias: boolean;
      powerPreference: string;
    };
    onCreated: (state: {
      gl: {
        debug: { onShaderError: unknown };
        domElement: HTMLCanvasElement;
      };
    }) => void;
    ref?: React.Ref<HTMLCanvasElement>;
    shadows: boolean;
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;

      if (typeof forwardedRef === 'function') {
        forwardedRef(canvas);
      } else if (forwardedRef) {
        forwardedRef.current = canvas;
      }

      if (canvas && harness.creationErrorBeforeCreated) {
        canvas.dispatchEvent(
          new Event('webglcontextcreationerror', { cancelable: true }),
        );
      }

      return () => {
        if (typeof forwardedRef === 'function') {
          forwardedRef(null);
        } else if (forwardedRef) {
          forwardedRef.current = null;
        }
      };
    }, [forwardedRef]);

    useEffect(() => {
      if (canvasRef.current && harness.renderer && !harness.skipOnCreated) {
        harness.renderer.domElement = canvasRef.current;
        onCreated({
          gl: {
            debug: harness.renderer.debug,
            domElement: canvasRef.current,
          },
        });
      }
    }, [onCreated]);

    return (
      <div
        data-testid="canvas"
        data-alpha={String(gl.alpha)}
        data-antialias={String(gl.antialias)}
        data-dpr={dpr.join(',')}
        data-frameloop={frameloop}
        data-power-preference={gl.powerPreference}
        data-shadows={String(shadows)}
      >
        <canvas ref={canvasRef} />
        {children}
      </div>
    );
  },
}));

import { HeroExperience } from '../../src/components/hero/HeroExperience';
import { buildHeroScenePlan } from '../../src/components/hero/HeroScene';

interface MockMediaQueryList extends MediaQueryList {
  setMatches(matches: boolean): void;
}

function createMediaQueryList(initialMatches: boolean): MockMediaQueryList {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = {
    matches: initialMatches,
    media: '',
    onchange: null,
    addEventListener: vi.fn(
      (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
    ),
    removeEventListener: vi.fn(
      (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
    ),
    addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    dispatchEvent: vi.fn(() => true),
    setMatches(matches: boolean) {
      this.matches = matches;
      listeners.forEach((listener) =>
        listener({ matches } as MediaQueryListEvent),
      );
    },
  };

  return media as MockMediaQueryList;
}

let intersectionCallback:
  ((entries: IntersectionObserverEntry[]) => void) | undefined;
let reducedMotion: MockMediaQueryList;
let noPreferredReduction: MockMediaQueryList;
let coarsePointer: MockMediaQueryList;

function renderHero() {
  return render(
    <div data-hero-visual data-render-state="poster">
      <figure data-hero-fallback />
      <HeroExperience />
    </div>,
  );
}

async function expectPhase(phase: HeroUpgradeState['phase']) {
  await waitFor(() =>
    expect(screen.getByTestId('scene')).toHaveAttribute('data-phase', phase),
  );
}

async function reachLightReady() {
  await expectPhase('light-loading');
  fireEvent.click(screen.getByText('light loaded'));
  await expectPhase('light-ready');
}

async function reachFullReady() {
  await reachLightReady();
  const stableSample = screen.getByText('stable sample');

  for (let sample = 0; sample < 5; sample += 1) {
    fireEvent.click(stableSample);
  }

  await expectPhase('full-loading');
  fireEvent.click(screen.getByText('full loaded'));
  await expectPhase('full-ready');
}

describe('HeroExperience with the real quality controller', () => {
  beforeEach(() => {
    harness.creationErrorBeforeCreated = false;
    harness.renderer = {
      debug: { onShaderError: null },
      domElement: null,
    };
    harness.sceneThrows = false;
    harness.skipOnCreated = false;
    intersectionCallback = undefined;
    reducedMotion = createMediaQueryList(false);
    noPreferredReduction = createMediaQueryList(true);
    coarsePointer = createMediaQueryList(false);

    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return reducedMotion;
        }

        if (query === '(prefers-reduced-motion: no-preference)') {
          return noPreferredReduction;
        }

        return coarsePointer;
      }),
    );
    vi.stubGlobal(
      'IntersectionObserver',
      class IntersectionObserverMock {
        constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
          intersectionCallback = callback;
        }

        observe() {}
        disconnect() {}
        unobserve() {}
        takeRecords() {
          return [];
        }
        readonly root = null;
        readonly rootMargin = '0px';
        readonly thresholds = [0];
      },
    );
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: {
        saveData: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: 8,
    });
    Object.defineProperty(navigator, 'deviceMemory', {
      configurable: true,
      value: 8,
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      getExtension: vi.fn(() => ({ loseContext: vi.fn() })),
    } as unknown as WebGL2RenderingContext);
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'connection');
    Reflect.deleteProperty(navigator, 'deviceMemory');
  });

  it('never mounts Canvas when reduced motion selects Static', async () => {
    reducedMotion.setMatches(true);
    noPreferredReduction.setMatches(false);

    renderHero();

    await waitFor(() =>
      expect(document.querySelector('[data-hero-experience]')).toHaveAttribute(
        'data-quality-tier',
        'static',
      ),
    );
    expect(screen.queryByTestId('canvas')).not.toBeInTheDocument();
    expect(document.querySelector('[data-hero-fallback]')).toBeInTheDocument();
    expect(document.querySelector('[data-hero-visual]')).toHaveAttribute(
      'data-render-state',
      'static',
    );
  });

  it('runs the real Full light-first upgrade and enables effects only when ready', async () => {
    renderHero();

    await expectPhase('light-loading');
    expect(document.querySelector('[data-hero-experience]')).toHaveAttribute(
      'data-quality-tier',
      'full',
    );
    expect(screen.getByTestId('scene')).toHaveAttribute(
      'data-initial-model',
      '/models/avatar-light.glb',
    );
    expect(screen.getByTestId('scene')).toHaveAttribute(
      'data-enhanced-model',
      '/models/avatar-full.glb',
    );

    fireEvent.click(screen.getByText('light loaded'));
    await expectPhase('light-ready');
    expect(screen.getByTestId('scene')).toHaveAttribute('data-model', 'light');

    const stableSample = screen.getByText('stable sample');
    for (let sample = 0; sample < 4; sample += 1) {
      fireEvent.click(stableSample);
    }
    expect(screen.getByTestId('scene')).toHaveAttribute(
      'data-phase',
      'light-ready',
    );
    expect(screen.getByTestId('scene')).toHaveAttribute(
      'data-stable-samples',
      '4',
    );
    expect(screen.getByTestId('scene')).toHaveAttribute(
      'data-effects',
      'false',
    );

    fireEvent.click(stableSample);
    await expectPhase('full-loading');
    expect(screen.getByTestId('scene')).toHaveAttribute('data-model', 'light');
    expect(screen.getByTestId('scene')).toHaveAttribute(
      'data-effects',
      'false',
    );

    fireEvent.click(screen.getByText('full loaded'));
    await expectPhase('full-ready');
    expect(screen.getByTestId('scene')).toHaveAttribute('data-model', 'full');
    expect(screen.getByTestId('scene')).toHaveAttribute('data-effects', 'true');
  });

  it('keeps Balanced on the light model', async () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: 4,
    });

    renderHero();
    await reachLightReady();

    expect(document.querySelector('[data-hero-experience]')).toHaveAttribute(
      'data-quality-tier',
      'balanced',
    );
    expect(screen.getByTestId('scene')).toHaveAttribute(
      'data-enhanced-model',
      'none',
    );

    for (let sample = 0; sample < 6; sample += 1) {
      fireEvent.click(screen.getByText('stable sample'));
    }

    expect(screen.getByTestId('scene')).toHaveAttribute(
      'data-phase',
      'light-ready',
    );
    expect(screen.getByTestId('scene')).toHaveAttribute('data-model', 'light');
  });

  it('keeps the poster until the real scene callback reports first frame', async () => {
    renderHero();
    await reachLightReady();

    expect(document.querySelector('[data-hero-visual]')).toHaveAttribute(
      'data-render-state',
      'poster',
    );
    fireEvent.click(screen.getByText('first frame'));
    expect(document.querySelector('[data-hero-visual]')).toHaveAttribute(
      'data-render-state',
      'ready',
    );
  });

  it('uses pointer input while preserving vertical touch scrolling', async () => {
    renderHero();
    await expectPhase('light-loading');

    const componentCss = document.querySelector(
      '[data-hero-experience] style',
    )?.textContent;
    expect(componentCss).toContain('pointer-events: auto');
    expect(componentCss).toContain('touch-action: pan-y');
    expect(componentCss).not.toContain('pointer-events: none');
  });

  it('configures Full Canvas and switches to demand outside the viewport', async () => {
    renderHero();
    await expectPhase('light-loading');

    expect(screen.getByTestId('canvas')).toHaveAttribute('data-dpr', '1,1.75');
    expect(screen.getByTestId('canvas')).toHaveAttribute(
      'data-frameloop',
      'always',
    );
    expect(screen.getByTestId('canvas')).toHaveAttribute(
      'data-shadows',
      'true',
    );
    expect(screen.getByTestId('canvas')).toHaveAttribute(
      'data-antialias',
      'true',
    );
    expect(screen.getByTestId('canvas')).toHaveAttribute('data-alpha', 'true');
    expect(screen.getByTestId('canvas')).toHaveAttribute(
      'data-power-preference',
      'high-performance',
    );

    const canvas = screen.getByTestId('canvas').querySelector('canvas');
    expect(canvas).toHaveAttribute('data-canvas-ready', 'true');

    act(() => {
      intersectionCallback?.([
        { isIntersecting: false } as IntersectionObserverEntry,
      ]);
    });
    expect(screen.getByTestId('canvas')).toHaveAttribute(
      'data-frameloop',
      'demand',
    );
  });

  it('registers the DOM canvas before onCreated and catches context creation failure', async () => {
    harness.creationErrorBeforeCreated = true;

    renderHero();

    await waitFor(() =>
      expect(document.querySelector('[data-hero-experience]')).toHaveAttribute(
        'data-quality-tier',
        'static',
      ),
    );
    expect(screen.queryByTestId('canvas')).not.toBeInTheDocument();
    expect(document.querySelector('[data-hero-fallback]')).toBeInTheDocument();
  });

  it('makes a real scene render error terminal through the ErrorBoundary', async () => {
    harness.sceneThrows = true;
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    renderHero();

    await waitFor(() =>
      expect(screen.queryByTestId('canvas')).not.toBeInTheDocument(),
    );
    expect(document.querySelector('[data-hero-experience]')).toHaveAttribute(
      'data-render-state',
      'error',
    );
    expect(
      consoleError.mock.calls.filter(
        ([message]) => message === 'Hero 3D disabled after a rendering error.',
      ),
    ).toHaveLength(1);
  });

  it('turns shader errors terminal once and restores the previous callback', async () => {
    const previousShaderError: NonNullable<WebGLDebug['onShaderError']> =
      vi.fn();
    if (!harness.renderer) {
      throw new Error('renderer harness missing');
    }
    harness.renderer.debug.onShaderError = previousShaderError;
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    renderHero();
    await expectPhase('light-loading');

    const installedShaderError = harness.renderer.debug
      .onShaderError as NonNullable<WebGLDebug['onShaderError']>;
    expect(installedShaderError).not.toBe(previousShaderError);
    const shaderArguments = [{}, {}, {}, {}] as unknown as Parameters<
      typeof installedShaderError
    >;

    act(() => {
      installedShaderError(...shaderArguments);
      installedShaderError(...shaderArguments);
    });

    await waitFor(() =>
      expect(screen.queryByTestId('canvas')).not.toBeInTheDocument(),
    );
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(harness.renderer.debug.onShaderError).toBe(previousShaderError);
  });

  it('restores the previous shader callback on normal unmount', async () => {
    const previousShaderError: NonNullable<WebGLDebug['onShaderError']> =
      vi.fn();
    if (!harness.renderer) {
      throw new Error('renderer harness missing');
    }
    harness.renderer.debug.onShaderError = previousShaderError;

    const { unmount } = renderHero();
    await expectPhase('light-loading');
    expect(harness.renderer.debug.onShaderError).not.toBe(previousShaderError);

    unmount();

    expect(harness.renderer.debug.onShaderError).toBe(previousShaderError);
  });

  it('fails terminally when Canvas never completes async initialization', async () => {
    vi.useFakeTimers();
    harness.skipOnCreated = true;
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    renderHero();
    expect(screen.getByTestId('canvas')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });

    expect(screen.queryByTestId('canvas')).not.toBeInTheDocument();
    expect(document.querySelector('[data-hero-experience]')).toHaveAttribute(
      'data-render-state',
      'error',
    );
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it('removes Canvas and returns to Static on WebGL context loss', async () => {
    renderHero();
    await reachLightReady();

    const canvas = screen.getByTestId('canvas').querySelector('canvas');
    expect(canvas).not.toBeNull();
    canvas?.dispatchEvent(
      new Event('webglcontextlost', { bubbles: true, cancelable: true }),
    );

    await waitFor(() =>
      expect(document.querySelector('[data-hero-experience]')).toHaveAttribute(
        'data-quality-tier',
        'static',
      ),
    );
    expect(screen.queryByTestId('canvas')).not.toBeInTheDocument();
    expect(document.querySelector('[data-hero-fallback]')).toBeInTheDocument();
  });

  it('returns to Static on the third real performance regression callback', async () => {
    renderHero();
    await reachLightReady();

    fireEvent.click(screen.getByText('performance regression'));
    fireEvent.click(screen.getByText('performance regression'));
    expect(screen.getByTestId('canvas')).toBeInTheDocument();

    fireEvent.click(screen.getByText('performance regression'));
    await waitFor(() =>
      expect(screen.queryByTestId('canvas')).not.toBeInTheDocument(),
    );
    expect(document.querySelector('[data-hero-experience]')).toHaveAttribute(
      'data-quality-tier',
      'static',
    );
  });

  it.each([
    ['light-ready', reachLightReady],
    ['full-ready', reachFullReady],
  ] as const)(
    'makes an internal error from %s terminal and restores the poster',
    async (_phase, reachPhase) => {
      renderHero();
      await reachPhase();
      fireEvent.click(screen.getByText('internal error'));

      await waitFor(() =>
        expect(screen.queryByTestId('canvas')).not.toBeInTheDocument(),
      );
      expect(document.querySelector('[data-hero-experience]')).toHaveAttribute(
        'data-render-state',
        'error',
      );
      expect(document.querySelector('[data-hero-visual]')).toHaveAttribute(
        'data-render-state',
        'error',
      );
      expect(
        document.querySelector('[data-hero-fallback]'),
      ).toBeInTheDocument();
    },
  );
});

describe('HeroScene rendering plan', () => {
  it('keeps Light visible while Full loads, then switches with Bloom only when ready', () => {
    const fullLoading: HeroUpgradeState = {
      phase: 'full-loading',
      targetTier: 'full',
      model: 'light',
      effects: false,
      stableSamples: 5,
      regressions: 0,
    };

    expect(buildHeroScenePlan(fullLoading, QUALITY_SETTINGS.full)).toEqual({
      renderLight: true,
      renderFull: true,
      fullVisible: false,
      bloom: false,
    });
    expect(
      buildHeroScenePlan(
        {
          ...fullLoading,
          phase: 'full-ready',
          model: 'full',
          effects: true,
        },
        QUALITY_SETTINGS.full,
      ),
    ).toEqual({
      renderLight: false,
      renderFull: true,
      fullVisible: true,
      bloom: true,
    });
    expect(
      buildHeroScenePlan(
        {
          ...fullLoading,
          phase: 'light-ready',
          targetTier: 'balanced',
          stableSamples: 0,
        },
        QUALITY_SETTINGS.balanced,
      ),
    ).toEqual({
      renderLight: true,
      renderFull: false,
      fullVisible: false,
      bloom: false,
    });
  });
});
