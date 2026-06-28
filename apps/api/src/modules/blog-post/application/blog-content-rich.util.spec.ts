import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { wrapContentByLanguage } from './blog-content-rich.util';

const doc = (text: string, schemaVersion = 3): EditorDocument => ({
  schemaVersion,
  content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
});

const isEmpty = (d: EditorDocument) => Array.isArray(d.content.content) && d.content.content.length === 0;

describe('wrapContentByLanguage', () => {
  it('keys an EN post under en and leaves vi empty', () => {
    const d = doc('hello');
    const { en, vi } = wrapContentByLanguage(d, 'EN');
    expect(en).toBe(d);
    expect(isEmpty(vi)).toBe(true);
  });

  it('keys a VI post under vi and leaves en empty', () => {
    const d = doc('xin chào');
    const { en, vi } = wrapContentByLanguage(d, 'VI');
    expect(vi).toBe(d);
    expect(isEmpty(en)).toBe(true);
  });

  it('stamps the empty locale at the source document schema version', () => {
    const { vi } = wrapContentByLanguage(doc('hi', 7), 'EN');
    expect(vi.schemaVersion).toBe(7);
  });
});
