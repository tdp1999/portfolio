import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';

import {
  BulkActionBar,
  EnumLabelPipe,
  FilterBar,
  FilterSearch,
  FilterSelect,
  ProgressBarService,
  RelativeTime,
  SkeletonTable,
  ConfirmDialogComponent,
  type ConfirmDialogData,
  ToastService,
  withListLoading,
} from '@portfolio/console/shared/ui';
import { BLOG_POST_STATUS_LABELS } from '@portfolio/shared/enum-labels';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, resolveErrorMessage } from '@portfolio/console/shared/util';
import { filter, switchMap } from 'rxjs';
import { BlogService } from '../blog.service';
import { AdminBlogPostListItem, BlogStatus, BulkPostAction, BulkPostResult, BulkPostSkip } from '../blog.types';
import { STATUS_OPTIONS } from './posts.data';

/** Appends a skip reason when there is one, so a mixed batch doesn't trail a bare separator. */
const withReason = (head: string, reason: string): string => (reason ? `${head} ${reason}` : head);

@Component({
  selector: 'console-posts',
  standalone: true,
  imports: [
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    MatSortModule,
    MatChipsModule,
    BulkActionBar,
    FilterBar,
    FilterSearch,
    FilterSelect,
    SkeletonTable,
    RelativeTime,
    EnumLabelPipe,
    RouterLink,
  ],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Posts implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly blogService = inject(BlogService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly progress = inject(ProgressBarService);
  private readonly route = inject(ActivatedRoute);

  // ── Queries ───────────────────────────────────────────────────────
  readonly paginator = viewChild.required(MatPaginator);

  // ── Writable signals ──────────────────────────────────────────────
  readonly posts = signal<AdminBlogPostListItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly status = signal('');
  readonly showDeleted = signal(false);
  readonly sortBy = signal('updatedAt');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  // ── Selection (signal-based; cleared on every list reload) ────────
  readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  readonly selectedCount = computed(() => this.selectedIds().size);
  readonly allOnPageSelected = computed(() => {
    const rows = this.posts();
    const sel = this.selectedIds();
    return rows.length > 0 && rows.every((r) => sel.has(r.id));
  });
  readonly someOnPageSelected = computed(
    () => this.posts().some((r) => this.selectedIds().has(r.id)) && !this.allOnPageSelected()
  );

  // ── Plain state ───────────────────────────────────────────────────
  readonly displayedColumns = [
    'select',
    'title',
    'status',
    'language',
    'categories',
    'publishedAt',
    'updatedAt',
    'actions',
  ];
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly statusOptions = STATUS_OPTIONS;
  readonly blogPostStatusLabels = BLOG_POST_STATUS_LABELS;

  ngOnInit(): void {
    // Deep-link from the dashboard stat cards: ?status=PUBLISHED|DRAFT pre-applies the filter.
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status && STATUS_OPTIONS.some((option) => option.value === status)) {
      this.status.set(status);
    }
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

  // ── Selection ─────────────────────────────────────────────────────
  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleRow(id: string): void {
    this.selectedIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleAllOnPage(): void {
    const rows = this.posts();
    this.selectedIds.update((prev) => {
      const allSelected = rows.length > 0 && rows.every((r) => prev.has(r.id));
      const next = new Set(prev);
      for (const r of rows) {
        if (allSelected) next.delete(r.id);
        else next.add(r.id);
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // ── Bulk actions ──────────────────────────────────────────────────
  bulkPublish(): void {
    this.bulkNoConfirm('publish', (n) => `${this.postLabel(n)} published`);
  }

  bulkUnpublish(): void {
    this.bulkNoConfirm('unpublish', (n) => `${this.postLabel(n)} moved to draft`);
  }

  bulkRestore(): void {
    this.bulkNoConfirm('restore', (n) => `${this.postLabel(n)} restored`);
  }

  bulkDelete(): void {
    const n = this.selectedCount();
    this.bulkWithConfirm(
      'delete',
      { title: 'Delete Posts', message: `Move ${this.postLabel(n)} to trash?`, confirmLabel: 'Delete' },
      (c) => `${this.postLabel(c)} deleted`
    );
  }

  bulkPermanentDelete(): void {
    const n = this.selectedCount();
    this.bulkWithConfirm(
      'permanent-delete',
      {
        title: 'Permanently Delete Posts',
        message: `Permanently delete ${this.postLabel(n)}? This cannot be undone.`,
        confirmLabel: 'Delete Forever',
      },
      (c) => `${this.postLabel(c)} permanently deleted`
    );
  }

  private postLabel(n: number): string {
    return `${n} post${n === 1 ? '' : 's'}`;
  }

  private bulkNoConfirm(action: BulkPostAction, success: (count: number) => string): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    this.blogService
      .bulk(ids, action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (result) => this.onBulkDone(result, success) });
  }

  private bulkWithConfirm(action: BulkPostAction, data: ConfirmDialogData, success: (count: number) => string): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.blogService.bulk(ids, action))
      )
      .subscribe({ next: (result) => this.onBulkDone(result, success) });
  }

  /**
   * The BE holds back posts that would break an invariant (empty draft, taken slug)
   * and reports them in `skipped`, so a bulk call is legitimately partial. Toast
   * severity follows what actually happened rather than always claiming success.
   */
  private onBulkDone({ count, skipped }: BulkPostResult, success: (count: number) => string): void {
    const reason = this.skipReason(skipped);

    if (count === 0 && skipped.length === 0) this.toast.info('No posts changed.');
    else if (count === 0)
      this.toast.error(withReason(`Nothing to do — ${this.postLabel(skipped.length)} skipped.`, reason));
    else if (skipped.length > 0)
      this.toast.warning(withReason(`${success(count)}, ${skipped.length} skipped.`, reason));
    else this.toast.success(success(count));

    this.loadPosts({ silent: true }); // reload clears the selection
  }

  /**
   * Skips of one kind get that code's dictionary copy. A mixed batch would need to
   * name several reasons at once, so it returns '' and the toast stays at the count.
   */
  private skipReason(skipped: BulkPostSkip[]): string {
    const codes = new Set(skipped.map((s) => s.errorCode));
    if (codes.size !== 1) return '';
    return resolveErrorMessage([...codes][0]) ?? '';
  }

  private loadPosts(opts: { silent?: boolean } = {}): void {
    this.clearSelection();
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
