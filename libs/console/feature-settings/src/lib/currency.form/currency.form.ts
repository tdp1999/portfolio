import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  CurrencyService,
  DisplayCurrency,
  MAX_VND_PER_USD,
  MIN_VND_PER_USD,
  RelativeTime,
  SegmentedControl,
  SegmentedControlOption,
  ToastService,
  toMoneyView,
} from '@portfolio/console/shared/ui';
import { FormErrorPipe } from '@portfolio/console/shared/util';

const CURRENCY_OPTIONS: SegmentedControlOption[] = [
  { value: 'VND', label: 'VND (₫)' },
  { value: 'USD', label: 'USD ($)' },
];

/** Example amounts for the preview: a $1 run budget and one quick Radar analysis. */
const PREVIEW_MICRO_USD = { budget: 1_000_000, call: 2_400 };

@Component({
  selector: 'console-currency-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    RelativeTime,
    SegmentedControl,
    FormErrorPipe,
  ],
  templateUrl: './currency.form.html',
  styleUrl: './currency.form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CurrencyForm {
  // ── DI ────────────────────────────────────────────────────────────
  private readonly currency = inject(CurrencyService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  // ── Writable signals ──────────────────────────────────────────────
  protected readonly fetching = signal(false);
  /** Set by "Fetch today's rate", cleared by a hand edit; saved as the rate's date. */
  private readonly fetchedAt = signal<string | null>(null);

  // ── Forms ─────────────────────────────────────────────────────────
  protected readonly form = this.fb.nonNullable.group({
    currency: this.fb.nonNullable.control<DisplayCurrency>(this.currency.preference().currency),
    vndPerUsd: this.fb.nonNullable.control(this.currency.preference().vndPerUsd, [
      Validators.required,
      Validators.min(MIN_VND_PER_USD),
      Validators.max(MAX_VND_PER_USD),
    ]),
  });

  // ── Plain state ───────────────────────────────────────────────────
  protected readonly options = CURRENCY_OPTIONS;
  protected readonly minRate = MIN_VND_PER_USD;
  protected readonly maxRate = MAX_VND_PER_USD;
  protected readonly savedRateAt = computed(() => this.currency.preference().rateUpdatedAt);

  // ── Computed ──────────────────────────────────────────────────────
  private readonly draft = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  /** How the draft would show two familiar amounts, before saving. */
  protected readonly preview = computed(() => {
    const { currency = 'VND', vndPerUsd = 0 } = this.draft();
    if (!(vndPerUsd >= MIN_VND_PER_USD && vndPerUsd <= MAX_VND_PER_USD)) return null;
    const pref = { currency, vndPerUsd, rateUpdatedAt: null };
    return {
      budget: toMoneyView(PREVIEW_MICRO_USD.budget, pref).text,
      call: toMoneyView(PREVIEW_MICRO_USD.call, pref).text,
    };
  });

  constructor() {
    // A hand edit makes the rate the Owner's own: it is saved with today's date, not the fetch time.
    // "Fetch today's rate" sets the value first and the fetch time after, so its own change is kept.
    this.form.controls.vndPerUsd.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.fetchedAt.set(null));
  }

  async onFetchRate(): Promise<void> {
    this.fetching.set(true);
    try {
      const rate = await this.currency.fetchVndPerUsd();
      this.form.controls.vndPerUsd.setValue(rate);
      this.form.controls.vndPerUsd.markAsDirty();
      this.fetchedAt.set(new Date().toISOString());
    } catch {
      this.toast.error('Could not fetch the rate. Type it in instead.');
    } finally {
      this.fetching.set(false);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currency, vndPerUsd } = this.form.getRawValue();
    const saved = this.currency.preference();
    const rateChanged = vndPerUsd !== saved.vndPerUsd;
    this.currency.save({
      currency,
      vndPerUsd,
      rateUpdatedAt: rateChanged ? (this.fetchedAt() ?? new Date().toISOString()) : saved.rateUpdatedAt,
    });
    this.fetchedAt.set(null);
    this.form.markAsPristine();
    this.toast.success('Currency saved');
  }
}
