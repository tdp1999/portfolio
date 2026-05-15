import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  ContainerComponent,
  EyebrowComponent,
  LandingBreadcrumbComponent,
  LandingSectionHeaderComponent,
  LandingLoadMoreComponent,
  LandingPaginationComponent,
  LandingResultsCountComponent,
  type BreadcrumbItem,
} from '@portfolio/landing/shared/ui';
import { FAKE_PROJECTS } from '../feed-fake-data';

@Component({
  selector: 'landing-feed-pagination-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ContainerComponent,
    EyebrowComponent,
    LandingBreadcrumbComponent,
    LandingSectionHeaderComponent,
    LandingLoadMoreComponent,
    LandingPaginationComponent,
    LandingResultsCountComponent,
  ],
  templateUrl: './feed-pagination.page.html',
  styleUrl: './feed-pagination.page.scss',
})
export class FeedPaginationPage {
  readonly breadcrumb: readonly BreadcrumbItem[] = [{ label: 'DDL', href: '/ddl' }, { label: 'Feed — pagination' }];

  readonly all = FAKE_PROJECTS;
  readonly total = FAKE_PROJECTS.length;
  readonly pageSize = 3;

  // V2: Load-more
  readonly loadMoreLimit = signal(3);
  readonly loadMoreVisible = computed(() => this.all.slice(0, this.loadMoreLimit()));

  loadMore(): void {
    this.loadMoreLimit.update((n) => Math.min(n + this.pageSize, this.total));
  }

  // V3: Paged
  readonly currentPage = signal(1);
  readonly totalPages = computed(() => Math.ceil(this.total / this.pageSize));
  readonly pagedVisible = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.all.slice(start, start + this.pageSize);
  });

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }
}
