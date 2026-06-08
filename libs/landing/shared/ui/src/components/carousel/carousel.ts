import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Figure } from '../figure/figure';
import { LightboxDirective } from '../lightbox';
import { CarouselSlide } from './carousel-slide.directive';
import type { GalleryImage } from '../gallery/gallery.types';

/** Per-instance fallback group id (SSR-safe: deterministic instantiation order). */
let carouselSeq = 0;

/**
 * `landing-carousel` — a full-feature, breakpoint-agnostic image slider.
 *
 * One reusable component for any "swipe through a set of frames" need (project
 * galleries, screenshots, testimonials-with-image…). It is NOT responsive by
 * itself — when a layout wants a slider on small screens and something else on
 * large ones, the *consumer* swaps components by breakpoint (e.g. via
 * `BreakpointObserverService.isAtLeast('laptop')`); this component just does the
 * slider job well at whatever size it is mounted.
 *
 * Two slide sources:
 * - **Image mode** (default) — pass `[images]`; each slide is a `landing-figure`.
 * - **Content mode** — pass `[items]` + an `<ng-template landingCarouselSlide>`;
 *   the carousel projects arbitrary content (cards, panels…) per slide while
 *   still owning the track / snap / count / index / dots / arrows.
 *
 * Features:
 * - **Touch swipe** — native CSS scroll-snap (momentum + flick for free).
 * - **Mouse drag** — pointer-drag on the track for desktop pointers.
 * - **Keyboard** — ←/→ move between slides when the track is focused.
 * - **Controls** — prev/next arrows + dot indicators (both optional).
 * - **Thumbnails** — optional filmstrip for random access (`showThumbnails`).
 * - **Peek** — optional sliver of the next frame so "more" is obvious (`peek`).
 * - **Loop** — optional wrap-around at the ends (`loop`).
 * - **Captions** — each slide is a `landing-figure`, so FIG number + caption and
 *   lazy-loading come along; visually consistent with the desktop gallery.
 * - **a11y** — `aria-roledescription="carousel"`, per-slide "i of n" labels, a
 *   polite live region announcing the active slide, labelled controls.
 *
 * SSR-safe: scroll/drag listeners attach in `afterNextRender`; edge state commits
 * inside `NgZone.run` so the OnPush view reflects scroll-driven index changes.
 */
@Component({
  selector: 'landing-carousel',
  standalone: true,
  imports: [Figure, LightboxDirective, NgTemplateOutlet],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'landing-carousel' },
})
export class Carousel {
  /**
   * Image-mode slides. Optional so the carousel can also run in content mode
   * (`[items]` + `landingCarouselSlide`). Existing image callers are unchanged.
   */
  readonly images = input<readonly GalleryImage[]>([]);
  /** Content-mode slide data — rendered through a `landingCarouselSlide` template. */
  readonly items = input<readonly unknown[]>([]);
  readonly ariaLabel = input<string>('Image carousel');
  /** Show FIG numbering on captions. */
  readonly numbered = input<boolean>(true);
  /** Wrap from last → first (and back) on prev/next. */
  readonly loop = input<boolean>(false);
  /** Render a thumbnail filmstrip below the stage for random access. */
  readonly showThumbnails = input<boolean>(false);
  /** Render the dot indicators. */
  readonly showDots = input<boolean>(true);
  /** Render the prev/next arrows. */
  readonly showArrows = input<boolean>(true);
  /** Leave a sliver of the neighbouring slides visible as a "more" cue. */
  readonly peek = input<boolean>(false);
  /** Frame aspect-ratio (any valid CSS `aspect-ratio`). */
  readonly aspectRatio = input<string>('4 / 3');
  /** Make each slide open the shared lightbox on tap/click. Default: off (opt-in). */
  readonly lightbox = input<boolean>(false);
  /** Lightbox group key. Defaults to a per-instance id so carousels don't merge. */
  readonly lightboxGroup = input<string>('');

  private readonly autoGroup = `lb-carousel-${carouselSeq++}`;
  protected readonly effectiveGroup = computed(() => this.lightboxGroup() || this.autoGroup);

