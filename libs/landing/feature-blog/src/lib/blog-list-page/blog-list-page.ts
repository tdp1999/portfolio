import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import {
  ContainerComponent,
  InputComponent,
  LandingEmptyStateComponent,
  LandingFilterChipComponent,
  LandingLocaleService,
  LandingPageShellComponent,
  LandingPaginationComponent,
  LandingResultsCountComponent,
  LandingViewToggleComponent,
  SegmentedComponent,
  SectionRuleComponent,
  CloudinarySrcsetPipe,
  type BreadcrumbItem,
  type SegmentOption,
  type ViewToggleOption,
} from '@portfolio/landing/shared/ui';
import {
  BlogDataService,
  type BlogPostListItem,
  type BlogPostListResponse,
} from '@portfolio/landing/shared/data-access';

type SortKey = 'newest' | 'oldest';
type ViewMode = 'row' | 'grid';
type StripVariant = 'v1' | 'v3';

const QUERY = {
  SEARCH: 'search',
  CATEGORY: 'category',
  SORT: 'sort',
  VIEW: 'view',
  PAGE: 'page',
} as const;

const PAGE_SIZE = 10;
/** ADR-018: featured strip caps at 5 (V1 asymmetric). Excess hidden. */
const FEATURED_CAP = 5;
/** ADR-018: 3-4 featured → V3 mosaic · 5+ → V1 asymmetric. */
const V1_THRESHOLD = 5;
/** Generous one-shot fetch; archive paginates client-side from this set. */
const FETCH_LIMIT = 50;

const VIEW_OPTIONS: readonly ViewToggleOption[] = [
  { id: 'row', label: 'Row', icon: 'list', description: 'List view — title + meta dominant.' },
  { id: 'grid', label: 'Grid', icon: 'layout-grid', description: 'Grid view — cover-dominant cards.' },
];

const SORT_OPTIONS: readonly SegmentOption[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
];

const EMPTY_RESPONSE: BlogPostListResponse = {
  data: [],
  total: 0,
  page: 1,
  limit: FETCH_LIMIT,
};

/**
 * Locale-aware "time ago" formatter via `Intl.RelativeTimeFormat`.
 * Falls back to "—" if the date is unparseable. Reads largest non-zero
 * unit (year → month → week → day → hour → minute), else "just now".
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
    if (abs >= sec) return rtf.format(Math.round(deltaSec / sec), unit);
  }
  return rtf.format(0, 'second');
}

function dateMs(iso: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

@Component({
  selector: 'landing-blog-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    UpperCasePipe,
    ContainerComponent,
    InputComponent,
    LandingEmptyStateComponent,
    LandingFilterChipComponent,
    LandingPageShellComponent,
    LandingPaginationComponent,
    LandingResultsCountComponent,
    LandingViewToggleComponent,
    SegmentedComponent,
    SectionRuleComponent,
    CloudinarySrcsetPipe,
  ],
  templateUrl: './blog-list-page.html',
  styleUrl: './blog-list-page.scss',
})
export class BlogListPage {
  private readonly blogService = inject(BlogDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly localeService = inject(LandingLocaleService);

  readonly locale = this.localeService.locale;

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Writing' }];

  readonly viewOptions = VIEW_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;
  readonly pageSize = PAGE_SIZE;

  // ─── Data (single fetch, generous limit) ─────────────────────────
  // ADR-018: featured strip + archive both read from this in-memory set.
  // Until a dedicated `featured` filter ships on the BE list query, this
  // is the simplest correct approach (seed has ~6 posts; cap at 50 leaves
  // generous headroom). SSR transfer cache captures the initial response.
  private readonly response = toSignal(this.blogService.list({ limit: FETCH_LIMIT }), {
    initialValue: EMPTY_RESPONSE,
  });
  readonly allPosts = computed<readonly BlogPostListItem[]>(() => this.response().data);

  // ─── URL-driven archive state ────────────────────────────────────
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

  readonly selectedCategory = computed<string | null>(() => this.queryParams().get(QUERY.CATEGORY));
  readonly sortKey = computed<SortKey>(() => (this.queryParams().get(QUERY.SORT) === 'oldest' ? 'oldest' : 'newest'));
  readonly viewMode = computed<ViewMode>(() => (this.queryParams().get(QUERY.VIEW) === 'grid' ? 'grid' : 'row'));
  readonly currentPage = computed<number>(() => {
    const raw = Number(this.queryParams().get(QUERY.PAGE));
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  });

  constructor() {
    this.title.setTitle('Writing | Phuong Tran');
    this.meta.updateTag({
      name: 'description',
      content: 'Long-form deep-dives, short notes, and the occasional retro from building this portfolio.',
    });

    const destroyRef = inject(DestroyRef);
    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(destroyRef))
      .subscribe((v) => {
        const trimmed = v.trim();
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            [QUERY.SEARCH]: trimmed.length === 0 ? null : trimmed,
            [QUERY.PAGE]: null,
          },
          queryParamsHandling: 'merge',
        });
      });
  }

  // ─── Featured strip (V1+V3 hybrid per ADR-018) ──────────────────
  readonly featuredPosts = computed<readonly BlogPostListItem[]>(() =>
    this.allPosts()
      .filter((p) => p.featured)
      .slice(0, FEATURED_CAP)
  );
  readonly featuredCount = computed(() => this.featuredPosts().length);
  /**
   * ADR-018: 3-4 featured → V3 mosaic · 5+ → V1 asymmetric.
   * 1-2 featured falls into V3 — its `data-count` rules already collapse
   * the archive grid sensibly (1 col @ count=1, 2 cols @ count=2).
   * 0 featured → strip hidden entirely.
   */
  readonly stripVariant = computed<StripVariant | null>(() => {
    const n = this.featuredCount();
    if (n === 0) return null;
    return n >= V1_THRESHOLD ? 'v1' : 'v3';
  });

  // V1 split: hero + 2 left + 2 right (at n=5).
  readonly v1Hero = computed<BlogPostListItem | null>(() => this.featuredPosts()[0] ?? null);
  readonly v1Left = computed<readonly BlogPostListItem[]>(() => this.featuredPosts().slice(1, 3));
  readonly v1Right = computed<readonly BlogPostListItem[]>(() => this.featuredPosts().slice(3, 5));

  // V3 split: top hero + archive (1-3 cards under).
  readonly v3Hero = computed<BlogPostListItem | null>(() => this.featuredPosts()[0] ?? null);
  readonly v3Archive = computed<readonly BlogPostListItem[]>(() => this.featuredPosts().slice(1));

  // ─── Archive pipeline (client-side from the same in-memory set) ──
  private readonly filtered = computed<readonly BlogPostListItem[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const cat = this.selectedCategory();
    let list = this.allPosts();
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

  readonly availableCategories = computed(() => {
    const map = new Map<string, { slug: string; name: string }>();
    for (const p of this.allPosts()) {
      for (const c of p.categories) {
        if (!map.has(c.slug)) map.set(c.slug, { slug: c.slug, name: c.name });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  });

  // ─── Template helpers ────────────────────────────────────────────
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
  clearFilters(): void {
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
}
