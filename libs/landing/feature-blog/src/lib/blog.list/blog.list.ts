import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { BehaviorSubject, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import {
  Container,
  Input,
  EmptyState,
  FilterChip,
  LoadingSpinner,
  LandingLocaleService,
  PageShell,
  Pagination,
  ResultsCount,
  ViewToggle,
  Segmented,
  SectionRule,
  Carousel,
  CarouselSlide,
  CloudinarySrcsetPipe,
  UmamiEventDirective,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import { BreakpointObserverService } from '@portfolio/shared/features/breakpoint-observer';
import { LandingUrlStateService } from '@portfolio/landing/shared/util';
import { BlogDataService, type BlogPostCategory, type BlogPostListItem } from '@portfolio/landing/shared/data-access';
import { asyncResource } from '@portfolio/shared/async-state';
import type { SortKey, ViewMode, StripVariant } from './blog.list.types';
import {
  QUERY,
  PAGE_SIZE,
  FEATURED_CAP,
  V1_THRESHOLD,
  STRIP_MIN,
  SEARCH_DEBOUNCE_MS,
  VIEW_OPTIONS,
  SORT_OPTIONS,
  EMPTY_RESPONSE,
} from './blog.list.data';
import { timeAgo, parsePageParam } from './blog.list.util';

@Component({
  selector: 'landing-blog-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgTemplateOutlet,
    UpperCasePipe,
    Container,
    Input,
    EmptyState,
    FilterChip,
    LoadingSpinner,
    PageShell,
    Pagination,
    ResultsCount,
    ViewToggle,
    Segmented,
    SectionRule,
    Carousel,
    CarouselSlide,
    CloudinarySrcsetPipe,
    UmamiEventDirective,
  ],
  templateUrl: './blog.list.html',
  styleUrl: './blog.list.scss',
})
export class BlogList {
  private readonly blogService = inject(BlogDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly urlState = inject(LandingUrlStateService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly localeService = inject(LandingLocaleService);
  private readonly breakpoint = inject(BreakpointObserverService);

  readonly locale = this.localeService.locale;
  /**
   * Below `laptop` (mobile + tablet) the featured strip keeps its lead hero but
   * swaps the stacked secondary cards for a swipeable `landing-carousel`. The full
   * multi-column grid is a laptop+ affordance. Component-swap, not a CSS reflow:
   * SSR defaults to the widest BP so desktop renders the grid first with no
   * hydration flash (mirrors Selected Work's gallery↔carousel swap).
   */
  readonly stripCompact = computed(() => !this.breakpoint.isAtLeast('laptop'));
  /**
   * Dot indicators are a one-card-per-view affordance: they track the card nearest
   * the viewport centre, which is ambiguous once tablet shows two cards at once.
   * So show dots only at mobile (1-up); tablet (2-up) navigates by arrows + peek.
   */
  readonly stripDots = computed(() => !this.breakpoint.isAtLeast('tablet'));
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Writing' }];
  readonly viewOptions = VIEW_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;
  readonly pageSize = PAGE_SIZE;

  // ─── Local state (URL is a mirror, not the source) ────────────────
  private readonly initialQp = this.route.snapshot.queryParamMap;

  readonly searchControl = new FormControl<string>(this.initialQp.get(QUERY.SEARCH) ?? '', { nonNullable: true });
  readonly searchTerm = signal<string>((this.initialQp.get(QUERY.SEARCH) ?? '').trim());
  readonly selectedCategory = signal<string | null>(this.initialQp.get(QUERY.CATEGORY));
  readonly sortKey = signal<SortKey>(this.initialQp.get(QUERY.SORT) === 'oldest' ? 'oldest' : 'newest');
  readonly viewMode = signal<ViewMode>(this.initialQp.get(QUERY.VIEW) === 'grid' ? 'grid' : 'row');
  readonly currentPage = signal<number>(parsePageParam(this.initialQp.get(QUERY.PAGE)));

  // ─── Featured strip (one-time call, NOT reactive to filters) ──────
  private readonly featuredRes = asyncResource<readonly BlogPostListItem[]>(this.blogService.featured(), {
    initialValue: [],
    isEmpty: (a) => a.length === 0,
    delayMs: 0,
    minMs: 400,
  });
  readonly featuredLoading = this.featuredRes.showSpinner;
  readonly featuredPosts = computed<readonly BlogPostListItem[]>(() => this.featuredRes.data().slice(0, FEATURED_CAP));
  readonly featuredCount = computed(() => this.featuredPosts().length);
  readonly stripVariant = computed<StripVariant | null>(() => {
    if (this.featuredRes.status() !== 'ready') return null;
    const n = this.featuredCount();
    if (n < STRIP_MIN) return null;
    return n >= V1_THRESHOLD ? 'v1' : 'v3';
  });
  readonly v1Hero = computed<BlogPostListItem | null>(() => this.featuredPosts()[0] ?? null);
  readonly v1Left = computed<readonly BlogPostListItem[]>(() => this.featuredPosts().slice(1, 3));
  readonly v1Right = computed<readonly BlogPostListItem[]>(() => this.featuredPosts().slice(3, 5));
  readonly v1Sides = computed<readonly BlogPostListItem[]>(() => this.featuredPosts().slice(1, 5));
  readonly v3Hero = computed<BlogPostListItem | null>(() => this.featuredPosts()[0] ?? null);
  readonly v3Archive = computed<readonly BlogPostListItem[]>(() => this.featuredPosts().slice(1));

  // ─── Categories facet (one-time, for filter chips) ─────────────────
  private readonly categoriesRes = asyncResource<readonly BlogPostCategory[]>(this.blogService.categories(), {
    initialValue: [],
  });
  readonly availableCategories = computed(() => this.categoriesRes.data());

  // ─── Archive (BE-driven, reactive to filter / sort / page) ─────────
  private readonly queryShape = computed(() => ({
    search: this.searchTerm() || undefined,
    categorySlug: this.selectedCategory() ?? undefined,
    sort: this.sortKey(),
    page: this.currentPage(),
    limit: PAGE_SIZE,
  }));
  private readonly fetchingSubject = new BehaviorSubject<boolean>(true);
  readonly fetching = toSignal(this.fetchingSubject, { initialValue: true });
  private readonly archive$ = toObservable(this.queryShape).pipe(
    tap(() => this.fetchingSubject.next(true)),
    switchMap((q) =>
      this.blogService.list(q).pipe(
        tap({
          next: () => this.fetchingSubject.next(false),
          error: () => this.fetchingSubject.next(false),
        })
      )
    )
  );
  private readonly archiveData = toSignal(this.archive$, { initialValue: EMPTY_RESPONSE });
  readonly archiveLoading = signal(true);
  private spinnerShownAt = 0;
  private spinnerHideTimer: ReturnType<typeof setTimeout> | null = null;
  readonly archiveEmpty = computed(() => !this.fetching() && this.archiveData().data.length === 0);
  readonly visiblePosts = computed<readonly BlogPostListItem[]>(() => this.archiveData().data);
  readonly visibleCount = computed(() => this.visiblePosts().length);
  readonly totalCount = computed(() => this.archiveData().total);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize)));

  constructor() {
    const title = 'Writing | Phuong Tran';
    const description = 'Long-form deep-dives, short notes, and the occasional retro from building this portfolio.';
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });

    const destroyRef = inject(DestroyRef);
    this.searchControl.valueChanges
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed(destroyRef))
      .subscribe((v) => {
        const trimmed = v.trim();
        this.searchTerm.set(trimmed);
        this.currentPage.set(1);
        this.urlState.patchQueryParams(this.route, {
          [QUERY.SEARCH]: trimmed.length === 0 ? null : trimmed,
          [QUERY.PAGE]: null,
        });
      });

    // Spinner with min-display window (400ms) so users always perceive the
    // request — even on cached/fast responses where the loading frame might
    // otherwise vanish in <100ms.
    effect(() => {
      const f = this.fetching();
      untracked(() => {
        if (f) {
          if (this.spinnerHideTimer) {
            clearTimeout(this.spinnerHideTimer);
            this.spinnerHideTimer = null;
          }
          if (!this.archiveLoading()) {
            this.spinnerShownAt = Date.now();
            this.archiveLoading.set(true);
          }
        } else {
          const elapsed = Date.now() - this.spinnerShownAt;
          const remaining = Math.max(0, 400 - elapsed);
          if (remaining === 0) {
            this.archiveLoading.set(false);
          } else {
            this.spinnerHideTimer = setTimeout(() => {
              this.archiveLoading.set(false);
              this.spinnerHideTimer = null;
            }, remaining);
          }
        }
      });
    });

    destroyRef.onDestroy(() => {
      if (this.spinnerHideTimer) clearTimeout(this.spinnerHideTimer);
    });
  }

  // ─── Template helpers ────────────────────────────────────────────
  timeAgo(post: BlogPostListItem): string {
    return timeAgo(post.publishedAt, this.locale());
  }
  primaryCategory(post: BlogPostListItem): string | null {
    return post.categories[0]?.name ?? null;
  }

  // ─── Mutators → local signal + URL mirror ─────────────────────────
  setCategory(slug: string | null): void {
    this.selectedCategory.set(slug);
    this.currentPage.set(1);
    this.urlState.patchQueryParams(this.route, { [QUERY.CATEGORY]: slug, [QUERY.PAGE]: null });
  }
  setSort(value: string): void {
    const next: SortKey = value === 'oldest' ? 'oldest' : 'newest';
    this.sortKey.set(next);
    this.currentPage.set(1);
    this.urlState.patchQueryParams(this.route, {
      [QUERY.SORT]: next === 'newest' ? null : next,
      [QUERY.PAGE]: null,
    });
  }
  setView(value: string): void {
    const next: ViewMode = value === 'grid' ? 'grid' : 'row';
    this.viewMode.set(next);
    this.urlState.patchQueryParams(this.route, { [QUERY.VIEW]: next === 'row' ? null : next });
  }
  setPage(page: number): void {
    const next = Math.max(1, Math.floor(page));
    this.currentPage.set(next);
    this.urlState.patchQueryParams(this.route, { [QUERY.PAGE]: next <= 1 ? null : String(next) });
  }
  clearFilters(): void {
    this.searchControl.setValue('');
    this.searchTerm.set('');
    this.selectedCategory.set(null);
    this.sortKey.set('newest');
    this.currentPage.set(1);
    this.urlState.patchQueryParams(this.route, {
      [QUERY.SEARCH]: null,
      [QUERY.CATEGORY]: null,
      [QUERY.SORT]: null,
      [QUERY.PAGE]: null,
    });
  }
}
