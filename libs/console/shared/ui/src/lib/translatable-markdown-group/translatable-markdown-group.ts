import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormErrorPipe } from '@portfolio/console/shared/util';
import { Editor as MarkdownEditor } from '../markdown-editor/editor';

export interface MarkdownLanguageConfig {
  key: string;
  label: string;
}

const DEFAULT_LANGUAGES: MarkdownLanguageConfig[] = [
  { key: 'en', label: 'EN' },
  { key: 'vi', label: 'VI' },
];

/**
 * Translatable markdown editor — wraps MarkdownEditor in a per-locale stack.
 *
 * Accepts any AbstractControl and narrows to FormGroup at runtime via instanceof,
 * mirroring TranslatableGroupComponent so callsites can pass loosely-typed children.
 */
@Component({
  selector: 'console-translatable-markdown-group',
  standalone: true,
  imports: [ReactiveFormsModule, MarkdownEditor, FormErrorPipe],
  template: `
    <div class="translatable-md-group" [formGroup]="fg()">
      @if (label(); as l) {
        <p class="field-label">{{ l }}</p>
      }
      @if (helperText(); as ht) {
        <p class="text-sm text-text-muted mb-2">{{ ht }}</p>
      }
      @for (lang of languages(); track lang.key) {
        <div class="md-locale">
          <p class="md-locale__label">{{ lang.label }}</p>
          <console-markdown-editor
            [formControlName]="lang.key"
            [placeholder]="placeholder()[lang.key] ?? ''"
            [ariaLabel]="(label() || '') + ' (' + lang.label + ')'"
            [minHeight]="minHeight()"
          />
          @if (fg().controls[lang.key].touched && fg().controls[lang.key].invalid) {
            <p class="md-locale__error">{{ fg().controls[lang.key] | formError }}</p>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .translatable-md-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .md-locale {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .md-locale__label {
      font-size: 12px;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant, #666);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .md-locale__error {
      color: var(--mat-sys-error, #b00020);
      font-size: 12px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslatableMarkdownGroupComponent {
  readonly group = input.required<AbstractControl>();
  readonly label = input<string>('');
  readonly helperText = input<string>('');
  readonly placeholder = input<Partial<Record<string, string>>>({});
  readonly languages = input<MarkdownLanguageConfig[]>(DEFAULT_LANGUAGES);
  /** Per-locale editor min-height in px. Default 320; pass smaller for short copy. */
  readonly minHeight = input<number>(320);

  protected readonly fg = computed<FormGroup>(() => {
    const c = this.group();
    if (!(c instanceof FormGroup)) {
      throw new Error('console-translatable-markdown-group: [group] must resolve to a FormGroup');
    }
    return c;
  });
}
