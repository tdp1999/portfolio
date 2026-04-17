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
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import {
  FilterBarComponent,
  FilterSearchComponent,
  FilterSelectComponent,
  type FilterOption,
  SpinnerOverlayComponent,
  ConfirmDialogComponent,
  type ConfirmDialogData,
  ToastService,
} from '@portfolio/console/shared/ui';
import { filter, switchMap } from 'rxjs';
import { BlogService } from '../blog.service';
import { AdminBlogPostListItem, BlogStatus } from '../blog.types';

const STATUS_OPTIONS: FilterOption[] = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'UNLISTED', label: 'Unlisted' },
  { value: 'PRIVATE', label: 'Private' },
  { value: 'TRASH', label: 'Trash' },
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
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
    SpinnerOverlayComponent,
  ],
  templateUrl: './posts-page.html',
  styleUrl: './posts-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PostsPageComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = ['title', 'status', 'language', 'categories', 'publishedAt', 'actions'];

  readonly posts = signal<AdminBlogPostListItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly search = signal('');
  readonly status = signal('');
  readonly statusOptions = STATUS_OPTIONS;

  readonly isTrashTab = computed(() => this.status() === 'TRASH');

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

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadPosts();
  }

  goToNew(): void {
    this.router.navigate(['/admin/blog/new']);
  }

  goToEdit(post: AdminBlogPostListItem): void {
    this.router.navigate(['/admin/blog', post.id, 'edit']);
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
          this.loadPosts();
        },
        error: () => this.toast.error('Failed to delete post'),
      });
  }

  restorePost(post: AdminBlogPostListItem): void {
    this.blogService.restore(post.id).subscribe({
      next: () => {
        this.toast.success('Post restored');
        this.loadPosts();
      },
      error: () => this.toast.error('Failed to restore post'),
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
          this.loadPosts();
        },
        error: () => this.toast.error('Failed to delete post'),
      });
  }

  private loadPosts(): void {
    this.loading.set(true);
    const isTrash = this.isTrashTab();
    const statusValue = this.status();
    this.blogService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        status: (isTrash ? undefined : statusValue || undefined) as BlogStatus | undefined,
        includeDeleted: isTrash || undefined,
        search: this.search() || undefined,
      })
      .subscribe({
        next: (res) => {
          const data = isTrash ? res.data.filter((p) => p.deletedAt) : res.data;
          this.posts.set(data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Failed to load posts');
          this.loading.set(false);
        },
      });
  }
}
