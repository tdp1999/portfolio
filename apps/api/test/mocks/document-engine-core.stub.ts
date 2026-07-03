// Test stub for @phuong-tran-redoc/document-engine-core.
//
// The published package ships ESM-only (index.esm.js → Tiptap/ProseMirror ESM) which
// the api's node jest transformer does not process. The engine is its own tested
// unit; api specs exercise OUR orchestration, not Tiptap's serializer — so the whole
// package is mapped to this stub via moduleNameMapper (apps/api/jest.config.cts).
//
// Mirrors the in-file mock in rich-text.service.spec.ts. Suites that need bespoke
// behaviour still `jest.mock(...)` with their own factory, which takes precedence.

export const LATEST_SCHEMA_VERSION = 1;

export const defaultExtensions: unknown[] = [];

// Identity migration that re-stamps the latest version, mirroring real v0.1.x
// behaviour — lets callers assert migrate is invoked and `.content` is forwarded.
export function migrateDoc(doc: { content: unknown }): { schemaVersion: number; content: unknown } {
  return { schemaVersion: LATEST_SCHEMA_VERSION, content: doc.content };
}

export function generateHTML(): string {
  return '';
}
