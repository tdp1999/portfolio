import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingIconArrowComponent } from '../icon/landing-icon-arrow.component';

/**
 * Sub-page "back to ..." link. Mirror of `<landing-link>` but pointing left:
 * mono caps voice, indigo lead arrow, ghost-trail lift-off on hover (slides
 * left). Used at the top of feed sub-pages (blog, projects, experience) and
 * inside not-found empty-states.
 *
 * Usage:
 * ```html
 * <landing-back-link href="/">Back to home</landing-back-link>
 * <landing-back-link href="/blog">All Articles</landing-back-link>
 * ```
 */
@Component({
  selector: 'landing-back-link',
  standalone: true,
  imports: [RouterLink, LandingIconArrowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a [routerLink]="href()" class="landing-back-link">
      <span class="landing-back-link__arrow-stack" aria-hidden="true">
        <landing-icon-arrow
          direction="left"
          [size]="14"
          class="landing-back-link__arrow landing-back-link__arrow--ghost"
        />
        <landing-icon-arrow
          direction="left"
          [size]="14"
          class="landing-back-link__arrow landing-back-link__arrow--lead"
        />
      </span>
      <span class="landing-back-link__text"><ng-content /></span>
    </a>
  `,
  styleUrl: './back-link.component.scss',
})
export class LandingBackLinkComponent {
  readonly href = input<string>('/');
}
