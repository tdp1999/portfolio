import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormErrorPipe, ServerErrorDirective } from '@portfolio/console/shared/util';
import { DEFAULT_BRIEF_WINDOW_MONTHS } from '../radar.constants';
import { RadarService } from '../radar.service';
import type { RadarBrief, RadarBriefCreateDialogData } from '../radar.types';
import { utcDayEnd, utcDayStart } from '../radar-run.util';

/** Asks for a brief: which posts (a window, all sources or one) the worker summarizes next. */
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
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { sourceId, windowFrom, windowTo } = this.form.getRawValue();
    if (!windowFrom || !windowTo) return;
    this.saving.set(true);
    this.radarService
      .createBrief({
        sourceId,
        windowFrom: utcDayStart(windowFrom).toISOString(),
        windowTo: utcDayEnd(windowTo).toISOString(),
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
