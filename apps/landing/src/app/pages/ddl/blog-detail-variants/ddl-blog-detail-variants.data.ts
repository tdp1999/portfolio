import type { LoadedPost } from './ddl-blog-detail-variants.types';

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
