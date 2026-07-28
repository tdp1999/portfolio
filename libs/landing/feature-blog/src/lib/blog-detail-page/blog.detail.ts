import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  TransferState,
  computed,
  effect,
  inject,
  makeStateKey,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { of, map, startWith, switchMap } from 'rxjs';
import {
  Chip,
  Container,
  Breadcrumb,
  BrowserWindow,
  EmptyState,
  LoadingSpinner,
  LandingProseAnchorsDirective,
  LandingScrollspyService,
  TocInline,
  TocSidebar,
  UmamiEventDirective,
  type BreadcrumbItem,
  type InPageSection,
  resolveCopy,
  formatLongDate,
  LandingCopyPipe,
  LandingMetaService,
} from '@portfolio/landing/shared/ui';
import { BlogDataService } from '@portfolio/landing/shared/data-access';
import { RteRender, RteRenderHtml } from '@portfolio/shared/features/rte-renderer';
import type { RenderContext } from '@portfolio/shared/features/rte-contract';
import type { PortableDocument } from '@portfolio/shared/features/rte-core/portable';
import { getLocalized } from '@portfolio/shared/utils/lite';
import type { Locale } from '@portfolio/shared/types';
import { addHeadingAnchors, hydrateImageRefs, type TocEntry } from '@portfolio/landing/shared/util';
import { BlogShareRow } from './blog.share-row';
import { Monogram, Wordmark } from '@portfolio/shared/features/brand';
import type { DetailState } from './blog.detail.types';
import { INITIAL_STATE } from './blog.detail.data';
import { shouldHideToc } from './blog.detail.util';

