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
import { Title, Meta, DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { from, of, map, startWith, switchMap } from 'rxjs';
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
import {
  BlogDataService,
  MarkdownService,
  type BlogPostDetail,
  type RenderedMarkdown,
} from '@portfolio/landing/shared/data-access';
import { BlogShareRow } from './blog.share-row';
import { Monogram, Wordmark } from '@portfolio/shared/features/brand';

const EMPTY_RENDER: RenderedMarkdown = { html: '', toc: [] };

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'not-found';

type DetailState = {
  status: LoadStatus;
  post: BlogPostDetail | null;
  rendered: RenderedMarkdown;
};

const INITIAL_STATE: DetailState = { status: 'idle', post: null, rendered: EMPTY_RENDER };

/**
 * Below this H2/H3 count the TOC is auto-hidden — same threshold the DDL
 * used (replaces an earlier word-count heuristic that mis-hid valid TOCs).
 * Notes (category slug `notes`) always hide regardless of section count.
 */
const TOC_MIN_SECTIONS = 3;

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
  ],
  providers: [LandingScrollspyService],
  templateUrl: './blog.detail.html',
  styleUrl: './blog.detail.scss',
})
export class BlogDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly blogService = inject(BlogDataService);
  private readonly markdown = inject(MarkdownService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly document = inject(DOCUMENT);
  private readonly scrollspy = inject(LandingScrollspyService);

  // ─── Data pipeline (SSR transfer cache) ──────────────────────────
  // Cache the rendered post in TransferState so the client doesn't refetch
  // + re-render markdown after hydration. Pattern shared with the previous
  // baseline; preserved through graduation.
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
        // empty state during the fetch+render window.
        return this.blogService.getBySlug(slug).pipe(
          switchMap((post) => {
            if (!post) return of<DetailState>({ status: 'not-found', post: null, rendered: EMPTY_RENDER });
            return from(this.markdown.render(post.content, { basePath: `/blog/${post.slug}` })).pipe(
              map((rendered): DetailState => {
                const next: DetailState = { status: 'loaded', post, rendered };
                if (!isPlatformBrowser(this.platformId)) {
                  this.transferState.set(stateKey, next);
                }
                return next;
              })
            );
          }),
          startWith<DetailState>({ status: 'loading', post: null, rendered: EMPTY_RENDER })
        );
      })
    ),
    { initialValue: INITIAL_STATE }
  );

  readonly post = computed(() => this.state().post);
  readonly loading = computed(() => this.state().status === 'loading');
  readonly notFound = computed(() => this.state().status === 'not-found');
  readonly contentHtml = computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(this.state().rendered.html));
  readonly toc = computed<readonly InPageSection[]>(() =>
    this.state().rendered.toc.map((e) => ({ id: e.id, title: e.text, level: e.level }))
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
    // SEO meta — runs on both server and client. Article OG tags + canonical
    // values mirror the about-page pattern (commit 96a0cd4).
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

    // SSR-only JSON-LD injection. Guarded by isPlatformServer so the client
    // never re-injects (which would yield duplicate <script> tags on hydration).
    // Payload comes pre-built from the BE (task 348) on `post.jsonLd`.
    effect(() => {
      const p = this.post();
      if (!p || !isPlatformServer(this.platformId)) return;
      const script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(p.jsonLd);
      this.document.head.appendChild(script);
    });

    // Scrollspy: register section anchors only when the TOC will actually
    // render. Clearing on hide avoids stale highlights from the previous post
    // when navigating slug → slug client-side.
    effect(() => {
      if (this.hideToc()) {
        this.scrollspy.setSections([]);
        return;
      }
      this.scrollspy.setSections(this.toc());
    });
  }
}

function wordCount(content: string | null | undefined): number {
  if (!content) return 0;
  return content.split(/\s+/).filter(Boolean).length;
}

function shouldHideToc(post: BlogPostDetail | null, sectionCount: number): boolean {
  if (!post) return true;
  const isNote = post.categories.some((c) => c.slug === 'notes');
  return isNote || sectionCount < TOC_MIN_SECTIONS;
}
