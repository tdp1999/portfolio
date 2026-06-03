import {
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

/** Width of the fade ramp at a scrollable edge, in px. */
const FADE_PX = 24;
/** Fraction of the viewport to advance per `scrollStep()` call. */
const STEP_FRACTION = 0.8;

/**
 * Fades the edge(s) of a scrollable element that have content out of view, so a
 * clipped child reads as "scroll for more" rather than "cut off". Self-contained:
 * applies a `mask-image` via a host style binding, so no per-consumer CSS is needed.
 * It also exposes its edge state + a `scrollStep()` method (via `exportAs`) so a
 * consumer can add explicit chevron indicators with plain template bindings:
 *
 *   <div class="rail">
 *     <button [hidden]="rail.atStart()" (click)="rail.scrollStep(-1)">‹</button>
 *     <div class="strip" landingScrollEdgeFade #rail="scrollEdgeFade"> … </div>
 *     <button [hidden]="rail.atEnd()" (click)="rail.scrollStep(1)">›</button>
 *   </div>
 *
 * Apply to the *scroll container* (the element with `overflow: auto`/`scroll`):
 *   `<div class="tabs" landingScrollEdgeFade> … </div>`        // horizontal (default)
 *   `<div class="list" landingScrollEdgeFade edgeFadeAxis="y"> … </div>`  // vertical
 *
 * Implementation notes:
 * - **Manual listeners, not Angular `(scroll)` bindings.** Under SSR hydration with
 *   event replay, template/host `(scroll)` listeners for the non-bubbling `scroll`
 *   event don't fire reliably; a manual `addEventListener` on the live element does.
 *   (`click` bindings — e.g. on chevrons — are fine; only `scroll` is affected.)
 * - **State commits inside `NgZone.run`.** Listeners run outside Angular so rapid
 *   scrolling doesn't thrash change detection; the edge state is committed inside the
 *   zone only when it actually changes, so the host style binding re-renders. Without
 *   this the signal write from an out-of-zone listener never flushes in zone.js apps.
 * - A ResizeObserver + MutationObserver recompute when the box resizes or content
 *   (e.g. async tab data) arrives. The mask is dropped entirely when nothing overflows.
 */
@Directive({
  selector: '[landingScrollEdgeFade]',
  standalone: true,
  exportAs: 'scrollEdgeFade',
  host: {
    '[style.-webkit-mask-image]': 'mask()',
    '[style.mask-image]': 'mask()',
  },
})
export class ScrollEdgeFadeDirective {
  /**
   * Scroll axis to fade: `'x'` (horizontal, default) or `'y'` (vertical). Kept separate
   * from the selector attribute so the bare `landingScrollEdgeFade` needs no value:
   *   `<div landingScrollEdgeFade>`                 // horizontal (default)
   *   `<div landingScrollEdgeFade edgeFadeAxis="y">` // vertical
   */
  readonly axis = input<'x' | 'y'>('x', { alias: 'edgeFadeAxis' });

  /**
   * Whether to apply the built-in `mask-image` fade. Set `[edgeFadeMask]="false"` when
   * the consumer renders its own edge affordance (e.g. gradient-scrim chevrons) but
   * still wants the `atStart()/atEnd()` state and `scrollStep()` helper.
   */
  readonly maskEnabled = input(true, { alias: 'edgeFadeMask' });

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _atStart = signal(true);
  private readonly _atEnd = signal(true);
  /** `true` when scrolled to the start/end edge (or nothing overflows). Read in a
   *  consumer template (via `exportAs`) to toggle chevron indicators. */
  readonly atStart = this._atStart.asReadonly();
  readonly atEnd = this._atEnd.asReadonly();

  protected readonly mask = computed<string | null>(() => {
    if (!this.maskEnabled()) return null;
    const fadeStart = !this._atStart();
    const fadeEnd = !this._atEnd();
    if (!fadeStart && !fadeEnd) return null; // nothing overflows → no mask (don't clip)
    const direction = this.axis() === 'x' ? 'to right' : 'to bottom';
    const head = fadeStart ? `transparent, #000 ${FADE_PX}px` : '#000';
    const tail = fadeEnd ? `#000 calc(100% - ${FADE_PX}px), transparent` : '#000';
    return `linear-gradient(${direction}, ${head}, ${tail})`;
  });

  constructor() {
    afterNextRender(() => {
      const node = this.el.nativeElement;
      const update = () => this.update();
      this.zone.runOutsideAngular(() => {
        node.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
      });
      const resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(node);
      // Catch async content (e.g. tab labels arriving from an API) that grows scrollWidth
      // without changing the container's own box.
      const mutationObserver = new MutationObserver(update);
      mutationObserver.observe(node, { childList: true, subtree: true, characterData: true });
      update();

      this.destroyRef.onDestroy(() => {
        node.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      });
    });
  }

  /** Scroll by ~80% of the viewport in the configured axis. `direction` is -1/+1. */
  scrollStep(direction: -1 | 1): void {
    const node = this.el.nativeElement;
    const horizontal = this.axis() === 'x';
    const amount = (horizontal ? node.clientWidth : node.clientHeight) * STEP_FRACTION * direction;
    node.scrollBy({ [horizontal ? 'left' : 'top']: amount, behavior: 'smooth' });
  }

  /**
   * Scroll the minimum amount so `target` (a descendant) is fully visible, keeping
   * `margin` px clear of each edge — pass the edge-affordance width so the target never
   * lands under a chevron/fade. No-op when `target` is already comfortably in view.
   */
  scrollIntoView(target: HTMLElement, margin = 0): void {
    const node = this.el.nativeElement;
    if (!node.isConnected) return;
    const horizontal = this.axis() === 'x';
    const nodeRect = node.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const pos = horizontal ? node.scrollLeft : node.scrollTop;
    const viewport = horizontal ? node.clientWidth : node.clientHeight;
    const start = pos + (horizontal ? targetRect.left - nodeRect.left : targetRect.top - nodeRect.top);
    const end = start + (horizontal ? targetRect.width : targetRect.height);
    const key = horizontal ? 'left' : 'top';
    if (start < pos + margin) {
      node.scrollTo({ [key]: start - margin, behavior: 'smooth' });
    } else if (end > pos + viewport - margin) {
      node.scrollTo({ [key]: end - viewport + margin, behavior: 'smooth' });
    }
  }

  private update(): void {
    const node = this.el.nativeElement;
    if (!node.isConnected) return; // ignore transient detach during hydration
    const horizontal = this.axis() === 'x';
    const client = horizontal ? node.clientWidth : node.clientHeight;
    if (client === 0) return;
    const overflow = (horizontal ? node.scrollWidth : node.scrollHeight) - client;
    const pos = horizontal ? node.scrollLeft : node.scrollTop;
    const nextStart = overflow <= 1 || pos <= 1;
    const nextEnd = overflow <= 1 || pos >= overflow - 1;
    if (nextStart === this._atStart() && nextEnd === this._atEnd()) return;
    // Commit inside the zone so the host style binding re-renders (listeners run
    // outside it). No-op cost when unchanged thanks to the early return above.
    this.zone.run(() => {
      this._atStart.set(nextStart);
      this._atEnd.set(nextEnd);
    });
  }
}
