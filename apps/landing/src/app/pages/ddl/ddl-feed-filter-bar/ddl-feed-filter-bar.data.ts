import type { DdlVariant } from '../ddl.types';

// Decision record — this page is still EXPLORING: four filter-bar UX strategies
// on the same filter set (year · status · stack) are on the board. V1 is fully
// wired; V2–V4 are visual mocks. No `selected` yet — each strategy carries its
// trade-off as a `note`, so the widget tags them all "Candidate". The inline
// marks (🟢 / 💡 / ⚠) encode the sentiment.
export const FEED_FILTER_BAR_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'v1',
    label: 'V1 — chip-row inline (collapsed by default)',
    note: '🟢 recommend — "Filters" toggle reveals chip groups. Multi-select OR within group, AND across groups, with an active count on the toggle. Most affordance-visible and matches the editorial voice. Fully wired.',
  },
  {
    id: 'v2',
    label: 'V2 — dropdown-per-facet (Linear style)',
    note: '💡 candidate — compact single row of facet buttons that open option dropdowns. Add only if V1 visibly clutters on mobile; affordance is hidden until the user clicks each facet.',
  },
  {
    id: 'v3',
    label: 'V3 — sidebar facets (Algolia / Shopify style)',
    note: '⚠ not recommended — built for e-commerce with 50+ facets; overkill for < 20 projects. Steals 240px of content width and forces a separate mobile sheet drawer.',
  },
  {
    id: 'v4',
    label: 'V4 — search + auto-chips',
    note: '💡 candidate — single search input suggests chips as you type. Strong power-user UX but no visible affordance until typed — poor for first-time visitors.',
  },
];
