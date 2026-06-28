import type { EditorDocument } from '@portfolio/shared/features/rte-core';

/**
 * Wrap a single editor document into the bilingual `{ en, vi }` envelope the
 * {@link RichTextService} expects. A blog post is one language, so the post's
 * language locale carries the document and the other locale is an empty doc
 * (stamped at the same schema version — the BE migrates on write anyway). This
 * keeps blog storage shape-identical to every other rich-text field.
 */
export function wrapContentByLanguage(
  doc: EditorDocument,
  language: 'EN' | 'VI'
): { en: EditorDocument; vi: EditorDocument } {
  const empty: EditorDocument = { schemaVersion: doc.schemaVersion, content: { type: 'doc', content: [] } };
  return {
    en: language === 'EN' ? doc : empty,
    vi: language === 'VI' ? doc : empty,
  };
}
