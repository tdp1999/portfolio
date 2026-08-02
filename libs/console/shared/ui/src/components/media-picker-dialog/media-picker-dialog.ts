import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SegmentedControl, type SegmentedControlOption } from '../segmented-control/segmented-control';
import type { MediaFolder, MediaItem, MediaMimeGroup, MediaSort } from '@portfolio/console/shared/util';
import { DEFAULT_PAGE_SIZE, MEDIA_PICKER_MIN_LOADING_MS } from '@portfolio/console/shared/util';
import { type Observable, catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { AssetFilterBar } from '../asset-filter-bar/asset-filter-bar';
import {
  DEFAULT_SORT,
  type MimeGroup,
  type SortOption,
  UPLOAD_FOLDERS,
  UPLOAD_FOLDER_LABELS,
  type UploadFolder,
} from '../asset-filter-bar/asset-filter-bar.types';
import { AssetGrid } from '../asset-grid/asset-grid';
import type { AssetGridViewMode } from '../asset-grid/asset-grid.types';
import { AssetUploadZone } from '../asset-upload-zone/asset-upload-zone';
import type { UploadFn, UploadProgress } from '../asset-upload-zone/asset-upload-zone.types';
import ConfirmDialog, { type ConfirmDialogData } from '../confirm-dialog/confirm-dialog';
import { MediaPickerDialogData, MediaPickerDialogResult } from './media-picker-dialog.types';
import { pushRecentIds, readRecentIds, readViewMode, writeRecentIds, writeViewMode } from './picker-storage.util';
import { MatInputModule } from '@angular/material/input';
import { ToastService } from '../../services/toast/toast.service';
import { MediaThumbPipe } from '../../pipes/media-thumb/media-thumb.pipe';
import { RecentlyUsedStrip } from './recently-used-strip';
import { formatMediaMeta } from './selection-summary.util';

@Component({
  selector: 'console-media-picker-dialog',
  standalone: true,
  imports: [
    A11yModule,
    FormsModule,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    MediaThumbPipe,
    SegmentedControl,
    AssetGrid,
    AssetFilterBar,
    AssetUploadZone,
    RecentlyUsedStrip,
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
export default class MediaPickerDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<MediaPickerDialog, MediaPickerDialogResult>);
  private readonly matDialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  readonly data = inject<MediaPickerDialogData>(MAT_DIALOG_DATA);

  readonly activeTab = signal<'library' | 'upload'>('library');
  readonly tabOptions: SegmentedControlOption[] = [
    { value: 'library', label: 'Library' },
    { value: 'upload', label: 'Upload' },
  ];
  readonly items = signal<MediaItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly page = signal(1);
  readonly selected = signal<Set<string>>(new Set());
  readonly recentItems = signal<MediaItem[]>([]);
  readonly viewMode = signal<AssetGridViewMode>('grid');
  readonly uploadsInProgress = signal(0);
  readonly highlightActive = signal(false);
  /**
   * Assets uploaded in this dialog session, still awaiting review. Cleared when the
   * author crosses over to the library with "Use these files".
   */
  readonly justUploaded = signal<MediaItem[]>([]);
  readonly uploadFolder = signal<UploadFolder>(this.data.defaultFolder ?? 'general');

  readonly uploadFolders = UPLOAD_FOLDERS;
  readonly uploadFolderLabels = UPLOAD_FOLDER_LABELS;

  readonly search = signal('');
  readonly mimeGroup = signal<MimeGroup | null>(null);
  readonly folder = signal<UploadFolder | null>(null);
  readonly sort = signal<SortOption>(DEFAULT_SORT);

  /**
   * Selected assets that are not on the current page — a pre-selection carried in
   * via `data.selectedIds`, or an item selected before paging away. Fetched once so
   * the footer can name every selection, not only the visible ones.
   */
  private readonly hydratedSelection = signal<ReadonlyMap<string, MediaItem>>(new Map());

  /** Ids already sent to the API, so an unresolvable one is not retried on every page change. */
  private readonly hydrationAttempted = new Set<string>();

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / DEFAULT_PAGE_SIZE)));
  readonly selectedIdsArray = computed(() => [...this.selected()]);

  /** Every asset we can currently name, keyed by id. */
  private readonly knownItems = computed(() => {
    const pool = new Map<string, MediaItem>(this.hydratedSelection());
    for (const item of this.recentItems()) pool.set(item.id, item);
    for (const item of this.items()) pool.set(item.id, item);
    return pool;
  });

  /**
   * Resolved detail for each selection, in selection order.
   *
   * A grid card can only ever show a truncated caption, so without this the footer's
   * "N selected" was the only feedback and there was no way to read the full name of
   * what you had picked.
   */
  readonly selectedDetails = computed(() => {
    const pool = this.knownItems();
    return this.selectedIdsArray()
      .map((id) => pool.get(id))
      .filter((item): item is MediaItem => !!item)
      .map((item) => ({ id: item.id, name: item.originalFilename, meta: formatMediaMeta(item) }));
  });

  /**
   * The selection list earns its own column only in multi mode. In single mode at
   * most one asset can ever be selected (9 of the 10 call sites), so a rail would
   * be a permanently near-empty 240px column — those get the footer one-liner.
   */
  readonly showSelectionRail = computed(() => this.data.mode === 'multi');

  /**
   * Footer one-liner for single mode: the full name plus its technical summary,
   * which is all a single selection can ever need.
   */
  readonly selectionSummary = computed(() => {
    const details = this.selectedDetails();
    if (!details.length) return '';
    if (details.length === 1) return `${details[0].name} · ${details[0].meta}`;
    const shown = details.slice(0, 2).map((d) => d.name);
    const rest = details.length - shown.length;
    return `${details.length} selected: ${shown.join(', ')}${rest > 0 ? ` +${rest} more` : ''}`;
  });

  readonly ctaLabel = computed(() => {
    if (this.data.mode === 'single') return 'Insert';
    const n = this.selected().size;
    return n > 0 ? `Insert ${n} item${n === 1 ? '' : 's'}` : 'Insert';
  });

  constructor() {
    effect(() => {
      const pool = this.knownItems();
      const missing = this.selectedIdsArray().filter((id) => !pool.has(id) && !this.hydrationAttempted.has(id));
      if (!missing.length) return;
      for (const id of missing) this.hydrationAttempted.add(id);

      untracked(() =>
        forkJoin(
          missing.map((id) => this.data.dataSource.getByIdSilent(id).pipe(catchError(() => of(null))))
        ).subscribe((fetched) => {
          const resolved = fetched.filter((item): item is MediaItem => !!item);
          if (!resolved.length) return;
          this.hydratedSelection.update((current) => {
            const next = new Map(current);
            for (const item of resolved) next.set(item.id, item);
            return next;
          });
        })
      );
    });
  }

  /**
   * Passes the data source's real progress ticks straight through, and only swaps in
   * the fetched `MediaItem` on the tick that carries an id. The previous version threw
   * the ticks away and synthesised `startWith(0)` … `100`, which is why the bar only
   * ever had two positions.
   */
  readonly uploadFn: UploadFn = (file) => {
    this.uploadsInProgress.update((n) => n + 1);
    return this.data.dataSource.upload(file, this.uploadFolder()).pipe(
      switchMap((event): Observable<UploadProgress> => {
        if (!event.id) return of({ progress: event.progress });
        return this.data.dataSource.getById(event.id).pipe(map((result) => ({ progress: 100, result })));
      }),
      finalize(() => this.uploadsInProgress.update((n) => Math.max(0, n - 1)))
    );
  };

  ngOnInit(): void {
    if (this.data.selectedIds?.length) {
      this.selected.set(new Set(this.data.selectedIds));
    }
    // NOTE: `defaultFolder` sets the UPLOAD destination (`uploadFolder`) only — it must
    // NOT pre-filter the library. Pinning the folder here hid pre-existing assets stored
    // under a different folder (e.g. a resume PDF uploaded to `general`). Leave the folder
    // facet on "All" so every matching-type asset is selectable; the user can still narrow.
    this.viewMode.set(readViewMode());

    this.dialogRef.disableClose = true;
    this.dialogRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') this.handleClose();
    });
    this.dialogRef.backdropClick().subscribe(() => this.handleClose());

    this.loadRecent();
    this.loadMedia();
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

  /** Rail affordance: drop one asset from the selection without hunting for its card. */
  protected deselect(id: string): void {
    const next = new Set(this.selected());
    next.delete(id);
    this.selected.set(next);
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

  /**
   * Upload finished. The dialog deliberately STAYS on the Upload tab.
   *
   * It used to jump straight to Library and pre-select the new asset, which left the
   * author with no confirmation of what had landed, nowhere to write the caption and
   * alt text the asset needs, and a tab switch they did not ask for. Instead the new
   * assets become a review list right here; "Use these files" is the explicit step
   * that crosses over to the library.
   */
  protected onUploadsComplete(uploaded: MediaItem[]): void {
    if (!uploaded.length) return;
    pushRecentIds(uploaded.map((i) => i.id));

    this.justUploaded.update((current) => [...current, ...uploaded]);
    this.toast.success(
      uploaded.length === 1 ? `Uploaded ${uploaded[0].originalFilename}` : `Uploaded ${uploaded.length} files`
    );

    // Refresh in the background so the library is already correct when the author
    // crosses over, without yanking the tab out from under them.
    this.page.set(1);
    this.loadMedia();
    this.loadRecent();
  }

  /** Persist one metadata field for a just-uploaded asset, on blur. */
  protected onReviewFieldBlur(id: string, field: 'altText' | 'caption', value: string): void {
    const item = this.justUploaded().find((i) => i.id === id);
    const next = value.trim() || null;
    if (!item || (item[field] ?? null) === next) return;

    const previous = item[field] ?? null;
    this.justUploaded.update((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: next } : r)));
    this.data.dataSource
      .update(id, { [field]: next })
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res === null) {
          this.toast.error(`Could not save the ${field === 'altText' ? 'alt text' : 'caption'}`);
          // Put the stored value back so the field never claims a save that failed —
          // but only if this write is still the one on screen. Two quick edits can
          // land out of order, and blindly restoring `previous` would resurrect a
          // value the author has already moved past.
          this.justUploaded.update((rows) =>
            rows.map((r) => (r.id === id && (r[field] ?? null) === next ? { ...r, [field]: previous } : r))
          );
        }
      });
  }

  /** Type, size and pixel dimensions for a review card. */
  protected metaFor(item: MediaItem): string {
    return formatMediaMeta(item);
  }

  /** Drop a row from the review list. The asset stays in the library. */
  protected dismissUploaded(id: string): void {
    this.justUploaded.update((rows) => rows.filter((r) => r.id !== id));
  }

  /** Select everything just uploaded and cross over to the library tab. */
  protected useUploadedFiles(): void {
    const ids = this.justUploaded().map((i) => i.id);
    if (!ids.length) return;

    const current = new Set(this.selected());
    if (this.data.mode === 'single') {
      current.clear();
      current.add(ids[ids.length - 1]);
    } else {
      for (const id of ids) current.add(id);
    }
    this.selected.set(current);

    this.highlightActive.set(true);
    setTimeout(() => this.highlightActive.set(false), 2500);

    this.justUploaded.set([]);
    this.activeTab.set('library');
  }

  protected handleClose(): void {
    if (this.uploadsInProgress() > 0) {
      const confirmRef = this.matDialog.open(ConfirmDialog, {
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
    const ids = [...this.selected()];
    pushRecentIds(ids);

    const pool = new Map<string, MediaItem>();
    for (const item of this.items()) pool.set(item.id, item);
    for (const item of this.recentItems()) pool.set(item.id, item);

    const missing = ids.filter((id) => !pool.has(id));
    const hydrate$ = missing.length
      ? forkJoin(missing.map((id) => this.data.dataSource.getByIdSilent(id).pipe(catchError(() => of(null)))))
      : of([] as (MediaItem | null)[]);

    hydrate$.subscribe((fetched) => {
      for (const item of fetched) if (item) pool.set(item.id, item);
      const resolved = ids.map((id) => pool.get(id)).filter((x): x is MediaItem => !!x);
      if (this.data.mode === 'single') {
        this.dialogRef.close(resolved[0]);
      } else {
        this.dialogRef.close(resolved);
      }
    });
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
    forkJoin(ids.map((id) => this.data.dataSource.getByIdSilent(id).pipe(catchError(() => of(null))))).subscribe(
      (results) => {
        const validIds = ids.filter((_, i) => results[i] !== null);
        if (validIds.length !== ids.length) writeRecentIds(validIds);
        this.recentItems.set(results.filter((x): x is MediaItem => x !== null));
      }
    );
  }
}
