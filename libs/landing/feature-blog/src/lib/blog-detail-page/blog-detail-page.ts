import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  PLATFORM_ID,
  TransferState,
  computed,
  effect,
  inject,
  makeStateKey,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, from, of, map } from 'rxjs';
import { ContainerComponent, SectionComponent, IconComponent, BadgeComponent } from '@portfolio/landing/shared/ui';
import { BlogDataService } from '@portfolio/landing/shared/data-access';
import type { BlogPostDetail } from '@portfolio/landing/shared/data-access';
import { MarkdownService, type RenderedMarkdown } from '../services/markdown.service';
import { TocComponent } from './toc.component';
import { ReadingProgressComponent } from './reading-progress.component';

const EMPTY_RENDER: RenderedMarkdown = { html: '', toc: [] };

type DetailState = {
  post: BlogPostDetail | null;
  rendered: RenderedMarkdown;
};

@Component({
  selector: 'landing-blog-detail-page',
  imports: [
    CommonModule,
    RouterLink,
    ContainerComponent,
    SectionComponent,
    IconComponent,
    BadgeComponent,
    TocComponent,
    ReadingProgressComponent,
  ],
  templateUrl: './blog-detail-page.html',
  styleUrl: './blog-detail-page.scss',
})
export class BlogDetailPage {
  private route = inject(ActivatedRoute);
  private blogService = inject(BlogDataService);
  private markdown = inject(MarkdownService);
  private sanitizer = inject(DomSanitizer);
  private title = inject(Title);
  private meta = inject(Meta);
  private platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);

  articleEl = viewChild<ElementRef<HTMLElement>>('articleEl');

  copied = signal(false);

  private state = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('slug');
        if (!slug) return of<DetailState>({ post: null, rendered: EMPTY_RENDER });

        const stateKey = makeStateKey<DetailState>('blog-post-' + slug);
        const cached = this.transferState.get(stateKey, null);
        if (cached) {
          this.transferState.remove(stateKey);
          return of<DetailState>(cached);
        }

        return this.blogService.getBySlug(slug).pipe(
          switchMap((post) => {
            if (!post) return of<DetailState>({ post: null, rendered: EMPTY_RENDER });
            return from(this.markdown.render(post.content)).pipe(
              map((rendered) => {
                const next = { post, rendered } as DetailState;
                if (!isPlatformBrowser(this.platformId)) {
                  this.transferState.set(stateKey, next);
                }
                return next;
              })
            );
          })
        );
      })
    ),
    { initialValue: { post: null, rendered: EMPTY_RENDER } as DetailState }
  );

  post = computed(() => this.state().post);
  toc = computed(() => this.state().rendered.toc);
  contentHtml = computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(this.state().rendered.html));
  notFound = computed(() => {
    // After first emission, if state has no post and slug present
    return this.state().post === null && this.route.snapshot.paramMap.has('slug');
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
    });
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  copyLink() {
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  articleElement = computed(() => this.articleEl()?.nativeElement ?? null);
}
