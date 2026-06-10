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
import { yearOf, yearRange, groupByYear } from './ddl-feed-item-variants.util';

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
