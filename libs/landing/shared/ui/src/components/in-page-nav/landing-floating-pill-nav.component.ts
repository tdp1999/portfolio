import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LandingScrollspyService } from './landing-scrollspy.service';
import { InPageSection } from './section.types';

/**
 * Floating bottom-center pill displaying current section + count.
 * Click toggles a dropdown TOC. Pairs with a vertical mini-map at the right edge.
 *
 * `hideOnSelector` accepts a CSS selector — when the matched element enters the
 * viewport, the pill + minimap fade out. Use it to clear the way for the footer
 * banner / signature once the user has scrolled past the last in-page section.
 */
@Component({
  selector: 'landing-floating-pill-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (visible()) {
      <!-- Pill: bottom-center. Desktop-only (≥lg) — tablets and below get the
           regular header nav, no in-page wayfinding pill. -->
      <div #pillContainer class="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 hidden lg:block">
        @if (open()) {
          <ul
            class="absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 overflow-hidden rounded-lg border border-landing-border bg-ink-1 shadow-xl"
            aria-label="Section navigation"
          >
            @for (s of sections(); track s.id) {
              <li>
                <a
                  [routerLink]="[]"
                  [fragment]="s.id"
                  (click)="open.set(false)"
                  [attr.aria-current]="active() === s.id ? 'location' : null"
                  class="block px-4 py-2 font-sans text-body-sm transition-colors duration-motion-base ease-landing-ease"
                  [class.text-landing-accent]="active() === s.id"
                  [class.bg-ink-2]="active() === s.id"
                  [class.text-landing-text-400]="active() !== s.id"
                  [class.hover:bg-ink-2]="active() !== s.id"
                >
                  <span class="font-mono text-mono-sm text-landing-text-500 mr-2">{{ $index + 1 }}.</span>
                  {{ s.title }}
                </a>
              </li>
            }
          </ul>
        }
        <button
          type="button"
          (click)="open.set(!open())"
          class="flex items-center gap-2 rounded-full border border-landing-border bg-[var(--landing-header-bg)] px-4 py-2 backdrop-blur-md shadow-lg transition-all duration-motion-base ease-landing-ease hover:border-landing-accent"
          [attr.aria-expanded]="open()"
          aria-haspopup="true"
        >
          <span class="font-mono text-mono-sm uppercase tracking-[0.06em] text-landing-text-500">
            {{ activeIndex() + 1 }} / {{ sections().length }}
          </span>
          <span class="font-sans text-body-sm text-landing-text-300">{{ activeSection().title }}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="text-landing-text-500 transition-transform duration-motion-base"
            [class.rotate-180]="open()"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      <!-- Mini-map: right edge with hover labels -->
      @if (showMinimap()) {
        <nav class="fixed right-3 top-1/2 z-30 -translate-y-1/2 hidden lg:block" aria-label="Mini-map">
          <ul class="flex flex-col gap-1">
            @for (s of sections(); track s.id) {
              <li>
                <a
                  [routerLink]="[]"
                  [fragment]="s.id"
                  [attr.aria-label]="s.title"
                  class="group relative flex h-2 items-center"
                >
                  <span
                    class="block h-1 rounded-full transition-all duration-motion-base ease-landing-ease"
                    [class.bg-landing-accent]="active() === s.id"
                    [class.w-8]="active() === s.id"
                    [class.bg-landing-text-700]="active() !== s.id"
                    [class.w-6]="active() !== s.id"
                    [class.group-hover:bg-landing-text-500]="active() !== s.id"
                  ></span>
                  <span
                    class="absolute right-10 whitespace-nowrap rounded border border-landing-border bg-ink-1 px-2 py-1 font-sans text-body-sm text-landing-text-300 opacity-0 pointer-events-none transition-opacity duration-motion-base ease-landing-ease group-hover:opacity-100"
                  >
                    {{ s.title }}
                  </span>
                </a>
              </li>
            }
          </ul>
        </nav>
      }
    }
  `,
})
export class LandingFloatingPillNavComponent {
  private readonly scrollspy = inject(LandingScrollspyService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pillContainer = viewChild<ElementRef<HTMLElement>>('pillContainer');

  readonly sections = input.required<readonly InPageSection[]>();
  readonly showMinimap = input(true);
  /** When the matched element is intersecting the viewport, hide the pill + minimap.
   *  Pass `null` (default) to keep the nav visible at the scroll-end. */
  readonly hideOnSelector = input<string | null>(null);
  /** Hide the pill + minimap while the scrollspy active section ID is one of these.
   *  Use it to keep the nav off the hero (e.g. `['hero']`) until the user reaches the
   *  first real content section. Default `[]` keeps the pill visible everywhere. */
  readonly hideWhileActiveIn = input<readonly string[]>([]);

  readonly open = signal(false);
  readonly active = computed(() => this.scrollspy.active());
  private readonly hiddenBySelector = signal(false);
  private readonly hiddenByActive = computed(() => this.hideWhileActiveIn().includes(this.active()));
  readonly visible = computed(() => !this.hiddenBySelector() && !this.hiddenByActive());

  readonly activeIndex = computed(() => {
    const id = this.active();
    return Math.max(
      0,
      this.sections().findIndex((s) => s.id === id)
    );
  });
  readonly activeSection = computed(() => this.sections()[this.activeIndex()]);

  constructor() {
    effect((onCleanup) => {
      const selector = this.hideOnSelector();
      if (!selector || !isPlatformBrowser(this.platformId)) return;

      // Defer to next frame so target nodes mounted by the host app exist.
      const handle = requestAnimationFrame(() => {
        const target = document.querySelector(selector);
        if (!target) return;

        const observer = new IntersectionObserver(
          ([entry]) => {
            this.hiddenBySelector.set(entry.isIntersecting);
            if (entry.isIntersecting) this.open.set(false);
          },
          // Negative bottom margin shrinks the IO root from the bottom — the pill
          // only hides once the target has scrolled ~40% of the viewport into view,
          // giving the user some overshoot room past the footer's top edge.
          { rootMargin: '0px 0px -40% 0px' }
        );
        observer.observe(target);
        this.destroyRef.onDestroy(() => observer.disconnect());
      });

      onCleanup(() => cancelAnimationFrame(handle));
    });
  }

  /** Close the dropdown when the user clicks anywhere outside the pill container.
   *  The pill toggle's own click handler runs first and stops here via the contains() check,
   *  so the menu still opens on toggle and closes on any outside pointer event. */
  @HostListener('document:pointerdown', ['$event.target'])
  onDocumentPointerDown(target: EventTarget | null): void {
    if (!this.open()) return;
    const host = this.pillContainer()?.nativeElement;
    if (host && target instanceof Node && !host.contains(target)) {
      this.open.set(false);
    }
  }

  /** Escape key closes the dropdown — standard popup a11y. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.open.set(false);
  }
}
