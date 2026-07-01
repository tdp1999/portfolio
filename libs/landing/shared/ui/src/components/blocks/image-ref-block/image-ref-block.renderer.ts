import type { BlockRenderer, RenderContext } from '@portfolio/shared/features/rte-contract';
import { IMAGE_REF_TYPE, type PortableNode } from '@portfolio/shared/features/rte-core/portable';
import { ImageRefBlock } from './image-ref-block';

/** Read a string attr off a node, or '' when absent/not-a-string. */
function str(node: PortableNode, key: string): string {
  const value = node.attrs?.[key];
  return typeof value === 'string' ? value : '';
}

/**
 * The `image-ref` registry entry (D4/D5): binds the canonical node's validated
 * `attrs` + the render context onto {@link ImageRefBlock}'s inputs. This is the one
 * place that knows the canonical shape — pass it to `provideBlockRenderers(...)` in
 * the app config. `attrs.imageId` is resolved to a URL/alt through `ctx.media` at
 * render time (the document itself is URL-free); an id that doesn't resolve yields an
 * empty `src`, and the component then renders nothing.
 */
export const imageRefBlockRenderer: BlockRenderer = {
  type: IMAGE_REF_TYPE,
  component: ImageRefBlock,
  inputs: (node: PortableNode, ctx: RenderContext) => {
    const imageId = str(node, 'imageId');
    const media = imageId ? ctx.media(imageId) : undefined;
    return {
      src: media?.url ?? '',
      alt: media?.alt ?? '',
      caption: str(node, 'caption'),
    };
  },
};
