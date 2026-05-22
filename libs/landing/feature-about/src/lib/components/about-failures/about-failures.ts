import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingHeadingComponent,
  LandingLocaleService,
  LandingTComponent,
} from '@portfolio/landing/shared/ui';
import { getFailureEssays, type FailureEssay } from './failures-content';

/**
 * About → Failures & lessons section. Graduated from `/ddl/about-signatures`
 * 2026-05-22 — winning variant was V1 (three-column cards). DDL still renders
 * this same component in its V1 slot for the historical comparison.
 *
 * Layout: bordered equal-height cards in a 3-column grid (collapses to a
 * single column < 1024px). Each card carries year + anonymized context as a
 * header, then three labeled sections (Decision / Consequence / Lesson). The
 * lesson row is bumped to text-300 + weight 500 so the takeaway stands out
 * inside the card without breaking the scan grid.
 *
 * Content lives in `failures-content.ts` — placeholder essays for v1; author
 * replaces with real essays in task 340. Optional `[essays]` input lets a
 * caller override the default locale-driven essays (used by the DDL
 * comparison page when it wants to show, e.g., locale-mismatched samples).
 */
@Component({
  selector: 'landing-about-failures',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContainerComponent, EyebrowComponent, LandingHeadingComponent, LandingTComponent],
  templateUrl: './about-failures.html',
  styleUrl: './about-failures.scss',
})
export class LandingAboutFailuresComponent {
  private readonly locale = inject(LandingLocaleService).locale;

  /** Optional override — when not provided, the component reads the current
   *  locale and pulls from `failures-content.ts`. The DDL sandbox renders the
   *  same default; production /about does not pass this input. */
  readonly essays = input<readonly FailureEssay[] | null>(null);

  protected readonly resolvedEssays = computed<readonly FailureEssay[]>(
    () => this.essays() ?? getFailureEssays(this.locale())
  );
}
