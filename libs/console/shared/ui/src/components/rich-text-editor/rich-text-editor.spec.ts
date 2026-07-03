import { Component, forwardRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RTE_EDITOR, RteEditor } from '@portfolio/shared/features/rte-contract';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { RichTextEditor } from './rich-text-editor';

// Minimal concrete editor standing in for RteTiptapEditor — records every CVA
// hook so we can assert the host proxies down to it.
@Component({
  selector: 'console-stub-rte-editor',
  standalone: true,
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => StubEditor), multi: true }],
})
class StubEditor extends RteEditor {
  written: EditorDocument | null | undefined = undefined;
  disabledState: boolean | undefined = undefined;
  changeFn: (value: EditorDocument | null) => void = () => undefined;

  writeValue(value: EditorDocument | null): void {
    this.written = value;
  }
  registerOnChange(fn: (value: EditorDocument | null) => void): void {
    this.changeFn = fn;
  }
  registerOnTouched(): void {
    /* unused in these tests */
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabledState = isDisabled;
  }
}

const DOC: EditorDocument = { schemaVersion: 1, content: { type: 'doc', content: [{ type: 'paragraph' }] } };

describe('RichTextEditor (console host for the RTE contract)', () => {
  let fixture: ComponentFixture<RichTextEditor>;
  let host: RichTextEditor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RichTextEditor],
      providers: [{ provide: RTE_EDITOR, useValue: StubEditor }],
    });
    fixture = TestBed.createComponent(RichTextEditor);
    host = fixture.componentInstance;
  });

  function inner(): StubEditor {
    const el = fixture.debugElement.query(By.directive(StubEditor));
    return el.componentInstance as StubEditor;
  }

  async function mount(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('creates the provided editor and mirrors the contract inputs', async () => {
    fixture.componentRef.setInput('mode', 'full');
    fixture.componentRef.setInput('placeholder', 'Write…');
    await mount();

    const editor = inner();
    expect(editor).toBeTruthy();
    expect(editor.mode()).toBe('full');
    expect(editor.placeholder()).toBe('Write…');
  });

  it('proxies writeValue down to the inner editor', async () => {
    await mount();
    host.writeValue(DOC);
    expect(inner().written).toEqual(DOC);
  });

  it('buffers writeValue called before the inner editor mounts', async () => {
    host.writeValue(DOC); // before detectChanges → inner not created yet
    await mount();
    expect(inner().written).toEqual(DOC);
  });

  it('forwards the inner editor change up through the host onChange', async () => {
    await mount();
    const seen: (EditorDocument | null)[] = [];
    host.registerOnChange((v) => seen.push(v));
    inner().changeFn(DOC);
    expect(seen.at(-1)).toEqual(DOC);
  });

  it('proxies setDisabledState down to the inner editor', async () => {
    await mount();
    host.setDisabledState(true);
    expect(inner().disabledState).toBe(true);
  });
});
