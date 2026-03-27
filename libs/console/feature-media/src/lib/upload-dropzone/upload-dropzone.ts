import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { validateFile, MAX_BULK_UPLOAD_FILES } from '../media.constants';

@Component({
  selector: 'console-upload-dropzone',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="dropzone"
      [class.dragover]="isDragOver()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
      (keydown.enter)="fileInput.click()"
      tabindex="0"
      role="button"
      aria-label="Upload files"
    >
      <mat-icon class="icon-2xl text-text-muted mb-2">cloud_upload</mat-icon>
      <p class="text-text font-medium">Drag and drop files here</p>
      <p class="text-text-muted text-sm mt-1">or <span class="text-primary underline">browse files</span></p>
      @if (errors().length) {
        <div class="mt-3 space-y-1">
          @for (error of errors(); track error) {
            <p class="text-sm text-red-500">{{ error }}</p>
          }
        </div>
      }
    </div>
    <input #fileInput type="file" multiple class="hidden" (change)="onFileSelected($event)" />
  `,
  styles: `
    :host {
      display: block;
    }
    .dropzone {
      @apply flex flex-col items-center justify-center rounded-lg p-8 cursor-pointer transition-colors;
      border: 2px dashed var(--color-border-strong);
      &:hover,
      &.dragover {
        border-color: var(--color-primary);
        background-color: color-mix(in srgb, var(--color-primary) 5%, transparent);
      }
    }
  `,
})
export class UploadDropzoneComponent {
  readonly filesSelected = output<File[]>();
  readonly isDragOver = signal(false);
  readonly errors = signal<string[]>([]);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.processFiles(files);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.processFiles(files);
  }

  private processFiles(files: File[]): void {
    this.errors.set([]);
    if (files.length === 0) return;

    if (files.length > MAX_BULK_UPLOAD_FILES) {
      this.errors.set([`Maximum ${MAX_BULK_UPLOAD_FILES} files per upload`]);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length) this.errors.set(errors);
    if (validFiles.length) this.filesSelected.emit(validFiles);
  }
}
