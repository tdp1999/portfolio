import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormErrorPipe } from '@portfolio/console/shared/util';

/**
 * Month-year picker for "duration / period" fields (Experience, Project start/end).
 * Wraps `mat-datepicker` configured for year-first → month selection. Day is fixed
 * to the 1st of the chosen month at midnight. See `.context/design/console-cookbook.md`.
 */
@Component({
  selector: 'console-month-year-picker',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, FormErrorPipe],
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
  placeholder = input<string>('');
  /** Optional control-name attribute mirrored onto the underlying `<input>` so test
   * selectors like `input[formControlName="startDate"]` keep working. Display-only. */
  controlName = input<string>('');

  private readonly picker = viewChild.required<MatDatepicker<Date>>('picker');

  onMonthSelected(date: Date): void {
    const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
    this.control().setValue(normalized);
    this.control().markAsDirty();
    this.picker().close();
  }
}
