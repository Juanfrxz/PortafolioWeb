import { describe, expect, it } from 'vitest';

import {
  QUALITY_SETTINGS,
  selectQualityTier,
  type QualitySignals,
} from '../../src/lib/quality-tier';

const fullSignals: QualitySignals = {
  reducedMotion: false,
  saveData: false,
  webgl: true,
  regressions: 0,
  coarsePointer: false,
  lowPower: false,
};

describe('hero quality tier selection', () => {
  it.each([
    ['reduced motion', { reducedMotion: true }],
    ['save-data', { saveData: true }],
    ['missing WebGL', { webgl: false }],
    ['three regressions', { regressions: 3 }],
    ['more than three regressions', { regressions: 4 }],
  ] satisfies ReadonlyArray<readonly [string, Partial<QualitySignals>]>)(
    'selects static for %s',
    (_reason, override) => {
      expect(selectQualityTier({ ...fullSignals, ...override })).toBe('static');
    },
  );

  it.each([
    ['a coarse pointer', { coarsePointer: true }],
    ['a low-power device', { lowPower: true }],
  ] satisfies ReadonlyArray<readonly [string, Partial<QualitySignals>]>)(
    'selects balanced for %s',
    (_reason, override) => {
      expect(selectQualityTier({ ...fullSignals, ...override })).toBe(
        'balanced',
      );
    },
  );

  it('lets a static restriction override balanced signals', () => {
    expect(
      selectQualityTier({
        ...fullSignals,
        reducedMotion: true,
        coarsePointer: true,
        lowPower: true,
      }),
    ).toBe('static');
  });

  it('selects full when no restriction or degradation signal is active', () => {
    expect(selectQualityTier(fullSignals)).toBe('full');
  });
});

describe('hero quality settings', () => {
  it('exposes the exact settings for every tier', () => {
    expect(QUALITY_SETTINGS).toEqual({
      full: {
        dpr: [1, 1.75],
        particles: 120,
        shadows: true,
        bloom: true,
        initialModel: '/models/avatar-light.glb',
        enhancedModel: '/models/avatar-full.glb',
      },
      balanced: {
        dpr: [0.75, 1.25],
        particles: 40,
        shadows: false,
        bloom: false,
        initialModel: '/models/avatar-light.glb',
        enhancedModel: null,
      },
      static: {
        dpr: [1, 1],
        particles: 0,
        shadows: false,
        bloom: false,
        initialModel: null,
        enhancedModel: null,
      },
    });
  });
});
