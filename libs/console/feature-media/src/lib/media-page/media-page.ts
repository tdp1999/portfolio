import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { extractApiError } from '@portfolio/console/shared/data-access';
import {
  ConfirmDialogComponent,
  type ConfirmDialogData,
  FilterBarComponent,
  FilterSearchComponent,
  FilterSelectComponent,
  type FilterOption,
  SpinnerOverlayComponent,
  ToastService,
} from '@portfolio/console/shared/ui';
import { MediaService } from '../media.service';
import { MediaItem, StorageStats } from '../media.types';
import { RouterLink } from '@angular/router';
import { UploadDropzoneComponent } from '../upload-dropzone/upload-dropzone';
import { MediaDialogData } from '../media-dialog/media-dialog.types';
import { formatFileSize, getMimeTypeCategory, MIME_TYPE_FILTERS } from '../media.constants';

interface FileUpload {
  file: File;
  progress: number;
  done: boolean;
  error: string | null;
}

type ViewMode = 'grid' | 'list';
const VIEW_MODE_KEY = 'media-view-mode';

@Component({
  selector: 'console-media-page',
  standalone: true,
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
    MatChipsModule,
    RouterLink,
    SpinnerOverlayComponent,
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
    UploadDropzoneComponent,
    DatePipe,
  ],
  templateUrl: './media-page.html',
  styleUrl: './media-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MediaPageComponent implements OnInit {
  private readonly mediaService = inject(MediaService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly paginator = viewChild.required(MatPaginator);

  // Data
  readonly media = signal<MediaItem[]>([]);
  readonly total = signal(0);
  readonly stats = signal<StorageStats | null>(null);
  readonly trashCount = signal(0);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly uploads = signal<FileUpload[]>([]);

  // Filters
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly search = signal('');
  readonly mimeFilter = signal('');
  private readonly platformId = inject(PLATFORM_ID);
  readonly viewMode = signal<ViewMode>('grid');

  // Selection
  readonly selected = signal<Set<string>>(new Set());

  // Table columns
  readonly displayedColumns = ['select', 'thumbnail', 'name', 'type', 'size', 'date', 'actions'];

  // Filter options
  readonly mimeOptions: FilterOption[] = MIME_TYPE_FILTERS.map((f) => ({ value: f.value, label: f.label }));

  // Computed
  readonly hasUploads = computed(() => this.uploads().length > 0);
  readonly selectedCount = computed(() => this.selected().size);
  readonly allSelected = computed(() => {
    const items = this.media();
    return items.length > 0 && this.selected().size === items.length;
  });
  readonly someSelected = computed(() => {
    const sel = this.selected();
    return sel.size > 0 && sel.size < this.media().length;
  });
  readonly statsFormatted = computed(() => {
    const s = this.stats();
    if (!s) return null;
    return {
      totalFiles: s.totalFiles,
      totalSize: formatFileSize(s.totalBytes),
      breakdown: (s.breakdown ?? []).map((item) => ({
        type: getMimeTypeCategory(item.mimeTypePrefix),
        count: item.count,
        size: formatFileSize(item.bytes),
      })),
    };
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(VIEW_MODE_KEY) as ViewMode;
      if (saved) this.viewMode.set(saved);
    }
    this.loadMedia();
    this.loadStats();
    this.loadTrashCount();
  }

  // --- View ---

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    }
  }

  // --- Filters ---

  onSearchChange(value: string): void {
    this.search.set(value);
    this.resetAndLoad();
  }

  onMimeFilterChange(value: string): void {
    this.mimeFilter.set(value);
    this.resetAndLoad();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadMedia();
  }

  // --- Upload ---

  onFilesSelected(files: File[]): void {
    this.uploading.set(true);
    const fileUploads: FileUpload[] = files.map((f) => ({ file: f, progress: 0, done: false, error: null }));
    this.uploads.set(fileUploads);

    let completed = 0;
    for (let i = 0; i < files.length; i++) {
      this.mediaService.upload(files[i]).subscribe({
        next: () => {
          this.uploads.update((list) => list.map((u, idx) => (idx === i ? { ...u, progress: 100, done: true } : u)));
          completed++;
          if (completed === files.length) this.onAllUploadsComplete();
        },
        error: (err) => {
          const apiError = extractApiError(err);
          this.uploads.update((list) =>
            list.map((u, idx) => (idx === i ? { ...u, error: apiError.message, done: true } : u))
          );
          completed++;
          if (completed === files.length) this.onAllUploadsComplete();
        },
      });
    }
  }

  dismissUploads(): void {
    this.uploads.set([]);
  }

  // --- Selection ---

  toggleAll(): void {
    if (this.allSelected()) {
      this.selected.set(new Set());
    } else {
      this.selected.set(new Set(this.media().map((i) => i.id)));
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

  bulkDelete(): void {
    const ids = Array.from(this.selected());
    if (ids.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Media',
        message: `Move ${ids.length} item(s) to trash?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        let completed = 0;
        let failed = 0;
        for (const id of ids) {
          this.mediaService.delete(id).subscribe({
            next: () => {
              completed++;
              if (completed + failed === ids.length) this.onBulkComplete(completed, failed);
            },
            error: () => {
              failed++;
              if (completed + failed === ids.length) this.onBulkComplete(completed, failed);
            },
          });
        }
      });
  }

  // --- Edit dialog ---

  openEditDialog(item: MediaItem): void {
    import('../media-dialog/media-dialog').then((m) => {
      const dialogRef = this.dialog.open(m.default, {
        width: '640px',
        data: { item } satisfies MediaDialogData,
      });
      dialogRef
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (result) {
            this.toast.success('Media updated');
            this.loadMedia();
          }
        });
    });
  }

  // --- Actions ---

  confirmDelete(item: MediaItem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Media',
        message: `Move "${item.originalFilename}" to trash?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) this.deleteMedia(item.id);
      });
  }

  // --- Helpers ---

  getTypeBadge(mimeType: string): string {
    return getMimeTypeCategory(mimeType);
  }

  getFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  getThumbnailUrl(item: MediaItem): string {
    if (item.mimeType.startsWith('image/') && item.url) {
      return item.url.replace('/upload/', '/upload/c_thumb,w_80,h_80/');
    }
    return '';
  }

  isImage(item: MediaItem): boolean {
    return item.mimeType.startsWith('image/');
  }

  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'movie';
    if (mimeType === 'application/pdf') return 'picture_as_pdf';
    if (mimeType === 'application/zip') return 'folder_zip';
    return 'description';
  }

  // --- Private ---

  private loadMedia(): void {
    this.loading.set(true);
    this.mediaService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.search() || undefined,
        mimeTypePrefix: this.mimeFilter() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.media.set(res.data);
          this.total.set(res.total);
          this.selected.set(new Set());
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Failed to load media');
        },
      });
  }

  private loadStats(): void {
    this.mediaService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => {
        // Ignore errors for stats, it's not critical
      },
    });
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.paginator().pageIndex = 0;
    this.loadMedia();
  }

  private onAllUploadsComplete(): void {
    this.uploading.set(false);
    const failed = this.uploads().filter((u) => u.error);
    if (failed.length === 0) {
      this.toast.success('All files uploaded successfully');
      this.uploads.set([]);
    } else {
      this.toast.error(`${failed.length} file(s) failed to upload`);
    }
    this.loadMedia();
    this.loadStats();
  }

  private onBulkComplete(success: number, failed: number): void {
    this.selected.set(new Set());
    this.loadMedia();
    this.loadStats();
    this.loadTrashCount();
    if (failed === 0) {
      this.toast.success(`${success} item(s) moved to trash`);
    } else {
      this.toast.error(`${failed} item(s) failed to delete`);
    }
  }

  private loadTrashCount(): void {
    this.mediaService.listDeleted({ page: 1, limit: 1 }).subscribe({
      next: (res) => this.trashCount.set(res.total),
      error: () => {
        // Ignore errors for trash count, it's not critical
      },
    });
  }

  private deleteMedia(id: string): void {
    this.mediaService.delete(id).subscribe({
      next: () => {
        this.toast.success('Media moved to trash');
        this.loadMedia();
        this.loadStats();
        this.loadTrashCount();
      },
      error: (err) => {
        const apiError = extractApiError(err);
        this.toast.error(apiError.message || 'Failed to delete media');
      },
    });
  }
}