  /** Active slide index. Two-way so a consumer can drive/observe it. */
  readonly index = model<number>(0);

  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  /** Present → content mode; absent → image mode. */
  protected readonly slide = contentChild(CarouselSlide);
  protected readonly slideTemplate = computed(() => this.slide()?.template ?? null);
  /** Content mode projects cards — arrows move to a bottom row so they never cover content. */
  protected readonly isContent = computed(() => this.slideTemplate() !== null);
  /** Unified slide source — drives count, dots, and the active-index sync. */
  protected readonly slideList = computed<readonly unknown[]>(() =>
    this.slideTemplate() ? this.items() : this.images()
  );

  protected readonly count = computed(() => this.slideList().length);
  /**
   * Whether the track actually overflows its viewport. When every slide already
   * fits (e.g. a 2-up view with only 2 cards), there is nothing to navigate — so
   * arrows and dots are hidden. Measured from the DOM; defaults to `true` so SSR
   * renders controls for the common overflowing case.
   */
  protected readonly scrollable = signal(true);
  /** Set once the track is live (client only); lets the count effect re-measure. */
  private remeasureScrollable: (() => void) | null = null;
  protected readonly atStart = computed(() => this.index() <= 0);
  protected readonly atEnd = computed(() => this.index() >= this.count() - 1);
  protected readonly liveLabel = computed(() => `Slide ${this.index() + 1} of ${this.count()}`);

  /** Step by ±1, wrapping when `loop` is on. */
  protected go(dir: -1 | 1): void {
    const n = this.count();
    if (n === 0) return;
    let next = this.index() + dir;
    if (this.loop()) next = (next + n) % n;
    else next = Math.min(n - 1, Math.max(0, next));
    this.goTo(next);
  }

  /** Scroll a given slide into view; the scroll listener updates `index`. */
  protected goTo(i: number): void {
    const el = this.track()?.nativeElement;
    const child = el?.children[i] as HTMLElement | undefined;
    if (!el || !child) return;
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.go(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.go(-1);
    }
  }

