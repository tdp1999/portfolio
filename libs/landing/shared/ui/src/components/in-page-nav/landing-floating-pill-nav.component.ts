import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingScrollspyService } from './landing-scrollspy.service';
import { InPageSection } from './section.types';

/**
 * Floating bottom-center pill displaying current section + count.
 * Click toggles a dropdown TOC. Pairs with a vertical mini-map at the right edge.
 */
@Component({
  selector: 'landing-floating-pill-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <!-- Pill: bottom-center -->
    <div class="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
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
      <nav class="fixed right-3 top-1/2 z-30 -translate-y-1/2" aria-label="Mini-map">
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
  `,
})
export class LandingFloatingPillNavComponent {
  private readonly scrollspy = inject(LandingScrollspyService);

  readonly sections = input.required<readonly InPageSection[]>();
  readonly showMinimap = input(true);

  readonly open = signal(false);
  readonly active = computed(() => this.scrollspy.active());

  readonly activeIndex = computed(() => {
    const id = this.active();
    return Math.max(
      0,
      this.sections().findIndex((s) => s.id === id)
    );
  });
  readonly activeSection = computed(() => this.sections()[this.activeIndex()]);
}
