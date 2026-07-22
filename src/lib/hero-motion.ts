import type { RefObject } from 'react';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, progress));
}

export function createHeroMotion(
  scope: HTMLElement,
  progressRef: RefObject<number>,
): () => void {
  progressRef.current = 0;

  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return () => {
      progressRef.current = 0;
    };
  }

  gsap.registerPlugin(ScrollTrigger);

  const context = gsap.context(() => {
    const media = gsap.matchMedia();

    media.add(MOTION_QUERY, () => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: scope,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            progressRef.current = clampProgress(self.progress);
          },
        },
      });

      timeline.to(
        progressRef,
        {
          current: 1,
          duration: 1,
          ease: 'none',
        },
        0,
      );
    });
  }, scope);

  return () => {
    context.revert();
    progressRef.current = 0;
  };
}
