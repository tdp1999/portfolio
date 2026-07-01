import {
  isSafeContentUrl,
  MARK_TYPES,
  parseBlockAttrs,
  PORTABLE_SCHEMA_VERSION,
  type Mark,
  type MarkType,
  type PortableDocument,
  type PortableNode,
} from '@portfolio/shared/features/rte-core/portable';
import type { EditorDocument } from '@portfolio/shared/features/rte-core/image-refs';

/**
 * Anti-corruption adapter: document-engine (E) Tiptap JSON → our canonical
 * {@link PortableDocument} (epic decision D3).
 *
 * This is the **single boundary** in the whole system that knows E's node/mark
 * names. Everything downstream — the AST renderer, the block registry, the block
 * components — keys on our stable `Portable*` types, so if E renames a node or
 * changes an attr key, only this file (and a schema-version bump) changes.
 *
 * It is also the **primary security gate** (D6): the walk whitelists node types and
 * runs each block's Zod attr schema (via `parseBlockAttrs`); unknown nodes/marks and
 * invalid attrs are dropped, and link `href`s are scheme-checked
 * (`javascript:`/`data:` rejected). A malicious or malformed document therefore
 * cannot produce a canonical node the renderer would trust.
 *
 * Pure and Angular-free — imports only the `rte-core/portable` contract (Zod) so it
 * runs at BE write-time without bundling the editor.
 */

/**
 * E node name → our canonical node name. A name absent from this map is an E node we
 * do not render (e.g. `image` with a URL, `horizontalRule`, `pageBreak`,
 * `dynamicField`, table nodes) and is dropped. The set of *values* here is
 * deliberately the semantic subset already permitted by `RICH_TEXT_WHITELIST`, so the
 * AST path and the HTML cache never diverge.
 */
const NODE_NAME_MAP: Readonly<Record<string, string>> = {
  paragraph: 'paragraph',
  heading: 'heading',
  text: 'text',
  bulletList: 'bulletList',
  listItem: 'listItem',
  blockquote: 'blockquote',
  codeBlock: 'codeBlock',
  hardBreak: 'hardBreak',
  // E's ordered list is the custom extension `customOrderedList`; we normalize the
  // name so the renderer keys on a single, engine-agnostic `orderedList`.
  customOrderedList: 'orderedList',
  // URL-free figure reference; attrs { imageId, caption?, captionPosition? }.
  imageRef: 'image-ref',
};

/** Minimal structural view of a Tiptap/ProseMirror JSON node. */
interface TiptapNode {
  type?: string;
  attrs?: Record<string, unknown> | null;
  marks?: { type?: string; attrs?: Record<string, unknown> | null }[] | null;
  text?: string;
  content?: TiptapNode[] | null;
}

/**
 * Normalize an E document to canonical form. `doc.content` is the ProseMirror root
 * (`type: 'doc'`) whose `.content` is the block array — we map that array. A
 * null/empty document yields an empty canonical document (never throws).
 */
export function tiptapToCanonical(doc: EditorDocument | null | undefined): PortableDocument {
  const root = doc?.content as TiptapNode | undefined;
  return {
    schemaVersion: PORTABLE_SCHEMA_VERSION,
    content: root?.content ? mapNodes(root.content) : [],
  };
}

/** Map a list of E nodes, dropping any that normalize to nothing. */
function mapNodes(nodes: readonly TiptapNode[]): PortableNode[] {
  const out: PortableNode[] = [];
  for (const node of nodes) {
    const mapped = mapNode(node);
    if (mapped) out.push(mapped);
  }
  return out;
}

/**
 * Map one E node → one canonical node, or `null` to drop it.
 *
 * - Text node → carry `text` + whitelisted marks.
 * - Known block (name in {@link NODE_NAME_MAP}) → validate attrs (`parseBlockAttrs`);
 *   drop on failure; recurse into children.
 * - Anything else (unknown/unsupported E node) → dropped.
 */
function mapNode(node: TiptapNode): PortableNode | null {
  if (node.type === 'text') {
    if (typeof node.text !== 'string' || node.text.length === 0) return null;
    const marks = mapMarks(node.marks);
    return marks.length ? { type: 'text', text: node.text, marks } : { type: 'text', text: node.text };
  }

  const eType = node.type;
  if (!eType) return null;
  const canonicalType = NODE_NAME_MAP[eType];
  if (!canonicalType) return null; // unsupported E node → drop

  const attrsResult = parseBlockAttrs(canonicalType, node.attrs ?? {});
  if (!attrsResult.ok) return null; // invalid/whitelist-failing attrs → drop the node

  const result: PortableNode = { type: canonicalType };
  if (Object.keys(attrsResult.attrs).length > 0) result.attrs = attrsResult.attrs;

  if (node.content && node.content.length > 0) {
    const children = mapNodes(node.content);
    if (children.length > 0) result.content = children;
  }
  return result;
}

/**
 * Whitelist a text node's marks. Marks outside {@link MARK_TYPES} (e.g. E's
 * subscript/superscript, textStyle color/font) are dropped. The one mark with attrs
 * — `link` — keeps only a scheme-safe `href` (D6); `target`/`rel` are re-forced at
 * render time (D5b), never carried here. A link with an unsafe/absent href is dropped.
 */
function mapMarks(marks: TiptapNode['marks']): Mark[] {
  if (!marks || marks.length === 0) return [];
  const out: Mark[] = [];
  for (const mark of marks) {
    const type = mark.type;
    if (!type || !(MARK_TYPES as readonly string[]).includes(type)) continue;

    if (type === 'link') {
      const href = mark.attrs?.['href'];
      if (typeof href === 'string' && isSafeContentUrl(href)) {
        out.push({ type: 'link', attrs: { href } });
      }
      continue; // drop links with an unsafe/missing href
    }

    out.push({ type: type as MarkType });
  }
  return out;
}
