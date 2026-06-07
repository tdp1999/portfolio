import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import {
  Container,
  Eyebrow,
  Breadcrumb,
  SectionHeader,
  IconArrow,
  Chip,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import { FAKE_PROJECTS } from '../feed-fake-data';
import type { ProjectListItem } from '@portfolio/landing/shared/data-access';

function yearOf(iso: string): string {
  return String(new Date(iso).getFullYear());
}

function yearRange(start: string, end: string | null): string {
  const s = yearOf(start);
  if (!end) return `${s} →`;
  const e = yearOf(end);
  return s === e ? s : `${s} – ${e}`;
}

/** Group projects by start year, sorted year desc. */
function groupByYear(projects: readonly ProjectListItem[]): { year: string; items: readonly ProjectListItem[] }[] {
  const map = new Map<string, ProjectListItem[]>();
  for (const p of projects) {
    const y = yearOf(p.startDate);
    const list = map.get(y) ?? [];
    list.push(p);
    map.set(y, list);
  }
  return [...map.entries()].sort(([a], [b]) => Number(b) - Number(a)).map(([year, items]) => ({ year, items }));
}

@Component({
  selector: 'landing-ddl-feed-item-variants',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Container, Eyebrow, Breadcrumb, SectionHeader, IconArrow, Chip],
  templateUrl: './ddl-feed-item-variants.html',
  styleUrl: './ddl-feed-item-variants.scss',
})
export class DdlFeedItemVariants {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Feed — item variants' }];

  readonly projects = FAKE_PROJECTS;
  readonly previewProjects = computed(() => this.projects.slice(0, 4));
  readonly grouped = computed(() => groupByYear(this.projects));

  yearOf = yearOf;
  yearRange = yearRange;

  statusToneClass(s: string): string {
    return `status-pill status-pill--${s.toLowerCase()}`;
  }
}
