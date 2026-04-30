import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { A11yModule } from '@angular/cdk/a11y';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent, type ConfirmDialogData, ToastService } from '@portfolio/console/shared/ui';
import { ServerErrorDirective } from '@portfolio/console/shared/util';
import { filter, switchMap } from 'rxjs';
import { MediaService } from '../media.service';
import { MediaItem } from '../media.types';
import { formatFileSize, getMimeTypeCategory } from '../media.constants';

@Component({
  selector: 'console-media-drawer',
  standalone: true,
  imports: [
    A11yModule,
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ServerErrorDirective,
  ],
  templateUrl: './media-drawer.html',
  styleUrl: './media-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaDrawerComponent {
  private readonly fb = inject(FormBuilder);
  private readonly mediaService = inject(MediaService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  /** Currently selected media id; null means closed. URL-synced by parent. */
  readonly selectedId = input<string | null>(null);

  readonly closed = output<void>();
  readonly updated = output<MediaItem>();
  readonly deleted = output<string>();

  readonly item = signal<MediaItem | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly dirty = signal(false);

  readonly form = this.fb.nonNullable.group({
    altText: [''],
    caption: [''],
  });

  readonly isImage = computed(() => {
    const it = this.item();
    return !!it && it.mimeType.startsWith('image/');
  });
  readonly typeBadge = computed(() => {
    const it = this.item();
    return it ? getMimeTypeCategory(it.mimeType) : '';
  });
  readonly fileSize = computed(() => {
    const it = this.item();
    return it ? formatFileSize(it.bytes) : '';
  });

  constructor() {
    effect(() => {
      const id = this.selectedId();
      if (id) {
        this.load(id);
      } else {
        this.item.set(null);
        this.dirty.set(false);
      }
    });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dirty.set(true);
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.selectedId() && this.dirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedId()) this.close();
  }

  close(): void {
    if (this.dirty() && !confirm('Discard unsaved metadata changes?')) return;
    this.closed.emit();
  }

  save(): void {
    const it = this.item();
    if (!it) return;
    this.submitting.set(true);
    const raw = this.form.getRawValue();

    this.mediaService
      .update(it.id, {
        altText: raw.altText || null,
        caption: raw.caption || null,
      })
      .pipe(
        switchMap(() => this.mediaService.getById(it.id)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (fresh) => {
          this.submitting.set(false);
          this.item.set(fresh);
          this.dirty.set(false);
          this.toast.success('Media updated');
          this.updated.emit(fresh);
        },
        error: () => this.submitting.set(false),
      });
  }

  confirmDelete(): void {
    const it = this.item();
    if (!it) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Media',
          message: `Move "${it.originalFilename}" to trash?`,
          confirmLabel: 'Delete',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.mediaService.delete(it.id))
      )
      .subscribe({
        next: () => {
          this.toast.success('Media moved to trash');
          this.deleted.emit(it.id);
        },
        // Global handler toasts via the error dictionary; nothing to do locally.
      });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.mediaService.getById(id).subscribe({
      next: (fresh) => {
        this.item.set(fresh);
        this.form.setValue({
          altText: fresh.altText ?? '',
          caption: fresh.caption ?? '',
        });
        this.dirty.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.closed.emit();
      },
    });
  }
}
