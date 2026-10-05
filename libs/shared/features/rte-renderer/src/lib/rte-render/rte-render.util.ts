import type { BlockRenderer, RenderContext } from '@portfolio/shared/features/rte-contract';
import type { Mark, PortableNode } from '@portfolio/shared/features/rte-core/portable';

/** A mark with its link target resolved; `href` is only read on link marks. */
export interface RenderMark extends Mark {
  href: string;
}

/**
 * A document node with everything its template branch reads resolved once per
 * document, so the recursive template only reads fields. Fields that belong to one
 * branch (heading level, code text, cell spans) carry a neutral value elsewhere.
 */
export interface RenderNode {
  type: string;
  text: string;
  marks: RenderMark[];
  children: RenderNode[];
  /** Registered block renderer, or undefined → structural/text/fallback. */
  renderer: BlockRenderer | undefined;
  /** The block component's inputs (D5); empty without a renderer. */
  inputs: Record<string, unknown>;
  level: 2 | 3 | 4;
  /** The stamped anchor id for a heading node (null for non-heading / unknown). */
  headingId: string | null;
  code: string;
  colspan: number | null;
  rowspan: number | null;
}

export interface RenderTreeDeps {
  byType: ReadonlyMap<string, BlockRenderer>;
  context: RenderContext;
  headingIdByNode: ReadonlyMap<PortableNode, string>;
}

/** Clamp heading level to the h2–h4 range the prose whitelist permits. */
function headingLevel(node: PortableNode): 2 | 3 | 4 {
  const level = node.attrs?.['level'];
  return level === 3 ? 3 : level === 4 ? 4 : 2;
}

/**
 * A table cell's `colspan`/`rowspan`, or null when it is 1.
 *
 * Null rather than "1" so the attribute is omitted entirely in the common case:
 * an explicit `colspan="1"` on every cell is noise in the DOM, and the
 * attribute is only meaningful when it departs from the default. Anything that
 * is not a positive whole number is treated as absent rather than trusted.
 */
function span(node: PortableNode, attr: 'colspan' | 'rowspan'): number | null {
  const value = node.attrs?.[attr];
  return typeof value === 'number' && Number.isInteger(value) && value > 1 ? value : null;
}

/** A link mark's href (already scheme-validated at write-time); '#' as a safety net. */
function href(mark: Mark): string {
  const value = mark.attrs?.['href'];
  return typeof value === 'string' ? value : '#';
}

/**
 * Concatenated text of a code block's descendants. `<pre>` is whitespace-
 * significant, so code text is bound as a single interpolation (no marks, no
 * per-node template) — this keeps stray formatting whitespace out of the output,
 * which the recursive inline path can introduce around `{{ text }}`.
 */
function codeText(node: PortableNode): string {
  return (node.text ?? '') + (node.content ?? []).map(codeText).join('');
}

export function buildRenderTree(nodes: readonly PortableNode[], deps: RenderTreeDeps): RenderNode[] {
  return nodes.map((node) => {
    const renderer = deps.byType.get(node.type);
    const isCell = node.type === 'tableHeader' || node.type === 'tableCell';
    return {
      type: node.type,
      text: node.text ?? '',
      marks: (node.marks ?? []).map((mark) => ({ ...mark, href: href(mark) })),
      children: buildRenderTree(node.content ?? [], deps),
      renderer,
      inputs: renderer?.inputs ? (renderer.inputs(node, deps.context) as Record<string, unknown>) : {},
      level: headingLevel(node),
      headingId: deps.headingIdByNode.get(node) ?? null,
      code: node.type === 'codeBlock' ? codeText(node) : '',
      colspan: isCell ? span(node, 'colspan') : null,
      rowspan: isCell ? span(node, 'rowspan') : null,
    };
  });
}
