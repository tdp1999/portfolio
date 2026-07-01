import { z } from 'zod/v4';

/**
 * The canonical **prose node tree** contract for the prose-block renderer epic.
 *
 * Landing renders long-form content by walking this tree node-by-node (an AST
 * renderer + block registry), NOT by binding an HTML string — see the epic
 * `epic-portfolio-prose-block-renderer.md`. HTML becomes just one serialization
 * (the `*Html` cache, demoted to an RSS/llms.txt/OG/no-JS fallback).
 *
 * The envelope mirrors ProseMirror, but the node `type`s and `attrs` are **ours**,
 * not document-engine's (E). Landing never reads E's Tiptap JSON directly: a single
 * BE write-time adapter maps E → this shape (Phase 2), so if E renames a node or
 * changes an attr, only that adapter changes — the renderer/registry/components,
 * which all key on these stable types, are untouched (decision D2/D3).
 *
 * Angular-free by design: this file imports only Zod, so the BE can import the
 * types + schemas at runtime to validate its adapter output without bundling
 * Angular. The Angular DI half of the contract (`BlockRenderer`, `BLOCK_RENDERERS`,
 * `provideBlockRenderers`, `RenderContext`) lives in `rte-contract`.
 */

/**
 * OUR schema version, independent of document-engine's `schemaVersion` (D2).
 *
 * Bumped only when THIS contract changes (a new required attr, a renamed node).
 * Stored docs below the latest are migrated lazily on next write, mirroring the RTE
 * epic's `migrateDoc` discipline but on our own version line.
 */
