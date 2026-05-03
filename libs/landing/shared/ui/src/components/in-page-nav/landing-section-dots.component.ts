import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingScrollspyService } from './landing-scrollspy.service';
import { InPageSection } from './section.types';

/**
 * Vertical section-position dots fixed to the right edge of the viewport.
 * Hovering a dot reveals the section title in a tooltip-pill.
 */
@Component({
  selector: 'landing-section-dots',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <nav class="fixed right-6 top-1/2 z-30 -translate-y-1/2" [attr.aria-label]="label()">
      <ul class="flex flex-col gap-3">
        @for (s of sections(); track s.id) {
          <li>
            <a
              [routerLink]="[]"
              [fragment]="s.id"
              [attr.aria-label]="s.title"
              [attr.aria-current]="active() === s.id ? 'true' : null"
              class="group relative flex h-3 w-3 items-center justify-center"
            >
              <span
                class="h-2 w-2 rounded-full border border-landing-text-500 transition-all duration-motion-base ease-landing-ease"
                [class.bg-landing-accent]="active() === s.id"
                [class.border-landing-accent]="active() === s.id"
                [class.scale-150]="active() === s.id"
              ></span>
              <span
                class="absolute right-5 whitespace-nowrap rounded border border-landing-border bg-ink-1 px-2 py-1 font-sans text-body-sm text-landing-text-300 opacity-0 pointer-events-none transition-opacity duration-motion-base ease-landing-ease group-hover:opacity-100"
              >
                {{ s.title }}
              </span>
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class LandingSectionDotsComponent {
  private readonly scrollspy = inject(LandingScrollspyService);

  readonly sections = input.required<readonly InPageSection[]>();
  readonly label = input('Sections');

  readonly active = computed(() => this.scrollspy.active());
}
