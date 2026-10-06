import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SegmentedControl } from '@portfolio/console/shared/ui';
import { map } from 'rxjs';
import { FormErrorPipe, ServerErrorDirective } from '@portfolio/console/shared/util';
import { DEFAULT_RUN_ITEM_CAP, MAX_RUN_ITEM_CAP } from '../radar.constants';
import { RUN_FLOW_OPTIONS } from '../radar.data';
import { RadarService } from '../radar.service';
import type { RadarRun, RadarRunCreateDialogData, RadarRunFlow } from '../radar.types';
import { defaultWindowFrom, utcDayEnd, utcDayStart } from '../radar-run.util';

@Component({
  selector: 'console-radar-run-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SegmentedControl,
    FormErrorPipe,
    ServerErrorDirective,
  ],
  templateUrl: './radar-run.create.dialog.html',
  styleUrl: './radar-run.create.dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarRunCreateDialog {
  // ── DI ────────────────────────────────────────────────────────────
  protected readonly data = inject<RadarRunCreateDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<RadarRunCreateDialog, RadarRun>>(MatDialogRef);
  private readonly radarService = inject(RadarService);
  private readonly fb = inject(FormBuilder);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly saving = signal(false);

  // ── Forms ─────────────────────────────────────────────────────────
  protected readonly form = this.fb.group({
    sourceId: this.fb.nonNullable.control(this.data.sources[0]?.id ?? '', Validators.required),
    flow: this.fb.nonNullable.control<RadarRunFlow>('HYBRID'),
    windowFrom: this.fb.control<Date | null>(this.windowStart(this.data.sources[0]?.id)),
    windowTo: this.fb.control<Date | null>(null),
    itemCap: this.fb.nonNullable.control(DEFAULT_RUN_ITEM_CAP, [
      Validators.required,
      Validators.min(1),
      Validators.max(MAX_RUN_ITEM_CAP),
    ]),
    fetchComments: this.fb.nonNullable.control(true),
  });

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly flowOptions = RUN_FLOW_OPTIONS;
  protected readonly maxItemCap = MAX_RUN_ITEM_CAP;
  protected readonly today = new Date();
  /** The server's run cap for comments; null until it loads, then the hint quotes it. */
  protected readonly commentsCapUsd = toSignal(
    this.radarService.commentsSettings().pipe(map((s) => s.runMaxChargeUsd)),
    {
      initialValue: null,
    }
  );

  constructor() {
    // A different source chains from its own last run, so the window start follows the pick.
    this.form.controls.sourceId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.form.controls.windowFrom.setValue(this.windowStart(id)));

    // Comments ride on incremental Hybrid runs only; a backfill (no window start) never buys them.
    const syncComments = () => {
      const { flow, windowFrom } = this.form.getRawValue();
      const control = this.form.controls.fetchComments;
      if (flow === 'HYBRID' && windowFrom) control.enable({ emitEvent: false });
      else control.disable({ emitEvent: false });
    };
    syncComments();
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(syncComments);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.radarService
      .createRun({
        sourceId: v.sourceId,
        flow: v.flow,
        itemCap: v.itemCap,
        windowFrom: v.windowFrom ? utcDayStart(v.windowFrom).toISOString() : undefined,
        windowTo: v.windowTo ? utcDayEnd(v.windowTo).toISOString() : undefined,
        fetchComments: this.form.controls.fetchComments.enabled && v.fetchComments,
      })
      .subscribe({
        next: (run) => this.dialogRef.close(run),
        error: () => this.saving.set(false),
      });
  }

  private windowStart(sourceId: string | undefined): Date | null {
    return sourceId ? defaultWindowFrom(this.data.runs, sourceId, new Date()) : null;
  }
}
