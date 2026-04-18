import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormErrorPipe } from '@portfolio/console/shared/util';

export interface LanguageConfig {
  key: string;
  label: string;
}

const DEFAULT_LANGUAGES: LanguageConfig[] = [
  { key: 'en', label: 'EN' },
  { key: 'vi', label: 'VI' },
];

/**
 * Accepts any `AbstractControl` and narrows to `FormGroup` at runtime via `instanceof`.
 * Callsites can pass loosely-typed results like `parent.controls['child']` without casts.
 */
@Component({
  selector: 'console-translatable-group',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, FormErrorPipe],
  template: `
    <div class="translatable-row" [formGroup]="fg()">
      @for (lang of languages(); track lang.key) {
        <mat-form-field appearance="outline" class="translatable-field">
          <mat-label>{{ label() }} ({{ lang.label }})</mat-label>
          @if (type() === 'textarea') {
            <textarea
              matInput
              [formControlName]="lang.key"
              [rows]="rows()"
              [attr.maxlength]="maxLength() ?? null"
              [attr.placeholder]="placeholder()[lang.key] ?? null"
            ></textarea>
          } @else {
            <input
              matInput
              [formControlName]="lang.key"
              [attr.maxlength]="maxLength() ?? null"
              [attr.placeholder]="placeholder()[lang.key] ?? null"
            />
          }
          @if (showCounter()) {
            <mat-hint align="end">
              {{ valueLength(lang.key) }}

              @if (maxLength()) {
                / {{ maxLength() }}
              }
            </mat-hint>
          }
          <mat-error>{{ fg().controls[lang.key] | formError }}</mat-error>
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslatableGroupComponent {
  readonly group = input.required<AbstractControl>();
  readonly label = input.required<string>();
  readonly type = input<'input' | 'textarea'>('input');
  readonly rows = input(3);
  readonly maxLength = input<number | undefined>(undefined);
  readonly placeholder = input<Partial<Record<string, string>>>({});
  readonly showCounter = input(false);
  readonly languages = input<LanguageConfig[]>(DEFAULT_LANGUAGES);

  protected readonly fg = computed<FormGroup>(() => {
    const c = this.group();
    if (!(c instanceof FormGroup)) {
      throw new Error('console-translatable-group: [group] must resolve to a FormGroup');
    }
    return c;
  });

  protected valueLength(key: string): number {
    const v = this.fg().controls[key]?.value;
    return typeof v === 'string' ? v.length : 0;
  }
}
