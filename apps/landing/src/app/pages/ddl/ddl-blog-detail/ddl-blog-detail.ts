import { ChangeDetectionStrategy, Component, computed, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, map } from 'rxjs';
import {
  LandingProseAnchorsDirective,
  LandingScrollspyService,
  TocSidebar,
  Segmented,
  Chip,
  Figure,
  type InPageSection,
  type SegmentOption,
} from '@portfolio/landing/shared/ui';
import { BlogDataService, type BlogPostDetail } from '@portfolio/landing/shared/data-access';
import { RteRenderHtml } from '@portfolio/shared/features/rte-renderer';
import { addHeadingAnchors } from '@portfolio/landing/shared/util';
import { getLocalized } from '@portfolio/shared/utils/lite';

import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlSection } from '../ddl-section/ddl-section';
import { DdlStage } from '../ddl-stage/ddl-stage';
import type { DdlVariant } from '../ddl.types';
import { DdlBlogShareRow } from './ddl-blog-share-row';
import type { LoadedPost } from './ddl-blog-detail.types';
import { EMPTY, DEEP_DIVE_SLUG, NOTE_SLUG, ESSAY_SLUG, RETRO_SLUG, BLOG_DETAIL_VARIANTS } from './ddl-blog-detail.data';
import { wordCount, shouldHideToc, tocFromEntries } from './ddl-blog-detail.util';

@Component({
  selector: 'landing-ddl-blog-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JsonPipe,
    RouterLink,
    Figure,
    LandingProseAnchorsDirective,
    TocSidebar,
    Segmented,
    Chip,
    DdlBlogShareRow,
    DdlDocPage,
    DdlDecisionRecord,
    DdlSection,
    DdlStage,
    RteRenderHtml,
  ],
  providers: [LandingScrollspyService],
  templateUrl: './ddl-blog-detail.html',
  styleUrl: './ddl-blog-detail.scss',
})
export class DdlBlogDetail {
  private readonly blogService = inject(BlogDataService);
  private readonly scrollspy = inject(LandingScrollspyService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly variants: readonly DdlVariant[] = BLOG_DETAIL_VARIANTS;

  // ─── Data loading ────────────────────────────────────────────────
  // Load the deep-dive + a note in parallel so V1's auto-hide TOC branch can
  // be demonstrated against a real short post. Each post's sanitized rich-text
  // HTML cache is slugged at read-time (addHeadingAnchors) to get HTML + toc[].
  // The DDL accepts duplicate heading IDs across stacked variants — anchor
  // clicks may scroll to the first occurrence (V1's). Acceptable for a sandbox.
  private readonly loaded = toSignal(
    combineLatest([
      this.blogService.getBySlug(DEEP_DIVE_SLUG),
      this.blogService.getBySlug(NOTE_SLUG),
      this.blogService.getBySlug(ESSAY_SLUG),
      this.blogService.getBySlug(RETRO_SLUG),
    ]).pipe(
      // Rendering is synchronous now (the BE ships the sanitized rich-text HTML cache);
      // the read-time slugger only adds h2/h3 anchors. No async markdown step.
      map(([deep, note, essay, retro]) => ({
        deep: this.renderOrEmpty(deep),
        note: this.renderOrEmpty(note),
        essay: this.renderOrEmpty(essay),
        retro: this.renderOrEmpty(retro),
      }))
    ),
    { initialValue: { deep: EMPTY, note: EMPTY, essay: EMPTY, retro: EMPTY } }
  );

  readonly deepPost = computed(() => this.loaded().deep.post);
  readonly notePost = computed(() => this.loaded().note.post);
  readonly essayPost = computed(() => this.loaded().essay.post);
  readonly retroPost = computed(() => this.loaded().retro.post);

  readonly deepHtml = computed(() => this.loaded().deep.html);
  readonly noteHtml = computed(() => this.loaded().note.html);
  readonly essayHtml = computed(() => this.loaded().essay.html);
  readonly retroHtml = computed(() => this.loaded().retro.html);

  readonly deepToc = computed<readonly InPageSection[]>(() => tocFromEntries(this.loaded().deep.toc));
  readonly noteToc = computed<readonly InPageSection[]>(() => tocFromEntries(this.loaded().note.toc));
  readonly essayToc = computed<readonly InPageSection[]>(() => tocFromEntries(this.loaded().essay.toc));
  readonly retroToc = computed<readonly InPageSection[]>(() => tocFromEntries(this.loaded().retro.toc));

  // ─── V4 content-shape sub-tabs ────────────────────────────────────
  readonly v4Type = signal<'deep' | 'essay' | 'retro' | 'note'>('deep');
  readonly v4Types: readonly SegmentOption[] = [
    { id: 'deep', label: 'Deep dive' },
    { id: 'essay', label: 'Featured essay' },
    { id: 'retro', label: 'Retro' },
    { id: 'note', label: 'Note' },
  ];

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
  // Track the deep-dive's headings (V3's prose) for the in-prose anchor spy.
  // Duplicate heading IDs across the stacked variants mean anchor clicks may
  // resolve to the first occurrence — acceptable for a sandbox preview.
  constructor() {
    effect(() => {
      this.scrollspy.setSections(this.deepToc());
    });
  }

  private renderOrEmpty(post: BlogPostDetail | null): LoadedPost {
    if (!post) return EMPTY;
    const locale = post.language === 'VI' ? 'vi' : 'en';
    const { html, toc } = addHeadingAnchors(getLocalized(post.contentHtml, locale));
    return { post, html, toc };
  }

  setV4Type(value: string): void {
    this.v4Type.set((value as 'deep' | 'essay' | 'retro' | 'note') ?? 'deep');
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
