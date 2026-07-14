import type { QualityTier } from './quality-tier';

export type HeroUpgradePhase =
  | 'poster'
  | 'light-loading'
  | 'light-ready'
  | 'full-loading'
  | 'full-ready'
  | 'static';

export type HeroModel = 'light' | 'full' | null;

export interface HeroUpgradeState {
  phase: HeroUpgradePhase;
  targetTier: QualityTier;
  model: HeroModel;
  effects: boolean;
  stableSamples: number;
  regressions: number;
}

export type HeroUpgradeEvent =
  | { type: 'START' }
  | { type: 'LIGHT_LOADED' }
  | { type: 'STABLE_SAMPLE'; factor: number }
  | { type: 'FULL_LOADED' }
  | { type: 'LOAD_FAILED' }
  | { type: 'CONTEXT_LOST' }
  | { type: 'RESTRICT' }
  | { type: 'PERFORMANCE_REGRESSION' }
  | { type: 'TARGET_DEGRADED'; targetTier: QualityTier };

const STABLE_FACTOR_THRESHOLD = 0.7;
const STABLE_SAMPLES_FOR_FULL = 5;
const REGRESSIONS_FOR_STATIC = 3;

export function createHeroUpgradeState(
  targetTier: QualityTier,
): HeroUpgradeState {
  return {
    phase: targetTier === 'static' ? 'static' : 'poster',
    targetTier,
    model: null,
    effects: false,
    stableSamples: 0,
    regressions: 0,
  };
}

function fallBackToStatic(
  state: HeroUpgradeState,
  regressions = state.regressions,
): HeroUpgradeState {
  return {
    phase: 'static',
    targetTier: 'static',
    model: null,
    effects: false,
    stableSamples: 0,
    regressions,
  };
}

export function transitionHeroUpgrade(
  state: HeroUpgradeState,
  event: HeroUpgradeEvent,
): HeroUpgradeState {
  if (state.phase === 'static') {
    return state;
  }

  if (event.type === 'TARGET_DEGRADED') {
    if (event.targetTier === 'static') {
      return fallBackToStatic(state);
    }

    if (state.targetTier !== 'full' || event.targetTier !== 'balanced') {
      return state;
    }

    const fullWasRequested =
      state.phase === 'full-loading' || state.phase === 'full-ready';

    return {
      ...state,
      phase: fullWasRequested ? 'light-ready' : state.phase,
      targetTier: 'balanced',
      model: fullWasRequested ? 'light' : state.model,
      effects: false,
      stableSamples: 0,
    };
  }

  if (event.type === 'CONTEXT_LOST' || event.type === 'RESTRICT') {
    return fallBackToStatic(state);
  }

  if (event.type === 'LOAD_FAILED') {
    return state.phase === 'light-loading' || state.phase === 'full-loading'
      ? fallBackToStatic(state)
      : state;
  }

  if (event.type === 'PERFORMANCE_REGRESSION') {
    const regressions = state.regressions + 1;

    if (regressions >= REGRESSIONS_FOR_STATIC) {
      return fallBackToStatic(state, regressions);
    }

    return { ...state, regressions, stableSamples: 0 };
  }

  if (state.phase === 'poster' && event.type === 'START') {
    return { ...state, phase: 'light-loading' };
  }

  if (state.phase === 'light-loading' && event.type === 'LIGHT_LOADED') {
    return { ...state, phase: 'light-ready', model: 'light' };
  }

  if (
    state.phase === 'light-ready' &&
    state.targetTier === 'full' &&
    event.type === 'STABLE_SAMPLE'
  ) {
    if (!(event.factor >= STABLE_FACTOR_THRESHOLD)) {
      return state.stableSamples === 0 ? state : { ...state, stableSamples: 0 };
    }

    const stableSamples = state.stableSamples + 1;

    return {
      ...state,
      phase:
        stableSamples >= STABLE_SAMPLES_FOR_FULL ? 'full-loading' : state.phase,
      stableSamples,
    };
  }

  if (state.phase === 'full-loading' && event.type === 'FULL_LOADED') {
    return {
      ...state,
      phase: 'full-ready',
      model: 'full',
      effects: true,
    };
  }

  return state;
}
