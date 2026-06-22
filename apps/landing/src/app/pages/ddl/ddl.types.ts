// ──────── Component-docs model (epic-ddl-component-docs) ─────────────────
//
// Lifecycle status doubles as the Reference/Lab separator:
//   Reference = shipped · Lab = decided + exploring · deprecated = hidden by default.
export type DdlStatus = 'shipped' | 'decided' | 'exploring' | 'deprecated';

// The scope-ladder taxonomy for the left sidebar (+ patterns as the guidance axis).
export type DdlGroupId = 'foundations' | 'components' | 'sections' | 'pages' | 'patterns';

// How wide a doc page asks the shell to make its content column.
//   prose → 768px (narrow readable measure; opt in for text-only pages)
//   wide  → 1120px (DEFAULT — see DdlDocPage.width; multi-column comparisons, galleries)
//   full  → spans everything right of the sidebar (reclaims the TOC column too);
//           the TOC is forced off. For genuinely full-bleed showcases.
export type DdlDocWidth = 'prose' | 'wide' | 'full';

// One entry per doc page. The single source of truth for the sidebar, badges,
// and the Reference/Lab filter. Replaces DDL_SECTIONS + DDL_SUBROUTES once the
// shell lands; additive for now.
export type DdlEntry = {
  readonly slug: string; // canonical route segment: 'button', 'hero', 'blog-detail'
  readonly title: string;
  readonly group: DdlGroupId;
  readonly status: DdlStatus;
  readonly summary: string; // one line for sidebar tooltip + page header
  readonly source?: string; // migration pointer: 'inline:#primitives' | 'route:/ddl/hero-variants'
};

export type DdlGroup = {
  readonly id: DdlGroupId;
  readonly label: string;
  readonly blurb: string;
};

// One per variant inside an exploration page. The standardized decision marker:
// `selected` + `decision` flag the winner; the rest collapse under "Considered".
export type DdlVariant = {
  readonly id: string; // 'alpha' | 'v2' | 'B'
  readonly label: string;
  readonly selected?: boolean;
  readonly decision?: string; // one-line rationale, only on the selected one
  readonly note?: string; // one-line "why not / trade-off", on a considered one
  readonly state?: 'considered' | 'rejected';
};
