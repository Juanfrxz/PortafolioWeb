import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const TRACK_MEDIA_CONDITIONS = {
  desktop: '(min-width: 1100px)',
  finePointer: '(pointer: fine)',
  motionAllowed: '(prefers-reduced-motion: no-preference)',
} as const;
const FOCUSABLE_SELECTOR =
  'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

export interface TrackActivationSignals {
  width: number;
  finePointer: boolean;
  reducedMotion: boolean;
}

export interface ChapterScrollTargetInput {
  trackTop: number;
  viewportHeight: number;
  chapterIndex: number;
  chapterCount: number;
}

export interface TrackGeometry {
  chapters: number;
  transitionViewports: number;
  entranceViewports: 1;
  exitViewports: 1;
  totalViewports: number;
}

export type SelectedWorkTrackMode = 'horizontal' | 'vertical';

export function selectTrackMode({
  width,
  finePointer,
  reducedMotion,
}: TrackActivationSignals): SelectedWorkTrackMode {
  return width >= 1100 && finePointer && !reducedMotion
    ? 'horizontal'
    : 'vertical';
}

export function getTrackGeometry(chapterCount: number): TrackGeometry {
  const chapters = Math.max(0, Math.floor(chapterCount));
  const transitionViewports = Math.max(0, chapters - 1);

  return {
    chapters,
    transitionViewports,
    entranceViewports: 1,
    exitViewports: 1,
    totalViewports: transitionViewports + 2,
  };
}

export function getChapterScrollTarget({
  trackTop,
  viewportHeight,
  chapterIndex,
  chapterCount,
}: ChapterScrollTargetInput): number {
  const chapters = Math.max(0, Math.floor(chapterCount));
  const lastChapterIndex = Math.max(0, chapters - 1);
  const normalizedIndex = Math.min(
    lastChapterIndex,
    Math.max(0, Math.floor(chapterIndex)),
  );

  return (
    Math.max(0, trackTop) + Math.max(0, viewportHeight) * (1 + normalizedIndex)
  );
}

export function getFocusScrollBehavior(reducedMotion: boolean): ScrollBehavior {
  return reducedMotion ? 'auto' : 'smooth';
}

interface TrackMediaConditions {
  desktop?: boolean;
  finePointer?: boolean;
  motionAllowed?: boolean;
}

function resetTrack(root: HTMLElement, stage: HTMLElement, track: HTMLElement) {
  root.dataset.trackMode = 'vertical';
  stage.style.removeProperty('--selected-work-track-viewports');
  track.style.removeProperty('transform');
}

function horizontalLayoutFits(
  track: HTMLElement,
  chapters: readonly HTMLElement[],
): boolean {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  if (track.scrollHeight > viewportHeight) {
    return false;
  }

  return chapters.every((chapter) => {
    if (chapter.scrollHeight > viewportHeight) {
      return false;
    }

    const chapterBounds = chapter.getBoundingClientRect();
    const controls = chapter.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

    return Array.from(controls).every((control) => {
      const bounds = control.getBoundingClientRect();
      const relativeLeft = bounds.left - chapterBounds.left;
      const relativeRight = bounds.right - chapterBounds.left;
      const relativeTop = bounds.top - chapterBounds.top;
      const relativeBottom = bounds.bottom - chapterBounds.top;

      return (
        relativeLeft >= 0 &&
        relativeRight <= viewportWidth &&
        relativeTop >= 0 &&
        relativeBottom <= viewportHeight
      );
    });
  });
}

export function createSelectedWorkTrack(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>('[data-selected-work-stage]');
  const track = root.querySelector<HTMLElement>('[data-selected-work-track]');
  const chapters = Array.from(
    root.querySelectorAll<HTMLElement>('[data-project-chapter]'),
  );

  if (
    !stage ||
    !track ||
    chapters.length < 2 ||
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return () => undefined;
  }

  gsap.registerPlugin(ScrollTrigger);

  const media = gsap.matchMedia();
  const context = gsap.context(() => {
    media.add(TRACK_MEDIA_CONDITIONS, (mediaContext) => {
      const conditions = (mediaContext.conditions ??
        {}) as TrackMediaConditions;
      const reducedMotion = !conditions.motionAllowed;
      const mode = selectTrackMode({
        width: conditions.desktop ? 1100 : 1099,
        finePointer: Boolean(conditions.finePointer),
        reducedMotion,
      });

      resetTrack(root, stage, track);

      if (mode !== 'horizontal') {
        return;
      }

      const geometry = getTrackGeometry(chapters.length);
      let tween: ReturnType<typeof gsap.to> | null = null;
      let disposed = false;

      const handleFocus = (event: FocusEvent) => {
        if (root.dataset.trackMode !== 'horizontal') {
          return;
        }

        const target = event.target;

        if (!(target instanceof Element)) {
          return;
        }

        const chapter = target.closest<HTMLElement>('[data-project-chapter]');

        if (!chapter || !root.contains(chapter)) {
          return;
        }

        const targetBounds = target.getBoundingClientRect();
        const isOffscreen =
          targetBounds.left < 0 ||
          targetBounds.right > window.innerWidth ||
          targetBounds.top < 0 ||
          targetBounds.bottom > window.innerHeight;

        if (!isOffscreen) {
          return;
        }

        const chapterIndex = chapters.indexOf(chapter);
        const trackTop = stage.getBoundingClientRect().top + window.scrollY;

        window.scrollTo({
          top: getChapterScrollTarget({
            trackTop,
            viewportHeight: window.innerHeight,
            chapterIndex,
            chapterCount: chapters.length,
          }),
          behavior: getFocusScrollBehavior(reducedMotion),
        });
      };

      const disableHorizontal = () => {
        tween?.kill();
        tween = null;
        resetTrack(root, stage, track);
      };

      const enableHorizontalIfSafe = () => {
        if (disposed) {
          return;
        }

        root.dataset.trackMode = 'horizontal';
        stage.style.setProperty(
          '--selected-work-track-viewports',
          String(geometry.totalViewports),
        );

        if (!horizontalLayoutFits(track, chapters)) {
          disableHorizontal();
          return;
        }

        if (!tween) {
          tween = gsap.to(track, {
            x: () => -(track.scrollWidth - stage.clientWidth),
            ease: 'none',
            scrollTrigger: {
              trigger: stage,
              start: () => `top+=${window.innerHeight} top`,
              end: 'bottom bottom',
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        }
      };

      root.addEventListener('focusin', handleFocus);
      enableHorizontalIfSafe();
      ScrollTrigger.addEventListener('refreshInit', enableHorizontalIfSafe);
      const refreshFrame = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });

      return () => {
        disposed = true;
        window.cancelAnimationFrame(refreshFrame);
        ScrollTrigger.removeEventListener(
          'refreshInit',
          enableHorizontalIfSafe,
        );
        root.removeEventListener('focusin', handleFocus);
        disableHorizontal();
      };
    });
  }, root);

  return () => {
    media.revert();
    context.revert();
    resetTrack(root, stage, track);
  };
}
