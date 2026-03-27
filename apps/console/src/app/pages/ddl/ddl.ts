import { Component, inject, signal } from '@angular/core';
import {
  FilterBarComponent,
  FilterOption,
  FilterSearchComponent,
  FilterSelectComponent,
  SkeletonComponent,
  SpinnerOverlayComponent,
  SpinnerService,
  ToastService,
} from '@portfolio/console/shared/ui';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Router } from '@angular/router';

@Component({
  selector: 'console-ddl',
  standalone: true,
  imports: [
    SkeletonComponent,
    SpinnerOverlayComponent,
    FilterBarComponent,
    FilterSearchComponent,
    FilterSelectComponent,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold mb-6">Design Development Lab</h1>

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

  readonly demoRows = [
    { name: 'Angular', slug: 'angular', count: 12 },
    { name: 'NestJS', slug: 'nestjs', count: 8 },
    { name: 'TypeScript', slug: 'typescript', count: 24 },
    { name: 'Design System', slug: 'design-system', count: 5 },
    { name: 'Playwright', slug: 'playwright', count: 3 },
  ];

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
