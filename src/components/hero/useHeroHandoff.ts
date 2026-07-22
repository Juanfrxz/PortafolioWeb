import { useEffect, useRef, type RefObject } from 'react';

import { createHeroMotion } from '../../lib/hero-motion';

export function useHeroHandoff(scopeRef: RefObject<HTMLElement | null>) {
  const progressRef = useRef(0);

  useEffect(() => {
    const scope = scopeRef.current;

    if (!scope) {
      return;
    }

    return createHeroMotion(scope, progressRef);
  }, [scopeRef]);

  return progressRef;
}
