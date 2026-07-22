import { PerformanceMonitor } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import {
  default as React,
  Suspense,
  useCallback,
  useRef,
  type ErrorInfo,
  type RefObject,
} from 'react';
import { MathUtils, type Group } from 'three';

import type { HeroUpgradeState } from '../../lib/hero-upgrade';
import type { QualitySettings } from '../../lib/quality-tier';
import { AvatarModel } from './AvatarModel';
import { HeroErrorBoundary } from './HeroErrorBoundary';
import { TopologyField } from './TopologyField';

interface HeroSceneProps {
  machine: HeroUpgradeState;
  settings: QualitySettings;
  progressRef: RefObject<number>;
  onFirstFrame: () => void;
  onLightLoaded: () => void;
  onFullLoaded: () => void;
  onLoadFailure: () => void;
  onFatalError: (error: Error) => void;
  onStableSample: (factor: number) => void;
  onPerformanceRegression: () => void;
}

export interface HeroScenePlan {
  renderLight: boolean;
  renderFull: boolean;
  fullVisible: boolean;
  bloom: boolean;
}

export function buildHeroScenePlan(
  machine: HeroUpgradeState,
  settings: QualitySettings,
): HeroScenePlan {
  const modelRequested =
    machine.phase !== 'poster' && machine.phase !== 'static';
  const renderFull =
    Boolean(settings.enhancedModel) &&
    (machine.phase === 'full-loading' || machine.phase === 'full-ready');
  const fullVisible =
    renderFull && machine.phase === 'full-ready' && machine.model === 'full';

  return {
    renderLight:
      modelRequested && Boolean(settings.initialModel) && !fullVisible,
    renderFull,
    fullVisible,
    bloom: Boolean(settings.bloom && machine.effects && fullVisible),
  };
}

function FirstMeaningfulFrame({
  enabled,
  onFrame,
}: {
  enabled: boolean;
  onFrame: () => void;
}) {
  const reportedRef = useRef(false);

  useFrame(() => {
    if (enabled && !reportedRef.current) {
      reportedRef.current = true;
      onFrame();
    }
  });

  return null;
}

export function HeroScene({
  machine,
  settings,
  progressRef,
  onFirstFrame,
  onLightLoaded,
  onFullLoaded,
  onLoadFailure,
  onFatalError,
  onStableSample,
  onPerformanceRegression,
}: HeroSceneProps) {
  const subjectRef = useRef<Group>(null);
  const plan = buildHeroScenePlan(machine, settings);

  const handleModelError = useCallback(
    (error: Error, _info: ErrorInfo) => {
      onLoadFailure();
      onFatalError(error);
    },
    [onFatalError, onLoadFailure],
  );

  useFrame(({ pointer }, delta) => {
    const subject = subjectRef.current;

    if (!subject) {
      return;
    }

    const targetX = MathUtils.clamp(pointer.y * -0.1, -0.1, 0.1);
    const targetY = MathUtils.clamp(pointer.x * 0.16, -0.16, 0.16);
    subject.rotation.x = MathUtils.damp(subject.rotation.x, targetX, 4, delta);
    subject.rotation.y = MathUtils.damp(subject.rotation.y, targetY, 4, delta);
    subject.position.y = MathUtils.damp(
      subject.position.y,
      progressRef.current * -0.32,
      3,
      delta,
    );
  });

  return (
    <>
      <fog attach="fog" args={['#090c16', 5.5, 14]} />
      <ambientLight color="#8ab8ff" intensity={0.42} />
      <directionalLight
        castShadow={settings.shadows}
        color="#b9dcff"
        intensity={2.4}
        position={[3.5, 4.5, 4]}
      />
      <pointLight color="#5ce1ff" intensity={16} position={[-3.5, 0.5, 2]} />
      <spotLight
        color="#a970ff"
        intensity={28}
        angle={0.5}
        penumbra={0.8}
        position={[2.5, 3.5, -2.5]}
      />

      <group ref={subjectRef}>
        {plan.renderLight && settings.initialModel && (
          <HeroErrorBoundary onError={handleModelError}>
            <Suspense fallback={null}>
              <AvatarModel
                key={settings.initialModel}
                path={settings.initialModel}
                visible
                shadows={settings.shadows}
                onLoaded={onLightLoaded}
              />
            </Suspense>
          </HeroErrorBoundary>
        )}
        {plan.renderFull && settings.enhancedModel && (
          <HeroErrorBoundary onError={handleModelError}>
            <Suspense fallback={null}>
              <AvatarModel
                key={settings.enhancedModel}
                path={settings.enhancedModel}
                visible={plan.fullVisible}
                shadows={settings.shadows}
                onLoaded={onFullLoaded}
              />
            </Suspense>
          </HeroErrorBoundary>
        )}
        <TopologyField count={settings.particles} />
      </group>

      <FirstMeaningfulFrame
        enabled={machine.model !== null}
        onFrame={onFirstFrame}
      />
      <PerformanceMonitor
        onChange={({ factor }) => onStableSample(factor)}
        onDecline={onPerformanceRegression}
      />

      {plan.bloom && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.7}
            luminanceThreshold={0.82}
            luminanceSmoothing={0.18}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}
