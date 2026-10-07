import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  CurrencyService,
  Money,
  SegmentedControl,
  amountToUsd,
  microUsdToAmount,
  toMoneyView,
} from '@portfolio/console/shared/ui';
import { catchError, map, of } from 'rxjs';
import { ErrorMessage, FormErrorPipe, ServerErrorDirective } from '@portfolio/console/shared/util';
import { DEFAULT_RUN_ITEM_CAP, MAX_RUN_BUDGET_USD, MAX_RUN_ITEM_CAP, MIN_RUN_BUDGET_USD } from '../radar.constants';
import { RUN_FLOW_HELP, runFlowOptions } from '../radar.data';
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
      (c: AbstractControl<number | null>) => this.budgetRangeError(c.value),
    ]),
  });

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly flowHelp = RUN_FLOW_HELP;
  protected readonly maxItemCap = MAX_RUN_ITEM_CAP;
  protected readonly budgetMessages: Record<string, ErrorMessage> = {
    budgetRange: (p) => `Between ${p['min']} and ${p['max']}.`,
  };
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
  protected readonly flowOptions = computed(() => runFlowOptions(this.aiSettings()?.configured ?? false));
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
      const pref = this.currency.preference();
      const amount = microUsdToAmount(ai.defaultBudgetMicroUsd, pref);
      this.form.controls.budget.setValue(pref.currency === 'VND' ? Math.round(amount) : Number(amount.toFixed(2)));
      if (ai.configured && this.form.controls.flow.pristine) this.form.controls.flow.setValue('AUTO');
    });

    // A different source chains from its own last run, so the window start follows the pick.
    this.form.controls.sourceId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.form.controls.windowFrom.setValue(this.windowStart(id)));

    // Comments ride on incremental Hybrid runs only; a backfill (no window start) never buys them.
    // The budget only means something on an AUTO run.
    const syncComments = () => {
      const { flow, windowFrom } = this.form.getRawValue();
      const control = this.form.controls.fetchComments;
      if (flow !== 'MANUAL' && windowFrom) control.enable({ emitEvent: false });
      else control.disable({ emitEvent: false });
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
        budgetUsd: this.budgetUsd(v.flow, v.budget),
      })
      .subscribe({
        next: (run) => this.dialogRef.close(run),
        error: () => this.saving.set(false),
      });
  }

  /** The server takes $0.01 to $100 per run: checked here in the display currency, the range quoted in it. */
  private budgetRangeError(value: number | null): ValidationErrors | null {
    if (value === null) return null;
    const pref = this.currency.preference();
    const usd = amountToUsd(value, pref);
    if (usd >= MIN_RUN_BUDGET_USD && usd <= MAX_RUN_BUDGET_USD) return null;
    return {
      budgetRange: {
        min: toMoneyView(MIN_RUN_BUDGET_USD * 1_000_000, pref).text,
        max: toMoneyView(MAX_RUN_BUDGET_USD * 1_000_000, pref).text,
      },
    };
  }

  /** The typed budget in USD (cents kept), or undefined to let the server apply its default. */
  private budgetUsd(flow: RadarRunFlow, budget: number | null): number | undefined {
    if (flow !== 'AUTO' || budget === null || budget <= 0) return undefined;
    // The validator keeps the amount in range, and rounding to cents cannot push it out.
    return Math.round(amountToUsd(budget, this.currency.preference()) * 100) / 100;
  }

  private windowStart(sourceId: string | undefined): Date | null {
    return sourceId ? defaultWindowFrom(this.data.runs, sourceId, new Date()) : null;
  }
}