@Component({
  selector: 'landing-blog-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Chip,
    Container,
    BrowserWindow,
    Breadcrumb,
    EmptyState,
    LoadingSpinner,
    LandingProseAnchorsDirective,
    TocInline,
    TocSidebar,
    BlogShareRow,
    Monogram,
    Wordmark,
    RteRender,
    RteRenderHtml,
    UmamiEventDirective,
    LandingCopyPipe,
  ],
  providers: [LandingScrollspyService],
  templateUrl: './blog.detail.html',
  styleUrl: './blog.detail.scss',
})
export class BlogDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly blogService = inject(BlogDataService);
  private readonly seo = inject(LandingMetaService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly document = inject(DOCUMENT);
  private readonly scrollspy = inject(LandingScrollspyService);

  // ─── Data pipeline (SSR transfer cache) ──────────────────────────
  // Cache the fetched post in TransferState so the client doesn't refetch
  // after hydration. Rendering is now synchronous (the BE already ships the
  // sanitized rich-text HTML cache), so the pipeline only awaits the HTTP fetch.
  private readonly state = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('slug');
        if (!slug) return of<DetailState>(INITIAL_STATE);

        const stateKey = makeStateKey<DetailState>('blog-post-' + slug);
        const cached = this.transferState.get(stateKey, null);
        if (cached) {
          this.transferState.remove(stateKey);
          return of<DetailState>(cached);
        }

        // Emit `loading` immediately so the template doesn't flash the 404
        // empty state during the fetch window.
        return this.blogService.getBySlug(slug).pipe(
          map((post): DetailState => {
            const next: DetailState = post ? { status: 'loaded', post } : { status: 'not-found', post: null };
            if (!isPlatformBrowser(this.platformId)) {
              this.transferState.set(stateKey, next);
            }
            return next;
          }),
          startWith<DetailState>({ status: 'loading', post: null })
        );
      })
    ),
    { initialValue: INITIAL_STATE }
  );

  readonly post = computed(() => this.state().post);
  readonly loading = computed(() => this.state().status === 'loading');
  readonly notFound = computed(() => this.state().status === 'not-found');

  /** Blog posts are single-language — the content envelope AND the chrome around it
   *  (breadcrumb, read-time, related-posts heading, author bio) are resolved by the
   *  post's own `language`, not the site locale. A post reads in one language. */
  protected readonly locale = computed<Locale>(() => (this.post()?.language === 'VI' ? 'vi' : 'en'));

  /** Canonical AST body (prose-block renderer epic). Present → `<rte-render [doc]>`
   *  (declarative marks + lightbox-enabled blocks). Null/empty → fall back to the
   *  `contentHtml` cache (also covers posts not yet re-saved through the editor). */
  readonly bodyDoc = computed<PortableDocument | null>(() => {
    const doc = getLocalized(this.post()?.contentCanonical, this.locale()) as unknown as PortableDocument | null;
    return doc && Array.isArray(doc.content) && doc.content.length > 0 ? doc : null;
  });
  readonly useAst = computed(() => this.bodyDoc() !== null);

  /** Synchronous media resolver for `image-ref` / `gallery` blocks (D3; SSR-safe). */
  readonly renderContext = computed<RenderContext>(() => {
    const refs = this.post()?.mediaRefs ?? {};
    return { locale: this.locale(), media: (id: string) => refs[id] };
  });

  /** Fallback body: the pre-sanitized HTML cache, slugged for the ToC. Used only when
   *  canonical is null (`<rte-render-html>` re-sanitizes browser-side). */
  private readonly rendered = computed(() => addHeadingAnchors(getLocalized(this.post()?.contentHtml, this.locale())));
  readonly contentHtml = computed(() => hydrateImageRefs(this.rendered().html, this.post()?.mediaRefs));
  readonly hasBody = computed(() => this.useAst() || this.contentHtml().length > 0);

  /** AST renderer instance (present on the canonical path) — its `headings()` is the
   *  single slug source for the ToC. */
  private readonly bodyRenderer = viewChild(RteRender);
  readonly toc = computed<readonly InPageSection[]>(() => {
    if (this.useAst()) {
      return (this.bodyRenderer()?.headings() ?? [])
        .filter((h) => h.level <= 3)
        .map((h) => ({ id: h.id, title: h.text, level: h.level as 2 | 3 }));
    }
    return this.rendered().toc.map((e: TocEntry) => ({ id: e.id, title: e.text, level: e.level }));
  });
  readonly hideToc = computed(() => shouldHideToc(this.post(), this.toc().length));

  readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => {
    const p = this.post();
    const locale = this.locale();
    const items: BreadcrumbItem[] = [
      { label: resolveCopy('common.page.home', locale), href: '/' },
      { label: resolveCopy('common.page.writing', locale), href: '/blog' },
    ];
    if (p) items.push({ label: p.title });
    return items;
  });

  readonly postType = computed<string>(() => {
    const p = this.post();
    if (!p) return '—';
    const locale = this.locale();
    if (p.categories[0]?.slug === 'notes') return resolveCopy('blog.postType.note', locale);
    // Deep dive ≈ 1500+ words; read-time is ceil(words / 200), so 1500 words ≈ 8 min.
    if ((p.readTimeMinutes ?? 0) >= 8) return resolveCopy('blog.postType.deepDive', locale);
    return resolveCopy('blog.postType.essay', locale);
  });

  /** `formatLongDate`, not `toLocaleDateString`: reads UTC parts so the server and
   *  the browser agree, and localizes the month name instead of hardcoding en-US. */
  readonly publishedDate = computed<string>(() => {
    const iso = this.post()?.publishedAt;
    if (!iso) return '';
    return formatLongDate(new Date(iso), this.locale());
  });

  readonly readTimeLabel = computed<string>(() => {
    const minutes = this.post()?.readTimeMinutes;
    if (!minutes) return '';
    return resolveCopy('blog.readTime', this.locale(), { n: minutes });
  });

  constructor() {
    effect(() => {
      const p = this.post();
      if (!p) return;
      this.seo.apply({
        title: (p.metaTitle ?? p.title) + ' | Phuong Tran',
        description: p.metaDescription ?? p.excerpt ?? '',
        path: `/blog/${p.slug}`,
        type: 'article',
        image: p.featuredImageUrl || undefined,
        extra: {
          ...(p.publishedAt ? { 'article:published_time': p.publishedAt } : {}),
          ...(p.author?.name ? { 'article:author': p.author.name } : {}),
        },
      });
    });

    effect(() => {
      const p = this.post();
      if (!p || !isPlatformServer(this.platformId)) return;
      const script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(p.jsonLd);
      this.document.head.appendChild(script);
    });

    effect(() => {
      if (this.hideToc()) {
        this.scrollspy.setSections([]);
        return;
      }
      this.scrollspy.setSections(this.toc());
    });
  }
}
