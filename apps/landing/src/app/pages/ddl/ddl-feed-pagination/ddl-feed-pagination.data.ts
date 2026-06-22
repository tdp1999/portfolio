import type { DdlVariant } from '../ddl.types';

// Decision record — this page is still EXPLORING: three pagination strategies
// for any feed/index page are on the board, none has won outright (the pick
// depends on item count). No `selected`; each strategy carries its trade-off as
// a `note`, so the widget tags them all "Candidate".
export const FEED_PAGINATION_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'v1',
    label: 'V1 — render-all (no pagination)',
    note: '🟢 recommend while < ~12 projects. No extra UI, scroll is the affordance, SSR prerenders the whole list, footer always reachable. Switch to load-more once count crosses ~12.',
  },
  {
    id: 'v2',
    label: 'V2 — load-more',
    note: '💡 fallback once count > 12. Single bottom button keeps the footer reachable, back-from-detail keeps position, SSR ships the first chunk. Avoid infinite-scroll — it buries the footer.',
  },
  {
    id: 'v3',
    label: 'V3 — paged (Page 1 of N)',
    note: '⚠ do not ship at portfolio scale. Built for 100+ item catalogs where users jump pages; breaks scroll position on each click and needs canonical URLs per page for SEO.',
  },
];
