import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { filter, merge } from 'rxjs';
import {
  HelpButton,
  MarkdownEditorComponent,
  onBeforeUnload,
  ToastService,
  UnsavedChangesDialog,
  type UnsavedChangesResult,
} from '@portfolio/console/shared/ui';
import { PROFILE_MAX_CHARS } from '../radar.constants';
import { RadarService } from '../radar.service';

/**
 * The Owner's workflow profile: the markdown the analysis reads before writing each apply note.
 * Opened from the Feed header; closing with unsaved edits asks first (the dialog opens with
 * `disableClose`, so Escape and the backdrop come through `onCancel`).
 */
@Component({
  selector: 'console-radar-profile-dialog',
  standalone: true,
  imports: [
    HelpButton,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MarkdownEditorComponent,
  ],
  templateUrl: './radar-profile.dialog.html',
  styleUrl: './radar-profile.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarProfileDialog implements OnInit {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly radarService = inject(RadarService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<RadarProfileDialog>);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly length = signal(0);
  protected readonly updatedAt = signal<string | null>(null);
  /** Read by the Feed's leave guard: Back or a link while editing asks before the edits are lost. */
  readonly unsaved = this.dirty.asReadonly();

  // ── Forms ─────────────────────────────────────────────────────────
  protected readonly body = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(PROFILE_MAX_CHARS)],
  });

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly maxChars = PROFILE_MAX_CHARS;
  /** Last saved text, so the dirty check needs no round trip. */
  private savedBody = '';

  ngOnInit(): void {
    this.body.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.length.set(value.length);
      this.dirty.set(value !== this.savedBody);
    });
    // An Escape a widget inside the dialog already handled (a menu closing) is not a request to close.
    merge(
      this.dialogRef.backdropClick(),
      this.dialogRef.keydownEvents().pipe(filter((e) => e.key === 'Escape' && !e.defaultPrevented))
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onCancel());
    this.load();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    onBeforeUnload(event, this.dirty());
  }

  onRetry(): void {
    this.load();
  }

  onCancel(): void {
    if (!this.dirty()) {
      this.dialogRef.close();
      return;
    }
    this.dialog
      .open<UnsavedChangesDialog, { showSave: boolean }, UnsavedChangesResult>(UnsavedChangesDialog, {
        data: { showSave: false },
        disableClose: true,
      })
      .afterClosed()
      .pipe(filter((result) => result === 'discard'))
      .subscribe(() => this.dialogRef.close());
  }

  onSave(): void {
    if (this.body.invalid) {
      this.body.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.radarService.saveProfile(this.body.value).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Workflow profile saved');
        this.dialogRef.close();
      },
      error: () => this.saving.set(false),
    });
  }

  // ── shared helpers ────────────────────────────────────────────────
  private load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.radarService.getProfile().subscribe({
      next: (profile) => {
        this.updatedAt.set(profile.updatedAt);
        this.savedBody = profile.body;
        this.body.setValue(profile.body);
        this.dirty.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
}
