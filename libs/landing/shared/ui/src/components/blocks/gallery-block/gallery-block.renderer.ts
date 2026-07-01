import type { BlockRenderer, RenderContext } from '@portfolio/shared/features/rte-contract';
import { GALLERY_TYPE, type PortableNode } from '@portfolio/shared/features/rte-core/portable';
import type { GalleryImage } from '../../gallery/gallery.types';
import { GalleryBlock } from './gallery-block';

/**
 * The `gallery` registry entry (D4/D5): resolves the node's `attrs.imageIds` to
 * {@link GalleryImage}s through `ctx.media`, dropping any id that doesn't resolve, and
 * binds them onto {@link GalleryBlock}. Pass it to `provideBlockRenderers(...)`
 * alongside `imageRefBlockRenderer` — two entries, two blocks, no renderer change.
 */
export const galleryBlockRenderer: BlockRenderer = {
  type: GALLERY_TYPE,
  component: GalleryBlock,
  inputs: (node: PortableNode, ctx: RenderContext) => {
    const rawIds = node.attrs?.['imageIds'];
    const ids = Array.isArray(rawIds) ? rawIds.filter((id): id is string => typeof id === 'string') : [];
    const images: GalleryImage[] = ids
      .map((id) => ctx.media(id))
      .filter((media): media is NonNullable<typeof media> => !!media)
      .map((media) => ({ url: media.url, alt: media.alt, width: media.width, height: media.height }));
    const numbered = node.attrs?.['numbered'];
    return { images, numbered: typeof numbered === 'boolean' ? numbered : true };
  },
};
