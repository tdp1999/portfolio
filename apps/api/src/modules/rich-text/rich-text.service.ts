import { Injectable, Logger } from '@nestjs/common';
import {
  defaultExtensions,
  generateHTML,
  LATEST_SCHEMA_VERSION,
  migrateDoc,
} from '@phuong-tran-redoc/document-engine-core';
import { sanitizeRichText, type EditorDocument } from '@portfolio/shared/features/rte-core';
import type { PortableDocument } from '@portfolio/shared/features/rte-core/portable';
import type { TranslatableJson, TranslatableRichText } from '@portfolio/shared/types';
import { BadRequestError, CommonErrorCode, ErrorLayer } from '@portfolio/shared/errors';
import { tiptapToCanonical } from './rich-text.adapter';

/**
 * A single field's canonical form.
 *
 * - `json` — E's Tiptap document, migrated to the latest E schema. This stays the
 *   **re-edit source** (console loads it back into the editor), so it is lossless.
 * - `canonical` — our engine-agnostic {@link PortableDocument} (via the D3 adapter),
 *   the AST renderer's read-path source. Decoupled from E and semantic-only.
 * - `html` — the sanitized HTML cache (fallback path: RSS/llms.txt/OG/no-JS).
 */
export interface CanonicalRichText {
  json: EditorDocument;
  canonical: PortableDocument;
  html: string;
  schemaVersion: number;
}

/**
 * A bilingual field's canonical form — shaped to drop straight into the
 * `*Json` / `*Canonical` / `*Html` / `*SchemaVersion` storage columns. One schema
 * version covers both locales (both are migrated to the latest on the way through).
 */
export interface CanonicalRichTextTranslatable {
  json: TranslatableRichText;
  canonical: TranslatableJson;
  html: TranslatableJson;
  schemaVersion: number;
}

/**
 * Write-time rich-text pipeline. Every command handler that persists a rich field
 * routes its incoming editor JSON through here so all three stored columns are
 * produced together and stay consistent.
 *
 * Pipeline: `migrateDoc` (lazy upgrade on write) → `generateHTML` (Tiptap headless,
 * Node-side, async) → `sanitizeRichText` (DOMPurify + `RICH_TEXT_WHITELIST`). The
 * sanitizer is the **single shared gate** with the FE renderer — both import it
 * from the Angular-free `@portfolio/shared/features/rte-core`, so write and read
 * can never drift. It already strips disallowed markup (e.g. `<script>`) and
 * hardens every surviving `<a>` with `target="_blank" rel="noopener nofollow"`.
 */
@Injectable()
export class RichTextService {
  private readonly logger = new Logger(RichTextService.name);

  /**
   * Canonicalize a single rich-text document.
   * @param fieldName Used only for the strip-warning log line (e.g. `profile.bioLong`).
   */
  async toCanonicalForm(doc: EditorDocument, fieldName = 'richText'): Promise<CanonicalRichText> {
    let json: EditorDocument;
    let rawHtml: string;
    try {
      json = migrateDoc(doc);
      rawHtml = await generateHTML(json.content, defaultExtensions);
    } catch (cause) {
      // The upstream Zod check only validates the `{ schemaVersion, content }` envelope,
      // not the inner ProseMirror document. A well-shaped but structurally-invalid doc
      // (or a `schemaVersion` with no registered migration — `migrateDoc` throws) makes
      // these calls throw a raw Error the exception filters would pass through as an
      // opaque 500. Reshape it into a serialized 400 with the offending field's name.
      throw BadRequestError(`Could not process rich-text field "${fieldName}"`, {
        errorCode: CommonErrorCode.VALIDATION_ERROR,
        layer: ErrorLayer.APPLICATION,
        remarks: cause instanceof Error ? cause.message : String(cause),
      });
    }

    const html = sanitizeRichText(rawHtml);

    // Sanitization removes disallowed nodes/attrs. A length change is a cheap,
    // allocation-free proxy for "something was stripped" — log it (no throw) so a
    // surprising strip is visible in the write path without failing the request.
    if (html.length !== rawHtml.length) {
      this.logger.warn(
        `Sanitization changed "${fieldName}": ${rawHtml.length} → ${html.length} chars (disallowed markup stripped or hardened)`
      );
    }

    // D3 adapter: normalize E's Tiptap JSON → our canonical PortableDocument. Pure
    // and total (never throws — unsupported nodes/marks are dropped), so it runs
    // after the migrate/HTML steps that own the error handling above.
    const canonical = tiptapToCanonical(json);

    return { json, canonical, html, schemaVersion: LATEST_SCHEMA_VERSION };
  }

  /**
   * Canonicalize a bilingual rich-text field. Both locales run through the same
   * single-document pipeline concurrently and share one schema version.
   */
  async toCanonicalFormTranslatable(
    input: { en: EditorDocument; vi: EditorDocument },
    fieldName = 'richText'
  ): Promise<CanonicalRichTextTranslatable> {
    const [en, vi] = await Promise.all([
      this.toCanonicalForm(input.en, `${fieldName}.en`),
      this.toCanonicalForm(input.vi, `${fieldName}.vi`),
    ]);

    return {
      // Each locale stores its full versioned EditorDocument; the structural
      // `EditorDocument` doesn't carry an index signature, so widen to the opaque
      // `RichTextDocument` (Record<string, unknown>) the storage column expects.
      json: { en: en.json, vi: vi.json } as unknown as TranslatableRichText,
      // Canonical PortableDocument per locale — the AST renderer's read source. The
      // `TranslatableJson` column type is a plain `{ en, vi }` JSON bag.
      canonical: { en: en.canonical, vi: vi.canonical } as unknown as TranslatableJson,
      html: { en: en.html, vi: vi.html },
      schemaVersion: LATEST_SCHEMA_VERSION,
    };
  }
}
