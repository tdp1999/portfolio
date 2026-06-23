import type { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';

// The engine packages are mocked: this suite verifies *our* CVA bridge
// (EditorDocument ↔ engine JSON), not Tiptap. Loading the real engine would drag
// the entire ProseMirror/happy-dom ESM tree into a jsdom unit test — out of scope
// here; real integration is covered by the build + console E2E (task 311).
jest.mock('@phuong-tran-redoc/document-engine-angular', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ng = require('@angular/core');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const forms = require('@angular/forms');

  @ng.Component({ selector: 'document-engine-editor', standalone: true, template: '<ng-content></ng-content>' })
  class DocumentEditorComponent {
    config: unknown;
    editor: unknown = {};
    static propDecorators = { config: [{ type: ng.Input }] };
  }

  @ng.Component({
    selector: 'tiptap-editor',
    standalone: true,
    template: '',
    providers: [{ provide: forms.NG_VALUE_ACCESSOR, useExisting: TiptapEditorDirective, multi: true }],
  })
  class TiptapEditorDirective {
    editor: unknown;
    outputFormat: unknown;
    static propDecorators = { editor: [{ type: ng.Input }], outputFormat: [{ type: ng.Input }] };
    writeValue(): void {
      /* stub */
    }
    registerOnChange(): void {
      /* stub */
    }
    registerOnTouched(): void {
      /* stub */
    }
    setDisabledState(): void {
      /* stub */
    }
  }

  return { __esModule: true, DocumentEditorComponent, TiptapEditorDirective };
});

jest.mock('@phuong-tran-redoc/document-engine-core', () => ({
  __esModule: true,
  LATEST_SCHEMA_VERSION: 1,
  // Identity migration that re-stamps to the latest version, mirroring the real
  // v0.1.0 behaviour — lets us assert the bridge *calls* migrate and uses .content.
  migrateDoc: jest.fn((doc: EditorDocument) => ({ schemaVersion: 1, content: doc.content })),
}));

// Imported after the mocks so these resolve to the mocked module.
import { migrateDoc } from '@phuong-tran-redoc/document-engine-core';
import { RteTiptapEditor } from './rte-tiptap.editor';

describe('RteTiptapEditor — CVA bridge (EditorDocument ↔ engine JSON)', () => {
  function createComponent(): RteTiptapEditor {
    TestBed.configureTestingModule({ imports: [RteTiptapEditor] });
    return TestBed.createComponent(RteTiptapEditor).componentInstance;
  }

  // The engine control is protected; reach it through a typed view for assertions.
  const inner = (cmp: RteTiptapEditor): FormControl => (cmp as unknown as { innerControl: FormControl }).innerControl;

  beforeEach(() => (migrateDoc as jest.Mock).mockClear());

  it('writeValue runs migrateDoc and pushes the migrated content into the engine control', () => {
    const cmp = createComponent();
    const doc: EditorDocument = { schemaVersion: 0, content: { type: 'doc', content: [] } };

    cmp.writeValue(doc);

    expect(migrateDoc).toHaveBeenCalledWith(doc);
    expect(inner(cmp).value).toEqual(doc.content);
  });

  it('writeValue(null) clears the engine control without migrating', () => {
    const cmp = createComponent();
    cmp.writeValue({ schemaVersion: 1, content: { type: 'doc', content: [] } });
    (migrateDoc as jest.Mock).mockClear();

    cmp.writeValue(null);

    expect(migrateDoc).not.toHaveBeenCalled();
    expect(inner(cmp).value).toBeNull();
  });

  it('wraps an engine JSON change into a versioned EditorDocument via onChange', () => {
    const cmp = createComponent();
    const seen: (EditorDocument | null)[] = [];
    cmp.registerOnChange((v) => seen.push(v));

    const json = { type: 'doc', content: [{ type: 'paragraph' }] };
    inner(cmp).setValue(json);

    expect(seen.at(-1)).toEqual({ schemaVersion: 1, content: json });
  });

  it('emits null through onChange when the engine clears to null', () => {
    const cmp = createComponent();
    const seen: (EditorDocument | null)[] = [];
    cmp.registerOnChange((v) => seen.push(v));

    inner(cmp).setValue(null);

    expect(seen.at(-1)).toBeNull();
  });

  it('writeValue does not re-emit through onChange (no feedback loop)', () => {
    const cmp = createComponent();
    const seen: (EditorDocument | null)[] = [];
    cmp.registerOnChange((v) => seen.push(v));

    cmp.writeValue({ schemaVersion: 1, content: { type: 'doc', content: [] } });

    expect(seen).toHaveLength(0);
  });

  it('setDisabledState toggles the engine control', () => {
    const cmp = createComponent();

    cmp.setDisabledState(true);
    expect(inner(cmp).disabled).toBe(true);

    cmp.setDisabledState(false);
    expect(inner(cmp).disabled).toBe(false);
  });
});
