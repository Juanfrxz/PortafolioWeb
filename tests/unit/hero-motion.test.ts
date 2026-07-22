import type { RefObject } from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const gsapHarness = vi.hoisted(() => {
  const contextRevert = vi.fn();
  const matchMediaRevert = vi.fn();
  const timelineTo = vi.fn().mockReturnThis();
  const timeline = vi.fn((_options?: unknown) => ({ to: timelineTo }));
  const context = vi.fn((callback: () => void) => {
    callback();
    return { revert: contextRevert };
  });
  const matchMediaAdd = vi.fn((_query: string, callback: () => void) => {
    if (gsapHarness.motionAllowed) {
      callback();
    }
  });
  const matchMedia = vi.fn(() => ({
    add: matchMediaAdd,
    revert: matchMediaRevert,
  }));

  return {
    context,
    contextRevert,
    matchMedia,
    matchMediaAdd,
    matchMediaRevert,
    motionAllowed: true,
    timeline,
    timelineTo,
  };
});

vi.mock('gsap', () => ({
  default: {
    context: gsapHarness.context,
    matchMedia: gsapHarness.matchMedia,
    registerPlugin: vi.fn(),
    timeline: gsapHarness.timeline,
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { name: 'ScrollTrigger' },
}));

import { createHeroMotion } from '../../src/lib/hero-motion';

describe('createHeroMotion', () => {
  beforeEach(() => {
    gsapHarness.motionAllowed = true;
    vi.clearAllMocks();
    vi.stubGlobal('matchMedia', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('drives a clamped mutable progress ref without scroll hijacking', () => {
    const scope = document.createElement('section');
    const progressRef = { current: 0 } as RefObject<number>;

    const cleanup = createHeroMotion(scope, progressRef);

    expect(gsapHarness.context).toHaveBeenCalledWith(
      expect.any(Function),
      scope,
    );
    expect(gsapHarness.matchMedia).toHaveBeenCalledTimes(1);
    expect(gsapHarness.matchMediaAdd).toHaveBeenCalledWith(
      '(prefers-reduced-motion: no-preference)',
      expect.any(Function),
    );
    expect(gsapHarness.timeline).toHaveBeenCalledTimes(1);

    const timelineOptions = gsapHarness.timeline.mock.calls[0]?.[0] as {
      scrollTrigger: {
        onUpdate: (self: { progress: number }) => void;
        [key: string]: unknown;
      };
    };

    expect(timelineOptions.scrollTrigger).toMatchObject({
      trigger: scope,
      scrub: true,
    });
    expect(timelineOptions.scrollTrigger).not.toHaveProperty('pin');
    expect(timelineOptions.scrollTrigger).not.toHaveProperty('snap');
    expect(timelineOptions.scrollTrigger).not.toHaveProperty('normalizeScroll');

    timelineOptions.scrollTrigger.onUpdate({ progress: 1.25 });
    expect(progressRef.current).toBe(1);
    timelineOptions.scrollTrigger.onUpdate({ progress: -0.25 });
    expect(progressRef.current).toBe(0);

    cleanup();

    expect(gsapHarness.contextRevert).toHaveBeenCalledTimes(1);
    expect(progressRef.current).toBe(0);
  });

  it('does not create a timeline when reduced motion is active', () => {
    gsapHarness.motionAllowed = false;
    const scope = document.createElement('section');
    const progressRef = { current: 0 } as RefObject<number>;

    const cleanup = createHeroMotion(scope, progressRef);

    expect(gsapHarness.matchMedia).toHaveBeenCalledTimes(1);
    expect(gsapHarness.timeline).not.toHaveBeenCalled();

    cleanup();

    expect(gsapHarness.contextRevert).toHaveBeenCalledTimes(1);
  });
});
