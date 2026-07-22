import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

const LazyHeroExperience = lazy(() =>
  import('./HeroExperience').then(({ HeroExperience }) => ({
    default: HeroExperience,
  })),
);

const AUTOMATIC_ACTIVATION_DELAY_MS = 30_000;

interface NetworkConnection {
  saveData?: boolean;
  addEventListener(type: 'change', listener: EventListener): void;
  removeEventListener(type: 'change', listener: EventListener): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
}

type DeferredState = 'poster' | 'static' | 'active';

function Placeholder({
  rootRef,
  state,
}: {
  rootRef?: RefObject<HTMLDivElement | null>;
  state: Exclude<DeferredState, 'active'>;
}) {
  return (
    <div
      ref={rootRef}
      data-hero-experience
      data-model-phase="static"
      data-quality-tier="static"
      data-render-state={state}
      aria-hidden="true"
      hidden
    />
  );
}

export function DeferredHeroExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<DeferredState>('poster');

  useEffect(() => {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as NavigatorWithConnection).connection;
    const visual = rootRef.current?.closest<HTMLElement>('[data-hero-visual]');
    let activationTimer: ReturnType<typeof setTimeout> | undefined;

    const isRestricted = () =>
      reducedMotion.matches || Boolean(connection?.saveData);
    const stopListening = () => {
      visual?.removeEventListener('pointermove', activate);
      visual?.removeEventListener('pointerdown', activate);
      visual?.removeEventListener('touchstart', activate);
      if (activationTimer !== undefined) clearTimeout(activationTimer);
    };
    const activate = () => {
      if (isRestricted()) {
        setState('static');
        return;
      }

      stopListening();
      setState('active');
    };
    const syncRestriction = () => {
      setState((current) => {
        if (current === 'active') return current;
        return isRestricted() ? 'static' : 'poster';
      });
    };

    syncRestriction();
    visual?.addEventListener('pointermove', activate, { passive: true });
    visual?.addEventListener('pointerdown', activate, { passive: true });
    visual?.addEventListener('touchstart', activate, { passive: true });
    reducedMotion.addEventListener('change', syncRestriction);
    connection?.addEventListener('change', syncRestriction);
    activationTimer = setTimeout(activate, AUTOMATIC_ACTIVATION_DELAY_MS);

    return () => {
      stopListening();
      reducedMotion.removeEventListener('change', syncRestriction);
      connection?.removeEventListener('change', syncRestriction);
    };
  }, []);

  if (state !== 'active') {
    return <Placeholder rootRef={rootRef} state={state} />;
  }

  return (
    <Suspense fallback={<Placeholder state="poster" />}>
      <LazyHeroExperience />
    </Suspense>
  );
}
