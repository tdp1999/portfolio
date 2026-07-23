import { DOCUMENT, DecimalPipe, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
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
import { Title, Meta } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, of, map, combineLatest } from 'rxjs';
import {
  Container,
  Section,
  EmptyState,
  Heading,
  Link,
  LandingLocaleService,
  LandingProseAnchorsDirective,
  LandingScrollspyService,
  TocSidebar,
  Eyebrow,
  Breadcrumb,
  BrowserWindow,
  CloudinarySrcsetPipe,
  ShowMore,
  type BreadcrumbItem,
  type InPageSection,
} from '@portfolio/landing/shared/ui';
import { ProjectDataService } from '@portfolio/landing/shared/data-access';
import { RteRender, RteRenderHtml } from '@portfolio/shared/features/rte-renderer';
import type { RenderContext } from '@portfolio/shared/features/rte-contract';
import type { PortableDocument } from '@portfolio/shared/features/rte-core/portable';
import { getLocalized } from '@portfolio/shared/utils/lite';
import {
  addHeadingAnchors,
  buildCloudinarySrcset,
  hydrateImageRefs,
  type TocEntry,
} from '@portfolio/landing/shared/util';
import {
  FALLBACK_TOC,
  HERO_WIDTH,
  LIFECYCLE_STATUS_LABEL,
  LINK_ORDER,
  LINK_TYPE_LABEL,
  type DetailState,
} from './project.detail.types';
import { plainToHtml, sortedIndex, yearRange, zero } from './project.detail.util';

