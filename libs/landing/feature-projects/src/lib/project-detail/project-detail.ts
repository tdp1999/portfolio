import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  TransferState,
  computed,
  effect,
  inject,
  makeStateKey,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta, DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, from, of, map, combineLatest } from 'rxjs';
import {
  ContainerComponent,
  SectionComponent,
  LandingEmptyStateComponent,
  LandingHeadingComponent,
  LandingLinkComponent,
  LandingProseAnchorsDirective,
  LandingScrollspyService,
  LandingTocSidebarComponent,
  EyebrowComponent,
  LandingBreadcrumbComponent,
  LandingBrowserWindowComponent,
  type BreadcrumbItem,
  type InPageSection,
} from '@portfolio/landing/shared/ui';
import {
  ProjectDataService,
  MarkdownService,
  type ProjectDetail,
  type ProjectListItem,
  type ProjectLinkType,
  type RenderedMarkdown,
  type TocEntry,
} from '@portfolio/landing/shared/data-access';
import { TranslatablePipe } from '@portfolio/shared/ui/pipes';
import { getLocalized } from '@portfolio/shared/utils';
import type { Locale } from '@portfolio/shared/types';

const EMPTY_RENDER: RenderedMarkdown = { html: '', toc: [] };

type ProjectIndexEntry = { readonly slug: string; readonly title: string };

type DetailState = {
  readonly project: ProjectDetail | null;
  readonly rendered: RenderedMarkdown;
  readonly index: readonly ProjectIndexEntry[];
  /** `false` for the toSignal initial value, `true` for every emission from the fetch
   *  pipeline. Lets `notFound` distinguish "still loading" from "loaded with no match". */
  readonly loaded: boolean;
};

const LINK_ORDER: readonly ProjectLinkType[] = ['repo', 'demo', 'case-study', 'doc', 'post'];
const LINK_TYPE_LABEL: Record<ProjectLinkType, string> = {
  repo: 'Repository',
  demo: 'Live demo',
  'case-study': 'Case study',
  doc: 'Documentation',
  post: 'Write-up',
};

const LIFECYCLE_STATUS_LABEL: Record<'LIVE' | 'SHIPPED' | 'ARCHIVED' | 'BETA' | 'ONGOING', string> = {
  LIVE: 'Live',
  SHIPPED: 'Shipped',
  ARCHIVED: 'Archived',
  BETA: 'Beta',
  ONGOING: 'Ongoing',
};

@Component({
  selector: 'landing-project-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    RouterLink,
    ContainerComponent,
    SectionComponent,
    LandingEmptyStateComponent,
    LandingHeadingComponent,
    LandingLinkComponent,
    LandingProseAnchorsDirective,
    LandingTocSidebarComponent,
    LandingBreadcrumbComponent,
    LandingBrowserWindowComponent,
    EyebrowComponent,
    TranslatablePipe,
  ],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
})
export class ProjectDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectDataService);
  private readonly markdown = inject(MarkdownService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly transferState = inject(TransferState);
  private readonly scrollspy = inject(LandingScrollspyService);

  readonly locale = signal<Locale>('en');

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
          switchMap(([project, list]) => {
            const index = sortedIndex(list);
            if (!project) {
              return of<DetailState>({ project: null, rendered: EMPTY_RENDER, index, loaded: true });
            }
            const md = getLocalized(project.body, this.locale());
            const render$ = md
              ? from(this.markdown.render(md, { basePath: `/projects/${project.slug}` }))
              : of(EMPTY_RENDER);
            return render$.pipe(
              map((rendered): DetailState => {
                const next: DetailState = { project, rendered, index, loaded: true };
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
    { initialValue: { project: null, rendered: EMPTY_RENDER, index: [], loaded: false } satisfies DetailState }
  );

  readonly project = computed(() => this.state().project);
  readonly toc = computed<readonly TocEntry[]>(() => this.state().rendered.toc);
  // Markdown source is repo-controlled (lives in project content fields written by the site
  // owner, not user input), so the `marked` output is trusted as-is without DOMPurify. If
  // user-submitted markdown ever flows through this path, add sanitization here first.
  readonly contentHtml = computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(this.state().rendered.html));

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

  /** Sidebar ToC anchors. Uses markdown-derived headings when body is present;
   *  otherwise synthesizes anchors from the in-template fallback sections. */
  readonly tocSections = computed<readonly InPageSection[]>(() => {
    const entries = this.toc();
    if (entries.length > 0) {
      return entries.map((e) => ({ id: e.id, title: e.text }));
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
      }
    });

    // Register TOC sections with the shared scrollspy service.
    effect(() => {
      this.scrollspy.setSections(this.tocSections());
    });
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

const FALLBACK_TOC: readonly InPageSection[] = [
  { id: 'overview', title: 'Overview' },
  { id: 'motivation', title: 'Motivation' },
  { id: 'role', title: 'My role' },
  { id: 'highlights', title: 'Highlights' },
];

function sortedIndex(list: readonly ProjectListItem[]): readonly ProjectIndexEntry[] {
  return [...list]
    .sort((a, b) => (a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0))
    .map((p) => ({ slug: p.slug, title: p.title }));
}

function yearRange(start: string, end: string | null): string {
  const s = new Date(start).getFullYear();
  const e = end ? new Date(end).getFullYear() : null;
  if (!Number.isFinite(s)) return '—';
  if (e === null) return `${s} → Present`;
  return s === e ? String(s) : `${s} → ${e}`;
}

function zero(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
