import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon';

let uid = 0;

/**
 * Reusable "see more" disclosure. Projects arbitrary content; when it exceeds
 * `maxHeight` the overflow is clamped (with an optional bottom fade) behind a
 * **See more / See less** toggle. The toggle only appears when the content
 * actually overflows — short content renders untouched, no button.
 *
 * SSR / no-JS safe by progressive enhancement: the server renders **expanded**
 * (all content reachable for crawlers and no-JS readers); on hydration the
 * component measures the projected content and collapses it if it overflows.
 *
 * Two overflow modes:
 * - `'toggle'` (default) — clamp behind a **See more / See less** button.
 * - `'scroll'` — cap at `maxHeight` and let the overflow scroll *inside* the box
 *   (no button). Use when you want a fixed-height block whose neighbours stay even
 *   (e.g. a 2-col rail row) rather than a disclosure. Switch `mode` reactively by
 *   breakpoint via `BreakpointObserverService`.
 *
 * ```html
 * <landing-show-more [maxHeight]="300">
 *   <dl class="project-meta-list">…</dl>
 * </landing-show-more>
 * ```
 */
@Component({
  selector: 'landing-show-more',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  template: `
    <div
      class="show-more"
      [class.show-more--collapsed]="collapsed()"
      [class.show-more--scroll]="scrollCapped()"
      [class.show-more--fade]="fade() && collapsed()"
      [class.show-more--expanded]="overflowing() && expanded()"
    >
      <div
        #content
        class="show-more__content"
        [id]="contentId"
        [style.max-height.px]="collapsed() || scrollCapped() ? maxHeight() : null"
      >
        <ng-content />
      </div>
      @if (showToggle()) {
        <button
          type="button"
          class="show-more__toggle"
          [attr.aria-expanded]="expanded()"
          [attr.aria-controls]="contentId"
          (click)="toggle($event)"
        >
          <span>{{ expanded() ? lessLabel() : moreLabel() }}</span>
          <landing-icon name="chevron-down" [size]="14" class="show-more__chevron" />
        </button>
      }
    </div>
  `,
  styleUrl: './show-more.scss',
})
export class ShowMore {
  /** Collapsed height cap in px. Content taller than this clamps behind the toggle. */
  readonly maxHeight = input(300);
  readonly moreLabel = input('See more');
  readonly lessLabel = input('See less');
  /** Bottom gradient fade on the clamped content (toggle mode only). */
  readonly fade = input(true);
  /** `'toggle'` clamps behind a button; `'scroll'` caps and scrolls inside the box. */
  readonly mode = input<'toggle' | 'scroll'>('toggle');

  protected readonly contentId = `show-more-${uid++}`;
  private readonly contentRef = viewChild.required<ElementRef<HTMLElement>>('content');

  /** Starts expanded for SSR/no-JS reachability; collapses after the first browser measure. */
  protected readonly expanded = signal(true);
  protected readonly overflowing = signal(false);
  /** Toggle mode, clamped + button shown. */
  protected readonly collapsed = computed(() => this.mode() === 'toggle' && this.overflowing() && !this.expanded());
  /** Scroll mode, capped at maxHeight with an internal scrollbar. */
  protected readonly scrollCapped = computed(() => this.mode() === 'scroll' && this.overflowing());
  protected readonly showToggle = computed(() => this.mode() === 'toggle' && this.overflowing());

  private autoCollapsed = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.measure();
      const ro = new ResizeObserver(() => this.measure());
      ro.observe(this.contentRef().nativeElement);
      this.destroyRef.onDestroy(() => ro.disconnect());
    });
  }

  protected toggle(event?: Event): void {
    this.expanded.update((v) => !v);
    // Drop focus after the click so the button doesn't linger in a
    // focused/hover-toned state once the content reflows past the pointer.
    (event?.currentTarget as HTMLElement | undefined)?.blur();
  }

  private measure(): void {
    const el = this.contentRef().nativeElement;
    // Measure against the un-clamped height: when collapsed the element is capped,
    // so compare scrollHeight (full content) to the cap.
    const over = el.scrollHeight > this.maxHeight() + 4;
    this.overflowing.set(over);
    // Auto-collapse once, the first time we learn it overflows. After that the
    // user owns the expanded state — don't fight their toggle on resize.
    if (over && !this.autoCollapsed) {
      this.autoCollapsed = true;
      this.expanded.set(false);
    }
  }
}
