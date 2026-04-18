import { Component, inject, signal } from '@angular/core';
import {
  AssetFilterBarComponent,
  AssetGridComponent,
  AssetUploadZoneComponent,
  type MimeGroup,
  type SortOption,
  type UploadFolder,
  FilterBarComponent,
  FilterOption,
  FilterSearchComponent,
  FilterSelectComponent,
  SkeletonComponent,
  SpinnerOverlayComponent,
  SpinnerService,
  ToastService,
  UploadFn,
} from '@portfolio/console/shared/ui';
import type { MediaItem } from '@portfolio/console/shared/util';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Router, RouterLink } from '@angular/router';
import { delay, map, mergeMap, of, throwError, timer } from 'rxjs';

@Component({
  selector: 'console-ddl',
  standalone: true,
  imports: [
    SkeletonComponent,
    SpinnerOverlayComponent,
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
    AssetGridComponent,
    AssetUploadZoneComponent,
    AssetFilterBarComponent,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    RouterLink,
  ],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold mb-6">Design Development Lab</h1>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Long-Form Chassis</h2>
        <p class="text-sm text-gray-500 mb-2">
          Scrollspy rail + section cards + sticky save bar + unsaved-changes guard. Demo of ADR-013 / ADR-014.
        </p>
        <a mat-flat-button color="primary" routerLink="/ddl/long-form">Open long-form demo</a>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Toast Notifications</h2>
        <div class="flex gap-3 flex-wrap">
          <button
            class="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            (click)="toastService.success('Operation completed successfully!')"
          >
            Success
          </button>
          <button
            class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            (click)="toastService.error('Something went wrong.')"
          >
            Error
          </button>
          <button
            class="rounded bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
            (click)="toastService.warning('Please check your input.')"
          >
            Warning
          </button>
          <button
            class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            (click)="toastService.info('New update available.')"
          >
            Info
          </button>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Loading Bar</h2>
        <p class="text-sm text-gray-500 mb-2">Triggers a route navigation to show the top loading bar.</p>
        <button class="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700" (click)="triggerLoadingBar()">
          Navigate (triggers loading bar)
        </button>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Full-Page Spinner</h2>
        <button class="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700" (click)="showFullPageSpinner()">
          Show Spinner (2s)
        </button>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Local Spinner Overlay</h2>
        <p class="text-sm text-gray-500 mb-2">Overlays a spinner on a local component during API calls.</p>
        <div class="flex gap-4 flex-wrap">
          @for (size of spinnerSizes; track size) {
            <div class="relative w-48 rounded-lg border border-gray-200 p-4">
              <console-spinner-overlay [loading]="localLoading()" [size]="size" />
              <p class="text-sm font-medium">Card content</p>
              <p class="text-xs text-gray-400">Size: {{ size }}</p>
            </div>
          }
        </div>
        <button class="mt-3 rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-700" (click)="simulateApiCall()">
          Simulate API Call (2s)
        </button>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">CRUD Page Template</h2>
        <div class="crud-page" style="height: 600px; overflow: auto;">
          <div class="crud-header">
            <div>
              <h1 class="text-page-title">Tags</h1>
              <p class="crud-header__subtitle">Manage content tags for blog posts and projects.</p>
            </div>
            <button mat-flat-button color="primary">
              <mat-icon class="icon-md">add</mat-icon>
              New Tag
            </button>
          </div>

          <console-filter-bar>
            <console-filter-search placeholder="Search tags..." />
            <console-filter-select label="Status" [options]="statusOptions" />
            <button mat-stroked-button class="ml-auto">
              <mat-icon class="icon-sm">filter_list_off</mat-icon>
              Clear filters
            </button>
          </console-filter-bar>

          <div class="crud-table-container">
            <table mat-table [dataSource]="demoRows">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>
              <ng-container matColumnDef="slug">
                <th mat-header-cell *matHeaderCellDef>Slug</th>
                <td mat-cell *matCellDef="let row" class="text-text-muted">{{ row.slug }}</td>
              </ng-container>
              <ng-container matColumnDef="count">
                <th mat-header-cell *matHeaderCellDef>Posts</th>
                <td mat-cell *matCellDef="let row">{{ row.count }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="col-actions"></th>
                <td mat-cell *matCellDef="let row" class="col-actions">
                  <button mat-icon-button>
                    <mat-icon class="icon-sm text-text-muted">more_vert</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['name', 'slug', 'count', 'actions']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['name', 'slug', 'count', 'actions']"></tr>
            </table>
          </div>

          <mat-paginator [length]="5" [pageSize]="20" showFirstLastButtons class="crud-pagination" />
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Asset Grid</h2>
        <p class="text-sm text-gray-500 mb-3">
          Presentational grid/list atom for media pages and pickers. Selection, keyboard nav, skeleton, empty state.
        </p>

        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">Multi-select grid</h3>
          <console-asset-grid
            [items]="demoMedia"
            [selectedIds]="multiSelection()"
            mode="multi"
            viewMode="grid"
            [currentPage]="1"
            [totalPages]="3"
            (selectionChange)="multiSelection.set($event)"
            (itemActivated)="toastService.info('Activated: ' + $event)"
            (pageChange)="toastService.info('Page: ' + $event)"
          />
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">Single-select grid</h3>
          <console-asset-grid
            [items]="demoMedia"
            [selectedIds]="singleSelection()"
            mode="single"
            viewMode="grid"
            (selectionChange)="singleSelection.set($event)"
          />
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">List mode</h3>
          <console-asset-grid
            [items]="demoMedia"
            [selectedIds]="multiSelection()"
            mode="multi"
            viewMode="list"
            (selectionChange)="multiSelection.set($event)"
          />
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">Loading skeleton</h3>
          <console-asset-grid [items]="[]" [loading]="true" viewMode="grid" [skeletonCount]="8" />
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">Empty state</h3>
          <console-asset-grid [items]="[]" viewMode="grid" />
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Asset Upload Zone</h2>
        <p class="text-sm text-gray-500 mb-4">
          Multi-file drag-drop with per-file progress, cancel, retry, and client-side validation.
        </p>

        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">Single upload (image/* only, max 2 MB)</h3>
          <console-asset-upload-zone
            accept="image/*"
            [maxFileSize]="2 * 1024 * 1024"
            [multiple]="false"
            [uploadFn]="slowUploadFn"
            (uploadsComplete)="toastService.success('Uploaded: ' + $event.length + ' file(s)')"
            (uploadFailed)="toastService.error('Failed: ' + $event.length + ' file(s)')"
          />
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">Multi upload (any type, max 10 MB)</h3>
          <console-asset-upload-zone
            accept="*/*"
            [maxFileSize]="10 * 1024 * 1024"
            [multiple]="true"
            [uploadFn]="slowUploadFn"
            (uploadsComplete)="toastService.success('Uploaded: ' + $event.length + ' file(s)')"
            (uploadFailed)="toastService.error('Failed: ' + $event.length + ' file(s)')"
          />
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">Error + retry flow (always fails)</h3>
          <console-asset-upload-zone
            accept="*/*"
            [maxFileSize]="10 * 1024 * 1024"
            [multiple]="true"
            [uploadFn]="errorUploadFn"
            (uploadFailed)="toastService.error('Upload failed (expected in demo)')"
          />
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">Oversize rejection (max 1 KB)</h3>
          <p class="text-xs text-gray-400 mb-2">
            Drop any file &gt; 1 KB — it should be rejected before upload starts.
          </p>
          <console-asset-upload-zone accept="*/*" [maxFileSize]="1024" [multiple]="true" [uploadFn]="slowUploadFn" />
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Asset Filter Bar</h2>
        <p class="text-sm text-gray-500 mb-4">
          Search (300ms debounce) + MIME group chips + folder dropdown + sort dropdown. Emits one change per control;
          parent owns state.
        </p>

        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">Default state</h3>
          <console-asset-filter-bar
            [search]="filterSearch()"
            [mimeGroup]="filterMime()"
            [folder]="filterFolder()"
            [sort]="filterSort()"
            (searchChange)="filterSearch.set($event)"
            (mimeGroupChange)="filterMime.set($event)"
            (folderChange)="filterFolder.set($event)"
            (sortChange)="filterSort.set($event)"
            (clearAll)="toastService.info('Cleared all filters')"
          />
          <p class="text-xs text-gray-500 mt-2">
            search: "{{ filterSearch() }}" | mime: {{ filterMime() ?? 'null' }} | folder:
            {{ filterFolder() ?? 'null' }} | sort: {{ filterSort() }}
          </p>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-medium mb-2">Active filters (clear-all visible)</h3>
          <console-asset-filter-bar
            search="portfolio"
            mimeGroup="image"
            folder="projects"
            sort="filename_asc"
            (clearAll)="toastService.success('Clear-all clicked')"
          />
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Skeleton Loaders</h2>
        <div class="max-w-md space-y-4">
          <div>
            <p class="text-sm text-gray-500 mb-1">Text lines</p>
            <div class="space-y-2">
              <console-skeleton />
              <console-skeleton width="75%" />
              <console-skeleton width="50%" />
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">Rectangle</p>
            <console-skeleton shape="rectangle" height="120px" />
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">Circle (avatar)</p>
            <console-skeleton shape="circle" width="48px" />
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">Card skeleton</p>
            <div class="flex gap-3 items-start">
              <console-skeleton shape="circle" width="40px" />
              <div class="flex-1 space-y-2">
                <console-skeleton width="60%" />
                <console-skeleton />
                <console-skeleton width="80%" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class DdlComponent {
  protected readonly toastService = inject(ToastService);
  private readonly spinnerService = inject(SpinnerService);
  private readonly router = inject(Router);

  protected readonly localLoading = signal(false);
  protected readonly spinnerSizes = ['sm', 'md', 'lg'] as const;

  readonly statusOptions: FilterOption[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  protected readonly multiSelection = signal<string[]>([]);
  protected readonly singleSelection = signal<string[]>([]);

  protected readonly filterSearch = signal('');
  protected readonly filterMime = signal<MimeGroup | null>(null);
  protected readonly filterFolder = signal<UploadFolder | null>(null);
  protected readonly filterSort = signal<SortOption>('createdAt_desc');

  readonly demoMedia: MediaItem[] = Array.from({ length: 8 }, (_, i) => ({
    id: `demo-${i + 1}`,
    originalFilename: `asset-${i + 1}.jpg`,
    mimeType: i === 7 ? 'application/pdf' : 'image/jpeg',
    url: `https://res.cloudinary.com/demo/image/upload/v1/sample${(i % 4) + 1}.jpg`,
    format: 'jpg',
    bytes: 50_000 + i * 12_000,
    width: 800,
    height: 600,
    altText: null,
    caption: null,
    createdAt: new Date(2026, 0, i + 1).toISOString(),
    updatedAt: new Date(2026, 0, i + 1).toISOString(),
  }));

  readonly demoRows = [
    { name: 'Angular', slug: 'angular', count: 12 },
    { name: 'NestJS', slug: 'nestjs', count: 8 },
    { name: 'TypeScript', slug: 'typescript', count: 24 },
    { name: 'Design System', slug: 'design-system', count: 5 },
    { name: 'Playwright', slug: 'playwright', count: 3 },
  ];

  readonly slowUploadFn: UploadFn = (file: File) => {
    let tick = 0;
    const steps = 5;
    const mockResult = {
      id: `demo-${Date.now()}`,
      originalFilename: file.name,
      mimeType: file.type,
      url: 'https://res.cloudinary.com/demo/image/upload/v1/sample1.jpg',
      format: file.name.split('.').pop() ?? 'bin',
      bytes: file.size,
      width: 800,
      height: 600,
      altText: null,
      caption: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies MediaItem;

    return timer(0, 400).pipe(
      map(() => {
        tick++;
        const progress = Math.min(tick * (100 / steps), 100);
        return progress >= 100 ? { progress: 100, result: mockResult } : { progress };
      }),
      mergeMap((val) => (val.progress >= 100 ? of(val) : of(val)))
    );
  };

  readonly errorUploadFn: UploadFn = (_file: File) =>
    timer(0, 400).pipe(
      map((tick) => ({ progress: Math.min((tick + 1) * 25, 75) })),
      mergeMap((val, idx) => (idx === 2 ? throwError(() => new Error('Server rejected the file')) : of(val)))
    );

  triggerLoadingBar(): void {
    this.router.navigateByUrl('/').then(() => {
      this.router.navigate(['/ddl']);
    });
  }

  showFullPageSpinner(): void {
    this.spinnerService.show();
    setTimeout(() => this.spinnerService.hide(), 2000);
  }

  simulateApiCall(): void {
    this.localLoading.set(true);
    setTimeout(() => this.localLoading.set(false), 2000);
  }
}
