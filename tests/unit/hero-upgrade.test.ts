import { describe, expect, it } from 'vitest';

import {
  createHeroUpgradeState,
  transitionHeroUpgrade,
  type HeroUpgradeEvent,
  type HeroUpgradeState,
} from '../../src/lib/hero-upgrade';

function moveToLightReady(
  targetTier: 'full' | 'balanced' = 'full',
): HeroUpgradeState {
  const poster = createHeroUpgradeState(targetTier);
  const loading = transitionHeroUpgrade(poster, { type: 'START' });

  return transitionHeroUpgrade(loading, { type: 'LIGHT_LOADED' });
}

function moveToFullLoading(): HeroUpgradeState {
  return [0.7, 0.8, 0.9, 1, 0.75].reduce(
    (state, factor) =>
      transitionHeroUpgrade(state, { type: 'STABLE_SAMPLE', factor }),
    moveToLightReady(),
  );
}

describe('hero progressive upgrade machine', () => {
  it('starts static targets in the terminal static state', () => {
    expect(createHeroUpgradeState('static')).toEqual({
      phase: 'static',
      targetTier: 'static',
      model: null,
      effects: false,
      stableSamples: 0,
      regressions: 0,
    });
  });

  it.each(['full', 'balanced'] as const)(
    'loads the light model first for a %s target',
    (targetTier) => {
      const poster = createHeroUpgradeState(targetTier);
      expect(poster).toMatchObject({
        phase: 'poster',
        targetTier,
        model: null,
        effects: false,
      });

      const loading = transitionHeroUpgrade(poster, { type: 'START' });
      expect(loading).toMatchObject({
        phase: 'light-loading',
        model: null,
        effects: false,
      });

      const ready = transitionHeroUpgrade(loading, {
        type: 'LIGHT_LOADED',
      });
      expect(ready).toMatchObject({
        phase: 'light-ready',
        model: 'light',
        effects: false,
      });
    },
  );

  it('waits for five consecutive stable samples before requesting full', () => {
    const lightReady = moveToLightReady();

    const afterFour = [0.7, 0.8, 0.9, 1].reduce(
      (state, factor) =>
        transitionHeroUpgrade(state, { type: 'STABLE_SAMPLE', factor }),
      lightReady,
    );

    expect(afterFour).toMatchObject({
      phase: 'light-ready',
      model: 'light',
      effects: false,
      stableSamples: 4,
    });

    expect(
      transitionHeroUpgrade(afterFour, {
        type: 'STABLE_SAMPLE',
        factor: 0.7,
      }),
    ).toMatchObject({
      phase: 'full-loading',
      model: 'light',
      effects: false,
      stableSamples: 5,
    });
  });

  it.each([
    ['a factor below the threshold', 0.69],
    ['a non-numeric factor', Number.NaN],
  ] as const)('resets the promotion streak after %s', (_reason, factor) => {
    const afterFour = [0.8, 0.8, 0.8, 0.8].reduce(
      (state, stableFactor) =>
        transitionHeroUpgrade(state, {
          type: 'STABLE_SAMPLE',
          factor: stableFactor,
        }),
      moveToLightReady(),
    );
    const reset = transitionHeroUpgrade(afterFour, {
      type: 'STABLE_SAMPLE',
      factor,
    });

    expect(reset).toMatchObject({ phase: 'light-ready', stableSamples: 0 });

    const next = transitionHeroUpgrade(reset, {
      type: 'STABLE_SAMPLE',
      factor: 1,
    });
    expect(next).toMatchObject({ phase: 'light-ready', stableSamples: 1 });
  });

  it('never promotes a balanced target during the mount', () => {
    const lightReady = moveToLightReady('balanced');
    const sampled = Array.from({ length: 10 }, () => 1).reduce(
      (state, factor) =>
        transitionHeroUpgrade(state, { type: 'STABLE_SAMPLE', factor }),
      lightReady,
    );

    expect(sampled).toBe(lightReady);
    expect(sampled.phase).toBe('light-ready');
  });

  it('locks a full target to balanced before Full promotion', () => {
    const afterFour = [0.8, 0.8, 0.8, 0.8].reduce(
      (state, factor) =>
        transitionHeroUpgrade(state, { type: 'STABLE_SAMPLE', factor }),
      moveToLightReady(),
    );

    const degraded = transitionHeroUpgrade(afterFour, {
      type: 'TARGET_DEGRADED',
      targetTier: 'balanced',
    });

    expect(degraded).toMatchObject({
      phase: 'light-ready',
      targetTier: 'balanced',
      model: 'light',
      effects: false,
      stableSamples: 0,
    });

    const attemptedPromotion = transitionHeroUpgrade(degraded, {
      type: 'TARGET_DEGRADED',
      targetTier: 'full',
    });
    expect(attemptedPromotion).toBe(degraded);

    const sampled = Array.from({ length: 10 }, () => 1).reduce(
      (state, factor) =>
        transitionHeroUpgrade(state, { type: 'STABLE_SAMPLE', factor }),
      attemptedPromotion,
    );
    expect(sampled).toBe(degraded);
  });

  it.each([
    ['full-loading', moveToFullLoading()],
    [
      'full-ready',
      transitionHeroUpgrade(moveToFullLoading(), { type: 'FULL_LOADED' }),
    ],
  ] satisfies ReadonlyArray<readonly [string, HeroUpgradeState]>)(
    'returns safely to the light model when %s degrades to balanced',
    (_phase, state) => {
      expect(
        transitionHeroUpgrade(state, {
          type: 'TARGET_DEGRADED',
          targetTier: 'balanced',
        }),
      ).toMatchObject({
        phase: 'light-ready',
        targetTier: 'balanced',
        model: 'light',
        effects: false,
        stableSamples: 0,
      });
    },
  );

  it('ignores same-tier updates and every target promotion', () => {
    const full = moveToLightReady();
    expect(
      transitionHeroUpgrade(full, {
        type: 'TARGET_DEGRADED',
        targetTier: 'full',
      }),
    ).toBe(full);

    const balanced = moveToLightReady('balanced');
    expect(
      transitionHeroUpgrade(balanced, {
        type: 'TARGET_DEGRADED',
        targetTier: 'balanced',
      }),
    ).toBe(balanced);
    expect(
      transitionHeroUpgrade(balanced, {
        type: 'TARGET_DEGRADED',
        targetTier: 'full',
      }),
    ).toBe(balanced);
  });

  it.each(['full', 'balanced'] as const)(
    'degrades a %s target to terminal static',
    (targetTier) => {
      expect(
        transitionHeroUpgrade(moveToLightReady(targetTier), {
          type: 'TARGET_DEGRADED',
          targetTier: 'static',
        }),
      ).toMatchObject({
        phase: 'static',
        targetTier: 'static',
        model: null,
        effects: false,
      });
    },
  );

  it('activates the full model and effects only after full load succeeds', () => {
    const fullLoading = moveToFullLoading();

    expect(fullLoading).toMatchObject({
      phase: 'full-loading',
      model: 'light',
      effects: false,
    });

    expect(
      transitionHeroUpgrade(fullLoading, { type: 'FULL_LOADED' }),
    ).toMatchObject({
      phase: 'full-ready',
      model: 'full',
      effects: true,
    });
  });

  it.each([
    [
      'light',
      transitionHeroUpgrade(createHeroUpgradeState('full'), {
        type: 'START',
      }),
    ],
    ['full', moveToFullLoading()],
  ] satisfies ReadonlyArray<readonly [string, HeroUpgradeState]>)(
    'falls back to static when the %s model load fails',
    (_model, state) => {
      expect(
        transitionHeroUpgrade(state, { type: 'LOAD_FAILED' }),
      ).toMatchObject({
        phase: 'static',
        targetTier: 'static',
        model: null,
        effects: false,
      });
    },
  );

  it.each([
    ['WebGL context loss', { type: 'CONTEXT_LOST' }],
    ['an explicit restriction', { type: 'RESTRICT' }],
  ] satisfies ReadonlyArray<readonly [string, HeroUpgradeEvent]>)(
    'falls back to static after %s',
    (_reason, event) => {
      const next = transitionHeroUpgrade(moveToLightReady(), event);

      expect(next).toEqual({
        phase: 'static',
        targetTier: 'static',
        model: null,
        effects: false,
        stableSamples: 0,
        regressions: 0,
      });
    },
  );

  it.each([
    ['poster', createHeroUpgradeState('full')],
    [
      'light-loading',
      transitionHeroUpgrade(createHeroUpgradeState('full'), {
        type: 'START',
      }),
    ],
    ['light-ready', moveToLightReady()],
    ['full-loading', moveToFullLoading()],
    [
      'full-ready',
      transitionHeroUpgrade(moveToFullLoading(), { type: 'FULL_LOADED' }),
    ],
  ] satisfies ReadonlyArray<readonly [string, HeroUpgradeState]>)(
    'treats safety restrictions as fatal from %s',
    (_phase, state) => {
      for (const event of [
        { type: 'CONTEXT_LOST' },
        { type: 'RESTRICT' },
      ] satisfies HeroUpgradeEvent[]) {
        expect(transitionHeroUpgrade(state, event)).toMatchObject({
          phase: 'static',
          targetTier: 'static',
          model: null,
          effects: false,
        });
      }
    },
  );

  it('falls back to static on the third performance regression', () => {
    const lightReady = transitionHeroUpgrade(moveToLightReady(), {
      type: 'STABLE_SAMPLE',
      factor: 1,
    });
    const first = transitionHeroUpgrade(lightReady, {
      type: 'PERFORMANCE_REGRESSION',
    });
    const second = transitionHeroUpgrade(first, {
      type: 'PERFORMANCE_REGRESSION',
    });

    expect(first).toMatchObject({
      phase: 'light-ready',
      regressions: 1,
      stableSamples: 0,
    });
    expect(second).toMatchObject({
      phase: 'light-ready',
      regressions: 2,
    });
    expect(
      transitionHeroUpgrade(second, { type: 'PERFORMANCE_REGRESSION' }),
    ).toMatchObject({
      phase: 'static',
      targetTier: 'static',
      regressions: 3,
    });
  });

  it.each([
    [
      'FULL_LOADED before light',
      createHeroUpgradeState('full'),
      { type: 'FULL_LOADED' },
    ],
    [
      'LIGHT_LOADED before loading',
      createHeroUpgradeState('full'),
      { type: 'LIGHT_LOADED' },
    ],
    [
      'STABLE_SAMPLE before light',
      createHeroUpgradeState('full'),
      { type: 'STABLE_SAMPLE', factor: 1 },
    ],
    [
      'a second START while light loads',
      transitionHeroUpgrade(createHeroUpgradeState('full'), { type: 'START' }),
      { type: 'START' },
    ],
    [
      'FULL_LOADED while light loads',
      transitionHeroUpgrade(createHeroUpgradeState('full'), { type: 'START' }),
      { type: 'FULL_LOADED' },
    ],
    [
      'STABLE_SAMPLE while light loads',
      transitionHeroUpgrade(createHeroUpgradeState('full'), { type: 'START' }),
      { type: 'STABLE_SAMPLE', factor: 1 },
    ],
    ['restarting from light-ready', moveToLightReady(), { type: 'START' }],
    [
      'early FULL_LOADED from light-ready',
      moveToLightReady(),
      { type: 'FULL_LOADED' },
    ],
    [
      'reloading light from light-ready',
      moveToLightReady(),
      { type: 'LIGHT_LOADED' },
    ],
    [
      'a stable sample while full loads',
      moveToFullLoading(),
      { type: 'STABLE_SAMPLE', factor: 1 },
    ],
    ['restarting while full loads', moveToFullLoading(), { type: 'START' }],
    [
      'reloading light while full loads',
      moveToFullLoading(),
      { type: 'LIGHT_LOADED' },
    ],
    [
      'a second FULL_LOADED after full-ready',
      transitionHeroUpgrade(moveToFullLoading(), { type: 'FULL_LOADED' }),
      { type: 'FULL_LOADED' },
    ],
    [
      'restarting after full-ready',
      transitionHeroUpgrade(moveToFullLoading(), { type: 'FULL_LOADED' }),
      { type: 'START' },
    ],
    [
      'reloading light after full-ready',
      transitionHeroUpgrade(moveToFullLoading(), { type: 'FULL_LOADED' }),
      { type: 'LIGHT_LOADED' },
    ],
    [
      'sampling stability after full-ready',
      transitionHeroUpgrade(moveToFullLoading(), { type: 'FULL_LOADED' }),
      { type: 'STABLE_SAMPLE', factor: 1 },
    ],
    [
      'a load failure before loading',
      createHeroUpgradeState('full'),
      { type: 'LOAD_FAILED' },
    ],
    [
      'a load failure after light is ready',
      moveToLightReady(),
      { type: 'LOAD_FAILED' },
    ],
    [
      'a load failure after full is ready',
      transitionHeroUpgrade(moveToFullLoading(), { type: 'FULL_LOADED' }),
      { type: 'LOAD_FAILED' },
    ],
  ] satisfies ReadonlyArray<
    readonly [string, HeroUpgradeState, HeroUpgradeEvent]
  >)('ignores illegal transition: %s', (_label, state, event) => {
    expect(transitionHeroUpgrade(state, event)).toBe(state);
  });

  it('keeps static terminal for every event', () => {
    const state = createHeroUpgradeState('static');
    const events: HeroUpgradeEvent[] = [
      { type: 'START' },
      { type: 'LIGHT_LOADED' },
      { type: 'STABLE_SAMPLE', factor: 1 },
      { type: 'FULL_LOADED' },
      { type: 'LOAD_FAILED' },
      { type: 'CONTEXT_LOST' },
      { type: 'RESTRICT' },
      { type: 'PERFORMANCE_REGRESSION' },
      { type: 'TARGET_DEGRADED', targetTier: 'balanced' },
      { type: 'TARGET_DEGRADED', targetTier: 'full' },
    ];

    for (const event of events) {
      expect(transitionHeroUpgrade(state, event)).toBe(state);
    }
  });
});
