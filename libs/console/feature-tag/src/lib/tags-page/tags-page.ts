import { ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  FilterBarComponent,
  FilterSearchComponent,
  ProgressBarService,
  RelativeTimeComponent,
  SkeletonTableComponent,
  ToastService,
  withListLoading,
} from '@portfolio/console/shared/ui';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@portfolio/console/shared/util';
import { TagService } from '../tag.service';
import { AdminTag } from '../tag.types';

@Component({
  selector: 'console-tags-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSortModule,
    MatChipsModule,
    SkeletonTableComponent,
    RelativeTimeComponent,
    FilterBarComponent,
    FilterSearchComponent,
    RouterLink,
  ],
  templateUrl: './tags-page.html',
  styleUrl: './tags-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TagsPageComponent implements OnInit {
  private readonly tagService = inject(TagService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly progress = inject(ProgressBarService);

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = ['name', 'slug', 'updatedAt', 'actions'];
  readonly tags = signal<AdminTag[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly search = signal('');
  readonly showDeleted = signal(false);
  readonly sortBy = signal('updatedAt');
  readonly sortDir = signal<'asc' | 'desc'>('desc');

  ngOnInit(): void {
    this.loadTags();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.resetAndLoad();
  }

  onShowDeletedChange(value: boolean): void {
    this.showDeleted.set(value);
    this.resetAndLoad();
  }

  onSortChange(sort: Sort): void {
    this.sortBy.set(sort.active || 'updatedAt');
    this.sortDir.set((sort.direction as 'asc' | 'desc') || 'desc');
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.loadTags();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadTags();
  }

  confirmDelete(tag: AdminTag): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Tag',
        message: `Are you sure you want to delete "${tag.name}"?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.deleteTag(tag.id);
    });
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.loadTags();
  }

  private loadTags(opts: { silent?: boolean } = {}): void {
    this.tagService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.search() || undefined,
        includeDeleted: this.showDeleted() || undefined,
        sortBy: this.sortBy(),
        sortDir: this.sortDir(),
      })
      .pipe(withListLoading({ silent: opts.silent, loading: this.loading, progress: this.progress }))
      .subscribe({
        next: (res) => {
          this.tags.set(res.data);
          this.total.set(res.total);
        },
      });
  }

  private deleteTag(id: string): void {
    this.tagService.delete(id).subscribe({
      next: () => {
        this.toast.success('Tag deleted successfully');
        this.loadTags({ silent: true });
      },
      error: () => {
        // Error toast handled by global error interceptor
      },
    });
  }
}
