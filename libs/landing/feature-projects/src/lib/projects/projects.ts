import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import {
  Container,
  Chip,
  Icon,
  EmptyState,
  FilterChip,
  IconArrow,
  LoadingSpinner,
  LandingLocaleService,
  PageShell,
  ResultsCount,
  ViewToggle,
  CloudinarySrcsetPipe,
  UmamiEventDirective,
  type BreadcrumbItem,
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
import { LandingUrlStateService } from '@portfolio/landing/shared/util';
import { asyncResource } from '@portfolio/shared/async-state';
import { TranslatablePipe } from '@portfolio/shared/ui';
import { QUERY, VIEW_OPTIONS, type ProjectRow, type ViewMode } from './projects.types';
import { initialViewMode, isViewMode, parseCsvSet, yearOf } from './projects.util';

@Component({
  selector: 'landing-projects',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Container,
    Chip,
    Icon,
    EmptyState,
    FilterChip,
    IconArrow,
    LoadingSpinner,
    PageShell,
    ResultsCount,
    ViewToggle,
    TranslatablePipe,
    CloudinarySrcsetPipe,
    UmamiEventDirective,
  ],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  private readonly queryPort = inject(PROJECTS_QUERY_PORT);
  private readonly route = inject(ActivatedRoute);
  private readonly urlState = inject(LandingUrlStateService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly localeService = inject(LandingLocaleService);

  readonly locale = this.localeService.locale;
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }, { label: 'Projects' }];
  readonly viewOptions = VIEW_OPTIONS;
  readonly statuses: readonly ProjectLifecycleStatus[] = PROJECT_LIFECYCLE_STATUSES;

  private readonly initialQp = this.route.snapshot.queryParamMap;

  readonly selectedYears = signal<ReadonlySet<number>>(
    parseCsvSet(this.initialQp.get(QUERY.YEAR), (s) => {
      const n = Number(s);
      return Number.isFinite(n) && s.length > 0 ? n : null;
    })
  );
  readonly selectedStatuses = signal<ReadonlySet<ProjectLifecycleStatus>>(
    parseCsvSet(this.initialQp.get(QUERY.STATUS), (s) =>
      (PROJECT_LIFECYCLE_STATUSES as readonly string[]).includes(s) ? (s as ProjectLifecycleStatus) : null
    )
  );
  readonly selectedSkills = signal<ReadonlySet<string>>(
    parseCsvSet(this.initialQp.get(QUERY.STACK), (s) => (s ? s : null))
  );
  readonly viewMode = signal<ViewMode>(initialViewMode(this.initialQp.get(QUERY.VIEW)));

  readonly activeFilterCount = computed(
    () => this.selectedYears().size + this.selectedStatuses().size + this.selectedSkills().size
  );

  private readonly queryShape = computed<ProjectsQuery>(() => ({
    years: [...this.selectedYears()],
    statuses: [...this.selectedStatuses()],
    skills: [...this.selectedSkills()],
    sort: 'startDate-desc',
  }));

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

  private readonly facets = toSignal(this.queryPort.facetsSource(), { initialValue: [] as readonly ProjectListItem[] });

  readonly years = computed(() => distinctYears(this.facets()));
  readonly skillGroups = computed(() => groupedTopSkills(this.facets(), { perCategory: 4 }));
  readonly totalCount = computed(() => this.facets().length);

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

  readonly filtersOpen = signal(false);

  constructor() {
    const title = 'Projects | Phuong Tran';
    const description = 'Full archive of projects by Phuong Tran: what I have shipped, built, and learned from.';
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
  }

  toggleFilters(): void {
    this.filtersOpen.update((v) => !v);
  }

  toggleYear(year: number, on: boolean): void {
    const next = new Set(this.selectedYears());
    if (on) next.add(year);
    else next.delete(year);
    const sorted = [...next].sort((a, b) => b - a);
    this.selectedYears.set(new Set(sorted));
    this.writeCsv(QUERY.YEAR, sorted.map(String));
  }

  toggleStatus(status: ProjectLifecycleStatus, on: boolean): void {
    const next = new Set(this.selectedStatuses());
    if (on) next.add(status);
    else next.delete(status);
    this.selectedStatuses.set(next);
    this.writeCsv(QUERY.STATUS, [...next]);
  }

  toggleSkill(slug: string, on: boolean): void {
    const next = new Set(this.selectedSkills());
    if (on) next.add(slug);
    else next.delete(slug);
    this.selectedSkills.set(next);
    this.writeCsv(QUERY.STACK, [...next]);
  }

  setView(mode: string): void {
    const next = isViewMode(mode) ? mode : 'row';
    this.viewMode.set(next);
    this.urlState.patchQueryParams(this.route, { [QUERY.VIEW]: next === 'row' ? null : next });
  }

  clearAll(): void {
    this.selectedYears.set(new Set());
    this.selectedStatuses.set(new Set());
    this.selectedSkills.set(new Set());
    this.urlState.patchQueryParams(this.route, {
      [QUERY.YEAR]: null,
      [QUERY.STATUS]: null,
      [QUERY.STACK]: null,
    });
  }

  private writeCsv(key: string, values: readonly string[]): void {
    this.urlState.patchQueryParams(this.route, { [key]: values.length > 0 ? values.join(',') : null });
  }
}
