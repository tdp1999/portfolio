import type { SegmentOption, ViewToggleOption } from '@portfolio/landing/shared/ui';
import type { BlogPostListItem } from '@portfolio/landing/shared/data-access';

import type { DdlVariant } from '../ddl.types';

export const QUERY = { SEARCH: 'search', CATEGORY: 'category', SORT: 'sort', VIEW: 'view', PAGE: 'page' } as const;

// Decision record — this page is still EXPLORING: the live board is the three
// magazine-density featured-strip layouts, none crowned outright (a count-based
// V1+V3 hybrid is the working direction). No `selected`; each variant carries
// its trade-off as a `note`, so the widget tags them all "Candidate". The
// earlier morning A/B/C round + afternoon V1–V4 strip round are superseded and
// live under Historical (DdlConsidered), not in this candidate list.
export const BLOG_LIST_VARIANTS: readonly DdlVariant[] = [
  {
    id: 'v1-center-hero',
    label: 'V1 — Center hero + 4 side',
    note: 'Magazine-cover symmetry — center hero flanked by two cards each side. Strong hierarchy, but wastes the strip below ~5 featured posts (empty side slots feel apologetic). Working pick for 5+ posts.',
  },
  {
    id: 'v2-left-hero',
    label: 'V2 — Left hero + 4 right',
    note: 'Asymmetric editorial — split hero leads L→R into a 2×2 right grid. Natural reading rhythm, but the rigid grid frays when side-card titles vary wildly in length. Retained as historical record, not chosen.',
  },
  {
    id: 'v3-top-hero',
    label: 'V3 — Top hero + 6 archive',
    note: 'Density-forward — wide split hero over a 3×2 archive grid. Best when the featured pool is large and rotates fast; archive cards lose hierarchy with long titles. Working pick for 3–4 posts.',
  },
  {
    id: 'list-section',
    label: 'List section — reuses /projects pattern',
    note: 'Below the strip: results count · view toggle · filter pills · sort, plus a debounced search input. URL-driven, survives refresh + browser back — the verbatim /projects toolbar with search added.',
  },
];

export const VIEW_OPTIONS: readonly ViewToggleOption[] = [
  { id: 'row', label: 'Row', icon: 'list', description: 'List view — title + meta dominant.' },
  { id: 'grid', label: 'Grid', icon: 'layout-grid', description: 'Grid view — cover-dominant cards.' },
];

export const SORT_OPTIONS: readonly SegmentOption[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
];

// Strip showcase needs predictable counts to demonstrate each variant at its
// design target AND graceful degradation. Mock 7 deterministic featured posts
// with distinct Cloudinary covers so reviewers can see each magazine variant
// render at its intended shape (V1=5, V2=5, V3=7).
export const STRIP_COUNT_OPTIONS: readonly SegmentOption[] = [
  { id: '1', label: '1' },
  { id: '2', label: '2' },
  { id: '3', label: '3' },
  { id: '4', label: '4' },
  { id: '5', label: '5' },
  { id: '6', label: '6' },
  { id: '7', label: '7' },
];

export const MOCK_FEATURED_BASE: readonly BlogPostListItem[] = [
  {
    slug: 'mock-shipping-the-archive',
    title: 'Shipping the archive: a year of rebuilding the portfolio from scratch',
    excerpt:
      'What broke, what stayed, and what I would not do again. A deliberate post-mortem on the rewrite that took six months instead of six weeks.',
    language: 'EN',
    featured: true,
    featuredImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
    categories: [{ id: 'mock-eng', name: 'Engineering', slug: 'engineering' }],
    tags: [],
    readTimeMinutes: 12,
    publishedAt: '2026-05-20T09:00:00Z',
  },
  {
    slug: 'mock-design-before-the-screen',
    title: 'Design before the screen',
    excerpt: 'Three principles I keep coming back to when the Figma file is empty and the deadline is real.',
    language: 'EN',
    featured: true,
    featuredImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/mountain.jpg',
    categories: [{ id: 'mock-proc', name: 'Process', slug: 'process' }],
    tags: [],
    readTimeMinutes: 6,
    publishedAt: '2026-05-10T09:00:00Z',
  },
  {
    slug: 'mock-khi-nao-rxjs',
    title: 'Khi nào nên dùng RxJS, khi nào không',
    excerpt: 'Signals tới rồi. Đây là cách mình quyết định stream nào nên giữ, stream nào nên thay bằng signal.',
    language: 'VI',
    featured: true,
    featuredImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/woman.jpg',
    categories: [{ id: 'mock-eng', name: 'Engineering', slug: 'engineering' }],
    tags: [],
    readTimeMinutes: 8,
    publishedAt: '2026-04-22T09:00:00Z',
  },
  {
    slug: 'mock-til-postgres-partial-indexes',
    title: 'TIL: Postgres partial unique indexes break Prisma upsert',
    excerpt: 'A short note on why upsert silently inserted duplicates and what to use instead.',
    language: 'EN',
    featured: true,
    featuredImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/balloons.jpg',
    categories: [{ id: 'mock-notes', name: 'Notes', slug: 'notes' }],
    tags: [],
    readTimeMinutes: 3,
    publishedAt: '2026-04-05T09:00:00Z',
  },
  {
    slug: 'mock-essay-vi',
    title: 'Một năm viết code không có TypeScript',
    excerpt: 'Mình thử quay lại JavaScript thuần trong 12 tháng cho một dự án thử nghiệm. Đây là điều mình học được.',
    language: 'VI',
    featured: true,
    featuredImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/leaves.jpg',
    categories: [{ id: 'mock-ind', name: 'Industry', slug: 'industry' }],
    tags: [],
    readTimeMinutes: 9,
    publishedAt: '2026-03-12T09:00:00Z',
  },
  {
    slug: 'mock-guardrails-vi',
    title: 'Guardrails trong harness engineering là gì? Vì sao bạn nên quan tâm?',
    excerpt:
      'Lần này tui đào sâu vào một mảnh ghép cực kỳ quan trọng nhưng anh em hay xem nhẹ: guardrails khi AI agent chạm vào production database.',
    language: 'VI',
    featured: true,
    featuredImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/couple.jpg',
    categories: [{ id: 'mock-proc', name: 'Process', slug: 'process' }],
    tags: [],
    readTimeMinutes: 10,
    publishedAt: '2026-05-22T09:00:00Z',
  },
  {
    slug: 'mock-second-brain-en',
    title: 'Building an effective Second Brain — where to start',
    excerpt:
      'A field guide for the developer who reads twenty articles a day and remembers none. Capture, organize, distill, express.',
    language: 'EN',
    featured: true,
    featuredImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/bike.jpg',
    categories: [{ id: 'mock-proc', name: 'Process', slug: 'process' }],
    tags: [],
    readTimeMinutes: 7,
    publishedAt: '2026-02-18T09:00:00Z',
  },
];
