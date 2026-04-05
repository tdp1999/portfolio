import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface LanguageConfig {
  key: string;
  label: string;
}

const DEFAULT_LANGUAGES: LanguageConfig[] = [
  { key: 'en', label: 'EN' },
  { key: 'vi', label: 'VI' },
];

@Component({
  selector: 'console-translatable-input',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="translatable-row">
      @for (lang of languages(); track lang.key) {
        <mat-form-field appearance="outline" class="translatable-field">
          <mat-label>{{ label() }} ({{ lang.label }})</mat-label>
          @if (type() === 'textarea') {
            <textarea
              matInput
              [rows]="rows()"
              [value]="getFieldValue(lang.key)"
              (input)="onFieldInput(lang.key, $event)"
              (blur)="onTouched()"
            ></textarea>
          } @else {
            <input
              matInput
              [value]="getFieldValue(lang.key)"
              (input)="onFieldInput(lang.key, $event)"
              (blur)="onTouched()"
            />
          }
        </mat-form-field>
      }
    </div>
  `,
  styles: `
    .translatable-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .translatable-field {
      width: 100%;
    }
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TranslatableInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslatableInputComponent implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly type = input<'input' | 'textarea'>('input');
  readonly rows = input(3);
  readonly languages = input<LanguageConfig[]>(DEFAULT_LANGUAGES);

  private readonly value = signal<Record<string, string>>({});
  private readonly disabled = signal(false);

  private onChange: (value: Record<string, string>) => void = () => {
    // No-op
  };
  onTouched: () => void = () => {
    // No-op
  };

  getFieldValue(key: string): string {
    return this.value()[key] ?? '';
  }

  onFieldInput(key: string, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    const current = { ...this.value() };
    current[key] = input.value;
    this.value.set(current);
    this.onChange(current);
  }

  writeValue(val: Record<string, string> | null): void {
    this.value.set(val ?? {});
  }

  registerOnChange(fn: (value: Record<string, string>) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