export const PORTABLE_SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Inline marks (D5b — rendered declaratively as nested real elements, never as an
// injected HTML string, so the read-path stays 100% `innerHTML`-free).
// ---------------------------------------------------------------------------

/** The fixed, closed whitelist of inline marks a text node may carry. */
export const MARK_TYPES = ['bold', 'italic', 'underline', 'strike', 'code', 'link'] as const;
export type MarkType = (typeof MARK_TYPES)[number];

/**
 * `link` is the only mark with attrs — and the only inline **sink**. Its `href` is
 * scheme-checked here (the primary security gate, D6): `javascript:` / `data:` etc.
 * are rejected. `target`/`rel` are NOT stored — the renderer forces
 * `target="_blank" rel="noopener nofollow"` on every link at render time (D5b).
 */
export const linkMarkAttrsSchema = z.object({
  href: z.string().refine(isSafeContentUrl, { message: 'href must be an http(s)/mailto/root-relative URL' }),
});
export type LinkMarkAttrs = z.infer<typeof linkMarkAttrsSchema>;

export interface Mark {
  type: MarkType;
  attrs?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Node envelope. `type`/`attrs` are ours; the shape mirrors ProseMirror so the
// Phase 2 adapter is a near-1:1 walk.
// ---------------------------------------------------------------------------

export interface PortableNode {
  /** OUR node type (e.g. 'paragraph', 'heading', 'image-ref'). */
  type: string;
  /** Zod-validated per block type (see BLOCK_ATTR_SCHEMAS). Absent for attr-less blocks. */
  attrs?: Record<string, unknown>;
  /** Inline marks — text nodes only. */
  marks?: Mark[];
  /** Text content — text nodes only. */
  text?: string;
  /** Children — recursive. */
  content?: PortableNode[];
}

export interface PortableDocument {
  /** OUR schema version (see PORTABLE_SCHEMA_VERSION), independent of E's. */
  schemaVersion: number;
  content: PortableNode[];
}

/** Runtime schema for the structural **envelope** (not the per-block attrs — those
 *  are validated separately so an unknown/invalid block can be dropped in isolation
 *  rather than failing the whole document). */
export const markSchema: z.ZodType<Mark> = z.object({
  type: z.enum(MARK_TYPES),
  attrs: z.record(z.string(), z.unknown()).optional(),
});

export const portableNodeSchema: z.ZodType<PortableNode> = z.lazy(() =>
  z.object({
    type: z.string(),
    attrs: z.record(z.string(), z.unknown()).optional(),
    marks: z.array(markSchema).optional(),
    text: z.string().optional(),
    content: z.array(portableNodeSchema).optional(),
  })
);

export const portableDocumentSchema: z.ZodType<PortableDocument> = z.object({
  schemaVersion: z.number().int().nonnegative(),
  content: z.array(portableNodeSchema),
});

// ---------------------------------------------------------------------------
// Per-block attr schemas — the stable anchor between editor, contract, and
// component (D5). "Hybrid" strictness (chosen 2026-07-01):
//   • logic-bearing / sink-carrying blocks (image-ref) get a full schema;
//   • structural blocks are validated only for the attrs the renderer actually
//     reads (heading.level) — attr-less structural blocks need no schema, their
//     unknown attrs are simply never read at render time (no DOM sink to reach).
// The real security boundary is the TYPE whitelist below, not the attr schema.
// ---------------------------------------------------------------------------

/**
 * Structural blocks we render. A node whose `type` is outside this set (and not an
 * `image-ref` block, and not a text node) is unknown → the renderer drops it / shows
 * the missing-block fallback (D4/D6). This whitelist — not the attr schemas — is the
 * primary read-time gate.
 */
export const STRUCTURAL_BLOCK_TYPES = [
  'paragraph',
  'heading',
  'blockquote',
  'bulletList',
  'orderedList',
  'listItem',
  'codeBlock',
  'hardBreak',
] as const;
export type StructuralBlockType = (typeof STRUCTURAL_BLOCK_TYPES)[number];

/** Non-structural, logic-bearing block types. */
export const IMAGE_REF_TYPE = 'image-ref';
/**
 * `gallery` — a multi-image block (renders the lightbox-enabled `landing-gallery`).
 * OUR type: document-engine has no gallery node today, so no adapter path emits one
 * yet — this is the **registered-but-dormant** second block that proves "add a block
 * = one registry entry" (epic Phase 4 / acceptance criteria). It becomes authorable
 * once E gains a gallery node (or we synthesize one from adjacent `image-ref`s) — a
 * change isolated to the D3 adapter, not the renderer/registry/component.
 */
export const GALLERY_TYPE = 'gallery';

/** Every non-text node type this contract knows how to render. */
export const BLOCK_TYPES = [...STRUCTURAL_BLOCK_TYPES, IMAGE_REF_TYPE, GALLERY_TYPE] as const;

/** Heading is the one structural block with a rendered attr: its level (h2–h4, per
 *  the RTE HTML whitelist). */
export const headingAttrsSchema = z.object({
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
});
export type HeadingAttrs = z.infer<typeof headingAttrsSchema>;

/**
 * `image-ref` — OUR decoupled shape. The Phase 2 adapter maps E's `imageRef`
 * (`{ imageId, caption, captionPosition }`) onto this. URL-free by design: the
 * document stores only the opaque `imageId`; the resolved media URL is injected at
 * render time from `RenderContext.media` (never persisted in the document).
 */
export const imageRefAttrsSchema = z.object({
  imageId: z.string().min(1),
  caption: z.string().optional(),
  captionPosition: z.enum(['top', 'bottom']).optional(),
});
export type ImageRefAttrs = z.infer<typeof imageRefAttrsSchema>;

/**
 * `gallery` — an ordered list of media ids the block resolves to real images at
 * render time (same URL-free discipline as `image-ref`: the document stores only
 * opaque `imageIds`, never URLs). `numbered` toggles the `FIG. 0X` caption numbering
 * of the underlying `landing-gallery`. At least one id is required — an empty gallery
 * is a dropped block, not an empty render.
 */
export const galleryAttrsSchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1),
  numbered: z.boolean().optional(),
});
export type GalleryAttrs = z.infer<typeof galleryAttrsSchema>;

/**
 * The attr-schema registry: block `type` → Zod schema for its `attrs`. Only blocks
 * with meaningful/validated attrs appear here; attr-less structural blocks
 * (paragraph, blockquote, lists, …) are intentionally absent — `parseBlockAttrs`
 * treats a missing entry as "no attrs" and returns `{}`.
 */
export const BLOCK_ATTR_SCHEMAS: Readonly<Record<string, z.ZodType>> = {
  heading: headingAttrsSchema,
  [IMAGE_REF_TYPE]: imageRefAttrsSchema,
  [GALLERY_TYPE]: galleryAttrsSchema,
};

