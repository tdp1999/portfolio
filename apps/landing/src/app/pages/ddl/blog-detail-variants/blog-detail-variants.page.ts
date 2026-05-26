import { ChangeDetectionStrategy, Component, computed, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, JsonPipe } from '@angular/common';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, from, of, switchMap, map } from 'rxjs';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingBreadcrumbComponent,
  LandingProseAnchorsDirective,
  LandingScrollspyService,
  LandingTocSidebarComponent,
  SegmentedComponent,
  ChipComponent,
  type BreadcrumbItem,
  type InPageSection,
  type SegmentOption,
} from '@portfolio/landing/shared/ui';
import {
  BlogDataService,
  MarkdownService,
  type BlogPostDetail,
  type RenderedMarkdown,
} from '@portfolio/landing/shared/data-access';
import { FigureComponent } from '@portfolio/landing/shared/ui';
import { BlogShareRowComponent } from './blog-share-row.component';

type Tab = 'v4' | 'v1' | 'v2' | 'v3' | 'prototypes' | 'usage';

type LoadedPost = {
  post: BlogPostDetail | null;
  rendered: RenderedMarkdown;
};

const EMPTY: LoadedPost = { post: null, rendered: { html: '', toc: [] } };
const DEEP_DIVE_SLUG = 'seed-angular-ssr-transfer-cache';
const NOTE_SLUG = 'seed-til-postgres-partial-unique-indexes';
const ESSAY_SLUG = 'seed-design-system-before-screen';
const RETRO_SLUG = 'seed-shipping-document-engine-console';

/** Minimum H2/H3 sections before a TOC is worth rendering. Below this the
 *  TOC is auto-hidden (it would show 1-2 entries and waste rail real estate).
 *  Replaces the earlier word-count threshold — section count is a better
 *  proxy for "this post benefits from a TOC". */
const TOC_MIN_SECTIONS = 3;

