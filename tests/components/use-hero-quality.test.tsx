import { act, cleanup, renderHook } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useHeroQuality,
  type HeroQualityController,
} from '../../src/components/hero/useHeroQuality';

interface MockMediaQueryList {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  emit: (matches: boolean) => void;
}

interface MockConnection {
  saveData: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  emit: (saveData: boolean) => void;
}

function createMediaQueryList(initialMatches = false): MockMediaQueryList {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  return {
    matches: initialMatches,
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
    emit(matches: boolean) {
      this.matches = matches;
      const event = { matches } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function createConnection(initialSaveData = false): MockConnection {
  const listeners = new Set<() => void>();

  return {
    saveData: initialSaveData,
    addEventListener: vi.fn((_type: string, listener: () => void) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: () => void) => {
      listeners.delete(listener);
    }),
    emit(saveData: boolean) {
      this.saveData = saveData;
      listeners.forEach((listener) => listener());
    },
  };
}

function HeroQualitySnapshot() {
  const quality = useHeroQuality();

  return (
    <output
      data-effects={String(quality.machine.effects)}
      data-initialized={String(quality.initialized)}
      data-model={quality.machine.model ?? 'none'}
      data-phase={quality.machine.phase}
      data-tier={quality.tier}
    />
  );
}

describe('useHeroQuality', () => {
  let reducedMotion: MockMediaQueryList;
  let coarsePointer: MockMediaQueryList;
  let connection: MockConnection;

  beforeEach(() => {
    reducedMotion = createMediaQueryList();
    coarsePointer = createMediaQueryList();
    connection = createConnection();

    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) =>
        query === '(prefers-reduced-motion: reduce)'
          ? reducedMotion
          : coarsePointer,
      ),
    );
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: connection,
    });
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: 8,
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      getExtension: vi.fn(() => ({ loseContext: vi.fn() })),
    } as unknown as WebGL2RenderingContext);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, 'connection');
  });

  it('hydrates the same uninitialized static snapshot and bootstraps once after mount', async () => {
    const loseContext = vi.fn();
    const getExtension = vi.fn(() => ({ loseContext }));
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue({
      getExtension,
    } as unknown as WebGL2RenderingContext);

    const serverMarkup = renderToString(<HeroQualitySnapshot />);

    expect(serverMarkup).toContain('data-initialized="false"');
    expect(serverMarkup).toContain('data-tier="static"');
    expect(serverMarkup).toContain('data-phase="static"');
    expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled();
    expect(window.matchMedia).not.toHaveBeenCalled();

    const container = document.createElement('div');
    container.innerHTML = serverMarkup;
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    let root!: ReturnType<typeof hydrateRoot>;

    await act(async () => {
      root = hydrateRoot(
        container,
        <StrictMode>
          <HeroQualitySnapshot />
        </StrictMode>,
      );
      expect(container.innerHTML).toBe(serverMarkup);
    });

    expect(consoleError).not.toHaveBeenCalled();
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(1);
    expect(container.querySelector('output')).toHaveAttribute(
      'data-initialized',
      'true',
    );
    expect(container.querySelector('output')).toHaveAttribute(
      'data-tier',
      'full',
    );

    await act(async () => root.unmount());
  });

  it('starts at full quality with the corresponding settings when signals allow it', () => {
    const { result } = renderHook(() => useHeroQuality());

    expect(result.current.tier).toBe('full');
    expect(result.current.machine).toMatchObject({
      phase: 'poster',
      targetTier: 'full',
      model: null,
      effects: false,
    });
    expect(result.current.settings).toMatchObject({
      dpr: [1, 1.75],
      particles: 120,
      initialModel: '/models/avatar-light.glb',
      enhancedModel: '/models/avatar-full.glb',
    });
  });

  it('drives the complete light-first upgrade through the public API', () => {
    const { result } = renderHook(() => useHeroQuality());

    act(() => result.current.start());
    expect(result.current.machine.phase).toBe('light-loading');

    act(() => result.current.reportLightLoaded());
    expect(result.current.machine).toMatchObject({
      phase: 'light-ready',
      model: 'light',
      effects: false,
    });

    act(() => {
      for (let sample = 0; sample < 4; sample += 1) {
        result.current.reportStableSample(0.7);
      }
    });
    expect(result.current.machine).toMatchObject({
      phase: 'light-ready',
      stableSamples: 4,
    });

    act(() => result.current.reportStableSample(0.7));
    expect(result.current.machine).toMatchObject({
      phase: 'full-loading',
      model: 'light',
      effects: false,
    });

    act(() => result.current.reportFullLoaded());
    expect(result.current.machine).toMatchObject({
      phase: 'full-ready',
      model: 'full',
      effects: true,
    });
  });

  it('synchronizes a valid model load failure to terminal static', () => {
    const { result } = renderHook(() => useHeroQuality());

    act(() => result.current.start());
    act(() => result.current.reportLoadFailure());

    expect(result.current.tier).toBe('static');
    expect(result.current.machine).toMatchObject({
      phase: 'static',
      targetTier: 'static',
      model: null,
      effects: false,
    });
  });

  it.each([
    ['poster', (_quality: HeroQualityController): void => {}],
    [
      'light-ready',
      (quality: HeroQualityController): void => {
        quality.start();
        quality.reportLightLoaded();
      },
    ],
    [
      'full-ready',
      (quality: HeroQualityController): void => {
        quality.start();
        quality.reportLightLoaded();
        for (let sample = 0; sample < 5; sample += 1) {
          quality.reportStableSample(1);
        }
        quality.reportFullLoaded();
      },
    ],
  ] as const)(
    'synchronizes a fatal error from %s to terminal static',
    (_phase, reachPhase) => {
      const { result } = renderHook(() => useHeroQuality());

      act(() => reachPhase(result.current));
      act(() => result.current.reportFatalError());

      expect(result.current.tier).toBe('static');
      expect(result.current.machine).toMatchObject({
        phase: 'static',
        targetTier: 'static',
        model: null,
        effects: false,
      });
    },
  );

  it('detects low-power hardware on the initial read', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      configurable: true,
      value: 4,
    });

    const { result } = renderHook(() => useHeroQuality());

    expect(result.current.tier).toBe('balanced');
    expect(result.current.machine.targetTier).toBe('balanced');
  });

  it('only degrades as media restrictions change', () => {
    const { result } = renderHook(() => useHeroQuality());

    act(() => coarsePointer.emit(true));
    expect(result.current.tier).toBe('balanced');
    expect(result.current.machine).toMatchObject({
      phase: 'poster',
      targetTier: 'balanced',
      stableSamples: 0,
    });

    act(() => coarsePointer.emit(false));
    expect(result.current.tier).toBe('balanced');

    act(() => reducedMotion.emit(true));
    expect(result.current.tier).toBe('static');
    expect(result.current.machine.phase).toBe('static');

    act(() => reducedMotion.emit(false));
    expect(result.current.tier).toBe('static');
  });

  it('captures restrictions that change while signal listeners are installed', () => {
    reducedMotion.addEventListener.mockImplementation(() => {
      reducedMotion.matches = true;
    });
    connection.addEventListener.mockImplementation(() => {
      connection.saveData = true;
    });

    const { result } = renderHook(() => useHeroQuality());

    expect(result.current.initialized).toBe(true);
    expect(result.current.tier).toBe('static');
    expect(result.current.machine).toMatchObject({
      phase: 'static',
      targetTier: 'static',
    });
  });

  it('degrades to static when save-data becomes active', () => {
    const { result } = renderHook(() => useHeroQuality());

    act(() => connection.emit(true));

    expect(result.current.tier).toBe('static');
    expect(result.current.settings.initialModel).toBeNull();
    expect(result.current.machine.phase).toBe('static');
  });

  it('starts static when WebGL is unavailable', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

    const { result } = renderHook(() => useHeroQuality());

    expect(result.current.tier).toBe('static');
  });

  it('requires WebGL2 and never falls back to an available WebGL1 context', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockImplementation(
      (contextId) =>
        contextId === 'webgl2' ? null : ({} as WebGLRenderingContext),
    );

    const { result } = renderHook(() => useHeroQuality());

    expect(result.current.tier).toBe('static');
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(1);
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith(
      'webgl2',
    );
  });

  it('releases the temporary WebGL2 probe context', () => {
    const loseContext = vi.fn();
    const getExtension = vi.fn(() => ({ loseContext }));
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue({
      getExtension,
    } as unknown as WebGL2RenderingContext);

    const { result } = renderHook(() => useHeroQuality());

    expect(result.current.tier).toBe('full');
    expect(getExtension).toHaveBeenCalledWith('WEBGL_lose_context');
    expect(loseContext).toHaveBeenCalledTimes(1);
  });

  it('registers context loss on the R3F canvas and degrades to static', () => {
    const canvas = document.createElement('canvas');
    const addEventListener = vi.spyOn(canvas, 'addEventListener');
    const removeEventListener = vi.spyOn(canvas, 'removeEventListener');
    const { result, unmount } = renderHook(() => useHeroQuality());

    act(() => result.current.registerCanvas(canvas));
    const contextLoss = new Event('webglcontextlost', { cancelable: true });
    act(() => canvas.dispatchEvent(contextLoss));

    expect(contextLoss.defaultPrevented).toBe(true);
    expect(result.current.tier).toBe('static');
    expect(result.current.machine.phase).toBe('static');

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      'webglcontextlost',
      addEventListener.mock.calls[0]?.[1],
    );
  });

  it('registers context creation failure and degrades to terminal static', () => {
    const canvas = document.createElement('canvas');
    const addEventListener = vi.spyOn(canvas, 'addEventListener');
    const removeEventListener = vi.spyOn(canvas, 'removeEventListener');
    const { result, unmount } = renderHook(() => useHeroQuality());

    act(() => result.current.registerCanvas(canvas));
    const creationError = new Event('webglcontextcreationerror', {
      cancelable: true,
    });
    act(() => canvas.dispatchEvent(creationError));

    expect(creationError.defaultPrevented).toBe(true);
    expect(result.current.tier).toBe('static');
    expect(result.current.machine.phase).toBe('static');
    expect(addEventListener).toHaveBeenCalledWith(
      'webglcontextcreationerror',
      expect.any(Function),
    );

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      'webglcontextcreationerror',
      addEventListener.mock.calls.find(
        ([eventName]) => eventName === 'webglcontextcreationerror',
      )?.[1],
    );
  });

  it('removes context loss from the previous canvas when the ref changes', () => {
    const firstCanvas = document.createElement('canvas');
    const secondCanvas = document.createElement('canvas');
    const addFirst = vi.spyOn(firstCanvas, 'addEventListener');
    const removeFirst = vi.spyOn(firstCanvas, 'removeEventListener');
    const { result } = renderHook(() => useHeroQuality());

    act(() => result.current.registerCanvas(firstCanvas));
    act(() => result.current.registerCanvas(secondCanvas));

    expect(removeFirst).toHaveBeenCalledWith(
      'webglcontextlost',
      addFirst.mock.calls[0]?.[1],
    );
    expect(removeFirst).toHaveBeenCalledWith(
      'webglcontextcreationerror',
      expect.any(Function),
    );
  });

  it('falls back to static on the third R3F performance regression', () => {
    const { result } = renderHook(() => useHeroQuality());

    act(() => result.current.reportPerformanceRegression());
    expect(result.current.tier).toBe('full');
    expect(result.current.machine.regressions).toBe(1);

    act(() => result.current.reportPerformanceRegression());
    expect(result.current.tier).toBe('full');
    expect(result.current.machine.regressions).toBe(2);

    act(() => result.current.reportPerformanceRegression());
    expect(result.current.tier).toBe('static');
    expect(result.current.machine).toMatchObject({
      phase: 'static',
      targetTier: 'static',
      regressions: 3,
    });
  });

  it('cannot re-promote after Full dynamically degrades to balanced', () => {
    const { result } = renderHook(() => useHeroQuality());

    act(() => result.current.start());
    act(() => result.current.reportLightLoaded());
    act(() => {
      for (let sample = 0; sample < 5; sample += 1) {
        result.current.reportStableSample(1);
      }
    });
    act(() => result.current.reportFullLoaded());
    expect(result.current.machine.phase).toBe('full-ready');

    act(() => coarsePointer.emit(true));
    expect(result.current.tier).toBe('balanced');
    expect(result.current.machine).toMatchObject({
      phase: 'light-ready',
      targetTier: 'balanced',
      model: 'light',
      effects: false,
      stableSamples: 0,
    });

    act(() => coarsePointer.emit(false));
    act(() => {
      for (let sample = 0; sample < 10; sample += 1) {
        result.current.reportStableSample(1);
      }
    });

    expect(result.current.tier).toBe('balanced');
    expect(result.current.machine).toMatchObject({
      phase: 'light-ready',
      targetTier: 'balanced',
      model: 'light',
      effects: false,
      stableSamples: 0,
    });
  });

  it('cleans media-query and connection listeners on unmount', () => {
    const { unmount } = renderHook(() => useHeroQuality());

    unmount();

    expect(reducedMotion.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
    expect(reducedMotion.removeEventListener).toHaveBeenCalledWith(
      'change',
      reducedMotion.addEventListener.mock.calls[0]?.[1],
    );
    expect(coarsePointer.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
    expect(coarsePointer.removeEventListener).toHaveBeenCalledWith(
      'change',
      coarsePointer.addEventListener.mock.calls[0]?.[1],
    );
    expect(connection.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
    expect(connection.removeEventListener).toHaveBeenCalledWith(
      'change',
      connection.addEventListener.mock.calls[0]?.[1],
    );
  });
});
