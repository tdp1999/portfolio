import { TestBed } from '@angular/core/testing';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { RteTextareaEditor } from './rte-textarea.editor';

// No engine mocks needed: this fallback editor has zero Tiptap/document-engine
// imports — that is the whole point of the lib. It mounts in a plain jsdom unit
// test without dragging in the ProseMirror ESM tree.
describe('RteTextareaEditor — CVA round-trip (EditorDocument ↔ JSON text)', () => {
  function createComponent(): RteTextareaEditor {
    TestBed.configureTestingModule({ imports: [RteTextareaEditor] });
    return TestBed.createComponent(RteTextareaEditor).componentInstance;
  }

  // text(), commit() and disabled() are protected; reach them through a typed view.
  interface Internals {
    text: () => string;
    commit: (raw: string) => void;
    disabled: () => boolean;
  }
  const view = (cmp: RteTextareaEditor): Internals => cmp as unknown as Internals;

  const doc: EditorDocument = {
    schemaVersion: 1,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] },
  };

  it('writeValue renders the document as pretty-printed JSON', () => {
    const cmp = createComponent();
    cmp.writeValue(doc);
    expect(view(cmp).text()).toBe(JSON.stringify(doc, null, 2));
  });

  it('round-trips a known document through writeValue → blur → onChange', () => {
    const cmp = createComponent();
    const seen: (EditorDocument | null)[] = [];
    cmp.registerOnChange((v) => seen.push(v));

    cmp.writeValue(doc);
    view(cmp).commit(view(cmp).text()); // simulate blur with the current textarea content

    expect(seen.at(-1)).toEqual(doc);
  });

  it('writeValue does not emit through onChange (no feedback loop)', () => {
    const cmp = createComponent();
    const seen: (EditorDocument | null)[] = [];
    cmp.registerOnChange((v) => seen.push(v));

    cmp.writeValue(doc);

    expect(seen).toHaveLength(0);
  });

  it('invalid JSON on blur keeps the last valid value and marks touched without emitting', () => {
    const cmp = createComponent();
    const seen: (EditorDocument | null)[] = [];
    let touched = false;
    cmp.registerOnChange((v) => seen.push(v));
    cmp.registerOnTouched(() => (touched = true));

    cmp.writeValue(doc); // establishes the last valid value
    view(cmp).commit('{ not json'); // invalid

    expect(touched).toBe(true);
    expect(seen).toHaveLength(0); // garbage is never emitted
    // a subsequent valid commit still yields the original — last valid was preserved
    view(cmp).commit(JSON.stringify(doc, null, 2));
    expect(seen.at(-1)).toEqual(doc);
  });

  it('empty textarea commits a null document', () => {
    const cmp = createComponent();
    const seen: (EditorDocument | null)[] = [];
    cmp.registerOnChange((v) => seen.push(v));

    cmp.writeValue(doc);
    view(cmp).commit('   ');

    expect(seen.at(-1)).toBeNull();
  });

  it('setDisabledState toggles the disabled signal', () => {
    const cmp = createComponent();

    cmp.setDisabledState(true);
    expect(view(cmp).disabled()).toBe(true);

    cmp.setDisabledState(false);
    expect(view(cmp).disabled()).toBe(false);
  });
});
