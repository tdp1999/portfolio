import { InjectionToken, Provider, Type } from '@angular/core';
import type { PortableNode } from '@portfolio/shared/features/rte-core/portable';
import type { MediaRef } from '@portfolio/shared/features/rte-core/image-refs';

/**
 * The Angular DI half of the prose-block contract (the Angular-free half — the
 * `PortableNode`/`PortableDocument` types + per-block Zod schemas — lives in
 * `rte-core/portable`, so the BE can import it without bundling Angular).
 *
 * A block is registered exactly like a Gutenberg plugin: one `provideBlockRenderers`
 * entry maps a node `type` to the Angular component that renders it. The AST renderer
 * (Phase 3) walks the `PortableDocument`, looks up `type` in these providers, and
 * mounts the component via `NgComponentOutlet`; an unknown type falls through to the
 * missing-block fallback (D4).
 */

/**
 * Read-time context passed to every block's `inputs` mapper — the shared "toolbox"
 * a block needs while rendering.
 *
 * `media` is the key member: a **synchronous** lookup of `imageId` → resolved
 * {@link MediaRef}. Media is resolved up-front (batched per page by landing
 * data-access) into a map, so blocks never do async work mid-render — this is what
 * keeps the URL-free `image-ref` block SSR-safe (risk row: "Media resolution async
 * vs SSR"). Returns `undefined` for a deleted/unknown asset so the block can render a
 * graceful fallback rather than throw.
 */
export interface RenderContext {
  media(imageId: string): MediaRef | undefined;
  /** Active locale — some blocks pick a localized field. */
  locale: string;
}

/**
 * Maps one canonical node `type` to the Angular component that renders it, plus how
 * to turn the node's validated `attrs` into that component's `@Input()`s.
 *
 * @typeParam I the component's input bag (defaults to an untyped record).
 */
export interface BlockRenderer<I = Record<string, unknown>> {
  /** Matches {@link PortableNode.type} (e.g. 'image-ref'). */
  type: string;
  /** The component mounted via `NgComponentOutlet` for this node type. */
  component: Type<unknown>;
  /**
   * Maps a node + context to the component's inputs. Attrs are already
   * Zod-validated (via `parseBlockAttrs` at write-time / in the renderer), so this
   * mapper trusts them. Omit for a component that takes no inputs.
   */
  inputs?: (node: PortableNode, ctx: RenderContext) => I;
}

/**
 * The multi-provider token the AST renderer injects to get every registered block.
 * Never injected directly by app code — go through {@link provideBlockRenderers}.
 */
export const BLOCK_RENDERERS = new InjectionToken<readonly BlockRenderer[]>('BLOCK_RENDERERS');

/**
 * Register one or more block renderers. The "plugin" entry point: adding a block to
 * landing is exactly one call in `app.config.ts` providers (or a route's providers).
 *
 * ```ts
 * providers: [
 *   provideBlockRenderers(
 *     { type: 'image-ref', component: FigureBlock, inputs: (n, ctx) => ({ … }) },
 *     { type: 'gallery',   component: GalleryBlock, inputs: (n, ctx) => ({ … }) },
 *   ),
 * ]
 * ```
 */
export function provideBlockRenderers(...renderers: BlockRenderer[]): Provider[] {
  return renderers.map((renderer) => ({
    provide: BLOCK_RENDERERS,
    useValue: renderer,
    multi: true,
  }));
}
