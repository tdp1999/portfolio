import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingBreadcrumbComponent,
  ShowMoreComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';

/**
 * `landing-show-more` — reusable clamp/scroll disclosure.
 *
 * Source-of-truth showcase: the two overflow modes (`toggle` / `scroll`), the
 * no-overflow → no-chrome behaviour, the `fade` toggle, and the even-height
 * 2-col rail pattern that project-detail uses below `wide`.
 */
@Component({
  selector: 'landing-show-more-ddl-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, EyebrowComponent, LandingBreadcrumbComponent, ShowMoreComponent],
  templateUrl: './show-more.page.html',
  styleUrl: './show-more.page.scss',
})
export class ShowMoreDdlPage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Show more — clamp / scroll disclosure' },
  ];

  // A long list so the clamp/scroll actually engages.
  readonly stack: readonly string[] = [
    'TypeScript',
    'Angular',
    'Angular Material',
    'RxJS',
    'Signals',
    'SSR',
    'Tailwind',
    'SCSS',
    'NestJS',
    'Prisma',
    'Postgres',
    'Nx',
    'Jest',
    'Playwright',
    'Claude Code',
    'Zod',
    'Cloudinary',
    'Railway',
  ];

  // A short list — proves "no overflow → no toggle".
  readonly tools: readonly string[] = ['Neovim', 'Ghostty', 'Raycast'];
}
