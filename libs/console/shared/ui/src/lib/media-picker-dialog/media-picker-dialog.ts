import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import type { MediaFolder, MediaItem, MediaMimeGroup, MediaSort } from '@portfolio/console/shared/util';
import { DEFAULT_PAGE_SIZE, MEDIA_PICKER_MIN_LOADING_MS } from '@portfolio/console/shared/util';
import { catchError, finalize, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { AssetFilterBarComponent } from '../asset-filter-bar/asset-filter-bar.component';
import {
  DEFAULT_SORT,
  type MimeGroup,
  type SortOption,
  UPLOAD_FOLDERS,
  UPLOAD_FOLDER_LABELS,
  type UploadFolder,
} from '../asset-filter-bar/asset-filter-bar.types';
import { AssetGridComponent } from '../asset-grid/asset-grid.component';
import type { AssetGridViewMode } from '../asset-grid/asset-grid.types';
import { AssetUploadZoneComponent } from '../asset-upload-zone/asset-upload-zone.component';
import type { UploadFn, UploadProgress } from '../asset-upload-zone/asset-upload-zone.types';
import ConfirmDialogComponent, { type ConfirmDialogData } from '../confirm-dialog/confirm-dialog';
import { MediaPickerDialogData, MediaPickerDialogResult } from './media-picker-dialog.types';
import { pushRecentIds, readRecentIds, readViewMode, writeViewMode } from './picker-storage.util';
import { RecentlyUsedStripComponent } from './recently-used-strip.component';

@Component({
  selector: 'console-media-picker-dialog',
  standalone: true,
  imports: [
    A11yModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatTabsModule,
    AssetGridComponent,
    AssetFilterBarComponent,
    AssetUploadZoneComponent,
    RecentlyUsedStripComponent,
  ],
  templateUrl: './media-picker-dialog.html',
  styleUrl: './media-picker-dialog.scss',
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'media-picker-title',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MediaPickerDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<MediaPickerDialogComponent, MediaPickerDialogResult>);
  private readonly matDialog = inject(MatDialog);
  readonly data = inject<MediaPickerDialogData>(MAT_DIALOG_DATA);

  readonly activeTab = signal<'library' | 'upload'>('library');
  readonly items = signal<MediaItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly page = signal(1);
  readonly selected = signal<Set<string>>(new Set());
  readonly recentItems = signal<MediaItem[]>([]);
  readonly viewMode = signal<AssetGridViewMode>('grid');
  readonly uploadsInProgress = signal(0);
  readonly highlightActive = signal(false);
  readonly uploadFolder = signal<UploadFolder>(this.data.defaultFolder ?? 'general');

  readonly uploadFolders = UPLOAD_FOLDERS;
  readonly uploadFolderLabels = UPLOAD_FOLDER_LABELS;

  readonly search = signal('');
  readonly mimeGroup = signal<MimeGroup | null>(null);
  readonly folder = signal<UploadFolder | null>(null);
  readonly sort = signal<SortOption>(DEFAULT_SORT);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / DEFAULT_PAGE_SIZE)));
  readonly selectedIdsArray = computed(() => [...this.selected()]);
  readonly ctaLabel = computed(() => {
    if (this.data.mode === 'single') return 'Insert';
    const n = this.selected().size;
    return n > 0 ? `Insert ${n} item${n === 1 ? '' : 's'}` : 'Insert';
  });

  readonly uploadFn: UploadFn = (file) => {
    this.uploadsInProgress.update((n) => n + 1);
    return this.data.dataSource.upload(file, this.uploadFolder()).pipe(
      switchMap(({ id }) => this.data.dataSource.getById(id)),
      map((result): UploadProgress => ({ progress: 100, result })),
      startWith<UploadProgress>({ progress: 0 }),
      finalize(() => this.uploadsInProgress.update((n) => Math.max(0, n - 1)))
    );
  };

  ngOnInit(): void {
    if (this.data.selectedIds?.length) {
      this.selected.set(new Set(this.data.selectedIds));
    }
    if (this.data.defaultFolder) {
      this.folder.set(this.data.defaultFolder);
    }
    this.viewMode.set(readViewMode());

    this.dialogRef.disableClose = true;
    this.dialogRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') this.handleClose();
    });
    this.dialogRef.backdropClick().subscribe(() => this.handleClose());

    this.loadRecent();
    this.loadMedia();
  }

  protected onTabChange(index: number): void {
    this.activeTab.set(index === 0 ? 'library' : 'upload');
  }

  protected onSearchChange(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.loadMedia();
  }

  protected onMimeGroupChange(group: MimeGroup | null): void {
    this.mimeGroup.set(group);
    this.page.set(1);
    this.loadMedia();
  }

  protected onFolderChange(folder: UploadFolder | null): void {
    this.folder.set(folder);
    this.page.set(1);
    this.loadMedia();
  }

  protected onSortChange(sort: SortOption): void {
    this.sort.set(sort);
    this.page.set(1);
    this.loadMedia();
  }

  protected onClearFilters(): void {
    this.search.set('');
    this.mimeGroup.set(null);
    this.folder.set(null);
    this.sort.set(DEFAULT_SORT);
    this.page.set(1);
    this.loadMedia();
  }

  protected onSelectionChange(ids: string[]): void {
    if (this.data.mode === 'single') {
      const last = ids[ids.length - 1];
      this.selected.set(last ? new Set([last]) : new Set());
    } else {
      this.selected.set(new Set(ids));
    }
  }

  protected onItemActivated(id: string): void {
    this.selected.set(new Set(this.data.mode === 'single' ? [id] : [...this.selected(), id]));
    this.confirm();
  }

  protected onPageChange(page: number): void {
    this.page.set(page);
    this.loadMedia();
  }

  protected onViewModeToggle(): void {
    const next: AssetGridViewMode = this.viewMode() === 'grid' ? 'list' : 'grid';
    this.viewMode.set(next);
    writeViewMode(next);
  }

  protected onRecentPick(id: string): void {
    if (this.data.mode === 'single') {
      this.selected.set(new Set([id]));
      return;
    }
    const current = new Set(this.selected());
    if (current.has(id)) current.delete(id);
    else current.add(id);
    this.selected.set(current);
  }

  protected onUploadsComplete(uploaded: MediaItem[]): void {
    if (!uploaded.length) return;
    const ids = uploaded.map((i) => i.id);
    pushRecentIds(ids);

    const current = new Set(this.selected());
    if (this.data.mode === 'single') {
      current.clear();
      current.add(ids[0]);
    } else {
      for (const id of ids) current.add(id);
    }
    this.selected.set(current);

    this.highlightActive.set(true);
    setTimeout(() => this.highlightActive.set(false), 2500);

    this.activeTab.set('library');
    this.page.set(1);
    this.loadMedia();
    this.loadRecent();
  }

  protected handleClose(): void {
    if (this.uploadsInProgress() > 0) {
      const confirmRef = this.matDialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Upload in progress',
          message: 'Uploads are still running. Close anyway?',
          confirmLabel: 'Close',
        } satisfies ConfirmDialogData,
      });
      confirmRef.afterClosed().subscribe((ok) => {
        if (ok) this.dialogRef.close();
      });
      return;
    }
    this.dialogRef.close();
  }

  protected confirm(): void {
    pushRecentIds([...this.selected()]);
    if (this.data.mode === 'single') {
      const [first] = this.selected();
      this.dialogRef.close(first);
    } else {
      this.dialogRef.close([...this.selected()]);
    }
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
    this.data.dataSource
      .list({
        page: this.page(),
        limit: DEFAULT_PAGE_SIZE,
        search: this.search() || undefined,
        mimeTypePrefix: this.data.mimeFilter && !this.data.mimeGroup ? this.data.mimeFilter : undefined,
        mimeGroup:
          this.data.mimeGroup ??
          (this.data.mimeFilter ? undefined : ((this.mimeGroup() as MediaMimeGroup | null) ?? undefined)),
        folder: this.folder() ? (this.folder() as MediaFolder) : undefined,
        sort: this.sort() as MediaSort,
      })
      .subscribe({
        next: (res) =>
          settle(() => {
            this.items.set(res.data);
            this.total.set(res.total);
          }),
        error: () => settle(() => undefined),
      });
  }

  private loadRecent(): void {
    const ids = readRecentIds();
    if (!ids.length) {
      this.recentItems.set([]);
      return;
    }
    forkJoin(ids.map((id) => this.data.dataSource.getById(id).pipe(catchError(() => of(null))))).subscribe(
      (results) => {
        this.recentItems.set(results.filter((x): x is MediaItem => x !== null));
      }
    );
  }
}
