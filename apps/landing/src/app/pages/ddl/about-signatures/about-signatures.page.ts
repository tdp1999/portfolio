import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingBreadcrumbComponent,
  LandingLocaleService,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import { SkillService } from '@portfolio/landing/shared/data-access';
import { DepthMapV1Component } from './depth-map-v1/depth-map-v1.component';
import { DepthMapV2Component } from './depth-map-v2/depth-map-v2.component';
import { DepthMapV3Component } from './depth-map-v3/depth-map-v3.component';
import { FailuresV2Component } from './failures-v2/failures-v2.component';
import { FailuresV3Component } from './failures-v3/failures-v3.component';
import { LandingAboutFailuresComponent, getFailureEssays } from '@portfolio/landing/feature-about';
import { CurrentlyShippingV1Component } from './currently-shipping-v1/currently-shipping-v1.component';
import { CurrentlyShippingV2Component } from './currently-shipping-v2/currently-shipping-v2.component';
import { CurrentlyShippingV3Component } from './currently-shipping-v3/currently-shipping-v3.component';
import { getNowEntry } from './now-mock';

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

type VariantMeta = {
  readonly label: string;
  readonly hint: string;
  readonly picked?: boolean;
};

const DEPTH_MAP_VARIANTS: readonly VariantMeta[] = [
  {
    label: 'Variant 1 · Tiered grid',
    hint: 'Three labeled rows; Daily dominates with name + 1-line rationale per item, Frequent + Shipped collapse to chips at decreasing prominence. Clearest read of "depth vs breadth."',
  },
  {
    label: 'Variant 2 · Concentric rings',
    hint: 'SVG three-ring polar layout; tools positioned evenly per tier (Daily inner, Frequent mid, Shipped outer). Rationale lives in a footnote list under the ring so the visualization stays legible.',
  },
  {
    label: 'Variant 3 · Constellation',
    hint: 'Daily tools as anchored "stars" — labeled cards with rationale, joined to a pivot by an accent rule. Frequent + Shipped cluster below as smaller pills and a mono row. Editorial voice.',
  },
];

const FAILURES_VARIANTS: readonly VariantMeta[] = [
  {
    label: 'Variant 1 · Three-column cards',
    hint: 'Equal-height bordered cards side-by-side; each has labeled Decision / Consequence / Lesson sections. Dense + scannable — all three failures fit one viewport on desktop. Collapses to single column < 1024px.',
    picked: true,
  },
  {
    label: 'Variant 2 · Numbered editorial',
    hint: 'Stacked vertical, mono numbers on a left rail, italic-display heading taken from the decision, lesson as a separated footer line. Reads like a journal — slower pace, more breathing room.',
  },
  {
    label: 'Variant 3 · Prose with pull-quote lesson',
    hint: 'Stacked editorial vignettes; decision + consequence flow as paragraphs, the lesson elevates to a large italic pull-quote with accent rule. The takeaway is what sticks; V3 makes that visible.',
  },
];

const CURRENTLY_SHIPPING_VARIANTS: readonly VariantMeta[] = [
  {
    label: 'Variant 1 · Status strip',
    hint: 'Four labeled rows (Building / Writing / Learning / Last shipped) with values, mono "Last updated" + `See /now →` footer. Most scannable; reads like a status board. Best when values stay ≤ 2 lines.',
  },
  {
    label: 'Variant 2 · Card with prose',
    hint: 'Bordered card; the four fields flow as labeled prose paragraphs ("Right now I\'m building X. Writing Y. Learning Z..."). Narrative voice over status-board scan — reads warmer.',
  },
  {
    label: 'Variant 3 · Terminal-styled',
    hint: 'Monospace pseudo-terminal block (`$ now`, `· building → X`). Strong craft signal; polarizing — HR persona may bounce off the affectation. No real interactivity.',
  },
];

@Component({
  selector: 'landing-ddl-about-signatures-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ContainerComponent,
    EyebrowComponent,
    LandingBreadcrumbComponent,
    DepthMapV1Component,
    DepthMapV2Component,
    DepthMapV3Component,
    LandingAboutFailuresComponent,
    FailuresV2Component,
    FailuresV3Component,
    CurrentlyShippingV1Component,
    CurrentlyShippingV2Component,
    CurrentlyShippingV3Component,
  ],
  templateUrl: './about-signatures.page.html',
  styleUrl: './about-signatures.page.scss',
})
export class DdlAboutSignaturesPage {
  private readonly skillService = inject(SkillService);
  private readonly locale = inject(LandingLocaleService).locale;

  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'About — signature sections' },
  ];

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
  readonly failureEssays = computed(() => getFailureEssays(this.locale()));
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

  readonly tocItems = [this.depthMapTocItem, this.failuresTocItem, this.currentlyShippingTocItem] as const;
}
