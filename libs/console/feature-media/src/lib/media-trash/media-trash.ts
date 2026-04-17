import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { SpinnerOverlayComponent, ToastService } from '@portfolio/console/shared/ui';
import { MediaService } from '../media.service';
import { MediaItem } from '../media.types';
import { formatFileSize, getMimeTypeCategory } from '../media.constants';

@Component({
  selector: 'console-media-trash',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
    SpinnerOverlayComponent,
    DatePipe,
    RouterLink,
  ],
  templateUrl: './media-trash.html',
  styleUrl: './media-trash.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MediaTrashComponent implements OnInit {
  private readonly mediaService = inject(MediaService);
  private readonly toast = inject(ToastService);

  readonly paginator = viewChild.required(MatPaginator);
  readonly displayedColumns = ['select', 'name', 'type', 'size', 'deletedAt', 'actions'];

  readonly items = signal<MediaItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly selected = signal<Set<string>>(new Set());

  readonly allSelected = computed(() => {
    const items = this.items();
    return items.length > 0 && this.selected().size === items.length;
  });

  readonly someSelected = computed(() => {
    const sel = this.selected();
    return sel.size > 0 && sel.size < this.items().length;
  });

  readonly selectedCount = computed(() => this.selected().size);

  ngOnInit(): void {
    this.loadTrash();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadTrash();
  }

  toggleAll(): void {
    if (this.allSelected()) {
      this.selected.set(new Set());
    } else {
      this.selected.set(new Set(this.items().map((i) => i.id)));
    }
  }

  toggleItem(id: string): void {
    this.selected.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  restoreItem(item: MediaItem): void {
    this.mediaService.restore(item.id).subscribe({
      next: () => {
        this.toast.success(`"${item.originalFilename}" restored`);
        this.loadTrash();
      },
      error: () => {
        this.toast.error(`Failed to restore "${item.originalFilename}"`);
      },
    });
  }

  bulkRestore(): void {
    const ids = Array.from(this.selected());
    if (ids.length === 0) return;

    let completed = 0;
    let failed = 0;
    for (const id of ids) {
      this.mediaService.restore(id).subscribe({
        next: () => {
          completed++;
          if (completed + failed === ids.length) this.onBulkComplete('restored', completed, failed);
        },
        error: () => {
          failed++;
          if (completed + failed === ids.length) this.onBulkComplete('restored', completed, failed);
        },
      });
    }
  }

  getTypeBadge(mimeType: string): string {
    return getMimeTypeCategory(mimeType);
  }

  getFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  private loadTrash(): void {
    this.loading.set(true);
    this.selected.set(new Set());
    this.mediaService.listDeleted({ page: this.pageIndex() + 1, limit: this.pageSize() }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load trash');
      },
    });
  }

  private onBulkComplete(action: string, success: number, failed: number): void {
    this.selected.set(new Set());
    this.loadTrash();
    if (failed === 0) {
      this.toast.success(`${success} item(s) ${action}`);
    } else {
      this.toast.error(`${failed} item(s) failed to ${action}`);
    }
  }
}
