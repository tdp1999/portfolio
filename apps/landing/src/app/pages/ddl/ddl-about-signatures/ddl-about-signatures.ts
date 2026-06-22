import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LandingLocaleService } from '@portfolio/landing/shared/ui';
import { FailureService, SkillService, type PublicAboutFailure } from '@portfolio/landing/shared/data-access';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlStage } from '../ddl-stage/ddl-stage';
import { DdlDepthMapV1 } from '../about-signatures/ddl-depth-map.v1/ddl-depth-map.v1';
import { DdlDepthMapV2 } from '../about-signatures/ddl-depth-map.v2/ddl-depth-map.v2';
import { DdlDepthMapV3 } from '../about-signatures/ddl-depth-map.v3/ddl-depth-map.v3';
import { DdlFailuresV2 } from '../about-signatures/ddl-failures.v2/ddl-failures.v2';
import { DdlFailuresV3 } from '../about-signatures/ddl-failures.v3/ddl-failures.v3';
import type { FailureEssay } from '@portfolio/landing/feature-about';
// DDL sandbox renders the real graduated `AboutFailures` (V1) component to keep the showcase
// faithful to production. feature-about is lazy-loaded at /about; this DDL-only page pulls it
// eagerly by design. A clean fix would re-export AboutFailures from a non-lazy entry point
// (lib restructure) — deferred. Scoped disable, not an allow-list change.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { AboutFailures } from '@portfolio/landing/feature-about';
import { DdlCurrentlyShippingV1 } from '../about-signatures/ddl-currently-shipping.v1/ddl-currently-shipping.v1';
import { DdlCurrentlyShippingV2 } from '../about-signatures/ddl-currently-shipping.v2/ddl-currently-shipping.v2';
import { DdlCurrentlyShippingV3 } from '../about-signatures/ddl-currently-shipping.v3/ddl-currently-shipping.v3';
import { getNowEntry } from '../about-signatures/now-mock';
import {
  ABOUT_SIGNATURES_VARIANTS,
  DEPTH_MAP_VARIANTS,
  FAILURES_VARIANTS,
  CURRENTLY_SHIPPING_VARIANTS,
} from './ddl-about-signatures.data';

/**
 * /ddl/about-signatures — staging ground for the /about signature elements.
 *
 *   §1 · Depth map           — DROPPED 2026-05-22 (duplicated home §04 Stack).
 *   §2 · Failures & lessons  — POPULATED (task 335) — V1 picked.
 *   §3 · Currently shipping  — DROPPED 2026-05-22 (duplicated /now page).
 *
 * Only failures graduates to /about (task 337). Depth-map + currently-shipping
 * V1/V2/V3 sandboxes stay as historical record per the
 * "DDL pages stay after graduation" rule.
 */

@Component({
  selector: 'landing-ddl-about-signatures',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DdlDocPage,
    DdlSection,
    DdlDecisionRecord,
    DdlStage,
    DdlDepthMapV1,
    DdlDepthMapV2,
    DdlDepthMapV3,
    AboutFailures,
    DdlFailuresV2,
    DdlFailuresV3,
    DdlCurrentlyShippingV1,
    DdlCurrentlyShippingV2,
    DdlCurrentlyShippingV3,
  ],
  templateUrl: './ddl-about-signatures.html',
  styleUrl: './ddl-about-signatures.scss',
})
export class DdlAboutSignatures {
  private readonly skillService = inject(SkillService);
  private readonly failureService = inject(FailureService);
  private readonly locale = inject(LandingLocaleService).locale;

  private readonly failureRows = toSignal(this.failureService.getPublicFailures(), {
    initialValue: [] as readonly PublicAboutFailure[],
  });

  // Decision record — three /about elements explored here, no page-wide winner.
  readonly variants = ABOUT_SIGNATURES_VARIANTS;

