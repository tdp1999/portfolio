import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import {
  ContainerComponent,
  EyebrowComponent,
  InputComponent,
  LandingBreadcrumbComponent,
  LandingEmptyStateComponent,
  LandingFilterChipComponent,
  LandingPaginationComponent,
  LandingResultsCountComponent,
  LandingViewToggleComponent,
  LandingLocaleService,
  SegmentedComponent,
  SectionRuleComponent,
  CloudinarySrcsetPipe,
  type BreadcrumbItem,
  type SegmentOption,
  type ViewToggleOption,
} from '@portfolio/landing/shared/ui';
import { BlogDataService, type BlogPostListItem } from '@portfolio/landing/shared/data-access';

type Tab = 'showcase' | 'prototypes' | 'usage';
type SortKey = 'newest' | 'oldest';
type ViewMode = 'row' | 'grid';

const QUERY = { SEARCH: 'search', CATEGORY: 'category', SORT: 'sort', VIEW: 'view', PAGE: 'page' } as const;

const VIEW_OPTIONS: readonly ViewToggleOption[] = [
  { id: 'row', label: 'Row', icon: 'list', description: 'List view — title + meta dominant.' },
  { id: 'grid', label: 'Grid', icon: 'layout-grid', description: 'Grid view — cover-dominant cards.' },
];

const SORT_OPTIONS: readonly SegmentOption[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
];

// Strip showcase needs predictable counts to demonstrate each variant at its
// design target AND graceful degradation. Mock 7 deterministic featured posts
// with distinct Cloudinary covers so reviewers can see each magazine variant
// render at its intended shape (V1=5, V2=5, V3=7).
const STRIP_COUNT_OPTIONS: readonly SegmentOption[] = [
  { id: '1', label: '1' },
  { id: '2', label: '2' },
  { id: '3', label: '3' },
  { id: '4', label: '4' },
  { id: '5', label: '5' },
  { id: '6', label: '6' },
  { id: '7', label: '7' },
];

const MOCK_FEATURED_BASE: readonly BlogPostListItem[] = [
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

/**
 * Locale-aware "time ago" formatter via `Intl.RelativeTimeFormat`.
 * Falls back to "—" if the date is unparseable. Reads largest non-zero
 * unit (year → month → week → day → hour → minute), else "just now".
 * Kept local — if a second consumer appears, graduate to a shared pipe.
 */
function timeAgo(iso: string | null, locale: 'en' | 'vi'): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '—';
  const deltaSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(deltaSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const units: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];
  for (const [unit, sec] of units) {
    if (abs >= sec) {
      return rtf.format(Math.round(deltaSec / sec), unit);
    }
  }
  return rtf.format(0, 'second');
}

@Component({
  selector: 'landing-blog-list-variants-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    UpperCasePipe,
    ContainerComponent,
    EyebrowComponent,
    InputComponent,
    LandingBreadcrumbComponent,
    LandingEmptyStateComponent,
    LandingFilterChipComponent,
    LandingPaginationComponent,
    LandingResultsCountComponent,
    LandingViewToggleComponent,
    SegmentedComponent,
    SectionRuleComponent,
    CloudinarySrcsetPipe,
  ],
  templateUrl: './blog-list-variants.page.html',
  styleUrl: './blog-list-variants.page.scss',
})
export class BlogListVariantsPage {
  private readonly blogService = inject(BlogDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly localeService = inject(LandingLocaleService);
  readonly locale = this.localeService.locale;

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Blog — list variants' }];

  readonly viewOptions = VIEW_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;
  readonly pageSize = 10;

  // Pulled once with generous limit — DDL operates on the seeded dataset.
  // Production /blog will paginate server-side and rely on task 358 for search.
  private readonly response = toSignal(this.blogService.list({ limit: 50 }), {
    initialValue: { data: [], total: 0, page: 1, limit: 50 },
  });
  readonly posts = computed<readonly BlogPostListItem[]>(() => this.response().data);

  // ─── URL-driven state for the LIST section ───────────────────────
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly searchControl = new FormControl<string>(this.route.snapshot.queryParamMap.get(QUERY.SEARCH) ?? '', {
    nonNullable: true,
  });
  readonly searchTerm = toSignal(
    this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(250),
      distinctUntilChanged()
    ),
    { initialValue: this.searchControl.value }
  );

