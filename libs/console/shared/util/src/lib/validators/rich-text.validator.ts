import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';

/** Bilingual rich-text document pair as the editor controls hold it (per-locale). */
export interface BilingualEditorDocument {
  en: EditorDocument;
  vi: EditorDocument;
}

/**
 * True when a rich-text document carries no authored content — null, missing
 * body, or only empty paragraphs. A heading/paragraph with no text does NOT
 * count; a leaf content node (image-ref, horizontal rule) does.
 */
export function isEmptyEditorDocument(doc: EditorDocument | null | undefined): boolean {
  if (!doc || !doc.content) return true;
  return !nodeHasContent(doc.content);
}

function nodeHasContent(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false;
  const n = node as { type?: string; text?: unknown; content?: unknown };
  if (typeof n.text === 'string' && n.text.trim() !== '') return true;
  if (n.type === 'image-ref' || n.type === 'horizontalRule') return true;
  return Array.isArray(n.content) && n.content.some(nodeHasContent);
}

/**
 * Flatten a rich-text document to plain text (all text nodes, whitespace
 * collapsed). Used for derived plain-text needs — a legacy markdown column kept
 * during the RTE transition, or an auto-generated excerpt — never for rendering.
 */
export function editorDocToPlainText(doc: EditorDocument | null | undefined): string {
  if (!doc || !doc.content) return '';
  const parts: string[] = [];
  collectText(doc.content, parts);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function collectText(node: unknown, parts: string[]): void {
  if (!node || typeof node !== 'object') return;
  const n = node as { text?: unknown; content?: unknown };
  if (typeof n.text === 'string') parts.push(n.text);
  if (Array.isArray(n.content)) for (const child of n.content) collectText(child, parts);
}

/**
 * Control-level required validator for a {@link EditorDocument} form control.
 * Reuses the `required` error key so the existing `FormErrorPipe` message applies.
 * Apply per-locale (en + vi) to mirror the plain `requiredTranslatableGroup`.
 */
export function richTextRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    isEmptyEditorDocument(control.value as EditorDocument | null) ? { required: true } : null;
}

/**
 * Build the bilingual `*Json` payload the API expects (both locales as valid
 * documents). Returns `undefined` when BOTH locales are empty so optional fields
 * are omitted; when only one locale has content, the empty locale is filled with
 * an empty document stamped at the present locale's schema version (the BE
 * migrates on write anyway).
 */
export function toBilingualRichTextPayload(value: {
  en: EditorDocument | null;
  vi: EditorDocument | null;
}): BilingualEditorDocument | undefined {
  const seed = value.en ?? value.vi;
  if (!seed) return undefined;
  const empty: EditorDocument = { schemaVersion: seed.schemaVersion, content: { type: 'doc', content: [] } };
  return { en: value.en ?? empty, vi: value.vi ?? empty };
}
