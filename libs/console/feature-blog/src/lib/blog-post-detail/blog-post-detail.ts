import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  EnumLabelPipe,
  SpinnerOverlayComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import { BLOG_POST_STATUS_LABELS } from '@portfolio/shared/enum-labels';
import { filter, switchMap } from 'rxjs';
import { BlogService } from '../blog.service';
import { AdminBlogPostDetail, BlogStatus } from '../blog.types';
import { renderMarkdownPreview } from '../post-form-page/markdown-utils';

@Component({
  selector: 'console-blog-post-detail',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    SpinnerOverlayComponent,
    EnumLabelPipe,
    RouterLink,
  ],
  templateUrl: './blog-post-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlogPostDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogService = inject(BlogService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly post = signal<AdminBlogPostDetail | null>(null);
  readonly loading = signal(false);

  readonly statusLabels = BLOG_POST_STATUS_LABELS;

  readonly renderedBody = computed(() => {
    const p = this.post();
    return p?.content ? renderMarkdownPreview(p.content) : '';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadPost(id);
  }

  goBack(): void {
    this.router.navigate(['/admin/blog']);
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

  togglePublish(): void {
    const p = this.post();
    if (!p) return;
    const nextStatus: BlogStatus = p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    const action = nextStatus === 'PUBLISHED' ? 'Publish' : 'Unpublish';
    this.blogService.update(p.id, { status: nextStatus }).subscribe({
      next: () => {
        this.toast.success(`Post ${action.toLowerCase()}ed`);
        this.loadPost(p.id);
      },
    });
  }

  confirmDelete(): void {
    const p = this.post();
    if (!p) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Post',
        message: `Move "${p.title}" to trash?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.blogService.delete(p.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Post deleted');
          this.goBack();
        },
      });
  }

  confirmRestore(): void {
    const p = this.post();
    if (!p) return;
    this.blogService.restore(p.id).subscribe({
      next: () => {
        this.toast.success('Post restored');
        this.loadPost(p.id);
      },
    });
  }

  private loadPost(id: string): void {
    this.loading.set(true);
    this.blogService.getById(id).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.goBack();
      },
    });
  }
}
