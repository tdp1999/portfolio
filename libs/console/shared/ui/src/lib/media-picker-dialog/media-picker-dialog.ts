import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MediaService, type MediaItem } from '@portfolio/console/shared/data-access';
import { MediaPickerDialogData, MediaPickerDialogResult } from './media-picker-dialog.types';

@Component({
  selector: 'console-media-picker-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'single' ? 'Select Media' : 'Select Media Files' }}</h2>

    <mat-dialog-content class="media-picker-content">
      <mat-form-field appearance="outline" class="w-full mb-4">
        <mat-icon matPrefix>search</mat-icon>
        <input matInput placeholder="Search media..." (input)="onSearch($event)" />
      </mat-form-field>

      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <mat-spinner diameter="40" />
        </div>
      } @else if (items().length === 0) {
        <div class="flex items-center justify-center py-12 text-text-muted">No media found</div>
      } @else {
        <div class="media-grid">
          @for (item of items(); track item.id) {
            <button
              type="button"
              class="media-card"
              [class.selected]="isSelected(item.id)"
              (click)="toggleSelect(item)"
            >
              @if (item.mimeType.startsWith('image/')) {
                <img [src]="item.url" [alt]="item.altText ?? item.originalFilename" class="media-thumb" />
              } @else {
                <div class="media-thumb media-file-icon">
                  <mat-icon>insert_drive_file</mat-icon>
                </div>
              }
              <span class="media-name">{{ item.originalFilename }}</span>
              @if (data.mode === 'multi') {
                <mat-checkbox
                  [checked]="isSelected(item.id)"
                  class="media-checkbox"
                  (click)="$event.stopPropagation()"
                  (change)="toggleSelect(item)"
                />
              }
            </button>
          }
        </div>
      }

      <mat-paginator
        [length]="total()"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex()"
        [pageSizeOptions]="[20, 50]"
        (page)="onPage($event)"
      />
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="selected().size === 0" (click)="confirm()">
        Select{{ data.mode === 'multi' && selected().size > 0 ? ' (' + selected().size + ')' : '' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .media-picker-content {
      min-width: 600px;
      max-height: 60vh;
    }

    .media-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.5rem;
    }

    .media-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem;
      border: 2px solid transparent;
      border-radius: 0.5rem;
      cursor: pointer;
      background: none;
      transition: border-color 0.15s;

      &:hover {
        border-color: var(--color-border);
      }

      &.selected {
        border-color: var(--color-primary);
        background: color-mix(in srgb, var(--color-primary) 8%, transparent);
      }
    }

    .media-thumb {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 0.25rem;
    }

    .media-file-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface);
    }

    .media-name {
      font-size: 0.75rem;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--color-text-muted);
    }

    .media-checkbox {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MediaPickerDialogComponent implements OnInit {
  private readonly mediaService = inject(MediaService);
  private readonly dialogRef = inject(MatDialogRef<MediaPickerDialogComponent, MediaPickerDialogResult>);
  readonly data = inject<MediaPickerDialogData>(MAT_DIALOG_DATA);

  readonly items = signal<MediaItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly pageIndex = signal(0);
  readonly pageSize = 20;
  readonly selected = signal<Set<string>>(new Set());

  private searchTerm = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    if (this.data.selectedIds?.length) {
      this.selected.set(new Set(this.data.selectedIds));
    }
    this.loadMedia();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.searchTerm = value;
      this.pageIndex.set(0);
      this.loadMedia();
    }, 300);
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.loadMedia();
  }

  isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  toggleSelect(item: MediaItem): void {
    const current = new Set(this.selected());
    if (this.data.mode === 'single') {
      current.clear();
      current.add(item.id);
    } else {
      if (current.has(item.id)) {
        current.delete(item.id);
      } else {
        current.add(item.id);
      }
    }
    this.selected.set(current);

    // In single mode, auto-confirm on click
    if (this.data.mode === 'single') {
      this.dialogRef.close(item.id);
    }
  }

  confirm(): void {
    if (this.data.mode === 'single') {
      const [first] = this.selected();
      this.dialogRef.close(first);
    } else {
      this.dialogRef.close([...this.selected()]);
    }
  }

  private loadMedia(): void {
    this.loading.set(true);
    this.mediaService
      .list({
        page: this.pageIndex() + 1,
        limit: this.pageSize,
        search: this.searchTerm || undefined,
        mimeTypePrefix: this.data.mimeFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
