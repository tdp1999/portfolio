import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SegmentedControl } from '@portfolio/console/shared/ui';
import { FormErrorPipe, ServerErrorDirective } from '@portfolio/console/shared/util';
import { catchError, of } from 'rxjs';
import { DEFAULT_BRIEF_WINDOW_MONTHS } from '../radar.constants';
import { BRIEF_WRITER_HELP, briefWriterOptions } from '../radar.data';
import { RadarService } from '../radar.service';
import type { RadarBrief, RadarBriefCreateDialogData, RadarBriefWriter } from '../radar.types';
import { utcDayEnd, utcDayStart } from '../radar-run.util';

/** Asks for a brief: which posts (a window, all sources or one) are summarized, and who writes it. */
@Component({
  selector: 'console-radar-brief-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SegmentedControl,
    FormErrorPipe,
    ServerErrorDirective,
  ],
  templateUrl: './radar-brief.create.dialog.html',
  styleUrl: './radar-brief.create.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarBriefCreateDialog {
  // ── DI ────────────────────────────────────────────────────────────
  protected readonly data = inject<RadarBriefCreateDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<RadarBriefCreateDialog, RadarBrief>>(MatDialogRef);
  private readonly radarService = inject(RadarService);
  private readonly fb = inject(FormBuilder);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly saving = signal(false);

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly today = new Date();

  // ── Forms ─────────────────────────────────────────────────────────
  protected readonly form = this.fb.group({
    /** Null reads "All sources". */
    sourceId: this.fb.control<string | null>(null),
    windowFrom: this.fb.control<Date | null>(this.defaultFrom(), Validators.required),
    windowTo: this.fb.control<Date | null>(this.today, Validators.required),
    /** Claude Code until the server confirms an AI key, then Auto. */
    writer: this.fb.nonNullable.control<RadarBriefWriter>('WORKER'),
  });

  // ── Derived ───────────────────────────────────────────────────────
  /** Null until it loads (or when it fails): Auto stays greyed out. */
  private readonly aiSettings = toSignal(this.radarService.aiSettings().pipe(catchError(() => of(null))), {
    initialValue: null,
  });
  protected readonly aiSettingsLoaded = computed(() => this.aiSettings() !== null);
  protected readonly aiConfigured = computed(() => this.aiSettings()?.configured ?? false);
  protected readonly writerOptions = computed(() => briefWriterOptions(this.aiConfigured()));
  protected readonly writer = toSignal(this.form.controls.writer.valueChanges, {
    initialValue: this.form.controls.writer.value,
  });
  protected readonly writerHelp = BRIEF_WRITER_HELP;

  constructor() {
    effect(() => {
      if (this.aiSettings()?.configured && this.form.controls.writer.pristine)
        this.form.controls.writer.setValue('AUTO');
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { sourceId, windowFrom, windowTo, writer } = this.form.getRawValue();
    if (!windowFrom || !windowTo) return;
    this.saving.set(true);
    this.radarService
      .createBrief({
        sourceId,
        windowFrom: utcDayStart(windowFrom).toISOString(),
        windowTo: utcDayEnd(windowTo).toISOString(),
        writer,
      })
      .subscribe({
        next: (brief) => this.dialogRef.close(brief),
        error: () => this.saving.set(false),
      });
  }

  private defaultFrom(): Date {
    const from = new Date(this.today);
    from.setMonth(from.getMonth() - DEFAULT_BRIEF_WINDOW_MONTHS);
    return from;
  }
}
