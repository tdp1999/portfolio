import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AssetFilterBarComponent,
  AssetGridComponent,
  AssetUploadZoneComponent,
  ChipSelectComponent,
  type ChipSelectOption,
  ConfirmDialogComponent,
  DEFAULT_SORT,
  ToastService,
  type AssetGridViewMode,
  type ConfirmDialogData,
  type MimeGroup,
  type SortOption,
  type UploadFn,
  type UploadFolder,
} from '@portfolio/console/shared/ui';
import {
  DEFAULT_PAGE_SIZE,
  MEDIA_PICKER_MIN_LOADING_MS,
  PAGE_SIZE_OPTIONS,
  STORAGE_KEYS,
} from '@portfolio/console/shared/util';
import { filter, forkJoin, map, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MediaDrawerComponent } from '../media-drawer/media-drawer';
import { formatFileSize, getMimeTypeCategory } from '../media.constants';
import { MediaService } from '../media.service';
import { MediaItem, MediaMimeGroup, StorageStats } from '../media.types';

const VIEW_MODE_KEY = STORAGE_KEYS.mediaPickerViewMode;

@Component({
  selector: 'console-media-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    AssetGridComponent,
    AssetFilterBarComponent,
    AssetUploadZoneComponent,
    ChipSelectComponent,
    MediaDrawerComponent,
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly selectedDetailId = signal<string | null>(null);

  // Data
  readonly media = signal<MediaItem[]>([]);
  readonly total = signal(0);
  readonly stats = signal<StorageStats | null>(null);
  readonly trashCount = signal(0);
  readonly loading = signal(false);

  // Filters
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly search = signal('');
  readonly mimeGroup = signal<MimeGroup | null>(null);
  readonly folder = signal<UploadFolder | null>(null);
  readonly sort = signal<SortOption>(DEFAULT_SORT);
  readonly viewMode = signal<AssetGridViewMode>('grid');
  readonly viewModeOptions: ChipSelectOption[] = [
    { value: 'grid', label: 'Grid view', icon: 'grid_view' },
    { value: 'list', label: 'List view', icon: 'view_list' },
  ];

  // Selection
  readonly selectedIds = signal<string[]>([]);

  // Computed
  readonly selectedCount = computed(() => this.selectedIds().length);
  readonly currentPage = computed(() => this.pageIndex() + 1);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
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

  readonly uploadFn: UploadFn = (file: File) =>
    this.mediaService.upload(file).pipe(
      switchMap(({ id }) => this.mediaService.getById(id)),
      map((result) => ({ progress: 100, result }))
    );

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(VIEW_MODE_KEY) as AssetGridViewMode;
      if (saved === 'grid' || saved === 'list') this.viewMode.set(saved);
    }
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.selectedDetailId.set(params.get('selected'));
    });
    this.loadMedia();
    this.loadStats();
    this.loadTrashCount();
  }

  onDrawerClose(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { selected: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onDrawerUpdated(): void {
    this.loadMedia();
  }

  onDrawerDeleted(): void {
    this.onDrawerClose();
    this.loadMedia();
    this.loadStats();
    this.loadTrashCount();
  }

  onViewModeChange(mode: string): void {
    const next = mode as AssetGridViewMode;
    this.viewMode.set(next);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(VIEW_MODE_KEY, next);
    }
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.resetPage();
    this.loadMedia();
  }

  onMimeGroupChange(group: MimeGroup | null): void {
    this.mimeGroup.set(group);
    this.resetPage();
    this.loadMedia();
  }

  onFolderChange(folder: UploadFolder | null): void {
    this.folder.set(folder);
    this.resetPage();
    this.loadMedia();
  }

  onSortChange(sort: SortOption): void {
    this.sort.set(sort);
    this.resetPage();
    this.loadMedia();
  }

  onClearAllFilters(): void {
    this.search.set('');
    this.mimeGroup.set(null);
    this.folder.set(null);
    this.sort.set(DEFAULT_SORT);
    this.resetPage();
    this.loadMedia();
  }

  onPageChange(page: number): void {
    this.pageIndex.set(page - 1);
    this.loadMedia();
  }

  onSelectionChange(ids: string[]): void {
    this.selectedIds.set(ids);
  }

  onItemActivated(id: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { selected: id },
      queryParamsHandling: 'merge',
    });
  }

  onUploadsComplete(items: MediaItem[]): void {
    this.toast.success(`${items.length} file(s) uploaded successfully`);
    this.loadMedia();
    this.loadStats();
  }

  onUploadFailed(failures: { file: File; error: Error }[]): void {
    this.toast.error(`${failures.length} file(s) failed to upload`);
  }

  bulkDelete(): void {
    const ids = this.selectedIds();
    if (!ids.length) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Media',
        message: `Move ${ids.length} item(s) to trash?`,
        confirmLabel: 'Delete',
      } satisfies ConfirmDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() =>
          forkJoin(
            ids.map((id) =>
              this.mediaService.delete(id).pipe(
                map(() => true as const),
                catchError(() => of(false as const))
              )
            )
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((results) => {
        const completed = results.filter(Boolean).length;
        const failed = results.length - completed;
        this.onBulkComplete(completed, failed);
      });
  }

  private resetPage(): void {
    this.pageIndex.set(0);
  }

  private loadMedia(): void {
    this.loading.set(true);

    const startedAt = Date.now();
    const settle = (apply: () => void) => {
      const remaining = MEDIA_PICKER_MIN_LOADING_MS - (Date.now() - startedAt);
      const finish = () => {
        apply();
        this.loading.set(false);
      };
      if (remaining > 0) setTimeout(finish, remaining);
      else finish();
    };

    this.mediaService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize(),
        search: this.search() || undefined,
        mimeGroup: (this.mimeGroup() as MediaMimeGroup | null) ?? undefined,
        folder: this.folder() ?? undefined,
        sort: this.sort(),
      })
      .subscribe({
        next: (res) => {
          settle(() => {
            this.media.set(res.data);
            this.total.set(res.total);
            this.selectedIds.set([]);
            this.loading.set(false);
          });
        },
        error: () => {
          settle(() => undefined);
          this.loading.set(false);
          this.toast.error('Failed to load media');
        },
      });
  }

  private loadStats(): void {
    this.mediaService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => {
        // No op
      },
    });
  }

  private onBulkComplete(success: number, failed: number): void {
    this.selectedIds.set([]);
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
        // No op
      },
    });
  }
}