  // ─── §01 · Depth map (DROPPED, sandbox kept) ───
  readonly tierGroups = toSignal(this.skillService.getSkillsByTier(), { initialValue: [] });
  readonly depthMapVariants = DEPTH_MAP_VARIANTS;
  readonly depthMapTocItem = { id: 'depth-map', num: '01', title: 'Depth map' } as const;
  /** DROPPED 2026-05-22 — all three variants duplicate the home §04 "The Stack"
   *  surface; visitor scrolling / → /about saw the same chips twice. The intended
   *  differentiator (per-Daily rationale) couldn't carry the section because
   *  `Skill.proficiencyNote` is null on most rows AND single-language. Sandbox
   *  retained as historical record per "DDL pages stay after graduation". */
  readonly depthMapWinner: string = 'DROPPED — duplicates home §04 The Stack (2026-05-22)';
  readonly depthMapSummary =
    'Originally a compact visual of expertise depth (Daily / Frequent / Shipped tiers). Section removed from /about IA — the home §04 Stack already covers this with the same data; per-Daily rationale was too thin to justify a second surface. Three variants kept below as a historical sandbox.';
  readonly depthMapQuestion = 'Resolved by removal — no further variants needed.';

  // ─── §02 · Failures & lessons ───
  /** Localized failure essays — same source-of-truth as the V1 component
   *  consumes internally (`FailureService`). Page projects to `FailureEssay`
   *  here so V2 + V3 receive the same data shape as V1 renders, keeping all
   *  three variants in sync after the task 345 service swap. */
  readonly failureEssays = computed<readonly FailureEssay[]>(() => {
    const loc = this.locale();
    return this.failureRows().map((f) => {
      const pick = (en: string | undefined, vi: string | undefined): string => {
        const enT = (en ?? '').trim();
        return loc === 'vi' ? (vi ?? '').trim() || enT : enT;
      };
      return {
        id: f.id,
        year: String(f.year),
        context: pick(f.context?.en, f.context?.vi),
        decision: pick(f.decision?.en, f.decision?.vi),
        consequence: pick(f.consequence?.en, f.consequence?.vi),
        lesson: pick(f.lesson?.en, f.lesson?.vi),
      };
    });
  });
  readonly failuresVariants = FAILURES_VARIANTS;
  readonly failuresTocItem = { id: 'failures', num: '02', title: 'Failures & lessons' } as const;
  readonly failuresWinner: string = 'Variant 1 · Three-column cards — graduated to /about 2026-05-22';
  readonly failuresSummary =
    'Three short anonymized clinical-toned essays (year · context · decision · consequence · lesson). Signals seniority via willingness to publish the unglamorous; clinical tone keeps it from sliding into performative humility. Placeholder essays loaded inline — real content lands in task 340.';
  readonly failuresQuote =
    'Which layout makes a 150-word essay land cleanly without burying the lesson — equal-weight scan, journal cadence, or pull-quote takeaway?';

  // ─── §03 · Currently shipping (DROPPED, sandbox kept) ───
  readonly nowEntry = computed(() => getNowEntry(this.locale()));
  readonly currentlyShippingVariants = CURRENTLY_SHIPPING_VARIANTS;
  readonly currentlyShippingTocItem = { id: 'currently-shipping', num: '03', title: 'Currently shipping' } as const;
  /** DROPPED 2026-05-22 — duplicated the standalone `/now` page (same 4-field
   *  data, same render shape). /now is the canonical surface for external
   *  traffic (LinkedIn bio, RSS, Sivers /now community). /about may later add
   *  a 1-line bridge in the hero meta strip — not a full section. Sandbox
   *  retained as historical record per "DDL pages stay after graduation". */
  readonly currentlyShippingWinner: string = 'DROPPED — duplicates /now page (2026-05-22)';
  readonly currentlyShippingSummary =
    'Originally a 4-field teaser pulling from /now data with a "See /now →" link. Section removed from /about IA — /now is already the canonical surface for this content and the teaser added no information density beyond a link click. Three variants kept below as a historical sandbox.';
  readonly currentlyShippingQuestion = 'Resolved by removal — no further variants needed.';
}
