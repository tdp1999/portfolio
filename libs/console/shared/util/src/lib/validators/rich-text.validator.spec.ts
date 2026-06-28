import { FormControl } from '@angular/forms';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { isEmptyEditorDocument, richTextRequiredValidator, toBilingualRichTextPayload } from './rich-text.validator';

const docWith = (text: string): EditorDocument => ({
  schemaVersion: 1,
  content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
});
const EMPTY_PARA: EditorDocument = { schemaVersion: 1, content: { type: 'doc', content: [{ type: 'paragraph' }] } };

describe('isEmptyEditorDocument', () => {
  it('treats null/undefined and content-less docs as empty', () => {
    expect(isEmptyEditorDocument(null)).toBe(true);
    expect(isEmptyEditorDocument(undefined)).toBe(true);
    expect(isEmptyEditorDocument({ schemaVersion: 1, content: { type: 'doc', content: [] } })).toBe(true);
    expect(isEmptyEditorDocument(EMPTY_PARA)).toBe(true);
    expect(isEmptyEditorDocument(docWith('   '))).toBe(true);
  });

  it('treats a doc with text or a leaf node as non-empty', () => {
    expect(isEmptyEditorDocument(docWith('hello'))).toBe(false);
    expect(
      isEmptyEditorDocument({ schemaVersion: 1, content: { type: 'doc', content: [{ type: 'image-ref' }] } })
    ).toBe(false);
  });
});

describe('richTextRequiredValidator', () => {
  const validator = richTextRequiredValidator();

  it('flags empty content with the reusable `required` key', () => {
    expect(validator(new FormControl(null))).toEqual({ required: true });
    expect(validator(new FormControl(EMPTY_PARA))).toEqual({ required: true });
  });

  it('passes when content is present', () => {
    expect(validator(new FormControl(docWith('content')))).toBeNull();
  });
});

describe('toBilingualRichTextPayload', () => {
  it('returns undefined only when both locales are absent (null) — nothing to write', () => {
    expect(toBilingualRichTextPayload({ en: null, vi: null })).toBeUndefined();
  });

  // Regression: clearing a field must persist. When the user deletes all text the
  // editor emits a present-but-empty doc (NOT null), so the payload must still be
  // sent — otherwise the partial update omits the key and the BE keeps the old value.
  it('sends a present-but-empty doc so a cleared field can be wiped', () => {
    const result = toBilingualRichTextPayload({ en: EMPTY_PARA, vi: null });
    expect(result).toBeDefined();
    expect(result?.en).toBe(EMPTY_PARA);
  });

  it('fills the empty locale with an empty doc at the present locale schema version', () => {
    const en = docWith('english');
    const result = toBilingualRichTextPayload({ en, vi: null });
    expect(result?.en).toBe(en);
    expect(result?.vi).toEqual({ schemaVersion: 1, content: { type: 'doc', content: [] } });
  });

  it('passes both locales through when both have content', () => {
    const en = docWith('english');
    const vi = docWith('tiếng việt');
    expect(toBilingualRichTextPayload({ en, vi })).toEqual({ en, vi });
  });
});
