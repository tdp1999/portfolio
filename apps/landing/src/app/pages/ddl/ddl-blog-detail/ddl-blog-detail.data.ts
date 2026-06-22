import type { DdlVariant } from '../ddl.types';
import type { LoadedPost } from './ddl-blog-detail.types';

// Decision record — this page is still EXPLORING the layout for `/blog/:slug`:
// three base layouts plus the V4 hybrid are on the board, none has won yet.
// No `selected`; each variant carries its trade-off as a `note`, so the widget
// tags them all "Candidate".
export const BLOG_DETAIL_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'v1',
    label: 'V1 — Editorial banner',
    note: 'Centered hero earns the first read; inline TOC sits below it on long posts and auto-hides on Notes. Anchored reading, but the largest header (~240-300px before prose).',
  },
  {
    id: 'v2',
    label: 'V2 — Dan minimal',
    note: 'Left-aligned title → date → straight to prose; no dek, no TOC, no banner. Cheapest layout (~80-100px hero), but no TOC makes long deep-dives hard to scan.',
  },
  {
    id: 'v3',
    label: 'V3 — Sticky meta rail',
    note: 'Two-column on desktop: prose left, sticky rail (TOC + meta + share) right. Best for desktop deep dives, but a non-trivial mobile collapse cost and looks empty on Notes.',
  },
  {
    id: 'v4',
    label: 'V4 — Center hero + floating far-right TOC',
    note: "V1's centered hero + V3's TOC floated off-container to the far right (≥1280px), collapsing to V1's inline block below. Richest, but the floating-TOC escape adds layout complexity.",
  },
];

export const EMPTY: LoadedPost = { post: null, rendered: { html: '', toc: [] } };
export const DEEP_DIVE_SLUG = 'seed-angular-ssr-transfer-cache';
export const NOTE_SLUG = 'seed-til-postgres-partial-unique-indexes';
export const ESSAY_SLUG = 'seed-design-system-before-screen';
export const RETRO_SLUG = 'seed-shipping-document-engine-console';

/** Minimum H2/H3 sections before a TOC is worth rendering. Below this the
 *  TOC is auto-hidden (it would show 1-2 entries and waste rail real estate).
 *  Replaces the earlier word-count threshold — section count is a better
 *  proxy for "this post benefits from a TOC". */
export const TOC_MIN_SECTIONS = 3;
