import { PORTABLE_SCHEMA_VERSION } from '@portfolio/shared/features/rte-core/portable';
import type { EditorDocument } from '@portfolio/shared/features/rte-core/image-refs';
import { tiptapToCanonical } from './rich-text.adapter';

/** Wrap block nodes in the ProseMirror `doc` envelope E persists. */
const eDoc = (...blocks: unknown[]): EditorDocument =>
  ({ schemaVersion: 1, content: { type: 'doc', content: blocks } }) as unknown as EditorDocument;

const p = (...children: unknown[]) => ({ type: 'paragraph', content: children });
const text = (value: string, marks?: unknown[]) => ({ type: 'text', text: value, ...(marks ? { marks } : {}) });

describe('tiptapToCanonical', () => {
  it('returns an empty document for null/empty input', () => {
    expect(tiptapToCanonical(null)).toEqual({ schemaVersion: PORTABLE_SCHEMA_VERSION, content: [] });
    expect(tiptapToCanonical(eDoc())).toEqual({ schemaVersion: PORTABLE_SCHEMA_VERSION, content: [] });
  });

  it('stamps OUR schema version, not E’s', () => {
    const out = tiptapToCanonical(eDoc(p(text('hi'))));
    expect(out.schemaVersion).toBe(PORTABLE_SCHEMA_VERSION);
  });

  it('maps a paragraph with text', () => {
    expect(tiptapToCanonical(eDoc(p(text('hello')))).content).toEqual([
      { type: 'paragraph', content: [{ type: 'text', text: 'hello' }] },
    ]);
  });

  it('remaps E node names (customOrderedList → orderedList, imageRef → image-ref)', () => {
    const doc = eDoc(
      { type: 'customOrderedList', content: [{ type: 'listItem', content: [p(text('a'))] }] },
      { type: 'imageRef', attrs: { imageId: 'm1', caption: 'Cap', captionPosition: 'bottom' } }
    );
    expect(tiptapToCanonical(doc).content).toEqual([
      {
        type: 'orderedList',
        content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }] }],
      },
      { type: 'image-ref', attrs: { imageId: 'm1', caption: 'Cap', captionPosition: 'bottom' } },
    ]);
  });

  it('keeps heading level but strips unmodeled attrs (e.g. textAlign)', () => {
    const doc = eDoc({ type: 'heading', attrs: { level: 3, textAlign: 'center' }, content: [text('T')] });
    expect(tiptapToCanonical(doc).content).toEqual([
      { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'T' }] },
    ]);
  });

  it('drops unsupported E nodes (image with URL, horizontalRule, dynamicField, table)', () => {
    const doc = eDoc(
      { type: 'image', attrs: { src: 'https://x/y.png' } },
      { type: 'horizontalRule' },
      { type: 'dynamicField', attrs: { fieldId: 'name' } },
      { type: 'styledTable', content: [] },
      p(text('kept'))
    );
    expect(tiptapToCanonical(doc).content).toEqual([{ type: 'paragraph', content: [{ type: 'text', text: 'kept' }] }]);
  });

  it('drops an image-ref missing its imageId (attr whitelist gate)', () => {
    const doc = eDoc({ type: 'imageRef', attrs: { caption: 'no id' } }, p(text('after')));
    expect(tiptapToCanonical(doc).content).toEqual([{ type: 'paragraph', content: [{ type: 'text', text: 'after' }] }]);
  });

  describe('marks', () => {
    it('keeps whitelisted marks, drops the rest (subscript/textStyle)', () => {
      const doc = eDoc(
        p(
          text('x', [
            { type: 'bold' },
            { type: 'italic' },
            { type: 'subscript' },
            { type: 'textStyle', attrs: { color: '#f00' } },
          ])
        )
      );
      expect(tiptapToCanonical(doc).content).toEqual([
        { type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'bold' }, { type: 'italic' }] }] },
      ]);
    });

    it('keeps only href on a safe link (drops target/rel/class)', () => {
      const doc = eDoc(
        p(text('link', [{ type: 'link', attrs: { href: 'https://a.com', target: '_self', rel: 'x', class: 'y' } }]))
      );
      expect(tiptapToCanonical(doc).content).toEqual([
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://a.com' } }] }],
        },
      ]);
    });

    it('drops a javascript: link (D6 security gate)', () => {
      const doc = eDoc(p(text('evil', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }])));
      expect(tiptapToCanonical(doc).content).toEqual([
        { type: 'paragraph', content: [{ type: 'text', text: 'evil' }] },
      ]);
    });
  });
});
