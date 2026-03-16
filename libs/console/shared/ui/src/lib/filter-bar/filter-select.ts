import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export interface FilterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'console-filter-select',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field subscriptSizing="dynamic" class="min-w-[140px]">
      <mat-label>{{ label() }}</mat-label>
      <mat-select [value]="value()" (selectionChange)="selectionChange.emit($event.value)">
        @if (showAll()) {
          <mat-option value="">All</mat-option>
        }
        @for (option of options(); track option.value) {
          <mat-option [value]="option.value">{{ option.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSelectComponent {
  readonly label = input.required<string>();
  readonly options = input.required<FilterOption[]>();
  readonly value = input('');
  readonly showAll = input(true);
  readonly selectionChange = output<string>();
}
