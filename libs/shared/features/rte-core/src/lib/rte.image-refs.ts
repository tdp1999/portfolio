import type { EditorDocument } from './rte.types';

// Re-export so a single SSR/node-safe entry (`rte-core/image-refs`) covers the
// types these helpers traffic in — consumers never need the barrel (which pulls
// `rte.sanitize` → isomorphic-dompurify/jsdom and breaks node-env jest).
export type { EditorDocument };

/**
 * Resolved media a single `image-ref` is hydrated with at read-time.
 *
 * The canonical document stores only an opaque `data-image-id`; this is what the
 * BE resolves that id to (one entry per referenced media) and ships to landing
 * alongside the HTML cache, so the renderer can inject a real `<img>` without
 * embedding URLs in the stored document. Locale-independent — the same media id
 * resolves to the same asset regardless of which language's prose references it.
 */
export interface MediaRef {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

/** Map of `image-ref` id → resolved {@link MediaRef}, keyed by `data-image-id`. */
export type MediaRefMap = Record<string, MediaRef>;

type JsonNode = {
  type?: string;
  attrs?: Record<string, unknown> | null;
  content?: JsonNode[] | null;
};

/**
 * Walk a canonical Tiptap document and collect every `image-ref` node's media id.
 *
 * The `image-ref` node carries its reference in `attrs.imageId` (the editor) which
 * serializes to `data-image-id` (the HTML). Reading the JSON — not the HTML — keeps
 * this independent of the write-time render and any later sanitize. Returns a
 * de-duplicated, order-preserving list; empty for a null/empty document.
 *
 * Pure and framework-free: the BE write/read pipeline imports it to resolve ids to
 * {@link MediaRef}s without pulling in the editor engine.
 */
export function collectImageIds(doc: EditorDocument | null | undefined): string[] {
  const root = doc?.content as JsonNode | undefined;
  if (!root) return [];

  const ids: string[] = [];
  const seen = new Set<string>();

  const walk = (node: JsonNode | null | undefined): void => {
    if (!node) return;
    if (node.type === 'imageRef') {
      const id = node.attrs?.['imageId'];
      if (typeof id === 'string' && id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
    node.content?.forEach(walk);
  };

  walk(root);
  return ids;
}
