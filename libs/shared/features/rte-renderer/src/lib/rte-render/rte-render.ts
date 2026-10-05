import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, isDevMode } from '@angular/core';
import { BLOCK_RENDERERS, type RenderContext } from '@portfolio/shared/features/rte-contract';
import {
  collectHeadings,
  type HeadingAnchor,
  type PortableDocument,
} from '@portfolio/shared/features/rte-core/portable';
import { buildRenderTree, type RenderNode } from './rte-render.util';

/** Fallback context for standalone use (no media resolution, EN locale). Real
 *  consumers pass a `[context]` carrying the pre-resolved media map + active locale. */
const NOOP_CONTEXT: RenderContext = { media: () => undefined, locale: 'en' };

/**
 * The canonical read-path renderer (prose-block epic, Phase 3). Walks a
 * {@link PortableDocument} node-by-node and renders it as a **live Angular component
 * tree** — the AST model that replaces the `[innerHTML]` HTML-string path
 * (`<rte-render-html>`), which cannot carry logic-bearing components/directives.
 *
 * Three per-node branches (see the template):
 * 1. A node `type` with a registered {@link BlockRenderer} (via `BLOCK_RENDERERS`) →
 *    mounted with `NgComponentOutlet` (the "plugin" seam; blocks arrive in Phase 4).
 * 2. A text node → its marks rendered **declaratively** as nested real elements
 *    (`<strong><a>…`), never an injected HTML string (D5b) — so this path is 100%
 *    `innerHTML`-free and Angular's binding sanitization covers `href` etc.
 * 3. A known structural type → the literal HTML tag (`<p>`, `<h2>`, `<ul>`, …).
 *
 * Structural tags are emitted as **direct children** of the host (recursion uses
 * `<ng-container>`, which is comment-only and adds no DOM element), so landing's
 * `.landing-prose > h2` direct-child rhythm selectors match unchanged. Put the prose
 * class on the host via `[contentClass]` (mirrors `<rte-render-html>`).
 *
 * An unknown type (no renderer, not a known structural type) renders nothing in
 * production and a dev-only placeholder in dev mode — never throws (D4/D6).
 *
 * **This is the SEO/SSR read-path.** Rendering is fully declarative (no `@defer`,
 * `afterRender`, or browser-only API on the render branch), so Angular SSR serializes
 * the whole tree — structural tags, marks, AND registered blocks with their resolved
 * `<img src>` — into first-paint HTML for crawlers, with no editor engine loaded.
 * Proven by `prose-blocks.ssr.spec.ts` (a real `platform-server` render). The sibling
 * `<rte-render-html>` (the only `[innerHTML]` binding) survives solely as the
 * cache fallback for non-Angular consumers — RSS / llms.txt / OG / no-JS (D7).
 */
@Component({
  selector: 'rte-render',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, NgTemplateOutlet],
  templateUrl: './rte-render.html',
  styleUrl: './rte-render.scss',
  host: { '[class]': 'hostClass()' },
})
export class RteRender {
  readonly doc = input<PortableDocument | null>(null);
  readonly context = input<RenderContext>(NOOP_CONTEXT);
  /** Extra class(es) on the host alongside `rte-content` (e.g. `landing-prose`). */
  readonly contentClass = input<string>('');

  /** Dev-only: show a visible placeholder for unknown blocks; silent in production. */
  protected readonly isDev = isDevMode();

  // Registered blocks, indexed by type. Optional → an empty registry (Phase 3, or a
  // consumer that ships no blocks) simply routes everything through the structural/
  // text branches.
  private readonly registry = inject(BLOCK_RENDERERS, { optional: true }) ?? [];
  private readonly byType = new Map(this.registry.map((r) => [r.type, r]));

  protected readonly hostClass = computed(() => ('rte-content ' + this.contentClass()).trim());

  // Headings walked once from the doc → stable slug ids (h2–h4) + a node→id map.
  // The template stamps the id onto each heading so a sticky ToC / scrollspy have
  // anchors; `headings()` exposes the list so a consumer can build the ToC from the
  // SAME slug source (no second HTML walk that could disagree).
  private readonly headingRefs = computed(() => collectHeadings(this.doc()));
  private readonly headingIdByNode = computed(() => new Map(this.headingRefs().map((h) => [h.node, h.id])));
  /** The document's headings (h2–h4) in reading order, with their anchor ids. Read
   *  via `viewChild(RteRender).headings()` to drive a table of contents. */
  readonly headings = computed<readonly HeadingAnchor[]>(() =>
    this.headingRefs().map(({ id, text, level }) => ({ id, text, level }))
  );

  /** The document resolved once into the render tree the recursive template reads. */
  protected readonly tree = computed<readonly RenderNode[]>(() =>
    buildRenderTree(this.doc()?.content ?? [], {
      byType: this.byType,
      context: this.context(),
      headingIdByNode: this.headingIdByNode(),
    })
  );
}
