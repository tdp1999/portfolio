import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { distinctYears, groupedTopSkills } from '@portfolio/landing/shared/data-access';
import {
  ChipComponent,
  ContainerComponent,
  EyebrowComponent,
  IconComponent,
  LandingBreadcrumbComponent,
  LandingFilterChipComponent,
  LandingIconArrowComponent,
  LandingResultsCountComponent,
  LandingSectionHeaderComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import { FAKE_PROJECTS, LIFECYCLE_STATUSES } from '../feed-fake-data';

@Component({
  selector: 'landing-feed-filter-bar-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ContainerComponent,
    EyebrowComponent,
    LandingBreadcrumbComponent,
    LandingSectionHeaderComponent,
    LandingFilterChipComponent,
    LandingResultsCountComponent,
    LandingIconArrowComponent,
    ChipComponent,
    IconComponent,
  ],
  templateUrl: './feed-filter-bar.page.html',
  styleUrl: './feed-filter-bar.page.scss',
})
export class FeedFilterBarPage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Feed — filter bar' }];

  readonly years = distinctYears(FAKE_PROJECTS);
  readonly statuses = LIFECYCLE_STATUSES;
  readonly skillGroups = groupedTopSkills(FAKE_PROJECTS, { perCategory: 4 });

  // V1 demo — collapsed by default; user toggles to expand
  readonly v1FiltersOpen = signal(false);

  // Demo selection state — only wires V1 (chip-row inline) to reactive filter
  readonly selectedYears = signal<Set<number>>(new Set());
  readonly selectedStatuses = signal<Set<string>>(new Set());
  readonly selectedSkills = signal<Set<string>>(new Set());

  // Visual-only state for non-V1 demos
  readonly v2OpenFacet = signal<string | null>(null);
  readonly v3CollapsedSections = signal<Set<string>>(new Set());
  readonly v4Search = signal('');

  readonly filteredProjects = computed(() => {
    const years = this.selectedYears();
    const statuses = this.selectedStatuses();
    const skills = this.selectedSkills();
    return FAKE_PROJECTS.filter((p) => {
      if (years.size > 0 && !years.has(new Date(p.startDate).getFullYear())) return false;
      if (statuses.size > 0 && !statuses.has(p.lifecycleStatus)) return false;
      if (skills.size > 0 && !p.skills.some((s) => skills.has(s.slug))) return false;
      return true;
    });
  });

  readonly filteredCount = computed(() => this.filteredProjects().length);

  readonly activeFilterCount = computed(
    () => this.selectedYears().size + this.selectedStatuses().size + this.selectedSkills().size
  );

  toggleV1Filters(): void {
    this.v1FiltersOpen.update((v) => !v);
  }

  yearOf(iso: string): string {
    return String(new Date(iso).getFullYear());
  }

  toggleYear(year: number, on: boolean): void {
    const next = new Set(this.selectedYears());
    if (on) next.add(year);
    else next.delete(year);
    this.selectedYears.set(next);
  }

  toggleStatus(status: string, on: boolean): void {
    const next = new Set(this.selectedStatuses());
    if (on) next.add(status);
    else next.delete(status);
    this.selectedStatuses.set(next);
  }

  toggleSkill(slug: string, on: boolean): void {
    const next = new Set(this.selectedSkills());
    if (on) next.add(slug);
    else next.delete(slug);
    this.selectedSkills.set(next);
  }

  clearAll(): void {
    this.selectedYears.set(new Set());
    this.selectedStatuses.set(new Set());
    this.selectedSkills.set(new Set());
  }

  readonly hasFilters = computed(
    () => this.selectedYears().size + this.selectedStatuses().size + this.selectedSkills().size > 0
  );

  readonly total = FAKE_PROJECTS.length;

  toggleV2Facet(name: string): void {
    this.v2OpenFacet.set(this.v2OpenFacet() === name ? null : name);
  }

  toggleV3Section(name: string): void {
    const next = new Set(this.v3CollapsedSections());
    if (next.has(name)) next.delete(name);
    else next.add(name);
    this.v3CollapsedSections.set(next);
  }

  v3SectionExpanded(name: string): boolean {
    return !this.v3CollapsedSections().has(name);
  }
}