@Component({
  selector: 'landing-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    NgTemplateOutlet,
    RouterLink,
    ShowMore,
    Container,
    Section,
    EmptyState,
    Heading,
    Link,
    LandingProseAnchorsDirective,
    TocSidebar,
    Breadcrumb,
    BrowserWindow,
    Eyebrow,
    CloudinarySrcsetPipe,
    RteRender,
    RteRenderHtml,
  ],
  templateUrl: './project.detail.html',
  styleUrl: './project.detail.scss',
})
export class ProjectDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectDataService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly scrollspy = inject(LandingScrollspyService);
  private readonly document = inject(DOCUMENT);
  private readonly localeService = inject(LandingLocaleService);

  readonly locale = this.localeService.locale;

  private readonly state = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('slug') ?? '';
        const stateKey = makeStateKey<DetailState>('project-detail-' + slug);
        const cached = this.transferState.get(stateKey, null);
        if (cached) {
          this.transferState.remove(stateKey);
          return of<DetailState>({ ...cached, loaded: true });
        }
        return combineLatest([this.projectService.getBySlug(slug), this.projectService.getPublicProjects()]).pipe(
          map(([project, list]): DetailState => {
            const next: DetailState = { project, index: sortedIndex(list), loaded: true };
            if (!isPlatformBrowser(this.platformId)) {
              this.transferState.set(stateKey, next);
            }
            return next;
          })
        );
      })
    ),
    { initialValue: { project: null, index: [], loaded: false } satisfies DetailState }
  );

  readonly project = computed(() => this.state().project);

  /** Canonical AST body for the active locale (prose-block renderer epic). When
   *  present it drives `<rte-render [doc]>` — the declarative read-path with live,
   *  lightbox-enabled figures. Null/empty → fall back to the `bodyHtml` cache below
   *  (also covers content not yet re-saved through the editor). Locale-reactive. */
  readonly bodyDoc = computed<PortableDocument | null>(() => {
    const doc = getLocalized(this.project()?.bodyCanonical, this.locale()) as unknown as PortableDocument | null;
    return doc && Array.isArray(doc.content) && doc.content.length > 0 ? doc : null;
  });
  readonly useAst = computed(() => this.bodyDoc() !== null);

  /** Synchronous media resolver for `image-ref` / `gallery` blocks — the page's
   *  pre-resolved `mediaRefs` map exposed as `RenderContext.media` (D3; no fetch at
   *  render time, SSR-safe). */
  readonly renderContext = computed<RenderContext>(() => {
    const refs = this.project()?.mediaRefs ?? {};
    return { locale: this.locale(), media: (id: string) => refs[id] };
  });

  /** Fallback body: the pre-sanitized rich-text HTML cache, slugged at read-time so
   *  the sticky ToC + scrollspy have h2/h3 anchors. Used only when canonical is null
   *  (`<rte-render-html>` re-sanitizes; ids survive the heading-only whitelist). */
  private readonly rendered = computed(() => addHeadingAnchors(getLocalized(this.project()?.bodyHtml, this.locale())));
  readonly contentHtml = computed(() => hydrateImageRefs(this.rendered().html, this.project()?.mediaRefs));

  /** The AST renderer instance (present only while the AST body is rendered) — its
   *  `headings()` is the single slug source for the ToC on the canonical path. */
  private readonly bodyRenderer = viewChild(RteRender);
  readonly toc = computed<readonly TocEntry[]>(() => {
    if (this.useAst()) {
      return (this.bodyRenderer()?.headings() ?? [])
        .filter((h) => h.level <= 3)
        .map((h) => ({ id: h.id, text: h.text, level: h.level as 2 | 3 }));
    }
    return this.rendered().toc;
  });
  /** Body wins over the synthesized fallback whenever a rich-text body exists (AST or cache). */
  readonly hasBody = computed(() => this.useAst() || this.contentHtml().length > 0);

  // Derived from reactive state, NOT route.snapshot — `state.loaded` flips true on the first
  // emission from the fetch pipeline, so we only show "not found" after the pipeline has
  // actually resolved (avoids a flash of the not-found screen on initial render).
  readonly notFound = computed(() => {
    const s = this.state();
    return s.loaded && s.project === null;
  });

  readonly oneLiner = computed(() => {
    const p = this.project();
    return p ? getLocalized(p.oneLiner, this.locale()) : '';
  });

  readonly motivation = computed(() => {
    const p = this.project();
    return p ? getLocalized(p.motivation, this.locale()) : '';
  });

  readonly description = computed(() => {
    const p = this.project();
    return p ? getLocalized(p.description, this.locale()) : '';
  });

  readonly role = computed(() => {
    const p = this.project();
    return p ? getLocalized(p.role, this.locale()) : '';
  });

  /** Highlight CAO blocks rendered through `<rte-render-html>`. Prefers each
   *  sub-field's sanitized rich-text cache (`*Html`); falls back to the legacy
   *  plain text (escaped, wrapped) while data is mid-migration so a not-yet-saved
   *  highlight never renders blank. Locale-reactive. */
  readonly highlightBlocks = computed(() => {
    const loc = this.locale();
    return (this.project()?.highlights ?? []).map((h) => ({
      title: getLocalized(h.title, loc),
      challenge: getLocalized(h.challengeHtml, loc) || plainToHtml(getLocalized(h.challenge, loc)),
      approach: getLocalized(h.approachHtml, loc) || plainToHtml(getLocalized(h.approach, loc)),
      outcome: getLocalized(h.outcomeHtml, loc) || plainToHtml(getLocalized(h.outcome, loc)),
    }));
  });

  readonly metadataRows = computed(() => {
    const p = this.project();
    if (!p) return [];
    return [
      { label: 'Role', value: this.role() || '—' },
      { label: 'Stack', value: p.skills.map((s) => s.name).join(', ') || '—' },
      { label: 'Year', value: yearRange(p.startDate, p.endDate) },
      { label: 'Status', value: LIFECYCLE_STATUS_LABEL[p.lifecycleStatus] },
    ];
  });

  readonly sortedLinks = computed(() => {
    const p = this.project();
    if (!p) return [];
    return [...p.links]
      .sort((a, b) => LINK_ORDER.indexOf(a.type) - LINK_ORDER.indexOf(b.type))
      .map((link) => ({ ...link, displayLabel: link.label || LINK_TYPE_LABEL[link.type] }));
  });

  /** Sidebar ToC anchors. Uses the rich-text body's slugged headings when a body is
   *  present; otherwise synthesizes anchors from the in-template fallback sections. */
  readonly tocSections = computed<readonly InPageSection[]>(() => {
    if (this.hasBody()) {
      return this.toc().map((e) => ({ id: e.id, title: e.text }));
    }
    return FALLBACK_TOC.filter((s) => this.hasFallbackSection(s.id));
  });

  readonly breadcrumb = computed<readonly BreadcrumbItem[]>(() => {
    const p = this.project();
    return [{ label: 'Home', href: '/' }, { label: 'Projects', href: '/projects' }, { label: p?.title ?? '…' }];
  });

  readonly footerNav = computed(() => {
    const p = this.project();
    const idx = this.state().index;
    if (!p || idx.length === 0) return null;
    const pos = idx.findIndex((e) => e.slug === p.slug);
    if (pos < 0) return null;
    const next = idx[(pos + 1) % idx.length];
    return {
      position: zero(pos + 1),
      total: zero(idx.length),
      next,
    };
  });

  constructor() {
    effect(() => {
      const p = this.project();
      if (!p) return;
      this.title.setTitle(`${p.title} | Phuong Tran`);
      this.meta.updateTag({ name: 'description', content: this.oneLiner() });
      if (p.thumbnailUrl) {
        this.meta.updateTag({ property: 'og:image', content: p.thumbnailUrl });
        this.injectHeroPreload(p.thumbnailUrl);
      }
    });

    // Register TOC sections with the shared scrollspy service.
    effect(() => {
      this.scrollspy.setSections(this.tocSections());
    });
  }

  /**
   * Inject `<link rel="preload" as="image">` for the hero thumbnail so the browser
   * starts fetching it before the bundled JS even parses. Lives in `<head>` and is
   * idempotent — repeated re-renders update the existing element. SSR-friendly:
   * runs during the change-detection tick and the resulting `<link>` is serialized
   * into the response HTML.
   */
  private injectHeroPreload(thumbnailUrl: string): void {
    const head = this.document.head;
    if (!head) return;
    const { src, srcset } = buildCloudinarySrcset(thumbnailUrl, HERO_WIDTH);
    const id = 'landing-hero-preload';
    let link = head.querySelector(`link#${id}`) as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.id = id;
      link.rel = 'preload';
      link.setAttribute('as', 'image');
      link.setAttribute('fetchpriority', 'high');
      head.appendChild(link);
    }
    link.href = src;
    if (srcset) {
      link.setAttribute('imagesrcset', srcset);
    } else {
      link.removeAttribute('imagesrcset');
    }
  }

  private hasFallbackSection(id: string): boolean {
    const p = this.project();
    if (!p) return false;
    switch (id) {
      case 'overview':
        return this.description().length > 0;
      case 'motivation':
        return this.motivation().length > 0;
      case 'role':
        return this.role().length > 0;
      case 'highlights':
        return p.highlights.length > 0;
      default:
        return false;
    }
  }
}
