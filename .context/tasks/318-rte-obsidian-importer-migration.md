# Task: Obsidian Importer — Migrate Output to Tiptap JSON

## Status: pending

## Goal
Convert the existing Obsidian Markdown importer to produce `EditorDocument` JSON (via `prosemirror-markdown`) and persist via the BE `RichTextService`, replacing the legacy "store as Markdown" path.

## Context
The Obsidian importer is the only tool that needs Markdown→JSON conversion. Round-trip is one-way (lossless from CommonMark to Tiptap JSON). After this task the runtime never sees Markdown for long-form fields.

Source: `.context/plans/epic-portfolio-rich-text-editor.md` Phase 8.

## Acceptance Criteria
- [ ] Importer (likely `apps/api/src/modules/blog-post/import/` or wherever it currently lives) calls `prosemirror-markdown` parser to produce a Tiptap-compatible `EditorDocument`.
- [ ] Importer passes the `EditorDocument` through `RichTextService.toCanonicalForm` to produce the 3-column triplet, then persists via the existing import command.
- [ ] Custom utilities (`convertObsidianMarkdown`, `extractTitleFromMarkdown`, `extractH1Title`) kept ONLY in this importer module. They no longer ship to runtime bundles.
- [ ] One-shot tooling, not a continuous flow: importer is invoked manually (CLI or admin button), not auto-running.
- [ ] An integration test imports a known Obsidian note and asserts: title extracted correctly, body JSON has expected structure (h2, lists, code-block), `contentHtml` is sanitized.
- [ ] Document the importer's place in the architecture: a one-shot tool, not a runtime path. Add a brief note to `.context/decisions.md` if not already covered.

## Technical Notes
- `prosemirror-markdown` is the standard conversion lib used across Tiptap projects. Add as a dev dependency if not already present.
- The importer's existing image handling: previous import created a `Media` row per image, then referenced via `<img src>`. Update so the imported JSON uses `image-ref` nodes pointing at those Media IDs.
- Front-matter parsing (title, tags, slug, date) stays as-is. Only the body conversion changes.

## Files to Touch
- `apps/api/src/modules/blog-post/**/import/*` (existing importer)
- `package.json` (`prosemirror-markdown` if missing)
- One importer test under `apps/api/src/modules/blog-post/**/import/*.spec.ts`

## Dependencies
- 307-rte-tiptap-concrete (for the `EditorDocument` type)
- 310-rte-be-service (for `toCanonicalForm`)
- 317-rte-markdown-pipe-and-parser-cleanup (so the runtime is already clean and the importer becomes the sole owner of the legacy utilities)

## Complexity: S

## Progress Log
