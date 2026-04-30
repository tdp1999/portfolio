import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';

import {
  EnumLabelPipe,
  FilterBarComponent,
  FilterSearchComponent,
  FilterSelectComponent,
  type FilterOption,
  ProgressBarService,
  RelativeTimeComponent,
  SkeletonTableComponent,
  ConfirmDialogComponent,
  type ConfirmDialogData,
  ToastService,
  withListLoading,
} from '@portfolio/console/shared/ui';
import { BLOG_POST_STATUS_LABELS } from '@portfolio/shared/enum-labels';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@portfolio/console/shared/util';
import { filter, switchMap } from 'rxjs';
import { BlogService } from '../blog.service';
import { AdminBlogPostListItem, BlogStatus } from '../blog.types';

const STATUS_OPTIONS: FilterOption[] = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'UNLISTED', label: 'Unlisted' },
  { value: 'PRIVATE', label: 'Private' },
];

@Component({
  selector: 'console-posts-page',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSortModule,
    MatChipsModule,
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
    SkeletonTableComponent,
    RelativeTimeComponent,
    EnumLabelPipe,
    RouterLink,
  ],
  templateUrl: './posts-page.html',
  styleUrl: './posts-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PostsPageComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly progress = inject(ProgressBarService);

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = ['title', 'status', 'language', 'categories', 'publishedAt', 'updatedAt', 'actions'];

  readonly posts = signal<AdminBlogPostListItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly search = signal('');
  readonly status = signal('');
  readonly statusOptions = STATUS_OPTIONS;

  readonly blogPostStatusLabels = BLOG_POST_STATUS_LABELS;
  readonly showDeleted = signal(false);
  readonly sortBy = signal('updatedAt');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  ngOnInit(): void {
    this.loadPosts();
  }

  onStatusChange(value: string): void {
    this.status.set(value);
    this.pageIndex.set(0);
    this.loadPosts();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.pageIndex.set(0);
    this.loadPosts();
  }

  onShowDeletedChange(value: boolean): void {
    this.showDeleted.set(value);
    this.pageIndex.set(0);
    this.loadPosts();
  }

  onSortChange(sort: Sort): void {
    this.sortBy.set(sort.active || 'updatedAt');
    this.sortDir.set((sort.direction as 'asc' | 'desc') || 'desc');
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.loadPosts();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadPosts();
  }

  categoryNames(post: AdminBlogPostListItem): string {
    return post.categories.map((c) => c.name).join(', ');
  }

  statusBadgeClass(status: BlogStatus): string {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      case 'PRIVATE':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'UNLISTED':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  confirmDelete(post: AdminBlogPostListItem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Post',
        message: `Move "${post.title}" to trash?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.blogService.delete(post.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Post deleted');
          this.loadPosts({ silent: true });
        },
      });
  }

  restorePost(post: AdminBlogPostListItem): void {
    this.blogService.restore(post.id).subscribe({
      next: () => {
        this.toast.success('Post restored');
        this.loadPosts({ silent: true });
      },
    });
  }

  confirmPermanentDelete(post: AdminBlogPostListItem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Permanently Delete Post',
        message: `Permanently delete "${post.title}"? This cannot be undone.`,
        confirmLabel: 'Delete Forever',
      } satisfies ConfirmDialogData,
    });
    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.blogService.delete(post.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Post permanently deleted');
          this.loadPosts({ silent: true });
        },
      });
  }

  private loadPosts(opts: { silent?: boolean } = {}): void {
    this.blogService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        status: (this.status() as BlogStatus | undefined) || undefined,
        includeDeleted: this.showDeleted() || undefined,
        search: this.search() || undefined,
        sortBy: this.sortBy(),
        sortDir: this.sortDir(),
      })
      .pipe(withListLoading({ silent: opts.silent, loading: this.loading, progress: this.progress }))
      .subscribe({
        next: (res) => {
          this.posts.set(res.data);
          this.total.set(res.total);
        },
      });
  }
}
