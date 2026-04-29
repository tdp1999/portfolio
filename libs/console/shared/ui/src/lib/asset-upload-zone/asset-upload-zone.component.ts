import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { extractApiError, type MediaItem } from '@portfolio/console/shared/util';
import { readableSize } from '@portfolio/shared/ui/pipes';
import { UploadRowComponent } from './upload-row.component';
import type { UploadFn, UploadRowState } from './asset-upload-zone.types';
import { HttpErrorResponse } from '@angular/common/http';

let nextId = 0;

@Component({
  selector: 'console-asset-upload-zone',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, UploadRowComponent],
  templateUrl: './asset-upload-zone.component.html',
  styleUrl: './asset-upload-zone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetUploadZoneComponent implements OnDestroy {
  readonly accept = input('*/*');
  readonly maxFileSize = input(10 * 1024 * 1024);
  readonly multiple = input(true);
  readonly uploadFn = input.required<UploadFn>();

  readonly uploadsComplete = output<MediaItem[]>();
  readonly uploadFailed = output<{ file: File; error: Error }[]>();

  protected readonly isDragOver = signal(false);
  protected readonly rows = signal<UploadRowState[]>([]);
  protected readonly validationErrors = signal<string[]>([]);

  protected readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly hasRows = computed(() => this.rows().length > 0);

  private readonly subs = new Map<string, Subscription>();

  ngOnDestroy(): void {
    for (const sub of this.subs.values()) {
      sub.unsubscribe();
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.processFiles(files);
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.processFiles(files);
  }

  protected onDropZoneKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.fileInput()?.nativeElement.click();
    }
  }

  protected openFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onCancelRow(id: string): void {
    this.subs.get(id)?.unsubscribe();
    this.subs.delete(id);
    this.rows.update((rs) => rs.filter((r) => r.id !== id));
  }

  protected onRetryRow(id: string): void {
    const row = this.rows().find((r) => r.id === id);
    if (!row) return;
    this.updateRow(id, { state: 'uploading', progress: 0, error: undefined });
    this.startUpload(id, row.file);
  }

  protected onRemoveRow(id: string): void {
    this.rows.update((rs) => rs.filter((r) => r.id !== id));
  }

  private processFiles(files: File[]): void {
    this.validationErrors.set([]);
    if (!files.length) return;

    const errors: string[] = [];
    const valid: File[] = [];

    for (const file of files) {
      const err = this.validateFile(file);
      if (err) {
        errors.push(`${file.name}: ${err}`);
      } else {
        valid.push(file);
      }
    }

    if (errors.length) this.validationErrors.set(errors);

    for (const file of valid) {
      const id = `upload-${++nextId}`;
      this.rows.update((rs) => [...rs, { id, file, state: 'uploading', progress: 0 }]);
      this.startUpload(id, file);
    }
  }

  private validateFile(file: File): string | null {
    if (file.size > this.maxFileSize()) {
      return `exceeds ${readableSize(this.maxFileSize())} limit`;
    }
    const accept = this.accept();
    if (!accept || accept === '*' || accept === '*/*') return null;

    const patterns = accept.split(',').map((p) => p.trim());
    const ok = patterns.some((pattern) => {
      if (pattern.endsWith('/*')) {
        return file.type.startsWith(pattern.slice(0, -2));
      }
      return file.type === pattern;
    });
    return ok ? null : 'file type not accepted';
  }

  private startUpload(id: string, file: File): void {
    this.subs.get(id)?.unsubscribe();
    const sub = this.uploadFn()(file).subscribe({
      next: ({ progress, result }) => {
        if (result) {
          this.updateRow(id, { state: 'done', progress: 100, result });
        } else {
          this.updateRow(id, { progress });
        }
      },
      error: (err: HttpErrorResponse) => {
        const parsedError = extractApiError(err);
        this.updateRow(id, {
          state: 'error',
          error: parsedError.message ? new Error(parsedError.message) : new Error('Upload failed'),
        });
        this.subs.delete(id);
        this.checkAllSettled();
      },
      complete: () => {
        this.subs.delete(id);
        this.checkAllSettled();
      },
    });
    this.subs.set(id, sub);
  }

  private updateRow(id: string, patch: Partial<UploadRowState>): void {
    this.rows.update((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  private checkAllSettled(): void {
    const rows = this.rows();
    if (rows.some((r) => r.state === 'uploading')) return;

    const completed = rows.filter((r) => r.state === 'done' && r.result).map((r) => r.result) as MediaItem[];
    const failed = rows
      .filter((r) => r.state === 'error')
      .map((r) => ({ file: r.file, error: r.error }) as { file: File; error: Error });

    if (completed.length) this.uploadsComplete.emit(completed);
    if (failed.length) this.uploadFailed.emit(failed);
  }
}
