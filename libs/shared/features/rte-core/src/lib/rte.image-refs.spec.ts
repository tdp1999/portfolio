import { collectImageIds } from './rte.image-refs';
import type { EditorDocument } from './rte.types';

const doc = (content: unknown[]): EditorDocument =>
  ({ schemaVersion: 1, content: { type: 'doc', content } }) as unknown as EditorDocument;

describe('collectImageIds', () => {
  it('returns [] for a null/undefined document', () => {
    expect(collectImageIds(null)).toEqual([]);
    expect(collectImageIds(undefined)).toEqual([]);
  });

  it('returns [] when no image-ref nodes are present', () => {
    expect(collectImageIds(doc([{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }]))).toEqual([]);
  });

  it('collects imageId from top-level image-ref nodes in document order', () => {
    const result = collectImageIds(
      doc([
        { type: 'imageRef', attrs: { imageId: 'a' } },
        { type: 'paragraph' },
        { type: 'imageRef', attrs: { imageId: 'b' } },
      ])
    );
    expect(result).toEqual(['a', 'b']);
  });

  it('finds image-ref nodes nested inside other content', () => {
    const result = collectImageIds(
      doc([{ type: 'blockquote', content: [{ type: 'imageRef', attrs: { imageId: 'nested' } }] }])
    );
    expect(result).toEqual(['nested']);
  });

  it('de-duplicates repeated ids, preserving first-seen order', () => {
    const result = collectImageIds(
      doc([
        { type: 'imageRef', attrs: { imageId: 'a' } },
        { type: 'imageRef', attrs: { imageId: 'a' } },
        { type: 'imageRef', attrs: { imageId: 'b' } },
      ])
    );
    expect(result).toEqual(['a', 'b']);
  });

  it('ignores image-ref nodes with a missing or non-string imageId', () => {
    const result = collectImageIds(
      doc([
        { type: 'imageRef', attrs: {} },
        { type: 'imageRef', attrs: { imageId: null } },
        { type: 'imageRef' },
        { type: 'imageRef', attrs: { imageId: 'ok' } },
      ])
    );
    expect(result).toEqual(['ok']);
  });
});
