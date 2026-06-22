import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShowMore } from '@portfolio/landing/shared/ui';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';

/**
 * `landing-show-more` — reusable clamp/scroll disclosure.
 *
 * Source-of-truth showcase: the two overflow modes (`toggle` / `scroll`), the
 * no-overflow → no-chrome behaviour, the `fade` toggle, and the even-height
 * 2-col rail pattern that project-detail uses below `wide`.
 */
@Component({
  selector: 'landing-ddl-show-more',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DdlDocPage, DdlSection, ShowMore],
  templateUrl: './ddl-show-more.html',
  styleUrl: './ddl-show-more.scss',
})
export class DdlShowMore {
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