// ---------------------------------------------------------------------------
// Helpers (pure, framework-free — shared by the BE adapter and the FE registry).
// ---------------------------------------------------------------------------

/**
 * The content-link URL policy (D6). Allows only:
 *   • absolute `http:` / `https:` / `mailto:`
 *   • root-relative in-site links (`/projects/foo`)
 * Everything else — notably `javascript:`, `data:`, `vbscript:` — is rejected, so a
 * link mark can never carry a script-executing href into the rendered `<a>`.
 */
export function isSafeContentUrl(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  // Root-relative in-site link (but not protocol-relative `//evil.com`).
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Heading anchors / ToC (read-path). The AST renderer emits slugged `id`s on
// headings so a sticky ToC + scrollspy have stable targets, and exposes the ToC
// itself. This lives here (Angular-free, over the portable types) so the slug +
// dedup policy is one implementation — the AST path's counterpart to landing's
// HTML-string `addHeadingAnchors` (only ONE runs per body: canonical → AST, else
// → HTML, so their slugs never need to agree for the same content).
// ---------------------------------------------------------------------------

/** A heading surfaced in a table of contents / used as a scroll anchor. */
export interface HeadingAnchor {
  id: string;
  text: string;
  level: 2 | 3 | 4;
}

/** A {@link HeadingAnchor} plus the source node, so a renderer can map node → id. */
export interface HeadingRef extends HeadingAnchor {
  node: PortableNode;
}

/** Slug a heading's text: lowercase, strip non-alphanumerics, dash-join, cap 80.
 *  Mirrors landing's `slugify` so anchors read the same across both read-paths. */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

/** Concatenated visible text of a node's subtree (marks/children flattened). */
function nodeText(node: PortableNode): string {
  const collect = (n: PortableNode): string => (n.text ?? '') + (n.content ?? []).map(collect).join('');
  return collect(node).trim();
}

/**
 * Walk a document in reading order and collect every `heading` (h2–h4) with a
 * stable, de-duplicated slug `id`. Deduping appends `-2`, `-3`, … on collision, and
 * an empty slug falls back to `heading-<n>` — identical to landing's HTML slugger so
 * either read-path yields the same anchors.
 */
export function collectHeadings(doc: PortableDocument | null | undefined): HeadingRef[] {
  const out: HeadingRef[] = [];
  const used = new Set<string>();
  const walk = (nodes: readonly PortableNode[] | undefined): void => {
    for (const node of nodes ?? []) {
      if (node.type === 'heading') {
        const level = node.attrs?.['level'];
        const lvl: 2 | 3 | 4 = level === 3 ? 3 : level === 4 ? 4 : 2;
        const text = nodeText(node);
        let id = slugifyHeading(text) || `heading-${out.length + 1}`;
        let suffix = 1;
        while (used.has(id)) id = `${id}-${++suffix}`;
        used.add(id);
        out.push({ node, id, text, level: lvl });
      }
      walk(node.content);
    }
  };
  walk(doc?.content);
  return out;
}

/** The outcome of validating one node's attrs against its block schema. */
export type BlockAttrsResult =
  | { readonly ok: true; readonly attrs: Record<string, unknown> }
  | { readonly ok: false; readonly error: string };

/**
 * Validate a block node's raw `attrs` against its registered schema.
 *
 * - Unknown type (not in {@link BLOCK_TYPES}) → `{ ok: false }`; the caller drops
 *   the node (the type whitelist is the security gate).
 * - Known type with no attr schema (attr-less structural block) → `{ ok: true, attrs: {} }`;
 *   any incoming attrs are dropped (never read at render time anyway).
 * - Known type with a schema → the parsed (and thus whitelisted) attrs, or
 *   `{ ok: false }` when required attrs are missing/invalid.
 */
export function parseBlockAttrs(type: string, attrs: unknown): BlockAttrsResult {
  if (!(BLOCK_TYPES as readonly string[]).includes(type)) {
    return { ok: false, error: `unknown block type "${type}"` };
  }
  const schema = BLOCK_ATTR_SCHEMAS[type];
  if (!schema) return { ok: true, attrs: {} };

  const parsed = schema.safeParse(attrs ?? {});
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message };
  }
  return { ok: true, attrs: parsed.data as Record<string, unknown> };
}
