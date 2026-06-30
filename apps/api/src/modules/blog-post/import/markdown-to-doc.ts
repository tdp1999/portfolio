import { marked } from 'marked';
import { defaultExtensions, LATEST_SCHEMA_VERSION } from '@phuong-tran-redoc/document-engine-core';
import type { Extensions, JSONContent } from '@tiptap/core';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { convertObsidianMarkdown, stripFirstH1 } from './obsidian-import.util';

type GenerateJSON = (html: string, extensions: Extensions) => JSONContent;

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

  // Load Tiptap's Node serializer via a `new Function` indirection so webpack
  // never sees the specifier: a runtime-built string + `webpackIgnore` is not
  // enough (ts-loader strips the magic comment, and webpack then compiles the
  // dynamic import into an empty context that throws "Cannot find module" at
  // runtime). Hiding it from static analysis lets the Node runtime resolve
  // `@tiptap/html/server` from node_modules natively. Also dodges the TS
  // `moduleResolution: node` subpath-export limitation. This module is Node-only
  // (the importer), so a native dynamic import is always safe here.
  const importEsm = new Function('s', 'return import(s)') as (s: string) => Promise<{
    generateJSON: GenerateJSON;
  }>;
  const { generateJSON } = await importEsm('@tiptap/html/server');
  const docNode = generateJSON(html, defaultExtensions);

  return { doc: { schemaVersion: LATEST_SCHEMA_VERSION, content: docNode }, warnings };
}
