/**
 * Stable references to the deterministic blog seed (see
 * `apps/api/prisma/seeds/blog-posts.seed.ts`). Tests should rely on these
 * constants — never hard-code the slugs inline — so that re-naming a seeded
 * post in one place updates every spec.
 *
 * The seed runs from `global-setup.ts` on every test run and is idempotent;
 * existing rows are detected by slug and skipped, so these constants stay
 * valid across local + CI runs.
 */

export const BLOG_SLUGS = {
  // Engineering · EN · deep dive (~3000 words, multiple H2/H3 → TOC renders).
  DEEP_DIVE_SSR: 'seed-angular-ssr-transfer-cache',
  // Process · EN · retro essay (≥3 H2s → TOC renders).
  RETRO_CONSOLE: 'seed-shipping-document-engine-console',
  // Industry · VI · long essay (≥3 H2s).
  ESSAY_VI_DURABILITY: 'seed-cach-toi-do-cong-viec-ky-thuat',
  // Notes · EN · note category → TOC auto-hidden.
  NOTE_EN_POSTGRES: 'seed-til-postgres-partial-unique-indexes',
  // Notes · VI · note category → TOC auto-hidden.
  NOTE_VI_RXJS: 'seed-khi-nao-khong-dung-rxjs',
  // Industry · EN · only post flagged `featured: true` in the seed.
  FEATURED_DESIGN_SYSTEM: 'seed-design-system-before-screen',
} as const;

export const BLOG_TITLES = {
  DEEP_DIVE_SSR: 'Angular SSR Hydration: The Transfer-Cache Pattern',
  RETRO_CONSOLE: 'Retro: Shipping the Document Engine console rewrite',
  ESSAY_VI_DURABILITY: 'Cách tôi đo công việc kỹ thuật của mình',
  NOTE_EN_POSTGRES: 'TIL: Postgres partial unique indexes for soft delete',
  NOTE_VI_RXJS: 'Note: Khi nào không dùng RxJS',
  FEATURED_DESIGN_SYSTEM: 'Why I build the design system before the first screen',
} as const;

export const BLOG_CATEGORY_SLUGS = {
  ENGINEERING: 'engineering',
  PROCESS: 'process',
  INDUSTRY: 'industry',
  NOTES: 'notes',
} as const;

/** Page size used by `BlogListPage` (PAGE_SIZE constant in the component). */
export const LIST_PAGE_SIZE = 10;

/** Total seeded posts — keeps assertions in sync with the seed file. */
export const SEEDED_POST_COUNT = 6;

/**
 * Title fragments that uniquely identify seeded posts via the public search
 * endpoint (which filters on title+excerpt). The deep-dive, retro, and the VI
 * durability essay share titles with real posts in the dev DB, so do not use
 * their titles as search keys — slug remains unique and can be used for
 * direct navigation.
 */
export const UNIQUE_SEED_SEARCH = {
  NOTE_EN_POSTGRES: 'Postgres partial unique',
  NOTE_VI_RXJS: 'Khi nào không dùng RxJS',
  FEATURED_DESIGN_SYSTEM: 'design system before the first screen',
} as const;
