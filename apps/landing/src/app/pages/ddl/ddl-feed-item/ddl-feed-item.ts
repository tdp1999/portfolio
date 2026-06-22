import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { Chip, IconArrow } from '@portfolio/landing/shared/ui';

import { FAKE_PROJECTS } from '../feed-fake-data';
import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { FEED_ITEM_VARIANTS } from './ddl-feed-item.data';
import { groupByYear, yearOf, yearRange } from './ddl-feed-item.util';

@Component({
  selector: 'landing-ddl-feed-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Chip, IconArrow, DdlDocPage, DdlSection, DdlDecisionRecord],
  templateUrl: './ddl-feed-item.html',
  styleUrl: './ddl-feed-item.scss',
})
export class DdlFeedItem {
  protected readonly variants = FEED_ITEM_VARIANTS;

  readonly projects = FAKE_PROJECTS;
  readonly previewProjects = computed(() => this.projects.slice(0, 4));
  readonly grouped = computed(() => groupByYear(this.projects));

  yearOf = yearOf;
  yearRange = yearRange;

  statusToneClass(s: string): string {
    return `status-pill status-pill--${s.toLowerCase()}`;
  }
}
