import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CurrencyService, Money, SegmentedControl } from '@portfolio/console/shared/ui';
import { catchError, map, of } from 'rxjs';
import { FormErrorPipe, ServerErrorDirective } from '@portfolio/console/shared/util';
import { BUDGET_MESSAGES, budgetFieldValue, budgetRangeValidator, budgetToUsd } from '../radar-budget.util';
import { DEFAULT_RUN_ITEM_CAP, MAX_RUN_ITEM_CAP } from '../radar.constants';
import { RUN_FLOW_HELP, runFlowOptions } from '../radar.data';
import { RadarService } from '../radar.service';
import type { RadarPlatform, RadarRun, RadarRunCreateDialogData, RadarRunFlow } from '../radar.types';
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
    Money,
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
  private readonly currency = inject(CurrencyService);

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
    /** In the display currency (Settings → Currency); sent to the API in USD. AUTO only. */
    budget: this.fb.control<number | null>(null, [
      Validators.required,
      budgetRangeValidator(() => this.currency.preference()),
    ]),
  });

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly flowHelp = RUN_FLOW_HELP;
  protected readonly maxItemCap = MAX_RUN_ITEM_CAP;
  protected readonly budgetMessages = BUDGET_MESSAGES;
  protected readonly today = new Date();
  /** The server's run cap for comments; null until it loads, then the hint quotes it. */
  protected readonly commentsCapMicroUsd = toSignal(
    this.radarService.commentsSettings().pipe(
      map((s) => Math.round(s.runMaxChargeUsd * 1_000_000)),
      catchError(() => of(null))
    ),
    {
      initialValue: null,
    }
  );

  /** Null until it loads (or when it fails): AUTO stays greyed out and the budget empty. */
  protected readonly aiSettings = toSignal(this.radarService.aiSettings().pipe(catchError(() => of(null))), {
    initialValue: null,
  });
  private readonly sourceId = toSignal(this.form.controls.sourceId.valueChanges, {
    initialValue: this.form.controls.sourceId.value,
  });
  /** Facebook unless the picked source is a YouTube channel. */
  protected readonly isFacebook = computed(
    () => (this.data.sources.find((s) => s.id === this.sourceId())?.platform ?? 'FACEBOOK') === 'FACEBOOK'
  );
  protected readonly flowOptions = computed(() =>
    runFlowOptions(this.aiSettings()?.configured ?? false, this.isFacebook())
  );
  protected readonly flow = toSignal(this.form.controls.flow.valueChanges, {
    initialValue: this.form.controls.flow.value,
  });
  protected readonly currencyCode = computed(() => this.currency.preference().currency);
  protected readonly defaultBudgetMicroUsd = computed(() => this.aiSettings()?.defaultBudgetMicroUsd ?? null);

  constructor() {
    // Once the server says AI is ready, AUTO becomes the default flow with the default budget.
    effect(() => {
      const ai = this.aiSettings();
      if (!ai) return;
      this.form.controls.budget.setValue(budgetFieldValue(ai.defaultBudgetMicroUsd, this.currency.preference()));
      if (ai.configured && this.form.controls.flow.pristine) this.form.controls.flow.setValue('AUTO');
    });

    // A different source chains from its own last run, so the window start follows the pick.
    // A YouTube channel cannot take a Manual run (the upload is a Facebook export).
    this.form.controls.sourceId.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => {
      this.form.controls.windowFrom.setValue(this.windowStart(id));
      const flow = this.form.controls.flow;
      if (flow.value === 'MANUAL' && this.platformOf(id) !== 'FACEBOOK') {
        flow.setValue(this.aiSettings()?.configured ? 'AUTO' : 'HYBRID');
      }
    });

    // Comments ride on incremental Hybrid and Auto runs of a Facebook source only; a backfill (no
    // window start) never buys them. The budget only means something on an AUTO run.
    const syncComments = () => {
      const { flow, windowFrom, sourceId } = this.form.getRawValue();
      const control = this.form.controls.fetchComments;
      if (flow !== 'MANUAL' && windowFrom && this.platformOf(sourceId) === 'FACEBOOK') {
        control.enable({ emitEvent: false });
      } else {
        control.disable({ emitEvent: false });
      }
      const budget = this.form.controls.budget;
      if (flow === 'AUTO') budget.enable({ emitEvent: false });
      else budget.disable({ emitEvent: false });
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
        budgetUsd: v.flow === 'AUTO' ? budgetToUsd(v.budget, this.currency.preference()) : undefined,
      })
      .subscribe({
        next: (run) => this.dialogRef.close(run),
        error: () => this.saving.set(false),
      });
  }

  private platformOf(sourceId: string): RadarPlatform {
    return this.data.sources.find((s) => s.id === sourceId)?.platform ?? 'FACEBOOK';
  }

  private windowStart(sourceId: string | undefined): Date | null {
    return sourceId ? defaultWindowFrom(this.data.runs, sourceId, new Date()) : null;
  }
}
