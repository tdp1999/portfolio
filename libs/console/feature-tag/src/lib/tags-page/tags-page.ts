import { ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { extractApiError } from '@portfolio/console/shared/data-access';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  FilterBarComponent,
  FilterSearchComponent,
  SpinnerOverlayComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import { AdminTag, TagService } from '../tag.service';
import { TagDialogData } from '../tag-dialog/tag-dialog';

@Component({
  selector: 'console-tags-page',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    SpinnerOverlayComponent,
    FilterBarComponent,
    FilterSearchComponent,
    DatePipe,
  ],
  templateUrl: './tags-page.html',
  styleUrl: './tags-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TagsPageComponent implements OnInit {
  private readonly tagService = inject(TagService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = ['name', 'slug', 'createdAt', 'actions'];
  readonly tags = signal<AdminTag[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly search = signal('');

  ngOnInit(): void {
    this.loadTags();
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.resetAndLoad();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadTags();
  }

  openCreateDialog(): void {
    import('../tag-dialog/tag-dialog').then((m) => {
      const dialogRef = this.dialog.open(m.default, { width: '400px' });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.toast.success('Tag created successfully');
          this.loadTags();
        }
      });
    });
  }

  openEditDialog(tag: AdminTag): void {
    import('../tag-dialog/tag-dialog').then((m) => {
      const dialogRef = this.dialog.open(m.default, {
        width: '400px',
        data: { tag } satisfies TagDialogData,
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.toast.success('Tag updated successfully');
          this.loadTags();
        }
      });
    });
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

  private loadTags(): void {
    this.loading.set(true);
    this.tagService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.search() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.tags.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Failed to load tags');
        },
      });
  }

  private deleteTag(id: string): void {
    this.tagService.delete(id).subscribe({
      next: () => {
        this.toast.success('Tag deleted successfully');
        this.loadTags();
      },
      error: (err) => {
        const apiError = extractApiError(err);
        this.toast.error(apiError?.message ?? 'Failed to delete tag');
      },
    });
  }
}
