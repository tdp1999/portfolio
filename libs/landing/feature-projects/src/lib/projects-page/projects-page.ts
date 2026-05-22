import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import {
  ContainerComponent,
  ChipComponent,
  IconComponent,
  LandingEmptyStateComponent,
  LandingFilterChipComponent,
  LandingIconArrowComponent,
  LandingLoadingSpinnerComponent,
  LandingLocaleService,
  LandingPageShellComponent,
  LandingResultsCountComponent,
  LandingViewToggleComponent,
  CloudinarySrcsetPipe,
  type BreadcrumbItem,
  type ViewToggleOption,
} from '@portfolio/landing/shared/ui';
import {
  PROJECTS_QUERY_PORT,
  PROJECT_LIFECYCLE_STATUSES,
  distinctYears,
  groupedTopSkills,
  type ProjectListItem,
  type ProjectLifecycleStatus,
  type ProjectsQuery,
  type ProjectsQueryResult,
} from '@portfolio/landing/shared/data-access';
import { asyncResource } from '@portfolio/shared/async-state';
import { TranslatablePipe } from '@portfolio/shared/ui/pipes';

const QUERY = { YEAR: 'year', STATUS: 'status', STACK: 'stack', VIEW: 'view' } as const;

const VIEW_MODES = ['row', 'grid', 'timeline'] as const;
type ViewMode = (typeof VIEW_MODES)[number];

const VIEW_OPTIONS: readonly ViewToggleOption[] = [
  {
    id: 'row',
    label: 'Row',
    icon: 'list',
    description: 'List View.',
  },
  {
    id: 'grid',
    label: 'Grid',
    icon: 'layout-grid',
    description: 'Grid View.',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: 'history',
    description: 'Timeline View, grouped by year.',
  },
];

type ProjectRow = ProjectListItem & { readonly year: string };

function parseCsvSet<T>(raw: string | null, parse: (s: string) => T | null): Set<T> {
  if (!raw) return new Set();
  const out = new Set<T>();
  for (const part of raw.split(',')) {
    const v = parse(part.trim());
    if (v !== null) out.add(v);
  }
  return out;
}

function isViewMode(v: string | null): v is ViewMode {
  return v != null && (VIEW_MODES as readonly string[]).includes(v);
}

@Component({
  selector: 'landing-projects-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ContainerComponent,
    ChipComponent,
    IconComponent,
    LandingEmptyStateComponent,
    LandingFilterChipComponent,
    LandingIconArrowComponent,
    LandingLoadingSpinnerComponent,
    LandingPageShellComponent,
    LandingResultsCountComponent,
    LandingViewToggleComponent,
    TranslatablePipe,
    CloudinarySrcsetPipe,
  ],
  templateUrl: './projects-page.html',
  styleUrl: './projects-page.scss',
})
export class ProjectsPage {
  private readonly queryPort = inject(PROJECTS_QUERY_PORT);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  constructor() {
    this.title.setTitle('Projects | Phuong Tran');
    this.meta.updateTag({
      name: 'description',
      content: 'Full archive of projects by Phuong Tran — what I have shipped, built, and learned from.',
    });
  }

  private readonly localeService = inject(LandingLocaleService);
  readonly locale = this.localeService.locale;
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Projects' }];
  readonly viewOptions = VIEW_OPTIONS;
  readonly statuses: readonly ProjectLifecycleStatus[] = PROJECT_LIFECYCLE_STATUSES;

  // ─── URL-derived state ───────────────────────────────────────
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly selectedYears = computed(() =>
    parseCsvSet(this.queryParams().get(QUERY.YEAR), (s) => {
      const n = Number(s);
      return Number.isFinite(n) && s.length > 0 ? n : null;
    })
  );
  readonly selectedStatuses = computed(() =>
    parseCsvSet(this.queryParams().get(QUERY.STATUS), (s) =>
      (PROJECT_LIFECYCLE_STATUSES as readonly string[]).includes(s) ? (s as ProjectLifecycleStatus) : null
    )
  );
  readonly selectedSkills = computed(() => parseCsvSet(this.queryParams().get(QUERY.STACK), (s) => (s ? s : null)));
  readonly viewMode = computed<ViewMode>(() => {
    const raw = this.queryParams().get(QUERY.VIEW);
    return isViewMode(raw) ? raw : 'row';
  });