@Component({
  selector: 'landing-blog-detail-variants-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JsonPipe,
    RouterLink,
    ContainerComponent,
    EyebrowComponent,
    FigureComponent,
    LandingBreadcrumbComponent,
    LandingProseAnchorsDirective,
    LandingTocSidebarComponent,
    SegmentedComponent,
    ChipComponent,
    BlogShareRowComponent,
  ],
  providers: [LandingScrollspyService],
  templateUrl: './blog-detail-variants.page.html',
  styleUrl: './blog-detail-variants.page.scss',
})
export class BlogDetailVariantsPage {
  private readonly blogService = inject(BlogDataService);
  private readonly markdown = inject(MarkdownService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly scrollspy = inject(LandingScrollspyService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly breadcrumb: readonly BreadcrumbItem[] = [
    { label: 'DDL', href: '/ddl' },
    { label: 'Blog — detail variants' },
  ];

  readonly tab = signal<Tab>('v4');
  readonly tabs: readonly SegmentOption[] = [
    { id: 'v4', label: 'V4 · Chosen' },
    { id: 'v1', label: 'V1 · Editorial' },
    { id: 'v2', label: 'V2 · Minimal' },
    { id: 'v3', label: 'V3 · Sticky rail' },
    { id: 'prototypes', label: 'Prototypes' },
    { id: 'usage', label: 'Usage' },
  ];
  setTab(value: string): void {
    this.tab.set((value as Tab) ?? 'v4');
  }

  // ─── Data loading ────────────────────────────────────────────────
  // Load the deep-dive + a note in parallel so V1's auto-hide TOC branch can
  // be demonstrated against a real short post. Marshal each through
  // MarkdownService to get HTML + toc[]. The DDL accepts duplicate heading
  // IDs across stacked variants — anchor clicks may scroll to the first
  // occurrence (V1's). Acceptable for a sandbox preview.
  private readonly loaded = toSignal(
    combineLatest([
      this.blogService.getBySlug(DEEP_DIVE_SLUG),
      this.blogService.getBySlug(NOTE_SLUG),
      this.blogService.getBySlug(ESSAY_SLUG),
      this.blogService.getBySlug(RETRO_SLUG),
    ]).pipe(
      switchMap(([deep, note, essay, retro]) =>
        combineLatest([
          this.renderOrEmpty(deep),
          this.renderOrEmpty(note),
          this.renderOrEmpty(essay),
          this.renderOrEmpty(retro),
        ]).pipe(map(([d, n, e, r]) => ({ deep: d, note: n, essay: e, retro: r })))
      )
    ),
    { initialValue: { deep: EMPTY, note: EMPTY, essay: EMPTY, retro: EMPTY } }
  );

  private renderOrEmpty(post: BlogPostDetail | null) {
    if (!post) return of(EMPTY);
    return from(this.markdown.render(post.content)).pipe(map((rendered): LoadedPost => ({ post, rendered })));
  }

  readonly deepPost = computed(() => this.loaded().deep.post);
  readonly notePost = computed(() => this.loaded().note.post);
  readonly essayPost = computed(() => this.loaded().essay.post);
  readonly retroPost = computed(() => this.loaded().retro.post);

  readonly deepHtml = computed<SafeHtml>(() => this.html(this.loaded().deep.rendered.html));
  readonly noteHtml = computed<SafeHtml>(() => this.html(this.loaded().note.rendered.html));
  readonly essayHtml = computed<SafeHtml>(() => this.html(this.loaded().essay.rendered.html));
  readonly retroHtml = computed<SafeHtml>(() => this.html(this.loaded().retro.rendered.html));

  readonly deepToc = computed<readonly InPageSection[]>(() => this.toc(this.loaded().deep.rendered.toc));
  readonly noteToc = computed<readonly InPageSection[]>(() => this.toc(this.loaded().note.rendered.toc));
  readonly essayToc = computed<readonly InPageSection[]>(() => this.toc(this.loaded().essay.rendered.toc));
  readonly retroToc = computed<readonly InPageSection[]>(() => this.toc(this.loaded().retro.rendered.toc));

  private html(raw: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }
  private toc(entries: readonly { id: string; text: string; level: 2 | 3 }[]): InPageSection[] {
    return entries.map((e) => ({ id: e.id, title: e.text, level: e.level }));
  }

  // ─── V4 content-shape sub-tabs ────────────────────────────────────
  readonly v4Type = signal<'deep' | 'essay' | 'retro' | 'note'>('deep');
  readonly v4Types: readonly SegmentOption[] = [
    { id: 'deep', label: 'Deep dive' },
    { id: 'essay', label: 'Featured essay' },
    { id: 'retro', label: 'Retro' },
    { id: 'note', label: 'Note' },
  ];
  setV4Type(value: string): void {
    this.v4Type.set((value as 'deep' | 'essay' | 'retro' | 'note') ?? 'deep');
  }
  readonly v4Active = computed(() => {
    switch (this.v4Type()) {
      case 'essay':
        return { post: this.essayPost(), html: this.essayHtml(), toc: this.essayToc() };
      case 'retro':
        return { post: this.retroPost(), html: this.retroHtml(), toc: this.retroToc() };
      case 'note':
        return { post: this.notePost(), html: this.noteHtml(), toc: this.noteToc() };
      default:
        return { post: this.deepPost(), html: this.deepHtml(), toc: this.deepToc() };
    }
  });
  readonly v4HideToc = computed(() => shouldHideToc(this.v4Active().post, this.v4Active().toc.length));

  // ─── V1 auto-hide TOC branch ─────────────────────────────────────
  // Hide TOC when category is "Notes" OR fewer than TOC_MIN_SECTIONS H2/H3
  // headings are present (short pieces don't earn a TOC).
  readonly hideTocForDeep = computed(() => shouldHideToc(this.deepPost(), this.deepToc().length));
  readonly hideTocForNote = computed(() => shouldHideToc(this.notePost(), this.noteToc().length));

  // ─── V3 scrollspy wiring ─────────────────────────────────────────
  // Only register sections when V3 is the active tab. Registering globally
  // (even while V1 or V2 was visible) caused two bugs:
  //   1. Page auto-scrolled — TocSidebar's scrollIntoView effect would bring
  //      V3's hidden rail into the viewport whenever active() changed.
  //   2. Duplicate heading IDs across stacked variants confused scrollspy.
  // Tab gating fixes both: V3's DOM only exists on its tab, scrollspy only
  // tracks while that DOM is mounted.
  constructor() {
    effect(() => {
      const t = this.tab();
      if (t === 'v3') {
        this.scrollspy.setSections(this.deepToc());
      } else if (t === 'v4') {
        this.scrollspy.setSections(this.v4HideToc() ? [] : this.v4Active().toc);
      } else {
        this.scrollspy.setSections([]);
      }
    });
  }

  // ─── Template helpers ────────────────────────────────────────────
  formatDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  postType(post: BlogPostDetail | null): string {
    if (!post) return '—';
    if (post.categories[0]?.slug === 'notes') return 'Note';
    const wc = wordCount(post.content);
    if (wc >= 1500) return 'Deep dive';
    return 'Essay';
  }

  // SSR-safe absolute URL (production wires WINDOW token; DDL uses fallback)
  absoluteUrl(slug: string): string {
    if (isPlatformBrowser(this.platformId)) return `${window.location.origin}/blog/${slug}`;
    return `/blog/${slug}`;
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
