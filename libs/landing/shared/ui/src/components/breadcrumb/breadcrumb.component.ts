import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  readonly label: string;
  /** Omit on the trailing item to mark it as the current page (rendered as plain text). */
  readonly href?: string;
}

/**
 * Mono-caps breadcrumb trail. Last item is rendered as plain text (current page);
 * preceding items are router links. Pairs naturally with eyebrow typography on
 * sub-page headers (DDL, /uses, /colophon, project detail, etc.).
 */
@Component({
  selector: 'landing-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="landing-breadcrumb" aria-label="Breadcrumb">
      <ol class="landing-breadcrumb__list" role="list">
        @for (item of items(); track item.label; let last = $last) {
          <li class="landing-breadcrumb__item">
            @if (last || !item.href) {
              <span class="landing-breadcrumb__current" aria-current="page">{{ item.label }}</span>
            } @else {
              <a class="landing-breadcrumb__link" [routerLink]="item.href">{{ item.label }}</a>
            }
            @if (!last) {
              <span class="landing-breadcrumb__sep" aria-hidden="true">/</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styleUrl: './breadcrumb.component.scss',
})
export class LandingBreadcrumbComponent {
  readonly items = input.required<readonly BreadcrumbItem[]>();

  /** Tally retained for tests / consumers; not used by the template. */
  protected readonly count = computed(() => this.items().length);
}
