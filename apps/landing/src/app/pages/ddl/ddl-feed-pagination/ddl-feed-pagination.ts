import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { LoadMore, Pagination, ResultsCount } from '@portfolio/landing/shared/ui';

import { DdlDecisionRecord } from '../ddl-decision-record/ddl-decision-record';
import { DdlDocPage } from '../ddl-doc-page/ddl-doc-page';
import { DdlSection } from '../ddl-section/ddl-section';
import { FAKE_PROJECTS } from '../feed-fake-data';
import { FEED_PAGINATION_VARIANTS } from './ddl-feed-pagination.data';

@Component({
  selector: 'landing-ddl-feed-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LoadMore, Pagination, ResultsCount, DdlDocPage, DdlSection, DdlDecisionRecord],
  templateUrl: './ddl-feed-pagination.html',
  styleUrl: './ddl-feed-pagination.scss',
})
export class DdlFeedPagination {
  protected readonly variants = FEED_PAGINATION_VARIANTS;

  readonly all = FAKE_PROJECTS;
  readonly total = FAKE_PROJECTS.length;
  readonly pageSize = 3;

  // V2: Load-more
  readonly loadMoreLimit = signal(3);
  readonly loadMoreVisible = computed(() => this.all.slice(0, this.loadMoreLimit()));

  // V3: Paged
  readonly currentPage = signal(1);
  readonly totalPages = computed(() => Math.ceil(this.total / this.pageSize));
  readonly pagedVisible = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.all.slice(start, start + this.pageSize);
  });

  loadMore(): void {
    this.loadMoreLimit.update((n) => Math.min(n + this.pageSize, this.total));
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }
}
