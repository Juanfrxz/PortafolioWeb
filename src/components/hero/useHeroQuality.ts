import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createHeroUpgradeState,
  transitionHeroUpgrade,
  type HeroUpgradeEvent,
  type HeroUpgradeState,
} from '../../lib/hero-upgrade';
import {
  QUALITY_SETTINGS,
  selectQualityTier,
  type QualitySettings,
  type QualitySignals,
  type QualityTier,
} from '../../lib/quality-tier';

interface NetworkConnection {
  saveData?: boolean;
  addEventListener(type: 'change', listener: EventListener): void;
  removeEventListener(type: 'change', listener: EventListener): void;
}

interface NavigatorWithDeviceSignals extends Navigator {
  connection?: NetworkConnection;
  deviceMemory?: number;
}

export interface HeroQualityController {
  initialized: boolean;
  tier: QualityTier;
  settings: QualitySettings;
  machine: HeroUpgradeState;
  start: () => void;
  reportStableSample: (factor: number) => void;
  reportLightLoaded: () => void;
  reportFullLoaded: () => void;
  reportLoadFailure: () => void;
  reportFatalError: () => void;
  reportPerformanceRegression: () => void;
  registerCanvas: (canvas: HTMLCanvasElement | null) => void;
}

const QUALITY_RANK: Record<QualityTier, number> = {
  static: 0,
  balanced: 1,
  full: 2,
};

const UNINITIALIZED_SIGNALS: QualitySignals = {
  reducedMotion: true,
  saveData: true,
  webgl: false,
  regressions: 0,
  coarsePointer: false,
  lowPower: true,
};

