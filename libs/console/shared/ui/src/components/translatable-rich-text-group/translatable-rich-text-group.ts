import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormErrorPipe } from '@portfolio/console/shared/util';
import type { EditorMode } from '@portfolio/shared/features/rte-core';
import { RichTextEditor } from '../rich-text-editor/rich-text-editor';
import { SegmentedControl } from '../segmented-control/segmented-control';
import { DEFAULT_LANGUAGES, VIEW_OPTIONS } from './translatable-rich-text-group.data';
import type { LocaleView, RichTextLanguageConfig } from './translatable-rich-text-group.types';

export type { RichTextLanguageConfig, LocaleView } from './translatable-rich-text-group.types';

/**
 * Bilingual rich-text editor — wraps {@link RichTextEditor} in a per-locale
 * stack with an `EN | VI | All` segmented toggle. Single-locale views render one
 * full-width editor; `All` stacks both. Both locale controls always live on the
 * FormGroup regardless of view, so a hidden locale keeps its value (the editor
 * re-mounts and re-applies it on the way back).
 *
 * Accepts any AbstractControl and narrows to FormGroup at runtime, mirroring
 * {@link TranslatableGroup} so callsites can pass loosely-typed children.
 */
@Component({
  selector: 'console-translatable-rich-text-group',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, FormErrorPipe, SegmentedControl, RichTextEditor],
  template: `
    <div class="trt-group" [formGroup]="fg()">
      <div class="trt-group__bar">
        @if (label(); as l) {
          <p class="field-label">{{ l }}</p>
        }
        <console-segmented-control
          class="trt-group__toggle"
          [options]="viewOptions"
          [ngModel]="view()"
          [ngModelOptions]="{ standalone: true }"
          (ngModelChange)="onViewChange($event)"
        />
      </div>
      @if (helperText(); as ht) {
        <p class="trt-group__helper">{{ ht }}</p>
      }
      @for (lang of languages(); track lang.key) {
        @let ctrl = fg().controls[lang.key];
        <!-- Always mounted; toggled with [hidden] (CSS), never @if. Re-mounting
             would re-init the Tiptap engine on every locale switch — janky, and
             the editor's @defer skeleton would flash on each toggle. -->
        <div class="trt-locale" [hidden]="!isVisible(lang.key)">
          @if (view() === 'all') {
            <p class="trt-locale__label">{{ lang.label }}</p>
          }
          <console-rich-text-editor
            [formControlName]="lang.key"
            [mode]="mode()"
            [placeholder]="placeholder()[lang.key] ?? ''"
          />
          @if (ctrl.touched && ctrl.invalid) {
            <p class="trt-locale__error">{{ ctrl | formError }}</p>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .trt-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .trt-group__bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .trt-group__helper {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant, #666);
      margin: 0;
    }
    .trt-locale {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    /* Win over .trt-locale's display:flex so the [hidden] locale truly collapses. */
    .trt-locale[hidden] {
      display: none;
    }
    .trt-locale__label {
      font-size: 12px;
      font-weight: 600;
      color: var(--mat-sys-on-surface-variant, #666);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin: 0;
    }
    .trt-locale__error {
      color: var(--mat-sys-error, #b00020);
      font-size: 12px;
      margin: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslatableRichTextGroup {
  readonly group = input.required<AbstractControl>();
  readonly label = input<string>('');
  readonly helperText = input<string>('');
  readonly placeholder = input<Partial<Record<string, string>>>({});
  readonly mode = input<EditorMode>('semantic');
  readonly languages = input<RichTextLanguageConfig[]>(DEFAULT_LANGUAGES);

  protected readonly view = signal<LocaleView>('en');

  protected readonly fg = computed<FormGroup>(() => {
    const c = this.group();
    if (!(c instanceof FormGroup)) {
      throw new Error('console-translatable-rich-text-group: [group] must resolve to a FormGroup');
    }
    return c;
  });

  protected readonly viewOptions = VIEW_OPTIONS;

  protected onViewChange(value: string): void {
    if (value === 'en' || value === 'vi' || value === 'all') {
      this.view.set(value);
    }
  }

  protected isVisible(key: string): boolean {
    const v = this.view();
    return v === 'all' || v === key;
  }
}
