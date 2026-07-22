export type QualityTier = 'full' | 'balanced' | 'static';

export interface QualitySignals {
  reducedMotion: boolean;
  saveData: boolean;
  webgl: boolean;
  regressions: number;
  coarsePointer: boolean;
  lowPower: boolean;
}

export interface QualitySettings {
  dpr: readonly [number, number];
  particles: number;
  shadows: boolean;
  bloom: boolean;
  initialModel: string | null;
  enhancedModel: string | null;
}

export const QUALITY_SETTINGS = {
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
} as const satisfies Record<QualityTier, QualitySettings>;

export function selectQualityTier(signals: QualitySignals): QualityTier {
  if (
    signals.reducedMotion ||
    signals.saveData ||
    !signals.webgl ||
    signals.regressions >= 3
  ) {
    return 'static';
  }

  if (signals.coarsePointer || signals.lowPower) {
    return 'balanced';
  }

  return 'full';
}