  constructor() {
    // Re-measure overflow when the slide count changes — the ResizeObserver below
    // only catches viewport-driven box changes, not in-place data changes (async
    // load, locale switch) that alter scrollWidth without touching clientWidth.
    effect(() => {
      this.count();
      this.remeasureScrollable?.();
    });

    afterNextRender(() => {
      const el = this.track()?.nativeElement;
      if (!el) return;

      // ── Overflow detection: hide controls when everything already fits ──
      const measureScrollable = () => {
        const overflows = el.scrollWidth - el.clientWidth > 1;
        if (overflows !== this.scrollable()) {
          this.zone.run(() => this.scrollable.set(overflows));
        }
      };
      this.remeasureScrollable = measureScrollable;
      measureScrollable();
      const ro = new ResizeObserver(() => measureScrollable());
      ro.observe(el);
      this.destroyRef.onDestroy(() => {
        ro.disconnect();
        this.remeasureScrollable = null;
      });

      // ── Active index from scroll position (nearest slide centre) ──
      const syncIndex = () => {
        const centre = el.scrollLeft + el.clientWidth / 2;
        let nearest = 0;
        let best = Infinity;
        for (let i = 0; i < el.children.length; i++) {
          const c = el.children[i] as HTMLElement;
          const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - centre);
          if (d < best) {
            best = d;
            nearest = i;
          }
        }
        if (nearest !== this.index()) {
          this.zone.run(() => this.index.set(nearest));
        }
      };

      // The on-screen distance from one slide to the next (slide width + gap).
      const slideStep = () => {
        const a = el.children[0] as HTMLElement | undefined;
        const b = el.children[1] as HTMLElement | undefined;
        if (a && b) return b.offsetLeft - a.offsetLeft;
        return a ? a.offsetWidth : el.clientWidth;
      };

      // ── Mouse pointer-drag (touch is handled natively by scroll-snap) ──
      // One gesture = at most one slide. The visual travel is capped to a single
      // neighbour so a long drag can never reveal slide ±2, and release commits
      // to ±1 on a small displacement OR a quick flick (responsive to light drags).
      //
      // Drag only ENGAGES once the pointer moves past a small threshold — until
      // then it stays a plain click, so a tap on a slide that is a link (content
      // mode) still navigates. Capturing the pointer on `pointerdown` would swallow
      // that click; we defer the capture to the first real move instead.
      const DRAG_THRESHOLD = 6; // px before a press becomes a drag
      let pointerDown = false;
      let dragging = false;
      let suppressClick = false;
      let startX = 0;
      let startScroll = 0;
      let startIndex = 0;
      let startTime = 0;
      let step = 0;
      let activePointer = -1;
      const onDown = (e: PointerEvent) => {
        // Clear any stale suppression from a drag that produced no trailing click.
        suppressClick = false;
        if (e.pointerType !== 'mouse') return;
        pointerDown = true;
        dragging = false;
        startX = e.clientX;
        startScroll = el.scrollLeft;
        startIndex = this.index();
        startTime = e.timeStamp;
        step = slideStep();
        activePointer = e.pointerId;
      };
      const onMove = (e: PointerEvent) => {
        if (!pointerDown) return;
        const delta = e.clientX - startX;
        if (!dragging) {
          if (Math.abs(delta) < DRAG_THRESHOLD) return;
          // Engage drag: now capture the pointer + kill snap so it tracks 1:1.
          dragging = true;
          el.classList.add('is-dragging');
          try {
            el.setPointerCapture(activePointer);
          } catch {
            /* pointer may already be released */
          }
        }
        // Clamp travel to one neighbour in either direction.
        el.scrollLeft = Math.min(startScroll + step, Math.max(startScroll - step, startScroll - delta));
      };
      const onUp = (e: PointerEvent) => {
        if (!pointerDown) return;
        pointerDown = false;
        if (!dragging) return; // a click, not a drag — let it through (link navigates)

        dragging = false;
        suppressClick = true; // a real drag just ended — swallow the trailing click
        el.classList.remove('is-dragging');
        if (el.hasPointerCapture(activePointer)) el.releasePointerCapture(activePointer);

        const dx = e.clientX - startX; // > 0 → dragged right → previous slide
        const dt = Math.max(1, e.timeStamp - startTime);
        const velocity = dx / dt; // px per ms
        // Low distance threshold + a velocity escape hatch = sensitive to light drags.
        const distanceTrigger = Math.min(48, Math.max(24, step * 0.12));
        const velocityTrigger = 0.4;
        let dir: -1 | 0 | 1 = 0;
        if (dx <= -distanceTrigger || velocity <= -velocityTrigger) dir = 1;
        else if (dx >= distanceTrigger || velocity >= velocityTrigger) dir = -1;

        const n = this.count();
        let target = startIndex + dir;
        if (this.loop()) target = (target + n) % n;
        else target = Math.min(n - 1, Math.max(0, target));
        this.goTo(target);
      };
      // Swallow the click synthesised at the end of a real drag so it can't
      // trigger a slide's link; a plain click (no drag) passes straight through.
      const onClick = (e: MouseEvent) => {
        if (suppressClick) {
          suppressClick = false;
          e.preventDefault();
          e.stopPropagation();
        }
      };
      // Suppress the browser's native image-drag ghost while dragging the track.
      const onDragStart = (e: DragEvent) => e.preventDefault();

      this.zone.runOutsideAngular(() => {
        el.addEventListener('scroll', syncIndex, { passive: true });
        el.addEventListener('pointerdown', onDown);
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onUp);
        el.addEventListener('click', onClick, true);
        el.addEventListener('dragstart', onDragStart);
      });

      this.destroyRef.onDestroy(() => {
        el.removeEventListener('scroll', syncIndex);
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
        el.removeEventListener('click', onClick, true);
        el.removeEventListener('dragstart', onDragStart);
      });
    });
  }
}