  constructor() {
    // Sync the debounced search term back to the URL so it survives refresh /
    // back-forward navigation. Reset to page 1 on every change.
    const destroyRef = inject(DestroyRef);
    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(destroyRef))
      .subscribe((v) => {
        const trimmed = v.trim();
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { [QUERY.SEARCH]: trimmed.length === 0 ? null : trimmed, [QUERY.PAGE]: null },
          queryParamsHandling: 'merge',
        });
      });
  }
  readonly selectedCategory = computed<string | null>(() => this.queryParams().get(QUERY.CATEGORY));
  readonly sortKey = computed<SortKey>(() => {
    const raw = this.queryParams().get(QUERY.SORT);
    return raw === 'oldest' ? 'oldest' : 'newest';
  });
  readonly viewMode = computed<ViewMode>(() => {
    const raw = this.queryParams().get(QUERY.VIEW);
    return raw === 'grid' ? 'grid' : 'row';
  });
  readonly currentPage = computed<number>(() => {
    const raw = Number(this.queryParams().get(QUERY.PAGE));
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  });

  // ─── Featured strip data (magazine variants V1-V3) ────────────────
  // Three magazine layouts with different hero placement + side card count.
  // Predictable mock dataset (7 posts) so reviewers can toggle counts and
  // see each variant at its target shape + degradation.
  //   V1 — Center hero + 4 sides (5 total): symmetric magazine cover
  //   V2 — Left hero + 4 right (5 total): asymmetric editorial
  //   V3 — Top wide hero + 6 archive grid (7 total): density-forward
  readonly stripCount = signal<number>(5);
  readonly stripCountOptions = STRIP_COUNT_OPTIONS;
  readonly featuredPosts = computed<readonly BlogPostListItem[]>(() => MOCK_FEATURED_BASE.slice(0, this.stripCount()));

  setStripCount(value: string): void {
    const n = Number(value);
    this.stripCount.set(Number.isFinite(n) && n >= 1 && n <= 7 ? n : 5);
  }

  // Default to 5 — most variants render at their target there.

  // V1: 1 center hero + adaptive left/right balance.
  //   count=1: hero only
  //   count=2: hero + 1 right
  //   count=3: hero + 1 left + 1 right (symmetric)
  //   count=4: hero + 1 left + 2 right (asymmetric)
  //   count>=5: hero + 2 left + 2 right (full)
  readonly v1Hero = computed(() => this.featuredPosts()[0] ?? null);
  readonly v1Left = computed(() => {
    const posts = this.featuredPosts();
    const n = posts.length;
    if (n >= 5) return posts.slice(1, 3);
    if (n === 3) return posts.slice(1, 2);
    return [];
  });
  readonly v1Right = computed(() => {
    const posts = this.featuredPosts();
    const n = posts.length;
    if (n >= 5) return posts.slice(3, 5);
    // count=4: dump all 3 supporting cards into the right column so they
    // stack evenly under a 2-col layout (hero on left, 3 stacked right).
    if (n === 4) return posts.slice(1, 4);
    if (n === 3) return posts.slice(2, 3);
    if (n === 2) return posts.slice(1, 2);
    return [];
  });

  // V2: 1 left hero + N right cards. Right grid adapts via data-count.
  readonly v2Hero = computed(() => this.featuredPosts()[0] ?? null);
  readonly v2Side = computed(() => this.featuredPosts().slice(1, 5));

  // V3: 1 top hero + N archive cards. Grid template adapts via data-count.
  readonly v3Hero = computed(() => this.featuredPosts()[0] ?? null);
  readonly v3Archive = computed(() => this.featuredPosts().slice(1, 7));

  readonly v1Count = computed(() => (this.v1Hero() ? 1 : 0) + this.v1Left().length + this.v1Right().length);
  readonly v2Count = computed(() => (this.v2Hero() ? 1 : 0) + this.v2Side().length);
  readonly v3Count = computed(() => (this.v3Hero() ? 1 : 0) + this.v3Archive().length);
  readonly v1Cap = 5;
  readonly v2Cap = 5;
  readonly v3Cap = 7;

  // ─── List section pipeline (search → category → sort → page) ─────
  // Search is client-side here (DDL sandbox). Production will hit BE via
  // BlogDataService.list({ search }) once task 358 ships — same shape.
  private readonly filtered = computed<readonly BlogPostListItem[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const cat = this.selectedCategory();
    let list = this.posts();
    if (term) {
      list = list.filter(
        (p) => p.title.toLowerCase().includes(term) || (p.excerpt?.toLowerCase().includes(term) ?? false)
      );
    }
    if (cat) {
      list = list.filter((p) => p.categories.some((c) => c.slug === cat));
    }
    const dir = this.sortKey() === 'oldest' ? 1 : -1;
    return [...list].sort((a, b) => dir * (dateMs(a.publishedAt) - dateMs(b.publishedAt)));
  });

  readonly totalCount = computed(() => this.filtered().length);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));
  readonly visiblePosts = computed<readonly BlogPostListItem[]>(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });
  readonly visibleCount = computed(() => this.visiblePosts().length);

  // Categories present in the loaded dataset — drives the filter pills.
  // Sorted by name asc so the pill order is stable across renders.
  readonly availableCategories = computed(() => {
    const map = new Map<string, { slug: string; name: string }>();
    for (const p of this.posts()) {
      for (const c of p.categories) {
        if (!map.has(c.slug)) map.set(c.slug, { slug: c.slug, name: c.name });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  });

  // ─── Template helpers ─────────────────────────────────────────────
  timeAgo(post: BlogPostListItem): string {
    return timeAgo(post.publishedAt, this.locale());
  }
  primaryCategory(post: BlogPostListItem): string | null {
    return post.categories[0]?.name ?? null;
  }

  // ─── Mutators → URL ──────────────────────────────────────────────
  setCategory(slug: string | null): void {
    this.writeQuery(QUERY.CATEGORY, slug);
    this.writeQuery(QUERY.PAGE, null);
  }
  setSort(value: string): void {
    const next: SortKey = value === 'oldest' ? 'oldest' : 'newest';
    this.writeQuery(QUERY.SORT, next === 'newest' ? null : next);
    this.writeQuery(QUERY.PAGE, null);
  }
  setView(value: string): void {
    const next: ViewMode = value === 'grid' ? 'grid' : 'row';
    this.writeQuery(QUERY.VIEW, next === 'row' ? null : next);
  }
  setPage(page: number): void {
    this.writeQuery(QUERY.PAGE, page <= 1 ? null : String(page));
  }
  clearListFilters(): void {
    this.searchControl.setValue('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        [QUERY.SEARCH]: null,
        [QUERY.CATEGORY]: null,
        [QUERY.SORT]: null,
        [QUERY.PAGE]: null,
      },
      queryParamsHandling: 'merge',
    });
  }

  private writeQuery(key: string, value: string | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: value },
      queryParamsHandling: 'merge',
    });
  }

  // ─── Tab state ───────────────────────────────────────────────────
  readonly tab = signal<Tab>('showcase');
  readonly tabs: readonly SegmentOption[] = [
    { id: 'showcase', label: 'Showcase' },
    { id: 'prototypes', label: 'Prototypes' },
    { id: 'usage', label: 'Usage' },
  ];
  setTab(value: string): void {
    this.tab.set((value as Tab) ?? 'showcase');
  }

  // ─── Historical (A/B/C) — Prototypes tab only ────────────────────
  readonly showHistorical = signal(false);
  toggleHistorical(): void {
    this.showHistorical.update((v) => !v);
  }
}

function dateMs(iso: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}
