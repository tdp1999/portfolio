import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { extractApiError } from '@portfolio/console/shared/util';
import { MediaService } from '../media.service';
import { formatFileSize, getMimeTypeCategory } from '../media.constants';
import { MediaDialogData } from './media-dialog.types';

@Component({
  selector: 'console-media-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  template: `
    <h2 mat-dialog-title>Edit Media</h2>
    <mat-dialog-content>
      <!-- Preview -->
      <div class="mb-4 flex justify-center rounded-lg bg-surface-alt p-4">
        @if (isImage) {
          <img
            [src]="data.item.url"
            [alt]="data.item.altText || data.item.originalFilename"
            class="max-h-48 rounded object-contain"
          />
        } @else {
          <div class="flex flex-col items-center gap-2 py-4 text-text-muted">
            <span class="text-4xl">{{ fileIcon }}</span>
            <span class="text-sm">{{ data.item.originalFilename }}</span>
          </div>
        }
      </div>

      <!-- Read-only info -->
      <div class="mb-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span class="text-text-muted">Filename</span>
          <p class="text-text truncate">{{ data.item.originalFilename }}</p>
        </div>
        <div>
          <span class="text-text-muted">Type</span>
          <p class="text-text">{{ typeBadge }}</p>
        </div>
        <div>
          <span class="text-text-muted">Size</span>
          <p class="text-text">{{ fileSize }}</p>
        </div>
        <div>
          <span class="text-text-muted">Uploaded</span>
          <p class="text-text">{{ data.item.createdAt | date: 'medium' }}</p>
        </div>
      </div>

      <!-- Editable fields -->
      <form [formGroup]="form" class="flex flex-col gap-4">
        <mat-form-field>
          <mat-label>Alt Text</mat-label>
          <input matInput formControlName="altText" placeholder="Describe the image for accessibility" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>Caption</mat-label>
          <textarea matInput formControlName="caption" placeholder="Optional caption" rows="2"></textarea>
        </mat-form-field>

        @if (serverError()) {
          <p class="text-sm text-red-500">{{ serverError() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="submitting()" (click)="submit()">
        @if (submitting()) {
          <mat-spinner diameter="20" />
        } @else {
          Save
        }
      </button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MediaDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<MediaDialogComponent>);
  private readonly mediaService = inject(MediaService);
  private readonly fb = inject(FormBuilder);
  readonly data = inject<MediaDialogData>(MAT_DIALOG_DATA);

  readonly isImage = this.data.item.mimeType.startsWith('image/');
  readonly typeBadge = getMimeTypeCategory(this.data.item.mimeType);
  readonly fileSize = formatFileSize(this.data.item.bytes);
  readonly fileIcon = this.isImage ? '' : '📄';

  readonly form = this.fb.nonNullable.group({
    altText: [this.data.item.altText ?? ''],
    caption: [this.data.item.caption ?? ''],
  });
  readonly submitting = signal(false);
  readonly serverError = signal('');

  submit(): void {
    this.submitting.set(true);
    this.serverError.set('');
    const raw = this.form.getRawValue();

    this.mediaService
      .update(this.data.item.id, {
        altText: raw.altText || null,
        caption: raw.caption || null,
      })
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          const apiError = extractApiError(err);
          this.serverError.set(apiError?.message ?? 'Failed to update metadata');
        },
      });
  }
}
