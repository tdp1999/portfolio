import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import type { UploadState } from './asset-upload-zone.types';

@Component({
  selector: 'console-upload-row',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="upload-row" [class]="'upload-row--' + state()">
      <div class="upload-row__icon">
        @if (state() === 'done') {
          <mat-icon class="icon-md text-green-500">check_circle</mat-icon>
        } @else if (state() === 'error') {
          <mat-icon class="icon-md text-red-500">error_outline</mat-icon>
        } @else {
          <mat-icon class="icon-md text-text-muted">insert_drive_file</mat-icon>
        }
      </div>

      <div class="upload-row__info">
        <span class="upload-row__name text-body truncate" [title]="file().name">{{ file().name }}</span>
        <span class="text-caption text-text-muted">{{ sizeLabel() }}</span>
      </div>

      <div class="upload-row__progress-area">
        @if (state() === 'uploading') {
          <div class="upload-row__track">
            <div class="upload-row__fill" [style.width.%]="progress()"></div>
          </div>
          <span class="text-caption text-text-muted upload-row__percent">{{ progress() }}%</span>
        }
        @if (state() === 'error') {
          <span class="text-caption text-red-500">{{ error()?.message ?? 'Upload failed' }}</span>
        }
      </div>

      <div class="upload-row__actions">
        @if (state() === 'uploading') {
          <button mat-icon-button (click)="cancelled.emit()" aria-label="Cancel upload">
            <mat-icon class="icon-md">close</mat-icon>
          </button>
        }
        @if (state() === 'error') {
          <button mat-icon-button (click)="retry.emit()" aria-label="Retry upload">
            <mat-icon class="icon-md">refresh</mat-icon>
          </button>
        }
        @if (state() === 'done') {
          <button mat-icon-button (click)="remove.emit()" aria-label="Remove">
            <mat-icon class="icon-md">delete_outline</mat-icon>
          </button>
        }
      </div>
    </div>
  `,
  styles: `
    .upload-row {
      @apply flex items-center gap-3 px-3 py-2 rounded-lg;
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);

      &__icon {
        @apply flex-shrink-0;
      }

      &__info {
        @apply flex flex-col min-w-0 flex-1;
      }

      &__name {
        @apply block;
        max-width: 200px;
      }

      &__progress-area {
        @apply flex items-center gap-2 flex-1;
      }

      &__track {
        @apply flex-1 rounded-full overflow-hidden;
        height: 4px;
        background: var(--color-border);
      }

      &__fill {
        height: 100%;
        background: var(--color-primary);
        transition: width 0.2s ease;
      }

      &__percent {
        @apply flex-shrink-0 w-8 text-right;
      }

      &__actions {
        @apply flex-shrink-0;
      }
    }
  `,
})
export class UploadRowComponent {
  readonly file = input.required<File>();
  readonly state = input.required<UploadState>();
  readonly progress = input(0);
  readonly error = input<Error | undefined>(undefined);

  readonly cancelled = output<void>();
  readonly retry = output<void>();
  readonly remove = output<void>();

  protected readonly sizeLabel = computed(() => {
    const bytes = this.file().size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  });
}
