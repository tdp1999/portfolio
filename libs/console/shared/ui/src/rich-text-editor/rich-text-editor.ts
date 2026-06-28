import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  ViewContainerRef,
  afterNextRender,
  booleanAttribute,
  effect,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RTE_EDITOR, type RteEditor } from '@portfolio/shared/features/rte-contract';
import type { EditorDocument, EditorMode } from '@portfolio/shared/features/rte-core';

/**
 * Console host for the rich-text editor. The single console-side surface that
 * speaks the `RteEditor` contract: it injects whichever concrete editor is
 * provided under {@link RTE_EDITOR} (the console wires `RteTiptapEditor` in
 * `app.config.ts`) and renders it dynamically, so neither this component nor any
 * feature lib ever imports `document-engine-angular` — keeping the engine behind
 * the module-boundary wall.
 *
 * Implements `ControlValueAccessor` by proxying every hook down to the inner
 * editor instance. The inner editor mounts in `afterNextRender` (browser-only,
 * matching the engine's `@defer`), so writeValue/disabled set before it exists
 * are buffered and flushed on mount.
 */
@Component({
  selector: 'console-rich-text-editor',
  standalone: true,
  template: '<ng-container #anchor />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Reflect the mode onto the host so the global engine stylesheet
  // (`styles/vendor/document-engine.scss`) can size the editable area per mode —
  // tall for long-form `full`/`semantic`, compact for `list` — without reaching
  // into the engine's own CSS.
  host: { '[attr.data-rte-mode]': 'mode()' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichTextEditor), multi: true }],
})
export class RichTextEditor implements ControlValueAccessor {
  private readonly editorType = inject(RTE_EDITOR);

  readonly mode = input<EditorMode>('semantic');
  readonly placeholder = input<string>('');
  readonly readonly = input(false, { transform: booleanAttribute });

  private readonly anchor = viewChild.required('anchor', { read: ViewContainerRef });

  private readonly ref = signal<ComponentRef<RteEditor> | null>(null);

  // CVA state buffered until the inner editor mounts. Plain mutable fields (not
  // readonly): they are reassigned as forms calls the CVA hooks.
  private pendingValue: EditorDocument | null = null;
  private hasPending = false;
  private disabled = false;

  constructor() {
    afterNextRender(() => {
      const ref = this.anchor().createComponent(this.editorType);
      const editor = ref.instance;
      editor.registerOnChange((value) => this.onChange(value));
      editor.registerOnTouched(() => this.onTouched());
      editor.setDisabledState?.(this.disabled);
      if (this.hasPending) {
        editor.writeValue(this.pendingValue);
        this.hasPending = false;
      }
      this.ref.set(ref);
    });

    // Mirror the contract inputs onto the inner editor once it exists, and on
    // every later change.
    effect(() => {
      const ref = this.ref();
      if (!ref) return;
      ref.setInput('mode', this.mode());
      ref.setInput('placeholder', this.placeholder());
      ref.setInput('readonly', this.readonly());
    });
  }

  // Arrow-function callbacks declared after the constructor (initialized before
  // the constructor body runs); the lint treats function-valued fields as methods.
  private onChange: (value: EditorDocument | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: EditorDocument | null): void {
    const ref = this.ref();
    if (ref) {
      ref.instance.writeValue(value);
    } else {
      this.pendingValue = value;
      this.hasPending = true;
    }
  }

  registerOnChange(fn: (value: EditorDocument | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.ref()?.instance.setDisabledState?.(isDisabled);
  }
}