function detectWebGL(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');

    if (context === null) {
      return false;
    }

    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function readSignalSnapshot(
  reducedMotionQuery: MediaQueryList,
  coarsePointerQuery: MediaQueryList,
  connection: NetworkConnection | undefined,
  webgl: boolean,
  regressions: number,
): QualitySignals {
  const deviceNavigator = navigator as NavigatorWithDeviceSignals;
  const hardwareConcurrency = deviceNavigator.hardwareConcurrency;
  const deviceMemory = deviceNavigator.deviceMemory;

  return {
    reducedMotion: reducedMotionQuery.matches,
    saveData: Boolean(connection?.saveData),
    webgl,
    regressions,
    coarsePointer: coarsePointerQuery.matches,
    lowPower:
      (hardwareConcurrency > 0 && hardwareConcurrency <= 4) ||
      (typeof deviceMemory === 'number' &&
        deviceMemory > 0 &&
        deviceMemory <= 4),
  };
}

function keepLowestTier(
  currentTier: QualityTier,
  candidateTier: QualityTier,
): QualityTier {
  return QUALITY_RANK[candidateTier] < QUALITY_RANK[currentTier]
    ? candidateTier
    : currentTier;
}

export function useHeroQuality(): HeroQualityController {
  const signalsRef = useRef<QualitySignals>({ ...UNINITIALIZED_SIGNALS });
  const initializedRef = useRef(false);
  const [initialized, setInitialized] = useState(false);
  const [tier, setTier] = useState<QualityTier>('static');
  const tierRef = useRef(tier);
  const [machine, setMachine] = useState<HeroUpgradeState>(() =>
    createHeroUpgradeState('static'),
  );
  const machineRef = useRef(machine);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const commitLowerTier = useCallback((candidateTier: QualityTier) => {
    const nextTier = keepLowestTier(tierRef.current, candidateTier);

    if (nextTier !== tierRef.current) {
      tierRef.current = nextTier;
      setTier(nextTier);
    }

    return nextTier;
  }, []);

  const dispatchMachine = useCallback(
    (event: HeroUpgradeEvent) => {
      const currentMachine = machineRef.current;
      const nextMachine = transitionHeroUpgrade(currentMachine, event);

      if (nextMachine !== currentMachine) {
        machineRef.current = nextMachine;
        setMachine(nextMachine);
      }

      if (nextMachine.phase === 'static') {
        commitLowerTier('static');
      }
    },
    [commitLowerTier],
  );

  const degradeTier = useCallback(
    (candidateTier: QualityTier) => {
      const currentTier = tierRef.current;
      const nextTier = commitLowerTier(candidateTier);

      if (nextTier !== currentTier) {
        dispatchMachine({
          type: 'TARGET_DEGRADED',
          targetTier: nextTier,
        });
      }
    },
    [commitLowerTier, dispatchMachine],
  );

  const updateSignals = useCallback(
    (updates: Partial<QualitySignals>) => {
      const signals = { ...signalsRef.current, ...updates };
      signalsRef.current = signals;
      degradeTier(selectQualityTier(signals));
    },
    [degradeTier],
  );

  const handleContextLost = useCallback(
    (event: Event) => {
      event.preventDefault();
      dispatchMachine({ type: 'CONTEXT_LOST' });
      updateSignals({ webgl: false });
    },
    [dispatchMachine, updateSignals],
  );

  const registerCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (canvasRef.current === canvas) {
        return;
      }

      canvasRef.current?.removeEventListener(
        'webglcontextlost',
        handleContextLost,
      );
      canvasRef.current = canvas;
      canvasRef.current?.addEventListener(
        'webglcontextlost',
        handleContextLost,
      );
    },
    [handleContextLost],
  );

  const reportPerformanceRegression = useCallback(() => {
    dispatchMachine({ type: 'PERFORMANCE_REGRESSION' });
    updateSignals({
      regressions: signalsRef.current.regressions + 1,
    });
  }, [dispatchMachine, updateSignals]);

  const start = useCallback(() => {
    dispatchMachine({ type: 'START' });
  }, [dispatchMachine]);

  const reportStableSample = useCallback(
    (factor: number) => {
      dispatchMachine({ type: 'STABLE_SAMPLE', factor });
    },
    [dispatchMachine],
  );

  const reportLightLoaded = useCallback(() => {
    dispatchMachine({ type: 'LIGHT_LOADED' });
  }, [dispatchMachine]);

  const reportFullLoaded = useCallback(() => {
    dispatchMachine({ type: 'FULL_LOADED' });
  }, [dispatchMachine]);

  const reportLoadFailure = useCallback(() => {
    dispatchMachine({ type: 'LOAD_FAILED' });
  }, [dispatchMachine]);

  const reportFatalError = useCallback(() => {
    dispatchMachine({ type: 'RESTRICT' });
  }, [dispatchMachine]);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const connection = (navigator as NavigatorWithDeviceSignals).connection;

    const handleReducedMotion = (event: MediaQueryListEvent) => {
      updateSignals({ reducedMotion: event.matches });
    };
    const handleCoarsePointer = (event: MediaQueryListEvent) => {
      updateSignals({ coarsePointer: event.matches });
    };
    const handleConnectionChange: EventListener = () => {
      updateSignals({ saveData: Boolean(connection?.saveData) });
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotion);
    coarsePointerQuery.addEventListener('change', handleCoarsePointer);
    connection?.addEventListener('change', handleConnectionChange);

    const webgl = initializedRef.current
      ? signalsRef.current.webgl
      : detectWebGL();
    const snapshot = readSignalSnapshot(
      reducedMotionQuery,
      coarsePointerQuery,
      connection,
      webgl,
      signalsRef.current.regressions,
    );

    if (!initializedRef.current) {
      initializedRef.current = true;
      signalsRef.current = snapshot;

      const initialTier = selectQualityTier(snapshot);
      const initialMachine = createHeroUpgradeState(initialTier);
      tierRef.current = initialTier;
      machineRef.current = initialMachine;
      setTier(initialTier);
      setMachine(initialMachine);
      setInitialized(true);
    } else {
      updateSignals(snapshot);
    }

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotion);
      coarsePointerQuery.removeEventListener('change', handleCoarsePointer);
      connection?.removeEventListener('change', handleConnectionChange);
    };
  }, [updateSignals]);

  useEffect(
    () => () => {
      canvasRef.current?.removeEventListener(
        'webglcontextlost',
        handleContextLost,
      );
      canvasRef.current = null;
    },
    [handleContextLost],
  );

  return {
    initialized,
    tier,
    settings: QUALITY_SETTINGS[tier],
    machine,
    start,
    reportStableSample,
    reportLightLoaded,
    reportFullLoaded,
    reportLoadFailure,
    reportFatalError,
    reportPerformanceRegression,
    registerCanvas,
  };
}
