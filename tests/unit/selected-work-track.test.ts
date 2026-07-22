import { describe, expect, it } from 'vitest';

import {
  getChapterScrollTarget,
  getFocusScrollBehavior,
  getTrackGeometry,
  selectTrackMode,
} from '../../src/lib/selected-work-track';

describe('selectTrackMode', () => {
  it('activates horizontal mode only at 1100px with a fine pointer and motion allowed', () => {
    expect(
      selectTrackMode({
        width: 1100,
        finePointer: true,
        reducedMotion: false,
      }),
    ).toBe('horizontal');
  });

  it.each([
    {
      name: 'a viewport below 1100px',
      signals: {
        width: 1099,
        finePointer: true,
        reducedMotion: false,
      },
    },
    {
      name: 'a coarse pointer',
      signals: {
        width: 1440,
        finePointer: false,
        reducedMotion: false,
      },
    },
    {
      name: 'reduced motion',
      signals: {
        width: 1440,
        finePointer: true,
        reducedMotion: true,
      },
    },
  ])('keeps vertical mode for $name', ({ signals }) => {
    expect(selectTrackMode(signals)).toBe('vertical');
  });
});

describe('getTrackGeometry', () => {
  it('gives three chapters two transition viewports plus entrance and exit', () => {
    expect(getTrackGeometry(3)).toEqual({
      chapters: 3,
      transitionViewports: 2,
      entranceViewports: 1,
      exitViewports: 1,
      totalViewports: 4,
    });
  });

  it('never creates negative transition geometry', () => {
    expect(getTrackGeometry(0)).toEqual({
      chapters: 0,
      transitionViewports: 0,
      entranceViewports: 1,
      exitViewports: 1,
      totalViewports: 2,
    });
  });
});

describe('focus synchronization', () => {
  it('maps a chapter index to its native vertical equivalent', () => {
    expect(
      getChapterScrollTarget({
        trackTop: 2_400,
        viewportHeight: 900,
        chapterIndex: 2,
        chapterCount: 3,
      }),
    ).toBe(5_100);
  });

  it('clamps the chapter index to the available track', () => {
    expect(
      getChapterScrollTarget({
        trackTop: 1_000,
        viewportHeight: 800,
        chapterIndex: 8,
        chapterCount: 3,
      }),
    ).toBe(3_400);
  });

  it('uses auto for reduced motion and smooth otherwise', () => {
    expect(getFocusScrollBehavior(true)).toBe('auto');
    expect(getFocusScrollBehavior(false)).toBe('smooth');
  });
});
