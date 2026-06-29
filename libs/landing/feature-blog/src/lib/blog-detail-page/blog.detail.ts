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
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
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
  type BreadcrumbItem,
  type InPageSection,
} from '@portfolio/landing/shared/ui';
import { BlogDataService } from '@portfolio/landing/shared/data-access';
import { RteRenderHtml } from '@portfolio/shared/features/rte-renderer';
import { getLocalized } from '@portfolio/shared/utils/lite';
import { addHeadingAnchors, type TocEntry } from '@portfolio/landing/shared/util';
import { BlogShareRow } from './blog.share-row';
import { Monogram, Wordmark } from '@portfolio/shared/features/brand';
import type { DetailState } from './blog.detail.types';
import { INITIAL_STATE } from './blog.detail.data';
import { shouldHideToc, wordCount } from './blog.detail.util';

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
    RteRenderHtml,
  ],
  providers: [LandingScrollspyService],
  templateUrl: './blog.detail.html',
  styleUrl: './blog.detail.scss',
})
export class BlogDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly blogService = inject(BlogDataService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
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

  /** Post body: the pre-sanitized rich-text HTML cache, slugged at read-time so the
   *  sticky ToC + scrollspy have h2/h3 anchors to target. `<rte-render-html>` re-sanitizes
   *  the result (id survives via the heading-only whitelist rule). Blog posts are
   *  single-language, so the content envelope is resolved by the post's own `language`. */
  private readonly rendered = computed(() => {
    const p = this.post();
    const locale = p?.language === 'VI' ? 'vi' : 'en';
    return addHeadingAnchors(getLocalized(p?.contentHtml, locale));
  });
  readonly contentHtml = computed(() => this.rendered().html);
  readonly hasBody = computed(() => this.contentHtml().length > 0);
  readonly toc = computed<readonly InPageSection[]>(() =>
    this.rendered().toc.map((e: TocEntry) => ({ id: e.id, title: e.text, level: e.level }))
  );
  readonly hideToc = computed(() => shouldHideToc(this.post(), this.toc().length));

  readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => {
    const p = this.post();
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
      { label: 'Writing', href: '/blog' },
    ];
    if (p) items.push({ label: p.title });
    return items;
  });

  readonly postType = computed<string>(() => {
    const p = this.post();
    if (!p) return '—';
    if (p.categories[0]?.slug === 'notes') return 'Note';
    const wc = wordCount(p.content);
    if (wc >= 1500) return 'Deep dive';
    return 'Essay';
  });

  readonly publishedDate = computed<string>(() => {
    const iso = this.post()?.publishedAt;
    if (!iso) return '';
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  });

  constructor() {
    effect(() => {
      const p = this.post();
      if (!p) return;
      const docTitle = (p.metaTitle ?? p.title) + ' | Phuong Tran';
      this.title.setTitle(docTitle);
      const description = p.metaDescription ?? p.excerpt ?? '';
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: docTitle });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ property: 'og:type', content: 'article' });
      if (p.featuredImageUrl) {
        this.meta.updateTag({ property: 'og:image', content: p.featuredImageUrl });
      }
      if (p.publishedAt) {
        this.meta.updateTag({ property: 'article:published_time', content: p.publishedAt });
      }
      if (p.author?.name) {
        this.meta.updateTag({ property: 'article:author', content: p.author.name });
      }
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