  readonly activeFilterCount = computed(
    () => this.selectedYears().size + this.selectedStatuses().size + this.selectedSkills().size
  );

  // ─── Query the port (today FE adapter; tomorrow could be BE) ─
  private readonly queryShape = computed<ProjectsQuery>(() => ({
    years: [...this.selectedYears()],
    statuses: [...this.selectedStatuses()],
    skills: [...this.selectedSkills()],
    sort: 'startDate-desc',
  }));

  // `startWith({ kind: 'loading' })` inside the switchMap is what lets `asyncResource`
  // distinguish "still fetching" from "loaded but empty" so the spinner shows on cold loads
  // (e.g. client-side nav into /projects) instead of flashing the empty state.
  private readonly resource = asyncResource<ProjectsQueryResult>(
    toObservable(this.queryShape).pipe(switchMap((q) => this.queryPort.query(q))),
    {
      initialValue: { items: [] as readonly ProjectListItem[], total: 0, hasMore: false },
      isEmpty: (r) => r.items.length === 0,
    }
  );

  readonly showSpinner = this.resource.showSpinner;

  readonly rows = computed<readonly ProjectRow[]>(() =>
    this.resource.data().items.map((p) => ({ ...p, year: yearOf(p.startDate) }))
  );
  readonly visibleCount = computed(() => this.rows().length);

  // ─── Facets — full list for year + top-N skill chips ─────────
  private readonly facets = toSignal(this.queryPort.facetsSource(), { initialValue: [] as readonly ProjectListItem[] });

  readonly years = computed(() => distinctYears(this.facets()));
  readonly skillGroups = computed(() => groupedTopSkills(this.facets(), { perCategory: 4 }));
  readonly totalCount = computed(() => this.facets().length);

  // ─── Timeline grouping — year buckets, sorted year desc ──────
  readonly groupedByYear = computed(() => {
    const map = new Map<string, ProjectRow[]>();
    for (const r of this.rows()) {
      const list = map.get(r.year) ?? [];
      list.push(r);
      map.set(r.year, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, items]) => ({ year, items: items as readonly ProjectRow[] }));
  });

  // ─── Filter panel collapse ───────────────────────────────────
  readonly filtersOpen = signal(false);

  toggleFilters(): void {
    this.filtersOpen.update((v) => !v);
  }

  // ─── Mutations → URL ─────────────────────────────────────────
  toggleYear(year: number, on: boolean): void {
    const next = new Set(this.selectedYears());
    if (on) next.add(year);
    else next.delete(year);
    this.writeQuery(QUERY.YEAR, [...next].sort((a, b) => b - a).map(String));
  }

  toggleStatus(status: ProjectLifecycleStatus, on: boolean): void {
    const next = new Set(this.selectedStatuses());
    if (on) next.add(status);
    else next.delete(status);
    this.writeQuery(QUERY.STATUS, [...next]);
  }

  toggleSkill(slug: string, on: boolean): void {
    const next = new Set(this.selectedSkills());
    if (on) next.add(slug);
    else next.delete(slug);
    this.writeQuery(QUERY.STACK, [...next]);
  }

  setView(mode: string): void {
    const next = isViewMode(mode) ? mode : 'row';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [QUERY.VIEW]: next === 'row' ? null : next },
      queryParamsHandling: 'merge',
    });
  }

  clearAll(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [QUERY.YEAR]: null, [QUERY.STATUS]: null, [QUERY.STACK]: null },
      queryParamsHandling: 'merge',
    });
  }

  private writeQuery(key: string, values: readonly string[]): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: values.length > 0 ? values.join(',') : null },
      queryParamsHandling: 'merge',
    });
  }
}

function yearOf(iso: string): string {
  const y = new Date(iso).getFullYear();
  return Number.isFinite(y) ? String(y) : '';
}
