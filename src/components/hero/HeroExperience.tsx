import { Canvas, type RootState } from '@react-three/fiber';
import {
  default as React,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { HeroErrorBoundary } from './HeroErrorBoundary';
import { HeroScene } from './HeroScene';
import { useHeroHandoff } from './useHeroHandoff';
import { useHeroQuality } from './useHeroQuality';

type HeroRenderState = 'poster' | 'ready' | 'static' | 'error';
type ShaderErrorCallback = NonNullable<
  RootState['gl']['debug']['onShaderError']
>;

interface ShaderErrorRegistration {
  renderer: RootState['gl'];
  installed: ShaderErrorCallback;
  previous: RootState['gl']['debug']['onShaderError'];
}

const CANVAS_INITIALIZATION_TIMEOUT_MS = 10_000;

export function HeroExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const fatalReportedRef = useRef(false);
  const initializationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const shaderErrorRegistrationRef = useRef<ShaderErrorRegistration | null>(
    null,
  );
  const [active, setActive] = useState(true);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const progressRef = useHeroHandoff(rootRef);
  const quality = useHeroQuality();
  const {
    initialized,
    tier,
    settings,
    machine,
    start,
    reportStableSample,
    reportLightLoaded,
    reportFullLoaded,
    reportLoadFailure,
    reportFatalError,
    reportPerformanceRegression,
    registerCanvas,
  } = quality;
  const canvasAllowed =
    initialized && tier !== 'static' && machine.phase !== 'static' && !failed;
  const renderState: HeroRenderState = failed
    ? 'error'
    : initialized && (tier === 'static' || machine.phase === 'static')
      ? 'static'
      : firstFrameReady
        ? 'ready'
        : 'poster';

  const clearInitializationTimer = useCallback(() => {
    if (initializationTimerRef.current !== null) {
      clearTimeout(initializationTimerRef.current);
      initializationTimerRef.current = null;
    }
  }, []);

  const restoreShaderErrorCallback = useCallback(() => {
    const registration = shaderErrorRegistrationRef.current;

    if (!registration) {
      return;
    }

    if (registration.renderer.debug.onShaderError === registration.installed) {
      registration.renderer.debug.onShaderError = registration.previous;
    }

    shaderErrorRegistrationRef.current = null;
  }, []);

  const handleFatalError = useCallback(
    (error: Error) => {
      if (fatalReportedRef.current) {
        return;
      }

      fatalReportedRef.current = true;
      console.error('Hero 3D disabled after a rendering error.', error);
      setFailed(true);
      setFirstFrameReady(false);
      reportFatalError();
    },
    [reportFatalError],
  );

  const handleCanvasRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      clearInitializationTimer();

      if (!canvas) {
        restoreShaderErrorCallback();
        registerCanvas(null);
        return;
      }

      registerCanvas(canvas);
      initializationTimerRef.current = setTimeout(() => {
        handleFatalError(
          new Error('Hero Canvas initialization did not complete in time.'),
        );
      }, CANVAS_INITIALIZATION_TIMEOUT_MS);
    },
    [
      clearInitializationTimer,
      handleFatalError,
      registerCanvas,
      restoreShaderErrorCallback,
    ],
  );

  useEffect(() => {
    const root = rootRef.current;

    if (!root || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(Boolean(entry?.isIntersecting));
      },
      { rootMargin: '120px 0px' },
    );
    observer.observe(root);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasAllowed || startedRef.current) {
      return;
    }

    startedRef.current = true;
    start();
  }, [canvasAllowed, start]);

  useEffect(() => {
    const wrapper = rootRef.current?.closest<HTMLElement>('[data-hero-visual]');

    if (wrapper) {
      wrapper.dataset.renderState = renderState;
    }
  }, [renderState]);

  useEffect(() => {
    if (!canvasAllowed) {
      registerCanvas(null);
    }
  }, [canvasAllowed, registerCanvas]);

  useEffect(
    () => () => {
      clearInitializationTimer();
      restoreShaderErrorCallback();
      registerCanvas(null);
    },
    [clearInitializationTimer, registerCanvas, restoreShaderErrorCallback],
  );

  const handleCreated = useCallback(
    ({ gl }: RootState) => {
      clearInitializationTimer();
      restoreShaderErrorCallback();

      const installed: ShaderErrorCallback = () => {
        handleFatalError(new Error('Hero shader compilation failed.'));
      };

      shaderErrorRegistrationRef.current = {
        renderer: gl,
        installed,
        previous: gl.debug.onShaderError,
      };
      gl.debug.onShaderError = installed;
      gl.domElement.dataset.canvasReady = 'true';
      registerCanvas(gl.domElement);
    },
    [
      clearInitializationTimer,
      handleFatalError,
      registerCanvas,
      restoreShaderErrorCallback,
    ],
  );

  const handleFirstFrame = useCallback(() => {
    setFirstFrameReady(true);
  }, []);

  return (
    <div
      ref={rootRef}
      data-hero-experience
      data-model-phase={machine.phase}
      data-quality-tier={tier}
      data-render-state={renderState}
      aria-hidden="true"
    >
      {canvasAllowed && (
        <HeroErrorBoundary onError={handleFatalError}>
          <Canvas
            ref={handleCanvasRef}
            camera={{ fov: 34, near: 0.1, far: 100, position: [0, 0.1, 7.4] }}
            dpr={[...settings.dpr]}
            frameloop={active ? 'always' : 'demand'}
            shadows={settings.shadows}
            gl={{
              alpha: true,
              antialias: tier === 'full',
              powerPreference: tier === 'full' ? 'high-performance' : 'default',
            }}
            onCreated={handleCreated}
            fallback={null}
          >
            <Suspense fallback={null}>
              <HeroScene
                machine={machine}
                settings={settings}
                progressRef={progressRef}
                onFirstFrame={handleFirstFrame}
                onLightLoaded={reportLightLoaded}
                onFullLoaded={reportFullLoaded}
                onLoadFailure={reportLoadFailure}
                onFatalError={handleFatalError}
                onStableSample={reportStableSample}
                onPerformanceRegression={reportPerformanceRegression}
              />
            </Suspense>
          </Canvas>
        </HeroErrorBoundary>
      )}

      <style>{`
        [data-hero-experience] {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: transparent;
          pointer-events: auto;
          touch-action: pan-y;
        }

        [data-hero-experience] > div,
        [data-hero-experience] canvas {
          inline-size: 100% !important;
          block-size: 100% !important;
          touch-action: pan-y !important;
        }
      `}</style>
    </div>
  );
}
