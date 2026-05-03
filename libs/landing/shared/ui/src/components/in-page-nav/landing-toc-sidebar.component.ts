import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingScrollspyService } from './landing-scrollspy.service';
import { InPageSection } from './section.types';

/**
 * Sticky table-of-contents sidebar with scrollspy active highlighting.
 *
 * Usage:
 * ```html
 * <landing-toc-sidebar [sections]="sections" label="On this page" />
 * ```
 *
 * Requires `LandingScrollspyService` provided in the parent. Page must register sections via
 * `scrollspy.setSections(sections)` in its constructor.
 */
@Component({
  selector: 'landing-toc-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <nav class="sticky top-24" [attr.aria-label]="label()">
      <p class="font-mono text-mono-sm uppercase tracking-[0.06em] text-landing-text-500 mb-3">
        {{ label() }}
      </p>
      <ul class="space-y-1.5 border-l border-landing-border">
        @for (s of sections(); track s.id) {
          <li>
            <a
              [routerLink]="[]"
              [fragment]="s.id"
              [attr.aria-current]="active() === s.id ? 'location' : null"
              class="block -ml-px border-l border-transparent pl-4 py-1 font-sans text-body-sm transition-colors duration-motion-base ease-landing-ease"
              [class.text-landing-accent]="active() === s.id"
              [class.border-landing-accent]="active() === s.id"
              [class.text-landing-text-500]="active() !== s.id"
              [class.hover:text-landing-text-300]="active() !== s.id"
            >
              {{ s.title }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
})
export class LandingTocSidebarComponent {
  private readonly scrollspy = inject(LandingScrollspyService);

  readonly sections = input.required<readonly InPageSection[]>();
  readonly label = input('On this page');

  readonly active = computed(() => this.scrollspy.active());
}
