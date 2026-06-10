import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import {
  Container,
  Eyebrow,
  Input,
  Breadcrumb,
  EmptyState,
  FilterChip,
  Pagination,
  ResultsCount,
  ViewToggle,
  LandingLocaleService,
  Segmented,
  SectionRule,
  CloudinarySrcsetPipe,
  type BreadcrumbItem,
  type SegmentOption,
} from '@portfolio/landing/shared/ui';
import { BlogDataService, type BlogPostListItem } from '@portfolio/landing/shared/data-access';
import type { Tab, SortKey, ViewMode } from './ddl-blog-list-variants.types';
import {
  QUERY,
  VIEW_OPTIONS,
  SORT_OPTIONS,
  STRIP_COUNT_OPTIONS,
  MOCK_FEATURED_BASE,
} from './ddl-blog-list-variants.data';
import { timeAgo, dateMs } from './ddl-blog-list-variants.util';

@Component({
  selector: 'landing-ddl-blog-list-variants',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    UpperCasePipe,
    Container,
    Eyebrow,
    Input,
    Breadcrumb,
    EmptyState,
    FilterChip,
    Pagination,
    ResultsCount,
    ViewToggle,
    Segmented,
    SectionRule,
    CloudinarySrcsetPipe,
  ],
  templateUrl: './ddl-blog-list-variants.html',
  styleUrl: './ddl-blog-list-variants.scss',
})
export class DdlBlogListVariants {
  private readonly blogService = inject(BlogDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly localeService = inject(LandingLocaleService);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly response = toSignal(this.blogService.list({ limit: 50 }), {
    initialValue: { data: [], total: 0, page: 1, limit: 50 },
  });

  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Blog — list variants' }];
  readonly locale = this.localeService.locale;
  readonly viewOptions = VIEW_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;
  readonly pageSize = 10;
  readonly searchControl = new FormControl<string>(this.route.snapshot.queryParamMap.get(QUERY.SEARCH) ?? '', {
    nonNullable: true,
  });

  readonly posts = computed<readonly BlogPostListItem[]>(() => this.response().data);
  readonly searchTerm = toSignal(
    this.searchControl.valueChanges.pipe(
      startWith(this.searchControl.value),
      debounceTime(250),
      distinctUntilChanged()
    ),
    { initialValue: this.searchControl.value }
  );

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
  readonly v1Cap = 5;
  readonly v2Cap = 5;
  readonly v3Cap = 7;

  readonly featuredPosts = computed<readonly BlogPostListItem[]>(() => MOCK_FEATURED_BASE.slice(0, this.stripCount()));

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
  readonly v1Count = computed(() => (this.v1Hero() ? 1 : 0) + this.v1Left().length + this.v1Right().length);

  // V2: 1 left hero + N right cards. Right grid adapts via data-count.
  readonly v2Hero = computed(() => this.featuredPosts()[0] ?? null);
  readonly v2Side = computed(() => this.featuredPosts().slice(1, 5));
  readonly v2Count = computed(() => (this.v2Hero() ? 1 : 0) + this.v2Side().length);

  // V3: 1 top hero + N archive cards. Grid template adapts via data-count.
  readonly v3Hero = computed(() => this.featuredPosts()[0] ?? null);
  readonly v3Archive = computed(() => this.featuredPosts().slice(1, 7));
  readonly v3Count = computed(() => (this.v3Hero() ? 1 : 0) + this.v3Archive().length);

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

  // ─── Tab state ───────────────────────────────────────────────────
  readonly tab = signal<Tab>('showcase');
  readonly tabs: readonly SegmentOption[] = [
    { id: 'showcase', label: 'Showcase' },
    { id: 'prototypes', label: 'Prototypes' },
    { id: 'usage', label: 'Usage' },
  ];

  // ─── Historical (A/B/C) — Prototypes tab only ────────────────────
  readonly showHistorical = signal(false);

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

  setStripCount(value: string): void {
    const n = Number(value);
    this.stripCount.set(Number.isFinite(n) && n >= 1 && n <= 7 ? n : 5);
  }

  setTab(value: string): void {
    this.tab.set((value as Tab) ?? 'showcase');
  }

  toggleHistorical(): void {
    this.showHistorical.update((v) => !v);
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
}
