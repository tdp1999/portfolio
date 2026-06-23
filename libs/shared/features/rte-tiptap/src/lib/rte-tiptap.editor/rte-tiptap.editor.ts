import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import type { Content, JSONContent } from '@tiptap/core';
import {
  DocumentEditorComponent,
  TiptapEditorDirective,
  type DocumentEngineConfig,
} from '@phuong-tran-redoc/document-engine-angular';
import { LATEST_SCHEMA_VERSION, migrateDoc } from '@phuong-tran-redoc/document-engine-core';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { RteEditor } from '@portfolio/shared/features/rte-contract';
import { documentEngineConfigFor } from '../rte-tiptap.config';
import { MEDIA_PICKER_HOOK } from '../rte-tiptap.tokens';

/**
 * Concrete Tiptap editor satisfying the `RteEditor` contract.
 *
 * The only place in the codebase allowed to import
 * `@phuong-tran-redoc/document-engine-angular` (enforced by ESLint module
 * boundaries). Console maps the contract token to this via
 * `provide(RTE_EDITOR, RteTiptapEditor)`.
 *
 * Two value levels meet here: the contract speaks the versioned
 * {@link EditorDocument}; the engine speaks raw Tiptap JSON. This component is
 * the bridge — migrating on the way in, re-stamping the schema version on the
 * way out, and never surfacing HTML.
 *
 * The heavy, browser-only engine is loaded via `@defer (on idle)` so it stays
 * out of the SSR server bundle and off the console's initial paint.
 */
@Component({
  selector: 'rte-tiptap-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocumentEditorComponent, TiptapEditorDirective, ReactiveFormsModule],
  templateUrl: './rte-tiptap.editor.html',
  styleUrl: './rte-tiptap.editor.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RteTiptapEditor), multi: true }],
})
export class RteTiptapEditor extends RteEditor {
  // Owns the engine's canonical JSON. It doubles as the SSR-safe value buffer:
  // a value set via writeValue() before the deferred editor mounts is picked up
  // by the inner CVA when it finally binds — so nothing is lost while @defer is
  // still showing the placeholder.
  protected readonly innerControl = new FormControl<Content | null>(null);

  readonly #mediaPicker = inject(MEDIA_PICKER_HOOK, { optional: true });
  readonly #disabled = signal(false);

  #onChange: (value: EditorDocument | null) => void = () => undefined;
  #onTouched: () => void = () => undefined;

  // Engine config derived from the contract inputs. `editable` follows
  // readonly + disabled state; `'full'` mode wires the consumer's media picker
  // into image.onPick when one was provided.
  protected readonly engineConfig = computed<Partial<DocumentEngineConfig>>(() => {
    const base = documentEngineConfigFor(this.mode());
    const placeholder = this.placeholder();
    return {
      ...base,
      editable: !this.readonly() && !this.#disabled(),
      placeholder: placeholder ? { placeholder } : false,
      ...(this.mode() === 'full' && this.#mediaPicker ? { image: { onPick: this.#mediaPicker } } : {}),
    };
  });

  constructor() {
    super();
    // Engine JSON → versioned EditorDocument. outputFormat="json" on the inner
    // directive guarantees we only ever receive canonical JSON, never HTML.
    this.innerControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((json) => {
      const doc: EditorDocument | null =
        json == null ? null : { schemaVersion: LATEST_SCHEMA_VERSION, content: json as JSONContent };
      this.#onChange(doc);
      this.#onTouched();
    });
  }

  // --- ControlValueAccessor (operates at the EditorDocument level) ---

  writeValue(value: EditorDocument | null): void {
    // Upgrade a stored document to the latest schema before it reaches the editor.
    const content = value ? migrateDoc(value).content : null;
    this.innerControl.setValue(content ?? null, { emitEvent: false });
  }

  registerOnChange(fn: (value: EditorDocument | null) => void): void {
    this.#onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.#onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.#disabled.set(isDisabled);
    if (isDisabled) {
      this.innerControl.disable({ emitEvent: false });
    } else {
      this.innerControl.enable({ emitEvent: false });
    }
  }
}
