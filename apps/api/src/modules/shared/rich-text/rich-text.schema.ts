import { z } from 'zod/v4';

/**
 * Loose validation for an incoming editor document `{ schemaVersion, content }`.
 * The body (ProseMirror/Tiptap JSON) is opaque at this boundary — `RichTextService`
 * migrates and sanitizes it downstream — so we only assert the envelope shape.
 */
export const EditorDocumentSchema = z.object({
  schemaVersion: z.number().int().nonnegative(),
  content: z.record(z.string(), z.unknown()),
});

/** A bilingual rich-text payload as the console submits it: one document per locale. */
export const BilingualEditorDocumentSchema = z.object({
  en: EditorDocumentSchema,
  vi: EditorDocumentSchema,
});

export type BilingualEditorDocumentDto = z.infer<typeof BilingualEditorDocumentSchema>;
