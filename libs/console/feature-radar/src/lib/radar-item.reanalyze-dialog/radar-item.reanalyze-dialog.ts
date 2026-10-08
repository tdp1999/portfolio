import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CurrencyService, Money, SegmentedControl, ToastService } from '@portfolio/console/shared/ui';
import { FormErrorPipe, ServerErrorDirective } from '@portfolio/console/shared/util';
import { catchError, of } from 'rxjs';
import { BUDGET_MESSAGES, budgetFieldValue, budgetRangeValidator, budgetToUsd } from '../radar-budget.util';
import {
  DEEP_ANALYSIS_HELP,
  REANALYZE_MODE_HELP,
  reanalyzeModeOptions,
  reanalyzeRunLink,
  reanalyzeToast,
} from '../radar.data';
import { RadarService } from '../radar.service';
import type { RadarReanalyzeDialogData, RadarReanalyzeMode, ReanalyzeItemsResult } from '../radar.types';

/**
 * Sends one post (Detail) or a selection (Feed) to be analyzed again. Auto is the default: a
 * re-analysis run on the server, under the budget typed here. Claude Code leaves the posts in the
 * queue for the next `/radar work`. Closes with the server's answer once it is sent.
 */
@Component({
  selector: 'console-radar-item-reanalyze-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    Money,
    SegmentedControl,
    FormErrorPipe,
    ServerErrorDirective,
  ],
  templateUrl: './radar-item.reanalyze-dialog.html',
  styleUrl: './radar-item.reanalyze-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadarItemReanalyzeDialog {
  // ── DI ────────────────────────────────────────────────────────────
  protected readonly data = inject<RadarReanalyzeDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<RadarItemReanalyzeDialog, ReanalyzeItemsResult>>(MatDialogRef);
  private readonly radarService = inject(RadarService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly currency = inject(CurrencyService);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly saving = signal(false);

  // ── Forms ─────────────────────────────────────────────────────────
  protected readonly form = this.fb.group({
    mode: this.fb.nonNullable.control<RadarReanalyzeMode>('WORKER'),
    /** In the display currency; sent in USD. Auto only. */
    budget: this.fb.control<number | null>(null, [
      Validators.required,
      budgetRangeValidator(() => this.currency.preference()),
    ]),
    /** Auto only, off by default (ADR-036). */
    deepAnalysis: this.fb.nonNullable.control(false),
  });

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly modeHelp = REANALYZE_MODE_HELP;
  protected readonly budgetMessages = BUDGET_MESSAGES;
  protected readonly deepHelp = DEEP_ANALYSIS_HELP;
  protected readonly title =
    this.data.ids.length === 1 ? 'Re-analyze this post' : `Re-analyze ${this.data.ids.length} posts`;

  // ── Derived ───────────────────────────────────────────────────────
  /** Null until it loads (or when it fails): Auto stays greyed out and Claude Code is picked. */
  protected readonly aiSettings = toSignal(this.radarService.aiSettings().pipe(catchError(() => of(null))), {
    initialValue: null,
  });
  protected readonly modeOptions = computed(() => reanalyzeModeOptions(this.aiSettings()?.configured ?? false));
  protected readonly mode = toSignal(this.form.controls.mode.valueChanges, {
    initialValue: this.form.controls.mode.value,
  });
  protected readonly currencyCode = computed(() => this.currency.preference().currency);
  protected readonly defaultBudgetMicroUsd = computed(() => this.aiSettings()?.defaultBudgetMicroUsd ?? null);

  constructor() {
    // Once the server says AI is ready, Auto becomes the pick with the default budget.
    effect(() => {
      const ai = this.aiSettings();
      if (!ai) return;
      this.form.controls.budget.setValue(budgetFieldValue(ai.defaultBudgetMicroUsd, this.currency.preference()));
      if (ai.configured && this.form.controls.mode.pristine) this.form.controls.mode.setValue('AUTO');
    });

    // The budget only means something for Auto.
    const syncBudget = (mode: RadarReanalyzeMode) => {
      const budget = this.form.controls.budget;
      if (mode === 'AUTO') budget.enable({ emitEvent: false });
      else budget.disable({ emitEvent: false });
    };
    syncBudget(this.form.controls.mode.value);
    this.form.controls.mode.valueChanges.pipe(takeUntilDestroyed()).subscribe(syncBudget);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { mode, budget, deepAnalysis } = this.form.getRawValue();
    this.saving.set(true);
    this.radarService
      .reanalyzeItems({
        ids: this.data.ids,
        mode,
        budgetUsd: mode === 'AUTO' ? budgetToUsd(budget, this.currency.preference()) : undefined,
        deepAnalysis: mode === 'AUTO' && deepAnalysis,
      })
      .subscribe({
        next: (result) => {
          const notice = reanalyzeToast(result, mode);
          if (result.requeued === 0) this.toast.warning(notice);
          else if (result.runId) this.toast.success(notice, { action: reanalyzeRunLink(result.runId) });
          else this.toast.success(notice);
          this.dialogRef.close(result);
        },
        error: () => this.saving.set(false),
      });
  }
}
