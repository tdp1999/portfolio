import { Inject, Injectable } from '@nestjs/common';
// Import from the `/image-refs` entry (not the barrel) so this never pulls
// `rte.sanitize` → isomorphic-dompurify/jsdom, which breaks node-env jest specs.
import { collectImageIds, type EditorDocument, type MediaRefMap } from '@portfolio/shared/features/rte-core/image-refs';
import { IMediaRepository } from './ports/media.repository.port';
import { MEDIA_REPOSITORY } from './media.token';

/**
 * Resolves the `image-ref` media a rich-text document references into the
 * URL-bearing {@link MediaRefMap} the landing renderer hydrates with (task 315).
 *
 * The canonical document is URL-free — `image-ref` nodes carry only an opaque
 * media id. A public read query runs its body docs through here to ship the
 * resolved `{ url, alt, width, height }` per id alongside the HTML cache, so the
 * landing side can inject `<img>` without the persisted document ever embedding a
 * URL (which is what keeps content resilient to media renames).
 *
 * Lives in the media module (which owns the repository) and is consumed
 * cross-module by the project and blog-post read handlers.
 */
@Injectable()
export class MediaRefResolverService {
  constructor(@Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository) {}

  /**
   * Resolve every `image-ref` id found across the given documents (e.g. both
   * locales of a bilingual body) into a {@link MediaRefMap}. Ids are de-duplicated
   * before lookup; an id that resolves to no (or a deleted) media is simply absent
   * from the map, so the renderer leaves that figure un-hydrated rather than
   * emitting a broken image. Returns an empty map when nothing is referenced.
   */
  async resolveForDocuments(docs: ReadonlyArray<EditorDocument | null | undefined>): Promise<MediaRefMap> {
    const ids = [...new Set(docs.flatMap((doc) => collectImageIds(doc)))];
    if (ids.length === 0) return {};

    const found = await Promise.all(ids.map((id) => this.repo.findById(id)));

    const map: MediaRefMap = {};
    for (const media of found) {
      if (!media) continue;
      map[media.id] = {
        url: media.url,
        alt: media.altText ?? '',
        width: media.width,
        height: media.height,
      };
    }
    return map;
  }
}
