import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormErrorPipe } from '@portfolio/console/shared/util';

const MONTH_YEAR_FORMATS = {
  parse: { dateInput: { month: 'numeric', year: 'numeric' } },
  display: {
    dateInput: { month: '2-digit', year: 'numeric' },
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { month: 'long', year: 'numeric' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
  },
};

/**
 * Month-year picker for "duration / period" fields (Experience, Project start/end).
 * Wraps `mat-datepicker` configured for year-first → month selection. Day is fixed
 * to the 1st of the chosen month at midnight. See `.context/design/console-cookbook.md`.
 */
@Component({
  selector: 'console-month-year-picker',
  standalone: true,
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MONTH_YEAR_FORMATS }],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    FormErrorPipe,
  ],
  template: `
    <mat-form-field appearance="outline" class="month-year-picker">
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        [matDatepicker]="picker"
        [formControl]="control()"
        [placeholder]="placeholder()"
        [attr.formControlName]="controlName() || null"
        readonly
      />
      @if (clearable() && control().value) {
        <button matSuffix mat-icon-button type="button" aria-label="Clear date" (click)="clear($event)">
          <mat-icon>close</mat-icon>
        </button>
      }
      <mat-datepicker-toggle matSuffix [for]="picker" />
      <mat-datepicker #picker startView="multi-year" (monthSelected)="onMonthSelected($event)" />
      <mat-error>{{ control() | formError }}</mat-error>
    </mat-form-field>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .month-year-picker {
        width: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthYearPickerComponent {
  control = input.required<FormControl<Date | null>>();
  label = input.required<string>();
  placeholder = input<string>('mm/yyyy');
  /** Optional control-name attribute mirrored onto the underlying `<input>` so test
   * selectors like `input[formControlName="startDate"]` keep working. Display-only. */
  controlName = input<string>('');
  clearable = input<boolean>(false);

  private readonly picker = viewChild.required<MatDatepicker<Date>>('picker');

  onMonthSelected(date: Date): void {
    const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
    this.control().setValue(normalized);
    this.control().markAsDirty();
    this.picker().close();
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.control().setValue(null);
    this.control().markAsDirty();
  }
}
