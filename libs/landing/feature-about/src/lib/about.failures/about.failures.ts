import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Container, Eyebrow, Heading, LandingLocaleService, T } from '@portfolio/landing/shared/ui';
import { FailureService, type PublicAboutFailure } from '@portfolio/landing/shared/data-access';
import type { FailureEssay } from '../about.failures.types';

/**
 * About → Failures & lessons section. Graduated from `/ddl/about-signatures`
 * 2026-05-22 — winning variant was V1 (three-column cards). DDL still renders
 * this same component in its V1 slot for the historical comparison.
 *
 * Layout: bordered equal-height cards in a 3-column grid (collapses to a
 * single column < 1024px). Each card carries year + anonymized context as a
 * header, then three labeled sections (Decision / Consequence / Lesson).
 *
 * Data source: `FailureService.getPublicFailures()` — console-managed via the
 * `AboutFailure` admin CRUD shipped in task 345. The DDL sandbox now passes
 * the same localized essays into V2/V3 via the page-level component so all
 * three variants stay in sync visually.
 */
@Component({
  selector: 'landing-about-failures',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Eyebrow, Heading, T],
  templateUrl: './about.failures.html',
  styleUrl: './about.failures.scss',
})
export class AboutFailures {
  private readonly locale = inject(LandingLocaleService).locale;
  private readonly failureService = inject(FailureService);

  private readonly raw = toSignal(this.failureService.getPublicFailures(), {
    initialValue: [] as readonly PublicAboutFailure[],
  });

  /** Localized essay list with EN-fallback per-item — preserves the layout
   *  if a translation is missing. Ordering follows the BE `order` field. */
  protected readonly resolvedEssays = computed<readonly FailureEssay[]>(() => {
    const loc = this.locale();
    return this.raw().map((f) => {
      const contextEn = (f.context?.en ?? '').trim();
      const decisionEn = (f.decision?.en ?? '').trim();
      const consequenceEn = (f.consequence?.en ?? '').trim();
      const lessonEn = (f.lesson?.en ?? '').trim();

      const pick = (en: string, vi: string | undefined): string => (loc === 'vi' ? (vi ?? '').trim() || en : en);

      return {
        id: f.id,
        year: String(f.year),
        context: pick(contextEn, f.context?.vi),
        decision: pick(decisionEn, f.decision?.vi),
        consequence: pick(consequenceEn, f.consequence?.vi),
        lesson: pick(lessonEn, f.lesson?.vi),
      };
    });
  });

  protected readonly isEmpty = computed(() => this.resolvedEssays().length === 0);
}
