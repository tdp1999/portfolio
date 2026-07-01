import { marked } from 'marked';
import { defaultExtensions, LATEST_SCHEMA_VERSION } from '@phuong-tran-redoc/document-engine-core';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { convertObsidianMarkdown, stripFirstH1 } from './obsidian-import.util';

/**
 * Markdown → editor-JSON conversion — the **sole owner** of the legacy
 * Markdown→document path. ESM-heavy (Markdown engine + Tiptap server schema), so
 * it is isolated from the pure helpers in `obsidian-import.util.ts` and is
 * mocked in unit tests; the real pipeline is exercised by the api-e2e import
 * spec against a live server.
 *
 * Pipeline: `convertObsidianMarkdown` (Obsidian-flavoured → CommonMark, image
 * embeds neutralised + flagged) → `marked` (CommonMark → HTML) → Tiptap
 * `generateJSON` against {@link defaultExtensions} (HTML → ProseMirror JSON).
 * The result is the same shape the editor emits, so it round-trips perfectly
 * through `RichTextService.toCanonicalForm` (which serializes back with the
 * identical `defaultExtensions` schema).
 */
export async function markdownToEditorDocument(markdown: string): Promise<{ doc: EditorDocument; warnings: string[] }> {
  const { content, warnings } = convertObsidianMarkdown(stripFirstH1(markdown));
  const html = marked.parse(content, { async: false }) as string;

  // Tiptap's Node serializer lives at the ESM-only `@tiptap/html/server` subpath
  // (backed by happy-dom). This module is Node-only, so a plain dynamic import is
  // safe: the webpack Node build externalizes it (happy-dom stays out of the
  // bundle) and `generatePackageJson` lists `@tiptap/html` in the api's dist deps.
  // TS resolution of the subpath is provided by the ambient shim in
  // `src/types/tiptap-html-server.d.ts` (the api tsconfig is node10).
  const { generateJSON } = await import('@tiptap/html/server');
  const docNode = generateJSON(html, defaultExtensions);

  return { doc: { schemaVersion: LATEST_SCHEMA_VERSION, content: docNode }, warnings };
}
