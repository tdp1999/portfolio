import { ChangeDetectionStrategy, Component, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { RteEditor } from '@portfolio/shared/features/rte-contract';

/**
 * Plain-textarea editor satisfying the `RteEditor` contract.
 *
 * A second concrete impl of the contract (alongside the Tiptap one) that proves
 * the abstraction is real and gives tests + SSR a dependency-free fallback: it
 * imports no editor library, so it mounts in a jsdom unit test without dragging
 * in the ProseMirror/document-engine ESM tree, and can stand in for the lazy
 * Tiptap chunk if that ever fails to load.
 *
 * It speaks the contract's {@link EditorDocument} directly: `writeValue`
 * pretty-prints the whole document into the textarea; on blur the text is parsed
 * back. `mode` is inherited but ignored — the textarea always shows raw JSON.
 */
@Component({
  selector: 'rte-textarea-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rte-textarea.editor.html',
  styleUrl: './rte-textarea.editor.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RteTextareaEditor), multi: true }],
})
export class RteTextareaEditor extends RteEditor {
  // Seed text shown in the textarea — set only by writeValue (programmatic).
  // User keystrokes live in the DOM and are read back on blur, so this signal is
  // intentionally not updated while typing (which would clobber the caret).
  protected readonly text = signal('');
  protected readonly disabled = signal(false);

  #onChange: (value: EditorDocument | null) => void = () => undefined;
  #onTouched: () => void = () => undefined;

  // --- ControlValueAccessor (operates at the EditorDocument level) ---

  writeValue(value: EditorDocument | null): void {
    this.text.set(value == null ? '' : JSON.stringify(value, null, 2));
  }

  registerOnChange(fn: (value: EditorDocument | null) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // Commit on blur. Empty → null document. Valid JSON → the new value. Invalid
  // JSON → rejected: we emit nothing, so the form keeps its last valid value, and
  // only mark touched (the user's text is left in place so they can fix it).
  protected commit(raw: string): void {
    this.#onTouched();

    if (raw.trim() === '') {
      this.#onChange(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as EditorDocument;
      this.#onChange(parsed);
    } catch {
      // Invalid JSON — emit nothing; the bound control retains its last value.
    }
  }
}
