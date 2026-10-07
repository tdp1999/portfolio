import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyService } from '../../services/currency/currency.service';
import { toMoneyView } from '../../services/currency/currency.util';

/**
 * A micro-USD amount in the Owner's display currency (Settings → Currency), with a tooltip that
 * always gives the USD original, and the rate when converted.
 */
@Component({
  selector: 'console-money',
  standalone: true,
  imports: [MatTooltipModule],
  template: `
    <span
      [matTooltip]="view().tooltip"
      matTooltipPosition="above"
      matTooltipClass="tooltip-multiline"
      class="whitespace-nowrap tabular-nums"
    >
      {{ view().text }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Money {
  private readonly currency = inject(CurrencyService);

  /** Null renders "No price" (a model missing from the API price table). */
  readonly microUsd = input.required<number | null>();

  protected readonly view = computed(() => toMoneyView(this.microUsd(), this.currency.preference()));
}
